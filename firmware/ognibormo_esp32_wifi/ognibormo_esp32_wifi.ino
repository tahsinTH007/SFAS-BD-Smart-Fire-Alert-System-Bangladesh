// =============================================================================
//  OGNIBORMO — ESP32 WiFi sensing unit
//  Part of SFAS-BD (Smart Fire Alert System, Bangladesh)
//
//  Posts readings to the SFAS-BD backend over the local WiFi. The backend
//  scores them (riskEngine), stores them, and pushes "telemetry:reading" /
//  "alert:new" to the dashboard over Socket.io — so the browser updates
//  without polling.
//
//    ESP32 --POST /api/v1/sensors/readings--> backend --socket.io--> frontend
//
//  DESIGN NOTE
//    The buzzer runs on core 1 and the network on core 0, on purpose. An HTTP
//    request can stall for seconds if the server is down or the WiFi drops,
//    and a local fire alarm must never go quiet because of that. The siren
//    keeps sounding whether or not anything is listening on the network.
//
//  WIRING — GPIO34 and GPIO26 are NOT 5V tolerant (3.6V absolute max)
//    MQ-2  : VCC->5V, GND->GND, A0 -> divider -> GPIO34
//            divider: A0 --[10k]--+--[20k]-- GND, tap (+) to GPIO34
//    Flame : power from 3.3V, D0 -> GPIO26
//    Buzzer: + -> GPIO25, - -> GND
// =============================================================================

#include <WiFi.h>
#include <HTTPClient.h>

// ─────────────────────────────────────────────────────────────────────────────
//  1. EDIT THIS BLOCK
// ─────────────────────────────────────────────────────────────────────────────
const char* WIFI_SSID   = "YOUR_WIFI_NAME";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";

// The LAN IP of the PC running the backend — NOT "localhost".
// Find it on Windows with:  ipconfig    (look for IPv4 Address)
const char* SERVER_HOST = "192.168.0.101";
const int   SERVER_PORT = 8080;              // backend .env  PORT=8080

// Should match a device row in the DB. `npm run seed` creates OGB-UTT-001 …
// OGB-GZ-002; using one of those gives the alert a real building, station and
// map position. An unregistered code still raises alerts, but they land as
// "Unknown location" with no station scoping.
#define DEVICE_CODE  "OGB-UTT-001"

// ─────────────────────────────────────────────────────────────────────────────
//  2. Pins and hardware options
// ─────────────────────────────────────────────────────────────────────────────
#define MQ2_A0             34    // ADC1_CH6, input-only
#define FLAME_D0           26
#define BUZZER             25

#define FLAME_ACTIVE_LOW   1     // 0 if your flame module reports HIGH on flame
#define BUZZER_IS_ACTIVE   0     // 1 = active buzzer (has its own oscillator)
#define HAS_DHT            0     // 1 once a real DHT22 is fitted
#define DHT_PIN            27

// ─────────────────────────────────────────────────────────────────────────────
//  3. Timing
// ─────────────────────────────────────────────────────────────────────────────
#define SERIAL_BAUD        1000000

// The backend rate-limits ingest to 120 requests / 60s per deviceCode
// (checkIngestRateLimit), i.e. one every 500ms at most. These stay well inside
// that, and speed up once something is actually wrong.
const uint32_t POST_IDLE_MS   = 3000;
const uint32_t POST_ALARM_MS  = 1000;

const uint32_t SAMPLE_MS      = 250;   // local sensor read + serial refresh
const uint32_t WARMUP_MS      = 20000; // MQ-2 preheat; set 0 to skip for a demo
const uint32_t BASELINE_MS    = 4000;  // clean-air sampling window
const uint32_t HTTP_TIMEOUT_MS = 4000;

// Beep half-periods — fire is faster and higher than smoke
const uint32_t FIRE_BEEP_MS   = 120;
const uint32_t SMOKE_BEEP_MS  = 150;
const int      FIRE_TONE_HZ   = 2500;
const int      SMOKE_TONE_HZ  = 1500;

// ─────────────────────────────────────────────────────────────────────────────
//  4. Detection tuning
// ─────────────────────────────────────────────────────────────────────────────
const int     SMOKE_DELTA    = 250;   // alarm at baseline + this (raw counts)
const float   CLEAR_FRACTION = 0.6f;  // hysteresis: clear at 60% of the delta
const uint8_t CONFIRM_READS  = 3;     // consecutive samples before alarming

#if HAS_DHT
  #include <DHT.h>
  DHT dht(DHT_PIN, DHT22);
#endif

// ─────────────────────────────────────────────────────────────────────────────
//  Shared state.  32-bit aligned scalars, written on core 1 and read on core 0
//  — atomic on the ESP32, so no mutex is needed for these.
// ─────────────────────────────────────────────────────────────────────────────
volatile int   g_smokeValue   = 0;
volatile bool  g_smokeAlarm   = false;
volatile bool  g_fireAlarm    = false;
volatile float g_temperature  = 0.0f;
volatile float g_humidity     = 0.0f;
volatile bool  g_dhtOk        = false;

volatile bool  g_wifiUp       = false;
volatile int   g_lastHttpCode = 0;
volatile int   g_riskScore    = -1;   // last score the backend sent back

int     smokeBaseline = 0;
int     smokeOnLevel  = 0;
int     smokeOffLevel = 0;
uint8_t smokeStreak   = 0;
uint8_t flameStreak   = 0;

uint32_t lastSample = 0;
uint32_t lastBeep   = 0;
bool     buzzerOn   = false;

// =============================================================================
//  Buzzer — tone() only exists on ESP32 core 3.x; core 2.x needs LEDC
// =============================================================================
#if !BUZZER_IS_ACTIVE && (!defined(ESP_ARDUINO_VERSION_MAJOR) || ESP_ARDUINO_VERSION_MAJOR < 3)
  #define LEDC_CHANNEL 0
#endif

void buzzerSetup() {
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);
#ifdef LEDC_CHANNEL
  ledcSetup(LEDC_CHANNEL, 2000, 8);
  ledcAttachPin(BUZZER, LEDC_CHANNEL);
  ledcWrite(LEDC_CHANNEL, 0);
#endif
}

void beepOn(int freq) {
#if BUZZER_IS_ACTIVE
  (void)freq;
  digitalWrite(BUZZER, HIGH);
#elif defined(LEDC_CHANNEL)
  ledcWriteTone(LEDC_CHANNEL, freq);
#else
  tone(BUZZER, freq);
#endif
}

void beepOff() {
#if BUZZER_IS_ACTIVE
  digitalWrite(BUZZER, LOW);
#elif defined(LEDC_CHANNEL)
  ledcWriteTone(LEDC_CHANNEL, 0);
#else
  noTone(BUZZER);
#endif
}

// =============================================================================
//  Sensors
// =============================================================================

/** Averages the ADC to take the edge off MQ-2 noise. */
int readSmokeRaw() {
  long sum = 0;
  for (uint8_t i = 0; i < 8; i++) {
    sum += analogRead(MQ2_A0);
    delayMicroseconds(200);
  }
  return (int)(sum / 8);
}

bool readFlameRaw() {
  int v = digitalRead(FLAME_D0);
#if FLAME_ACTIVE_LOW
  return v == LOW;
#else
  return v == HIGH;
#endif
}

/**
 * MQ-2 has no absolute scale — clean-air output depends on the module's load
 * resistor, the supply and the sensor's age. So measure this unit's own clean
 * air at boot and alarm on the rise above it, rather than guessing a constant.
 */
void calibrateBaseline() {
  if (WARMUP_MS > 0) {
    Serial.print("Warming up MQ-2 (");
    Serial.print(WARMUP_MS / 1000);
    Serial.println("s) - keep the air clean...");
    uint32_t start = millis();
    while (millis() - start < WARMUP_MS) {
      delay(1000);
      Serial.print(".");
    }
    Serial.println();
  }

  Serial.println("Sampling clean-air baseline...");
  long sum = 0;
  int  n   = 0;
  uint32_t start = millis();
  while (millis() - start < BASELINE_MS) {
    sum += readSmokeRaw();
    n++;
    delay(50);
  }

  smokeBaseline = (int)(sum / n);
  smokeOnLevel  = smokeBaseline + SMOKE_DELTA;
  smokeOffLevel = smokeBaseline + (int)(SMOKE_DELTA * CLEAR_FRACTION);

  Serial.print("Baseline        : ");  Serial.println(smokeBaseline);
  Serial.print("Alarm above     : ");  Serial.println(smokeOnLevel);
  Serial.print("Clears below    : ");  Serial.println(smokeOffLevel);
}

// =============================================================================
//  Network task — runs on core 0 so it can block freely
// =============================================================================

void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    g_wifiUp = true;
    return;
  }

  g_wifiUp = false;
  Serial.println("[net] WiFi down, reconnecting...");

  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    vTaskDelay(pdMS_TO_TICKS(500));
  }

  if (WiFi.status() == WL_CONNECTED) {
    g_wifiUp = true;
    Serial.print("[net] WiFi connected. Device IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[net] WiFi connect failed, will retry.");
  }
}

void postReading() {
  char url[128];
  snprintf(url, sizeof(url), "http://%s:%d/api/v1/sensors/readings",
           SERVER_HOST, SERVER_PORT);

  // MQ-2 feeds "smoke" only. It also responds to LPG, but sending the same
  // number as "gas" too would make riskEngine treat one sensor as two agreeing
  // sources and inflate the fused score.
  char body[256];
  int len = snprintf(body, sizeof(body),
                     "{\"deviceCode\":\"%s\",\"smoke\":%d,\"fire\":%d",
                     DEVICE_CODE, g_smokeValue, g_fireAlarm ? 1 : 0);

  if (g_dhtOk) {
    len += snprintf(body + len, sizeof(body) - len,
                    ",\"temp\":%.1f,\"humidity\":%.1f",
                    g_temperature, g_humidity);
  }
  snprintf(body + len, sizeof(body) - len, "}");

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);

  if (!http.begin(url)) {
    Serial.println("[net] http.begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  int code = http.POST((uint8_t*)body, strlen(body));
  g_lastHttpCode = code;

  if (code > 0) {
    String reply = http.getString();

    // Pull riskScore out of the reply without dragging in a JSON library —
    // it is only for the local display, so a substring is enough.
    int at = reply.indexOf("\"riskScore\":");
    g_riskScore = (at >= 0) ? reply.substring(at + 12).toInt() : -1;

    if (code >= 400) {
      Serial.print("[net] HTTP ");
      Serial.print(code);
      Serial.print(" -> ");
      Serial.println(reply);
    }
  } else {
    Serial.print("[net] POST failed: ");
    Serial.println(http.errorToString(code));
    g_riskScore = -1;
  }

  http.end();
}

void netTask(void* pv) {
  (void)pv;
  for (;;) {
    ensureWifi();
    if (g_wifiUp) postReading();

    uint32_t wait = (g_fireAlarm || g_smokeAlarm) ? POST_ALARM_MS : POST_IDLE_MS;
    vTaskDelay(pdMS_TO_TICKS(wait));
  }
}

// =============================================================================
//  Setup
// =============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD);
  pinMode(FLAME_D0, INPUT);
  buzzerSetup();

  analogReadResolution(12);                    // 0..4095
  analogSetPinAttenuation(MQ2_A0, ADC_11db);   // full ~0-3.3V span

#if HAS_DHT
  dht.begin();
#endif

  delay(500);
  Serial.println();
  Serial.println("==============================================");
  Serial.println("        OGNIBORMO  /  SFAS-BD  UNIT");
  Serial.println("==============================================");
  Serial.print("Device Code     : ");  Serial.println(DEVICE_CODE);
  Serial.print("Backend         : http://");
  Serial.print(SERVER_HOST); Serial.print(":"); Serial.println(SERVER_PORT);
  Serial.print("Temp / Humidity : ");
#if HAS_DHT
  Serial.println("DHT22 fitted");
#else
  Serial.println("NOT FITTED (no sensor - nothing reported)");
#endif
  Serial.println("==============================================");

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);          // sleep adds latency to an alarm post
  WiFi.setAutoReconnect(true);

  calibrateBaseline();

  // Core 0 handles the network. loop() owns core 1 and never blocks, so the
  // buzzer timing stays correct even while an HTTP request is stalled.
  xTaskCreatePinnedToCore(netTask, "net", 8192, nullptr, 1, nullptr, 0);

  Serial.println("System ready.");
  Serial.println("==============================================");
}

// =============================================================================
//  Loop — core 1: sensors, siren, local display. Nothing blocks here.
// =============================================================================
void loop() {
  uint32_t now = millis();

  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;

    int  smokeValue = readSmokeRaw();
    bool flameNow   = readFlameRaw();
    g_smokeValue = smokeValue;

    // Hysteresis: rise past the on-level for CONFIRM_READS samples to alarm,
    // fall below the lower off-level to clear. Stops the buzzer chattering
    // when the reading sits right on the boundary.
    if (!g_smokeAlarm) {
      smokeStreak = (smokeValue > smokeOnLevel) ? smokeStreak + 1 : 0;
      if (smokeStreak >= CONFIRM_READS) g_smokeAlarm = true;
    } else if (smokeValue < smokeOffLevel) {
      g_smokeAlarm = false;
      smokeStreak  = 0;
    }

    // An IR flame sensor trips on sunlight and hot elements, so require two
    // consecutive reads before believing it.
    if (flameNow) { if (flameStreak < 2) flameStreak++; }
    else          { flameStreak = 0; }
    g_fireAlarm = (flameStreak >= 2);

#if HAS_DHT
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    g_dhtOk = !isnan(t) && !isnan(h);
    if (g_dhtOk) { g_temperature = t; g_humidity = h; }
#endif

    // ── Local display ────────────────────────────────────────────────────────
    Serial.println();
    Serial.println("------------------------------------------------");
    Serial.print("Smoke Value        : ");
    Serial.print(smokeValue);
    Serial.print("  (baseline ");
    Serial.print(smokeBaseline);
    Serial.println(")");

    Serial.print("Smoke Status       : ");
    Serial.println(g_smokeAlarm ? "!!! SMOKE DETECTED !!!" : "NORMAL");

    Serial.print("Flame Status       : ");
    Serial.println(g_fireAlarm ? "!!! FIRE DETECTED !!!" : "NORMAL");

#if HAS_DHT
    Serial.print("Temperature        : ");
    if (g_dhtOk) { Serial.print(g_temperature, 1); Serial.println(" C"); }
    else         { Serial.println("read error"); }
    Serial.print("Humidity           : ");
    if (g_dhtOk) { Serial.print(g_humidity, 1); Serial.println(" %"); }
    else         { Serial.println("read error"); }
#else
    Serial.println("Temperature        : -- (no sensor fitted)");
    Serial.println("Humidity           : -- (no sensor fitted)");
#endif

    Serial.print("Link               : ");
    if (!g_wifiUp) {
      Serial.println("WiFi DOWN (alarm still local)");
    } else if (g_lastHttpCode == 201 || g_lastHttpCode == 200) {
      Serial.print("sent OK");
      if (g_riskScore >= 0) {
        Serial.print("  |  backend risk ");
        Serial.print(g_riskScore);
        Serial.print("/100");
      }
      Serial.println();
    } else if (g_lastHttpCode == 429) {
      Serial.println("rate limited - increase POST_IDLE_MS");
    } else if (g_lastHttpCode == 0) {
      Serial.println("connecting...");
    } else {
      Serial.print("HTTP ");
      Serial.println(g_lastHttpCode);
    }

    if (g_fireAlarm)       Serial.println(">>> FIRE ALARM ACTIVE <<<");
    else if (g_smokeAlarm) Serial.println(">>> SMOKE ALARM ACTIVE <<<");
    else                   Serial.println("SYSTEM NORMAL");
  }

  // ── Siren — serviced every pass, so the beep rates are real ────────────────
  if (g_fireAlarm || g_smokeAlarm) {
    uint32_t period = g_fireAlarm ? FIRE_BEEP_MS : SMOKE_BEEP_MS;
    int      freq   = g_fireAlarm ? FIRE_TONE_HZ : SMOKE_TONE_HZ;

    if (now - lastBeep >= period) {
      lastBeep = now;
      buzzerOn = !buzzerOn;
      if (buzzerOn) beepOn(freq);
      else          beepOff();
    }
  } else if (buzzerOn) {
    beepOff();
    buzzerOn = false;
  }

  delay(2);   // yields to the RTOS; far finer than the beep period
}
