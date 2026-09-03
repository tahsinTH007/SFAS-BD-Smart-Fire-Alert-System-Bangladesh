// =============================================================================
//  OGNIBORMO — ESP32 field unit  (SFAS-BD)
//
//  Battery powered, no USB, no serial console. Everything is configured from a
//  phone and every state is reported by the LED and the buzzer, because on a
//  battery there is nothing else to look at.
//
//  ── FIRST POWER-ON, OR A NEW WIFI ──────────────────────────────────────────
//   1. The unit finds no saved network and opens its own:
//          SSID      OGNIBORMO-SETUP
//          password  ognibormo
//      (LED blinks slowly, buzzer chirps twice every 5s.)
//   2. Join it from a phone. The setup page opens by itself; if it does not,
//      browse to  http://192.168.4.1
//   3. Pick the WiFi, type its password. Leave "Server address" on Auto and
//      the unit finds the backend by itself. Save — it reboots and connects.
//
//  ── LATER ──────────────────────────────────────────────────────────────────
//   The unit's own address shows in the dashboard under Units → Last seen.
//   Open it in a browser for a live status page and to change the server
//   without redoing the WiFi.
//
//   To force setup mode again: hold the BOOT button while switching on, keep
//   it held ~3s, until the buzzer gives one long beep.
//
//  ── WIRING — GPIO34 and GPIO26 are NOT 5V tolerant (3.6V max) ──────────────
//    MQ-2  : VCC->5V, GND->GND, A0 -> divider -> GPIO34
//            divider: A0 --[10k]--+--[20k]-- GND, tap (+) to GPIO34
//    Flame : power from 3.3V, D0 -> GPIO26
//    Buzzer: + -> GPIO25, - -> GND
// =============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

// ─────────────────────────────────────────────────────────────────────────────
//  Pins and hardware options
// ─────────────────────────────────────────────────────────────────────────────
#define MQ2_A0             34    // ADC1_CH6, input-only
#define FLAME_D0           26
#define BUZZER             25
#define STATUS_LED          2    // on-board LED on most ESP32 devkits
#define BOOT_BUTTON         0    // BOOT button, LOW when pressed

#define FLAME_ACTIVE_LOW    1    // 0 if your flame module reports HIGH on flame
#define BUZZER_IS_ACTIVE    0    // 1 = active buzzer (has its own oscillator)
#define LED_ACTIVE_LOW      0    // 1 if your board's LED lights on LOW
#define HAS_DHT             0    // 1 once a real DHT22 is fitted
#define DHT_PIN            27

// On battery, modem sleep cuts the average draw roughly 3x. It adds ~100ms to
// a posted alert, which does not matter: the local siren is driven straight
// from the sensor and never waits for the network.
#define WIFI_POWER_SAVE     1

// Diagnostics over USB. The unit is designed to run headless on a battery, so
// nothing here is load-bearing — it is for bench testing, and costs one idle
// UART when the unit is deployed.
#define SERIAL_DEBUG        1
#define SERIAL_BAUD         115200

#if SERIAL_DEBUG
  #define DBG(x)      Serial.print(x)
  #define DBGLN(x)    Serial.println(x)
#else
  #define DBG(x)
  #define DBGLN(x)
#endif

// ─────────────────────────────────────────────────────────────────────────────
//  Setup-portal identity
// ─────────────────────────────────────────────────────────────────────────────
const char* AP_SSID = "OGNIBORMO-SETUP";
const char* AP_PASS = "ognibormo";        // WPA2 needs at least 8 characters

// ─────────────────────────────────────────────────────────────────────────────
//  Timing
// ─────────────────────────────────────────────────────────────────────────────
const uint32_t POST_IDLE_MS    = 3000;  // backend allows 120 posts / 60s
const uint32_t POST_ALARM_MS   = 1000;
const uint32_t HEARTBEAT_MS    = 30000; // makes the unit's IP show on the dashboard
const uint32_t SAMPLE_MS       = 250;
const uint32_t WARMUP_MS       = 20000; // MQ-2 preheat; set 0 to skip for a demo
const uint32_t BASELINE_MS     = 4000;
const uint32_t HTTP_TIMEOUT_MS = 4000;
const uint32_t WIFI_JOIN_MS    = 15000;

const uint32_t FIRE_BEEP_MS    = 120;
const uint32_t SMOKE_BEEP_MS   = 150;
const int      FIRE_TONE_HZ    = 2500;
const int      SMOKE_TONE_HZ   = 1500;

// ─────────────────────────────────────────────────────────────────────────────
//  Detection tuning
// ─────────────────────────────────────────────────────────────────────────────
const int     SMOKE_DELTA    = 250;   // alarm at baseline + this (raw counts)
const float   CLEAR_FRACTION = 0.6f;  // hysteresis: clear at 60% of the delta
const uint8_t CONFIRM_READS  = 3;

#if HAS_DHT
  #include <DHT.h>
  DHT dht(DHT_PIN, DHT22);
#endif

// ─────────────────────────────────────────────────────────────────────────────
//  Saved configuration (NVS — survives power loss)
// ─────────────────────────────────────────────────────────────────────────────
Preferences prefs;

String cfgSsid, cfgPass, cfgServer, cfgDevice;
uint16_t cfgPort = 8080;
bool cfgAutoDiscover = true;

void loadConfig() {
  prefs.begin("ognibormo", true);
  cfgSsid         = prefs.getString("ssid", "");
  cfgPass         = prefs.getString("pass", "");
  cfgServer       = prefs.getString("server", "");
  cfgDevice       = prefs.getString("device", "OGB-UTT-001");
  cfgPort         = prefs.getUShort("port", 8080);
  cfgAutoDiscover = prefs.getBool("auto", true);
  prefs.end();
}

void saveConfig() {
  prefs.begin("ognibormo", false);
  prefs.putString("ssid", cfgSsid);
  prefs.putString("pass", cfgPass);
  prefs.putString("server", cfgServer);
  prefs.putString("device", cfgDevice);
  prefs.putUShort("port", cfgPort);
  prefs.putBool("auto", cfgAutoDiscover);
  prefs.end();
}

void clearConfig() {
  prefs.begin("ognibormo", false);
  prefs.clear();
  prefs.end();
}

// ─────────────────────────────────────────────────────────────────────────────
//  State.  32-bit aligned scalars are atomic on the ESP32, so core 1 can write
//  and core 0 can read these without a mutex.
// ─────────────────────────────────────────────────────────────────────────────
enum LinkState { LINK_PORTAL, LINK_JOINING, LINK_NO_SERVER, LINK_ONLINE };

volatile LinkState g_link         = LINK_JOINING;
volatile int       g_smokeValue   = 0;
volatile bool      g_smokeAlarm   = false;
volatile bool      g_fireAlarm    = false;
volatile float     g_temperature  = 0.0f;
volatile float     g_humidity     = 0.0f;
volatile bool      g_dhtOk        = false;
volatile int       g_lastHttpCode = 0;
volatile int       g_riskScore    = -1;
volatile bool      g_rescanWanted = false;

int     smokeBaseline = 0;
int     smokeOnLevel  = 0;
int     smokeOffLevel = 0;
uint8_t smokeStreak   = 0;
uint8_t flameStreak   = 0;

uint32_t lastSample      = 0;
uint32_t lastBeep        = 0;
uint32_t lastLed         = 0;
uint32_t lastPortalChirp = 0;
uint8_t  ledPhase        = 0;
bool     buzzerOn        = false;

WebServer  server(80);
DNSServer  dns;
bool       portalMode = false;

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

/** Blocking chirp. Only used at boot and on config changes, never in alarm. */
void chirp(int freq, int ms, int times = 1, int gap = 80) {
  for (int i = 0; i < times; i++) {
    beepOn(freq);
    delay(ms);
    beepOff();
    if (i < times - 1) delay(gap);
  }
}

void ledWrite(bool on) {
#if LED_ACTIVE_LOW
  digitalWrite(STATUS_LED, on ? LOW : HIGH);
#else
  digitalWrite(STATUS_LED, on ? HIGH : LOW);
#endif
}

/**
 * The LED is the only status display this unit has once it is on a battery,
 * so each link state gets a pattern that is distinguishable across a room.
 *
 *   slow blink   waiting to be set up   — join OGNIBORMO-SETUP
 *   fast blink   joining WiFi
 *   double-blink on WiFi, backend not reachable
 *   solid        online, readings landing on the dashboard
 */
void serviceLed(uint32_t now) {
  switch (g_link) {
    case LINK_PORTAL:
      if (now - lastLed >= 500) { lastLed = now; ledPhase ^= 1; ledWrite(ledPhase); }
      break;

    case LINK_JOINING:
      if (now - lastLed >= 150) { lastLed = now; ledPhase ^= 1; ledWrite(ledPhase); }
      break;

    case LINK_NO_SERVER: {
      // on-off-on-off--------  repeating every 1.4s
      uint32_t t = now % 1400;
      ledWrite(t < 120 || (t >= 260 && t < 380));
      break;
    }

    case LINK_ONLINE:
      ledWrite(true);
      break;
  }
}

// =============================================================================
//  Sensors
// =============================================================================
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
  if (WARMUP_MS > 0) {
    uint32_t start = millis();
    while (millis() - start < WARMUP_MS) {
      ledWrite((millis() / 250) % 2);   // quick flicker = warming up
      delay(50);
    }
  }

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

  DBGLN("");
  DBG("Clean-air baseline : "); DBGLN(smokeBaseline);
  DBG("Siren above        : "); DBGLN(smokeOnLevel);
  DBG("Clears below       : "); DBGLN(smokeOffLevel);
  DBG("Set backend .env   : SMOKE_THRESHOLD=");
  DBGLN((smokeBaseline + SMOKE_DELTA) / 2);
  DBGLN("");
}

// =============================================================================
//  Web pages
// =============================================================================

const char* PAGE_CSS =
  "<style>"
  "*{box-sizing:border-box}"
  "body{margin:0;padding:20px;background:#0f172a;color:#e2e8f0;"
  "font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}"
  ".w{max-width:420px;margin:0 auto}"
  "h1{font-size:19px;margin:0 0 4px;color:#fb923c}"
  ".sub{font-size:13px;color:#94a3b8;margin:0 0 20px}"
  "label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.05em;"
  "color:#94a3b8;margin:14px 0 5px}"
  "input,select{width:100%;padding:11px;background:#1e293b;color:#e2e8f0;"
  "border:1px solid #334155;border-radius:8px;font-size:15px}"
  "button{width:100%;margin-top:20px;padding:13px;background:#ea580c;color:#fff;"
  "border:0;border-radius:8px;font-size:15px;font-weight:600}"
  "button.alt{background:#334155;margin-top:10px}"
  "table{width:100%;border-collapse:collapse;font-size:14px}"
  "td{padding:7px 0;border-bottom:1px solid #1e293b}"
  "td:last-child{text-align:right;font-family:ui-monospace,monospace;color:#f1f5f9}"
  ".ok{color:#34d399}.bad{color:#f87171}.warn{color:#fbbf24}"
  "</style>";

/** Setup portal: pick a network, set where the backend lives. */
void handlePortalRoot() {
  String html = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>";
  html += "<title>OGNIBORMO setup</title>";
  html += PAGE_CSS;
  html += "<div class=w><h1>OGNIBORMO unit</h1>";
  html += "<p class=sub>Connect this unit to the WiFi that the SFAS-BD dashboard is on.</p>";
  html += "<form method=POST action=/save>";

  html += "<label>WiFi network</label><select name=ssid>";
  int n = WiFi.scanNetworks();
  for (int i = 0; i < n; i++) {
    html += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i);
    html += "  (" + String(WiFi.RSSI(i)) + " dBm)</option>";
  }
  if (n == 0) html += "<option value=''>-- no networks found --</option>";
  html += "</select>";

  html += "<label>WiFi password</label><input name=pass type=password value='" + cfgPass + "'>";

  html += "<label>Unit code</label><input name=device value='" + cfgDevice + "'>";

  html += "<label>Server address</label>";
  html += "<input name=server placeholder='leave empty to find it automatically' value='" + cfgServer + "'>";

  html += "<label>Server port</label><input name=port value='" + String(cfgPort) + "'>";

  html += "<button type=submit>Save and connect</button></form></div>";

  server.send(200, "text/html", html);
}

void handlePortalSave() {
  cfgSsid   = server.arg("ssid");
  cfgPass   = server.arg("pass");
  cfgDevice = server.arg("device");
  cfgServer = server.arg("server");
  cfgServer.trim();
  cfgPort   = (uint16_t)server.arg("port").toInt();
  if (cfgPort == 0) cfgPort = 8080;
  cfgAutoDiscover = (cfgServer.length() == 0);

  saveConfig();

  String html = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>";
  html += PAGE_CSS;
  html += "<div class=w><h1>Saved</h1><p class=sub>Connecting to <b>" + cfgSsid + "</b>.";
  html += " The unit restarts now. When the LED stays solid it is online and reporting.";
  html += " Its address will appear in the dashboard under Units.</p></div>";
  server.send(200, "text/html", html);

  delay(1200);
  ESP.restart();
}

/** Live status page, served at the unit's own address once it is on the WiFi. */
void handleStatusRoot() {
  String html = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>";
  html += "<meta http-equiv=refresh content=10>";
  html += "<title>" + cfgDevice + "</title>";
  html += PAGE_CSS;
  html += "<div class=w><h1>" + cfgDevice + "</h1>";
  html += "<p class=sub>OGNIBORMO field unit</p><table>";

  html += "<tr><td>WiFi</td><td>" + WiFi.SSID() + "</td></tr>";
  html += "<tr><td>Signal</td><td>" + String(WiFi.RSSI()) + " dBm</td></tr>";
  html += "<tr><td>This unit</td><td>" + WiFi.localIP().toString() + "</td></tr>";
  html += "<tr><td>Backend</td><td>" + (cfgServer.length() ? cfgServer + ":" + String(cfgPort)
                                                           : String("not found")) + "</td></tr>";

  html += "<tr><td>Link</td><td class=";
  if (g_link == LINK_ONLINE)          html += "ok>reporting";
  else if (g_link == LINK_NO_SERVER)  html += "bad>backend unreachable";
  else                                html += "warn>connecting";
  html += "</td></tr>";

  if (g_lastHttpCode) html += "<tr><td>Last response</td><td>HTTP " + String(g_lastHttpCode) + "</td></tr>";
  if (g_riskScore >= 0) html += "<tr><td>Backend risk</td><td>" + String(g_riskScore) + "/100</td></tr>";

  html += "<tr><td>Smoke</td><td>" + String(g_smokeValue) + " / base " + String(smokeBaseline) + "</td></tr>";
  html += "<tr><td>Alarms above</td><td>" + String(smokeOnLevel) + "</td></tr>";

  html += "<tr><td>State</td><td class=";
  if (g_fireAlarm)       html += "bad>FIRE";
  else if (g_smokeAlarm) html += "bad>SMOKE";
  else                   html += "ok>normal";
  html += "</td></tr>";

#if HAS_DHT
  if (g_dhtOk) {
    html += "<tr><td>Temperature</td><td>" + String(g_temperature, 1) + " C</td></tr>";
    html += "<tr><td>Humidity</td><td>" + String(g_humidity, 1) + " %</td></tr>";
  }
#else
  html += "<tr><td>Temperature</td><td>no sensor fitted</td></tr>";
#endif
  html += "</table>";

  html += "<form method=POST action=/server>";
  html += "<label>Backend address</label><input name=server value='" + cfgServer + "'>";
  html += "<label>Port</label><input name=port value='" + String(cfgPort) + "'>";
  html += "<button type=submit>Save server</button></form>";

  html += "<form method=POST action=/rescan><button class=alt type=submit>Search the network for the backend</button></form>";
  html += "<form method=POST action=/forget onsubmit=\"return confirm('Forget the WiFi and reopen setup?')\">";
  html += "<button class=alt type=submit>Forget WiFi and reopen setup</button></form>";
  html += "</div>";

  server.send(200, "text/html", html);
}

void handleSetServer() {
  cfgServer = server.arg("server");
  cfgServer.trim();
  cfgPort = (uint16_t)server.arg("port").toInt();
  if (cfgPort == 0) cfgPort = 8080;
  cfgAutoDiscover = (cfgServer.length() == 0);
  saveConfig();

  server.sendHeader("Location", "/");
  server.send(303);
}

void handleRescan() {
  g_rescanWanted = true;
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleForget() {
  clearConfig();
  server.send(200, "text/html",
              "<!doctype html><body style='background:#0f172a;color:#e2e8f0;"
              "font:15px system-ui;padding:24px'>WiFi cleared. Restarting into "
              "setup mode — join <b>OGNIBORMO-SETUP</b>.");
  delay(1200);
  ESP.restart();
}

// =============================================================================
//  Setup portal (AP mode)
// =============================================================================
void startPortal() {
  portalMode = true;
  g_link = LINK_PORTAL;

  WiFi.mode(WIFI_AP_STA);          // STA too, so the network scan works
  WiFi.softAP(AP_SSID, AP_PASS);
  delay(300);

  dns.start(53, "*", WiFi.softAPIP());   // catch-all DNS → captive portal

  server.on("/save", HTTP_POST, handlePortalSave);
  server.onNotFound(handlePortalRoot);   // any URL opens the setup page
  server.begin();

  chirp(1200, 400);   // one long beep = "I am waiting to be set up"
}

// =============================================================================
//  Backend discovery — find the dashboard PC without being told its address
// =============================================================================

/** True if something on this address answers the SFAS-BD health endpoint. */
bool probeBackend(IPAddress ip, uint16_t port) {
  WiFiClient c;
  if (!c.connect(ip, port, 180)) return false;

  c.print(String("GET /api/v1/health/live HTTP/1.1\r\nHost: ") +
          ip.toString() + "\r\nConnection: close\r\n\r\n");

  uint32_t start = millis();
  String head;
  while (c.connected() && millis() - start < 700 && head.length() < 400) {
    while (c.available()) head += (char)c.read();
  }
  c.stop();

  // The health route answers {"status":"ok",...} — enough to tell it apart
  // from whatever else might happen to be listening on this port.
  return head.indexOf("\"status\"") >= 0;
}

/**
 * Walks the unit's own /24. The dashboard PC is on the same router by design,
 * so this is bounded and only ever runs once per network — the result is saved.
 * Runs on core 0, so the siren is unaffected while it works.
 */
bool discoverBackend() {
  IPAddress me = WiFi.localIP();
  IPAddress gw = WiFi.gatewayIP();

  DBGLN("[net] searching the network for the SFAS-BD backend...");

  // The router itself is the least likely host and the slowest to answer, so
  // try the gateway last and walk the rest in order.
  for (int i = 2; i <= 254; i++) {
    if (IPAddress(me[0], me[1], me[2], i) == me) continue;
    if (probeBackend(IPAddress(me[0], me[1], me[2], i), cfgPort)) {
      cfgServer = IPAddress(me[0], me[1], me[2], i).toString();
      saveConfig();
      DBG("[net] backend found at "); DBGLN(cfgServer);
      return true;
    }
    if ((i & 0x0F) == 0) vTaskDelay(pdMS_TO_TICKS(1));  // stay friendly to the RTOS
  }

  if (probeBackend(gw, cfgPort)) {
    cfgServer = gw.toString();
    saveConfig();
    return true;
  }
  return false;
}

// =============================================================================
//  Network task — core 0, free to block
// =============================================================================

void sendHeartbeat() {
  if (!cfgServer.length()) return;

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);

  String url = "http://" + cfgServer + ":" + String(cfgPort) + "/api/v1/devices/heartbeat";
  if (!http.begin(url)) return;

  http.addHeader("Content-Type", "application/json");
  // The backend records the address this request arrived from, which is how
  // the unit's IP reaches the dashboard without it being typed anywhere.
  http.POST("{\"deviceCode\":\"" + cfgDevice + "\"}");
  http.end();
}

void postReading() {
  if (!cfgServer.length()) { g_link = LINK_NO_SERVER; return; }

  // MQ-2 feeds "smoke" only. It also responds to LPG, but sending the same
  // number as "gas" would make riskEngine treat one sensor as two agreeing
  // sources and inflate the fused score.
  String body = "{\"deviceCode\":\"" + cfgDevice + "\",\"smoke\":" + String(g_smokeValue) +
                ",\"fire\":" + String(g_fireAlarm ? 1 : 0);
  if (g_dhtOk) {
    body += ",\"temp\":" + String(g_temperature, 1) +
            ",\"humidity\":" + String(g_humidity, 1);
  }
  body += "}";

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.setConnectTimeout(HTTP_TIMEOUT_MS);

  String url = "http://" + cfgServer + ":" + String(cfgPort) + "/api/v1/sensors/readings";
  if (!http.begin(url)) { g_link = LINK_NO_SERVER; return; }

  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  g_lastHttpCode = code;

  if (code > 0) {
    String reply = http.getString();
    int at = reply.indexOf("\"riskScore\":");
    g_riskScore = (at >= 0) ? reply.substring(at + 12).toInt() : -1;
    g_link = (code < 400 || code == 429) ? LINK_ONLINE : LINK_NO_SERVER;
  } else {
    g_link = LINK_NO_SERVER;
    g_riskScore = -1;
  }

  http.end();
}

bool joinWifi() {
  g_link = LINK_JOINING;

  WiFi.mode(WIFI_STA);
#if WIFI_POWER_SAVE
  WiFi.setSleep(true);
#else
  WiFi.setSleep(false);
#endif
  WiFi.setAutoReconnect(true);
  WiFi.begin(cfgSsid.c_str(), cfgPass.c_str());

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_JOIN_MS) {
    vTaskDelay(pdMS_TO_TICKS(250));
  }

  if (WiFi.status() == WL_CONNECTED) {
    DBG("[net] joined "); DBG(cfgSsid);
    DBG("  unit IP: ");   DBGLN(WiFi.localIP());
    return true;
  }
  DBG("[net] could not join "); DBGLN(cfgSsid);

#if SERIAL_DEBUG
  // Distinguish the failures that look identical from the outside: an AP that
  // is not there, a wrong password, and an AP whose security this radio cannot
  // speak. Without this the only symptom is an endless "joining".
  Serial.print("[net] status code ");
  Serial.print((int)WiFi.status());
  Serial.println("  (1=SSID not found, 4=auth failed, 6=disconnected)");

  int n = WiFi.scanNetworks();
  bool seen = false;
  for (int i = 0; i < n; i++) {
    if (WiFi.SSID(i) != cfgSsid) continue;
    seen = true;
    Serial.print("[net] AP visible, rssi ");
    Serial.print(WiFi.RSSI(i));
    Serial.print(" dBm, security: ");
    switch (WiFi.encryptionType(i)) {
      case WIFI_AUTH_OPEN:           Serial.println("open"); break;
      case WIFI_AUTH_WPA_PSK:        Serial.println("WPA - ok"); break;
      case WIFI_AUTH_WPA2_PSK:       Serial.println("WPA2 - ok"); break;
      case WIFI_AUTH_WPA_WPA2_PSK:   Serial.println("WPA/WPA2 - ok"); break;
      case WIFI_AUTH_WPA2_WPA3_PSK:  Serial.println("WPA2/WPA3 mixed - ok"); break;
      case WIFI_AUTH_WPA3_PSK:
        Serial.println("WPA3-ONLY");
        Serial.println("[net] >> switch the hotspot to WPA2 or WPA2/WPA3 mixed");
        break;
      default:                       Serial.println("unknown"); break;
    }
  }
  if (!seen) Serial.println("[net] AP not found in scan - is it switched on?");
  WiFi.scanDelete();
#endif

  return false;
}

void netTask(void* pv) {
  (void)pv;

  uint32_t lastHeartbeat = 0;
  bool announced   = false;
  bool httpStarted = false;

  for (;;) {
    if (WiFi.status() != WL_CONNECTED) {
      g_link = LINK_JOINING;
      announced = false;
      if (!joinWifi()) {
        vTaskDelay(pdMS_TO_TICKS(5000));
        continue;
      }
      // Station-mode status page, reachable at the unit's own address. Routes
      // are registered once for the life of the process — WebServer::on()
      // appends, so re-registering them on every reconnect would pile up
      // duplicate handlers and leak the heap this unit cannot spare.
      if (!httpStarted) {
        httpStarted = true;
        server.on("/server", HTTP_POST, handleSetServer);
        server.on("/rescan", HTTP_POST, handleRescan);
        server.on("/forget", HTTP_POST, handleForget);
        server.onNotFound(handleStatusRoot);
        server.begin();
      }
    }

    if (g_rescanWanted) {
      g_rescanWanted = false;
      cfgServer = "";
      discoverBackend();
    }

    if (!cfgServer.length() && cfgAutoDiscover) {
      g_link = LINK_NO_SERVER;
      discoverBackend();
    }

    if (cfgServer.length()) {
      if (millis() - lastHeartbeat >= HEARTBEAT_MS) {
        lastHeartbeat = millis();
        sendHeartbeat();
      }
      postReading();

      if (!announced && g_link == LINK_ONLINE) {
        announced = true;
        chirp(1800, 90, 2);   // two quick chirps = online and reporting
      }
    }

    uint32_t wait = (g_fireAlarm || g_smokeAlarm) ? POST_ALARM_MS : POST_IDLE_MS;
    vTaskDelay(pdMS_TO_TICKS(wait));
  }
}

// =============================================================================
//  Setup
// =============================================================================
void setup() {
#if SERIAL_DEBUG
  Serial.begin(SERIAL_BAUD);
  delay(300);
  Serial.println();
  Serial.println("==============================================");
  Serial.println("        OGNIBORMO  /  SFAS-BD  UNIT");
  Serial.println("==============================================");
#endif

  pinMode(FLAME_D0, INPUT);
  pinMode(STATUS_LED, OUTPUT);
  pinMode(BOOT_BUTTON, INPUT_PULLUP);
  buzzerSetup();
  ledWrite(false);

  analogReadResolution(12);                    // 0..4095
  analogSetPinAttenuation(MQ2_A0, ADC_11db);   // full ~0-3.3V span

#if HAS_DHT
  dht.begin();
#endif

  chirp(2000, 60);   // one short chirp = powered up

  // Hold BOOT through power-on to wipe the saved WiFi and reopen setup. This
  // is the only recovery path on a unit with no serial console.
  uint32_t held = millis();
  while (digitalRead(BOOT_BUTTON) == LOW) {
    if (millis() - held > 3000) {
      clearConfig();
      chirp(900, 500);
      break;
    }
    delay(20);
  }

  loadConfig();

  DBG("Unit code          : "); DBGLN(cfgDevice);
  DBG("Saved WiFi         : ");
  DBGLN(cfgSsid.length() ? cfgSsid : String("(none - will open setup portal)"));
  DBG("Saved backend      : ");
  DBGLN(cfgServer.length() ? cfgServer + ":" + String(cfgPort)
                           : String("(none - will search the network)"));
  DBGLN("Warming up MQ-2, keep the air clean...");

  calibrateBaseline();

  if (cfgSsid.length() == 0) {
    DBGLN("No WiFi saved. Join 'OGNIBORMO-SETUP' (password: ognibormo)");
    DBGLN("then open http://192.168.4.1 if the page does not appear.");
    startPortal();
    return;                       // loop() services the portal
  }

  // Core 0 owns the network. loop() owns core 1 and never blocks, so the siren
  // keeps its timing even while an HTTP request is stalled or a scan is running.
  xTaskCreatePinnedToCore(netTask, "net", 8192, nullptr, 1, nullptr, 0);
}

// =============================================================================
//  Loop — core 1: sensors, siren, status LED. Nothing blocks here.
// =============================================================================
void loop() {
  uint32_t now = millis();

  if (portalMode) dns.processNextRequest();
  server.handleClient();

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

#if SERIAL_DEBUG
    // One line per sample, so the bench test reads as a stream rather than a
    // wall of blocks. Printed every 4th sample (~1s) to stay readable.
    static uint8_t tick = 0;
    if (++tick >= 4) {
      tick = 0;
      Serial.print("smoke ");
      Serial.print(smokeValue);
      Serial.print("/");
      Serial.print(smokeOnLevel);
      Serial.print("  flame ");
      Serial.print(g_fireAlarm ? "YES" : "no ");
      Serial.print("  | ");
      if (g_fireAlarm)       Serial.print("FIRE ALARM ");
      else if (g_smokeAlarm) Serial.print("SMOKE ALARM");
      else                   Serial.print("normal     ");
      Serial.print("  | link ");
      switch (g_link) {
        case LINK_ONLINE:    Serial.print("online"); break;
        case LINK_NO_SERVER: Serial.print("no backend"); break;
        case LINK_JOINING:   Serial.print("joining"); break;
        case LINK_PORTAL:    Serial.print("setup portal"); break;
      }
      if (g_riskScore >= 0) { Serial.print("  risk "); Serial.print(g_riskScore); }
      Serial.println();
    }
#endif
  }

  // ── Siren — the alarm is local and owns the buzzer whenever it is active ───
  if (g_fireAlarm || g_smokeAlarm) {
    uint32_t period = g_fireAlarm ? FIRE_BEEP_MS : SMOKE_BEEP_MS;
    int      freq   = g_fireAlarm ? FIRE_TONE_HZ : SMOKE_TONE_HZ;

    if (now - lastBeep >= period) {
      lastBeep = now;
      buzzerOn = !buzzerOn;
      if (buzzerOn) beepOn(freq);
      else          beepOff();
    }
    ledWrite((now / 100) % 2);      // LED tracks the siren during an alarm
  } else {
    if (buzzerOn) { beepOff(); buzzerOn = false; }

    // Portal mode chirps every few seconds, so a unit left waiting for setup
    // in a cupboard is not silently doing nothing.
    if (portalMode && now - lastPortalChirp >= 5000) {
      lastPortalChirp = now;
      chirp(1400, 60, 2);
    }

    serviceLed(now);
  }

  delay(2);   // yields to the RTOS; far finer than the beep period
}
