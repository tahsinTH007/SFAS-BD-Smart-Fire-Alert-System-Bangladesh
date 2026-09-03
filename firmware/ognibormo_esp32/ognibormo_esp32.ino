// =============================================================================
//  OGNIBORMO — ESP32 unit, USB serial link
//  Part of SFAS-BD (Smart Fire Alert System, Bangladesh)
//
//  No WiFi. The unit stays plugged into the laptop and emits one JSON frame per
//  second on the USB serial port. The backend's serial listener parses those
//  frames, scores them, and pushes alerts to the dashboard over Socket.io:
//
//    ESP32 --USB serial JSON--> sensor.listener.ts --socket.io--> dashboard
//
//  BACKEND SETTINGS THIS EXPECTS  (backend/.env)
//    SERIAL_ENABLED=true
//    SERIAL_PORT=COM7
//    SERIAL_BAUD_RATE=115200
//    SERIAL_DATA_FORMAT=json
//
//  Only JSON frames are printed. Anything else on this port would be logged by
//  the backend as an unparsable frame, so the human-readable view lives on the
//  dashboard rather than here.
//
//  WIRING — GPIO34 and GPIO26 are NOT 5V tolerant (3.6V max)
//    MQ-2  : VCC->5V, GND->GND, A0 -> divider -> GPIO34
//            divider: A0 --[10k]--+--[20k]-- GND, tap (+) to GPIO34
//    Flame : power from 3.3V, D0 -> GPIO26
//    Buzzer: + -> GPIO25, - -> GND
// =============================================================================

// ── Identity ─────────────────────────────────────────────────────────────────
#define DEVICE_CODE   "OGB-UTT-001"   // must match a registered device
#define SERIAL_BAUD   115200          // must match SERIAL_BAUD_RATE in .env

// ── Pins ─────────────────────────────────────────────────────────────────────
#define MQ2_A0        34    // ADC1_CH6, input-only
#define FLAME_D0      26
#define BUZZER        25
#define STATUS_LED     2

// ── Hardware options ─────────────────────────────────────────────────────────
#define FLAME_ACTIVE_LOW  1   // 0 if your flame module reports HIGH on flame
#define BUZZER_IS_ACTIVE  0   // 1 = active buzzer (has its own oscillator)
#define HAS_DHT           0   // 1 once a real DHT22 is fitted
#define DHT_PIN          27

// ── Timing ───────────────────────────────────────────────────────────────────
const uint32_t SAMPLE_MS   = 250;    // sensor read rate
const uint32_t FRAME_MS    = 1000;   // one JSON frame per second
const uint32_t WARMUP_MS   = 10000;  // MQ-2 preheat; set 0 to skip entirely
const uint32_t BASELINE_MS = 3000;   // clean-air sampling window

const uint32_t FIRE_BEEP_MS  = 120;
const uint32_t SMOKE_BEEP_MS = 150;
const int      FIRE_TONE_HZ  = 2500;
const int      SMOKE_TONE_HZ = 1500;

// ── Detection tuning ─────────────────────────────────────────────────────────
const int     SMOKE_DELTA    = 250;   // siren at baseline + this (raw counts)
const float   CLEAR_FRACTION = 0.6f;  // hysteresis: clears at 60% of the delta
const uint8_t CONFIRM_READS  = 3;

#if HAS_DHT
  #include <DHT.h>
  DHT dht(DHT_PIN, DHT22);
#endif

// ── State ────────────────────────────────────────────────────────────────────
int     smokeBaseline = 0;
int     smokeOnLevel  = 0;
int     smokeOffLevel = 0;
int     smokeValue    = 0;
uint8_t smokeStreak   = 0;
uint8_t flameStreak   = 0;
bool    smokeAlarm    = false;
bool    fireAlarm     = false;

float   temperature = 0.0f;
float   humidity    = 0.0f;
bool    dhtOk       = false;

uint32_t lastSample = 0;
uint32_t lastFrame  = 0;
uint32_t lastBeep   = 0;
bool     buzzerOn   = false;

// =============================================================================
//  Buzzer — tone() exists only on ESP32 core 3.x; core 2.x needs LEDC
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
  (void)freq;  digitalWrite(BUZZER, HIGH);
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
 * resistor, the supply and the sensor's age. Measure this unit's own clean air
 * at boot and alarm on the rise above it, rather than guessing a constant.
 */
void calibrateBaseline() {
  uint32_t start = millis();
  while (millis() - start < WARMUP_MS) {
    digitalWrite(STATUS_LED, (millis() / 250) % 2);
    delay(50);
  }

  long sum = 0;
  int  n   = 0;
  start = millis();
  while (millis() - start < BASELINE_MS) {
    sum += readSmokeRaw();
    n++;
    delay(50);
  }

  smokeBaseline = (int)(sum / n);
  smokeOnLevel  = smokeBaseline + SMOKE_DELTA;
  smokeOffLevel = smokeBaseline + (int)(SMOKE_DELTA * CLEAR_FRACTION);
}

// =============================================================================
//  Setup
// =============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD);

  pinMode(FLAME_D0, INPUT);
  pinMode(STATUS_LED, OUTPUT);
  buzzerSetup();

  analogReadResolution(12);                     // 0..4095
  analogSetPinAttenuation(MQ2_A0, ADC_11db);    // full ~0-3.3V span

#if HAS_DHT
  dht.begin();
#endif

  beepOn(2000); delay(60); beepOff();           // one chirp = powered up

  calibrateBaseline();

  digitalWrite(STATUS_LED, HIGH);               // solid = sampling and emitting
  beepOn(1800); delay(80); beepOff();
  delay(80);
  beepOn(1800); delay(80); beepOff();           // two chirps = ready
}

// =============================================================================
//  Loop — nothing blocks, so the siren keeps its timing
// =============================================================================
void loop() {
  uint32_t now = millis();

  // ── Sample ────────────────────────────────────────────────────────────────
  if (now - lastSample >= SAMPLE_MS) {
    lastSample = now;

    smokeValue    = readSmokeRaw();
    bool flameNow = readFlameRaw();

    // Hysteresis: rise past the on-level for CONFIRM_READS samples to alarm,
    // fall below the lower off-level to clear. Stops the buzzer chattering
    // when the reading sits right on the boundary.
    if (!smokeAlarm) {
      smokeStreak = (smokeValue > smokeOnLevel) ? smokeStreak + 1 : 0;
      if (smokeStreak >= CONFIRM_READS) smokeAlarm = true;
    } else if (smokeValue < smokeOffLevel) {
      smokeAlarm  = false;
      smokeStreak = 0;
    }

    // An IR flame sensor trips on sunlight and hot elements, so require two
    // consecutive reads before believing it.
    if (flameNow) { if (flameStreak < 2) flameStreak++; }
    else          { flameStreak = 0; }
    fireAlarm = (flameStreak >= 2);

#if HAS_DHT
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    dhtOk = !isnan(t) && !isnan(h);
    if (dhtOk) { temperature = t; humidity = h; }
#endif
  }

  // ── Emit one frame per second ─────────────────────────────────────────────
  // MQ-2 feeds "smoke" only. It also responds to LPG, but sending the same
  // number as "gas" would make riskEngine treat one sensor as two agreeing
  // sources and inflate the fused score.
  if (now - lastFrame >= FRAME_MS) {
    lastFrame = now;

    Serial.print("{\"deviceCode\":\"" DEVICE_CODE "\",\"smoke\":");
    Serial.print(smokeValue);
    Serial.print(",\"fire\":");
    Serial.print(fireAlarm ? 1 : 0);
#if HAS_DHT
    if (dhtOk) {
      Serial.print(",\"temp\":");     Serial.print(temperature, 1);
      Serial.print(",\"humidity\":"); Serial.print(humidity, 1);
    }
#endif
    Serial.println("}");
  }

  // ── Siren ─────────────────────────────────────────────────────────────────
  if (fireAlarm || smokeAlarm) {
    uint32_t period = fireAlarm ? FIRE_BEEP_MS : SMOKE_BEEP_MS;
    int      freq   = fireAlarm ? FIRE_TONE_HZ : SMOKE_TONE_HZ;

    if (now - lastBeep >= period) {
      lastBeep = now;
      buzzerOn = !buzzerOn;
      if (buzzerOn) beepOn(freq);
      else          beepOff();
    }
    digitalWrite(STATUS_LED, (now / 100) % 2);
  } else {
    if (buzzerOn) { beepOff(); buzzerOn = false; }
    digitalWrite(STATUS_LED, HIGH);
  }

  delay(2);   // yields to the RTOS; far finer than the beep period
}
