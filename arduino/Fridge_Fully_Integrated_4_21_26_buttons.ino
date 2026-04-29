#include <U8g2lib.h>
#include <ArduinoBLE.h>
#include <Wire.h>
#include <PID_v1.h>

#define MAXIMWIRE_EXTERNAL_PULLUP
#include <MaximWire.h>

// buttons
bool displayNeedsUpdate = true;
unsigned long lastDisplayUpdate = 0;
const unsigned long DISPLAY_INTERVAL = 250;

// ============================================================
// Pin Definitions
// ============================================================
constexpr int ONE_WIRE_BUS1_PIN = 4;   // two sensors here
constexpr int ONE_WIRE_BUS2_PIN = 10;  // one sensor here (change if needed)

constexpr int UP_BUTTON_PIN = 6;
constexpr int DOWN_BUTTON_PIN = 5;

constexpr int COMPRESSOR_RELAY_PIN = 2;  // active-low relay control

constexpr int VBAT_PIN = A6;
constexpr int VADP_PIN = A7;

// OLED constructor pins: clock, data, cs
U8G2_SSD1309_128X64_NONAME0_F_4W_HW_SPI u8g2(U8G2_R0, 7, 8, 9);

// ============================================================
// One-Wire / Temperature Sensors
// ============================================================
constexpr int MAX_BUS1_SENSORS = 1;
constexpr int MAX_BUS2_SENSORS = 2;
constexpr int MAX_TOTAL_SENSORS = 3;

MaximWire::Bus bus1(ONE_WIRE_BUS1_PIN);
MaximWire::Bus bus2(ONE_WIRE_BUS2_PIN);

MaximWire::Address bus1Addresses[MAX_BUS1_SENSORS];
MaximWire::Address bus2Addresses[MAX_BUS2_SENSORS];

int bus1SensorCount = 0;
int bus2SensorCount = 0;
int totalSensorCount = 0;

unsigned long lastTempRequest = 0;
bool conversionInProgress = false;

// ============================================================
// BLE
// ============================================================
BLEService fridgeService("6a8da328-7627-43a6-a5b4-a4cfb5fd139c");

// 8-byte characteristic: bytes 0-3 = float temperature (LE),
//                        bytes 4-7 = uint32 age in minutes (LE).
// age = 0 means a live/current reading; age > 0 means a stored reading.
BLECharacteristic temperatureChar(
  "96ac696e-aba0-467f-8fd9-910a55394e54",
  BLERead | BLENotify,
  8);

BLEIntCharacteristic vaccineChar(
  "bf83677e-0135-4b7e-9f42-df8d32ad39c9",
  BLEWrite | BLERead | BLENotify);

BLEIntCharacteristic solarChar(
  "446b6bee-b10b-4a0b-9114-29b86b23f8d8",
  BLERead | BLENotify);

BLEIntCharacteristic gridChar(
  "499d19ec-35b7-450c-88bc-8a9963008879",
  BLERead | BLENotify);

BLEIntCharacteristic batterySourceChar(
  "5c51b225-e17e-45fd-b4a9-84a635b71cad",
  BLERead | BLENotify);

unsigned long lastBLESent = 0;
// 5-minute interval for both storing offline readings and sending live readings
const unsigned long BLE_INTERVAL = 600000UL;

// Tracks whether a central was connected in the previous loop tick so we can
// detect the moment a new connection is established and flush the buffer.
bool wasConnected = false;

// ============================================================
// Offline Reading Buffer
// ============================================================
// Stores up to 12 hours of readings (144 × 5-min intervals) when no central
// is connected.  Implemented as a circular buffer.

const int READING_BUFFER_SIZE = 288;

struct StoredReading {
  float temp;
  bool solar;
  bool grid;
  bool battery;
  unsigned long millisWhenTaken;
};

StoredReading readingBuffer[READING_BUFFER_SIZE];
int readingBufferHead = 0;   // next write index
int readingBufferCount = 0;  // number of valid entries

// ============================================================
// AD5243 Digital Potentiometer
// ============================================================
constexpr uint8_t AD5243_ADDR = 0x2F;
constexpr float R_AB_OHMS = 2500.0f;

bool adFound = false;
float TARGET_OHMS = 1250.0f;

// ============================================================
// PID Control
// ============================================================
double Setpoint = 5.0;
double Input;
double Output;

double Kp = 30;
double Ki = 0.3;
double Kd = 80;

PID fridgePID(&Input, &Output, &Setpoint, Kp, Ki, Kd, DIRECT);

unsigned long lastControlUpdate = 0;
const unsigned long CONTROL_INTERVAL = 3000;

// ============================================================
// Relay Supervisor Control
// ============================================================
const float RELAY_ON_TEMP = 7.0f;    // turn compressor on when warm
const float RELAY_OFF_TEMP = 4.0f;   // turn compressor off when cooled
const float HARD_LOW_CUTOFF = 2.0f;  // emergency freeze protection

const unsigned long MIN_ON_TIME_MS = 60000;    // 60 s
const unsigned long MIN_OFF_TIME_MS = 120000;  // 120 s

unsigned long compressorLastStateChange = 0;
bool autoControlEnabled = true;

// ============================================================
// Power Source Monitoring
// ============================================================
const float ADC_REF_VOLTAGE = 3.3f;
const int ADC_MAX = 4095;

const float VBAT_RTOP = 50000.0f;
const float VBAT_RBOT = 10000.0f;

const float VADP_RTOP = 40000.0f;
const float VADP_RBOT = 10000.0f;

const float VADP_ACTIVE_THRESHOLD = 5.0f;
const float VBAT_ACTIVE_THRESHOLD = 5.0f;

// ============================================================
// Application State
// ============================================================
struct PowerSourceState {
  bool solar;
  bool grid;
  bool battery;
};


int upButtonState = HIGH;
int downButtonState = HIGH;

int vials = 374;
float temperature = 0.0f;   // retained for BLE/display compatibility
float filteredTemp = 5.0f;  // now based on average valid temp

float sensorTemps[MAX_TOTAL_SENSORS] = { NAN, NAN, NAN };

struct InventoryUpdate {
  int count;
  unsigned long timestamp;
};

InventoryUpdate lastUpdate;

bool compressorCommand = false;  // false = OFF, true = ON

// ============================================================
// Utility Functions
// ============================================================
bool ad5243Set(uint8_t code) {
  uint8_t instruction = 0x00;

  Wire.beginTransmission(AD5243_ADDR);
  Wire.write(instruction);
  Wire.write(code);

  return (Wire.endTransmission() == 0);
}

uint8_t convertResistanceToCode(float targetOhms) {
  float frac = targetOhms / R_AB_OHMS;

  if (frac < 0.0f) frac = 0.0f;
  if (frac > 1.0f) frac = 1.0f;

  return (uint8_t)(frac * 255.0f);
}

void setCompressorRelay(bool on) {
  compressorCommand = on;

  // Active-low relay:
  // LOW  = compressor ON
  // HIGH = compressor OFF
  digitalWrite(COMPRESSOR_RELAY_PIN, on ? LOW : HIGH);

  Serial.print("Compressor command: ");
  Serial.println(on ? "ON" : "OFF");
}

void resetPIDForCooling() {
  fridgePID.SetMode(MANUAL);
  Output = TARGET_OHMS;
  fridgePID.SetMode(AUTOMATIC);
}

bool getValidTempStats(float &minTemp, float &maxTemp, float &avgTemp) {
  int count = 0;
  float sum = 0.0f;

  minTemp = 1000.0f;
  maxTemp = -1000.0f;

  for (int i = 0; i < totalSensorCount; i++) {
    if (!isnan(sensorTemps[i])) {
      if (sensorTemps[i] < minTemp) minTemp = sensorTemps[i];
      if (sensorTemps[i] > maxTemp) maxTemp = sensorTemps[i];
      sum += sensorTemps[i];
      count++;
    }
  }

  if (count == 0) return false;

  avgTemp = sum / count;
  return true;
}

void printSerialHelp() {
  Serial.println("Available commands:");
  Serial.println("  on        -> manual compressor ON");
  Serial.println("  off       -> manual compressor OFF");
  Serial.println("  toggle    -> manual toggle compressor state");
  Serial.println("  auto      -> enable automatic relay supervisor");
  Serial.println("  manual    -> disable automatic relay supervisor");
  Serial.println("  status    -> print compressor/control status");
  Serial.println("  help      -> show this help");
  Serial.println();
}

void handleSerialCommands() {
  if (!Serial.available()) return;

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toLowerCase();

  if (cmd == "on") {
    autoControlEnabled = false;
    setCompressorRelay(true);
    resetPIDForCooling();
    compressorLastStateChange = millis();
    Serial.println("Mode: MANUAL");
  } else if (cmd == "off") {
    autoControlEnabled = false;
    setCompressorRelay(false);
    compressorLastStateChange = millis();
    Serial.println("Mode: MANUAL");
  } else if (cmd == "toggle") {
    autoControlEnabled = false;
    setCompressorRelay(!compressorCommand);
    if (compressorCommand) resetPIDForCooling();
    compressorLastStateChange = millis();
    Serial.println("Mode: MANUAL");
  } else if (cmd == "auto") {
    autoControlEnabled = true;
    compressorLastStateChange = millis();
    Serial.println("Mode: AUTO");
  } else if (cmd == "manual") {
    autoControlEnabled = false;
    Serial.println("Mode: MANUAL");
  } else if (cmd == "status") {
    float minTemp, maxTemp, avgTemp;
    bool valid = getValidTempStats(minTemp, maxTemp, avgTemp);

    Serial.print("Mode: ");
    Serial.println(autoControlEnabled ? "AUTO" : "MANUAL");

    Serial.print("Compressor: ");
    Serial.println(compressorCommand ? "ON" : "OFF");

    if (valid) {
      Serial.print("Temp stats -> min: ");
      Serial.print(minTemp, 2);
      Serial.print(" C, avg: ");
      Serial.print(avgTemp, 2);
      Serial.print(" C, max: ");
      Serial.print(maxTemp, 2);
      Serial.println(" C");
    } else {
      Serial.println("Temp stats unavailable");
    }

    Serial.print("Reading buffer: ");
    Serial.print(readingBufferCount);
    Serial.println(" stored readings");
  } else if (cmd == "help") {
    printSerialHelp();
  } else if (cmd.length() > 0) {
    Serial.print("Unknown command: ");
    Serial.println(cmd);
    printSerialHelp();
  }
}

void scanI2C() {
  Serial.println();
  Serial.println("I2C scanner. Scanning ...");

  byte count = 0;

  for (byte address = 1; address < 120; address++) {
    Wire.beginTransmission(address);

    if (Wire.endTransmission() == 0) {
      Serial.print("Found address: ");
      Serial.print(address);
      Serial.print(" (0x");
      Serial.print(address, HEX);
      Serial.println(")");
      count++;
      delay(1);
    }
  }

  Serial.println("Done.");
  Serial.print("Found ");
  Serial.print(count);
  Serial.println(" device(s).");

  Wire.beginTransmission(AD5243_ADDR);
  adFound = (Wire.endTransmission() == 0);

  if (adFound) {
    Serial.print("AD5243 detected at 0x");
    Serial.println(AD5243_ADDR, HEX);
  } else {
    Serial.print("AD5243 NOT detected at 0x");
    Serial.println(AD5243_ADDR, HEX);
    Serial.println("Check wiring/power.");
  }
}

float readPinVoltage(int pin) {
  int raw = analogRead(pin);
  return (raw * ADC_REF_VOLTAGE) / ADC_MAX;
}

float calculateSourceVoltage(float pinVoltage, float rTop, float rBot) {
  return pinVoltage * ((rTop + rBot) / rBot);
}

float readSourceVoltage(int pin, float rTop, float rBot) {
  float pinVoltage = readPinVoltage(pin);
  return calculateSourceVoltage(pinVoltage, rTop, rBot);
}

// ============================================================
// Initialization Helpers
// ============================================================
void initDigitalPot() {
  if (!adFound) return;

  uint8_t code = convertResistanceToCode(TARGET_OHMS);
  bool ok = ad5243Set(code);

  Serial.print("I2C write: ");
  Serial.println(ok ? "OK" : "FAIL");

  if (ok) {
    Serial.print("Set AD5243 CH1 to ~");
    Serial.print(TARGET_OHMS);
    Serial.println(" ohms");

    Serial.print("Wiper Position Code: ");
    Serial.println(code);
  } else {
    Serial.println("ERROR: I2C write to AD5243 failed.");
  }
}

void initBLE() {
  BLE.begin();
  BLE.setLocalName("Fridge_1_Arduino");

  fridgeService.addCharacteristic(temperatureChar);
  fridgeService.addCharacteristic(vaccineChar);
  fridgeService.addCharacteristic(solarChar);
  fridgeService.addCharacteristic(gridChar);
  fridgeService.addCharacteristic(batterySourceChar);

  BLE.setAdvertisedService(fridgeService);
  BLE.addService(fridgeService);

  uint8_t initTempBuf[8] = { 0 };
  temperatureChar.writeValue(initTempBuf, 8);
  vaccineChar.writeValue(vials);
  solarChar.writeValue(0);
  gridChar.writeValue(0);
  batterySourceChar.writeValue(0);

  BLE.advertise();
}

void initDisplay() {
  pinMode(8, OUTPUT);
  digitalWrite(8, HIGH);

  pinMode(7, OUTPUT);
  digitalWrite(7, HIGH);

  pinMode(9, OUTPUT);
  digitalWrite(9, HIGH);

  delay(10);
  digitalWrite(9, LOW);
  delay(10);
  digitalWrite(9, HIGH);
  delay(50);

  u8g2.begin();
  u8g2.setBusClock(500000);
  u8g2.enableUTF8Print();
}

void initButtons() {
  pinMode(UP_BUTTON_PIN, INPUT_PULLUP);
  pinMode(DOWN_BUTTON_PIN, INPUT_PULLUP);
}

void initCompressorRelay() {
  digitalWrite(COMPRESSOR_RELAY_PIN, LOW);  // pre-set ON for active-low
  pinMode(COMPRESSOR_RELAY_PIN, OUTPUT);
  setCompressorRelay(true);  // default ON at boot
  compressorLastStateChange = millis();
}

void discoverBus1Sensors() {
  MaximWire::Discovery discovery = bus1.Discover();

  while (discovery.HaveMore() && bus1SensorCount < MAX_BUS1_SENSORS) {
    MaximWire::Address address;

    if (discovery.FindNextDevice(address)) {
      if (address.GetModelCode() == MaximWire::DS18B20::MODEL_CODE) {
        bus1Addresses[bus1SensorCount] = address;

        Serial.print("Found DS18B20 on BUS1: ");
        Serial.println(address.ToString());

        bus1SensorCount++;
      }
    }
  }
}

void discoverBus2Sensors() {
  MaximWire::Discovery discovery = bus2.Discover();

  while (discovery.HaveMore() && bus2SensorCount < MAX_BUS2_SENSORS) {
    MaximWire::Address address;

    if (discovery.FindNextDevice(address)) {
      if (address.GetModelCode() == MaximWire::DS18B20::MODEL_CODE) {
        bus2Addresses[bus2SensorCount] = address;

        Serial.print("Found DS18B20 on BUS2: ");
        Serial.println(address.ToString());

        bus2SensorCount++;
      }
    }
  }
}

void discoverTemperatureSensors() {
  discoverBus1Sensors();
  discoverBus2Sensors();

  totalSensorCount = bus1SensorCount + bus2SensorCount;

  Serial.print("Total BUS1 sensors found: ");
  Serial.println(bus1SensorCount);

  Serial.print("Total BUS2 sensors found: ");
  Serial.println(bus2SensorCount);

  Serial.print("Total sensors found: ");
  Serial.println(totalSensorCount);
}

void initPID() {
  fridgePID.SetMode(AUTOMATIC);
  fridgePID.SetOutputLimits(0, 2500);
  fridgePID.SetSampleTime(4000);
  Output = TARGET_OHMS;
}

// ============================================================
// Temperature Handling
// ============================================================
void startTemperatureConversion() {
  for (int i = 0; i < bus1SensorCount; i++) {
    MaximWire::DS18B20 sensor(bus1Addresses[i]);
    sensor.Update(bus1);
  }

  for (int i = 0; i < bus2SensorCount; i++) {
    MaximWire::DS18B20 sensor(bus2Addresses[i]);
    sensor.Update(bus2);
  }

  lastTempRequest = millis();
  conversionInProgress = true;
}

void readTemperatureResults() {
  int logicalIndex = 0;

  for (int i = 0; i < bus1SensorCount; i++) {
    MaximWire::DS18B20 sensor(bus1Addresses[i]);
    float temp = sensor.GetTemperature<float>(bus1);

    sensorTemps[logicalIndex] = temp;

    Serial.print("Sensor ");
    Serial.print(logicalIndex);
    Serial.print(" (BUS1): ");
    Serial.println(temp);

    logicalIndex++;
  }

  for (int i = 0; i < bus2SensorCount; i++) {
    MaximWire::DS18B20 sensor(bus2Addresses[i]);
    float temp = sensor.GetTemperature<float>(bus2);

    sensorTemps[logicalIndex] = temp;

    Serial.print("Sensor ");
    Serial.print(logicalIndex);
    Serial.print(" (BUS2): ");
    Serial.println(temp);

    logicalIndex++;
  }

  float minTemp, maxTemp, avgTemp;
  if (getValidTempStats(minTemp, maxTemp, avgTemp)) {
    temperature = avgTemp;
    temperature = round(temperature * 10.0f) / 10.0f;
    filteredTemp = 0.9f * filteredTemp + 0.1f * avgTemp;
  }

  conversionInProgress = false;
}

void handleTemperatureSensors() {
  if (totalSensorCount <= 0) return;

  if (!conversionInProgress && millis() - lastTempRequest >= 1000) {
    startTemperatureConversion();
  }

  if (conversionInProgress && millis() - lastTempRequest >= 750) {
    readTemperatureResults();
  }
}

// ============================================================
// Repeating Tasks
// ============================================================
void handleBLEInventoryUpdate() {
  BLE.poll();

  BLEDevice central = BLE.central();

  if (central && central.connected()) {
    if (vaccineChar.written()) {
      InventoryUpdate newVal;
      newVal.count = vaccineChar.value();
      newVal.timestamp = millis();

      if (newVal.timestamp > lastUpdate.timestamp) {
        vials = newVal.count;
        lastUpdate = newVal;
        displayNeedsUpdate = true;  //buttons
      }
    }
  }
}

// void handleButtons() {
//   static int lastUpButtonState = HIGH;
//   static int lastDownButtonState = HIGH;

//   upButtonState = digitalRead(UP_BUTTON_PIN);
//   downButtonState = digitalRead(DOWN_BUTTON_PIN);

//   if (lastUpButtonState == HIGH && upButtonState == LOW) {
//     vials++;
//   }

//   if (lastDownButtonState == HIGH && downButtonState == LOW) {
//     vials--;
//   }

//   lastUpButtonState = upButtonState;
//   lastDownButtonState = downButtonState;
// }

void handleButtons() {
  static int lastRawUp = HIGH;
  static int lastRawDown = HIGH;

  static int stableUp = HIGH;
  static int stableDown = HIGH;

  static unsigned long upLastChangeTime = 0;
  static unsigned long downLastChangeTime = 0;

  const unsigned long debounceMs = 30;

  int rawUp = digitalRead(UP_BUTTON_PIN);
  int rawDown = digitalRead(DOWN_BUTTON_PIN);

  // Track raw changes
  if (rawUp != lastRawUp) {
    upLastChangeTime = millis();
    lastRawUp = rawUp;
  }

  if (rawDown != lastRawDown) {
    downLastChangeTime = millis();
    lastRawDown = rawDown;
  }

  // Accept new stable UP state after debounce time
  if ((millis() - upLastChangeTime) > debounceMs) {
    if (stableUp != rawUp) {
      stableUp = rawUp;

      if (stableUp == LOW) {  // button press
        vials++;
        Serial.print("UP pressed -> vials = ");
        Serial.println(vials);
        displayNeedsUpdate = true;
      }
    }
  }

  // Accept new stable DOWN state after debounce time
  if ((millis() - downLastChangeTime) > debounceMs) {
    if (stableDown != rawDown) {
      stableDown = rawDown;

      if (stableDown == LOW) {  // button press
        if (vials > 0) vials--;
        Serial.print("DOWN pressed -> vials = ");
        Serial.println(vials);
        displayNeedsUpdate = true;
      }
    }
  }

  upButtonState = stableUp;
  downButtonState = stableDown;
}

void handleCompressorSupervisor() {
  if (!autoControlEnabled) return;

  float minTemp, maxTemp, avgTemp;
  if (!getValidTempStats(minTemp, maxTemp, avgTemp)) return;

  unsigned long now = millis();
  unsigned long timeInState = now - compressorLastStateChange;

  // Immediate freeze protection
  if (minTemp <= HARD_LOW_CUTOFF) {
    if (compressorCommand) {
      setCompressorRelay(false);
      compressorLastStateChange = now;
      Serial.println("AUTO: Compressor OFF due to hard low-temp cutoff");
    }
    return;
  }

  // OFF -> ON transition
  if (!compressorCommand) {
    if (maxTemp >= RELAY_ON_TEMP && timeInState >= MIN_OFF_TIME_MS) {
      setCompressorRelay(true);
      resetPIDForCooling();
      compressorLastStateChange = now;
      Serial.println("AUTO: Compressor ON due to upper temp threshold");
    }
  }
  // ON -> OFF transition
  else {
    if (avgTemp <= RELAY_OFF_TEMP && timeInState >= MIN_ON_TIME_MS) {
      setCompressorRelay(false);
      compressorLastStateChange = now;
      Serial.println("AUTO: Compressor OFF due to lower temp threshold");
    }
  }
}

void handlePIDControl() {
  if (!compressorCommand) return;
  if (millis() - lastControlUpdate < CONTROL_INTERVAL) return;

  Input = filteredTemp;
  fridgePID.Compute();

  static float currentOhms = 1250.0f;
  const float maxStep = 60.0f;

  if (Output > currentOhms + maxStep) Output = currentOhms + maxStep;
  if (Output < currentOhms - maxStep) Output = currentOhms - maxStep;

  currentOhms = Output;

  if (currentOhms < 0.0f) currentOhms = 0.0f;
  if (currentOhms > 2500.0f) currentOhms = 2500.0f;

  TARGET_OHMS = currentOhms;

  uint8_t code = convertResistanceToCode(TARGET_OHMS);
  bool ok = ad5243Set(code);

  Serial.print("PID active | Avg temp: ");
  Serial.print(Input);
  Serial.print(" C, TARGET_OHMS: ");
  Serial.print(TARGET_OHMS);
  Serial.print(", code: ");
  Serial.print(code);
  Serial.print(", write: ");
  Serial.println(ok ? "OK" : "FAIL");

  lastControlUpdate = millis();
}

PowerSourceState readPowerSources() {
  PowerSourceState state;
  float vadp = readSourceVoltage(VADP_PIN, VADP_RTOP, VADP_RBOT);
  float vbat = readSourceVoltage(VBAT_PIN, VBAT_RTOP, VBAT_RBOT);
  state.solar = false;
  state.grid = vadp >= VADP_ACTIVE_THRESHOLD;
  state.battery = vbat >= VBAT_ACTIVE_THRESHOLD;
  return state;
}

// ============================================================
// BLE Reading Buffer Helpers
// ============================================================

/**
 * writeTempPacket
 * ----------------
 * Writes an 8-byte packet to the temperature BLE characteristic.
 *   Bytes 0-3: IEEE 754 float32 temperature in °C (little-endian)
 *   Bytes 4-7: uint32 age in whole minutes (little-endian)
 *              0 = live/current reading; >0 = stored reading taken that many minutes ago
 */
void writeTempPacket(float temp, uint32_t ageMinutes) {
  uint8_t buf[8];
  memcpy(buf, &temp, 4);
  memcpy(buf + 4, &ageMinutes, 4);
  temperatureChar.writeValue(buf, 8);
}

/**
 * storeReading
 * -------------
 * Adds a temperature reading and its associated power state to the circular
 * buffer.  Oldest entries are silently overwritten once the buffer is full.
 */
void storeReading(float temp, bool solar, bool grid, bool battery) {
  readingBuffer[readingBufferHead] = { temp, solar, grid, battery, millis() };
  readingBufferHead = (readingBufferHead + 1) % READING_BUFFER_SIZE;
  if (readingBufferCount < READING_BUFFER_SIZE) {
    readingBufferCount++;
  }
}

/**
 * flushReadingBuffer
 * -------------------
 * Transmits every stored reading to the connected central, oldest first.
 * For each reading the power-source characteristics are updated before the
 * temperature packet is written so the app can associate the correct power
 * state with the correct reading.  A 100 ms gap between packets gives the
 * app time to process each reading.  The buffer is cleared when done.
 */
void flushReadingBuffer() {
  if (readingBufferCount == 0) return;

  unsigned long nowMs = millis();
  int count = readingBufferCount;
  int startIdx = (readingBufferHead - count + READING_BUFFER_SIZE) % READING_BUFFER_SIZE;

  Serial.print("BLE: Flushing ");
  Serial.print(count);
  Serial.println(" stored readings");

  for (int i = 0; i < count; i++) {
    int idx = (startIdx + i) % READING_BUFFER_SIZE;
    StoredReading &r = readingBuffer[idx];

    unsigned long elapsedMs = nowMs - r.millisWhenTaken;
    uint32_t ageMinutes = (uint32_t)(elapsedMs / 600000UL);

    // Set power source state that was recorded with this reading
    solarChar.writeValue((int)r.solar);
    BLE.poll();  // keep the BLE stack alive between writes

    gridChar.writeValue((int)r.grid);
    BLE.poll();  // keep the BLE stack alive between writes

    batterySourceChar.writeValue((int)r.battery);
    BLE.poll();  // keep the BLE stack alive between writes


    writeTempPacket(r.temp, ageMinutes);

    BLE.poll();  // keep the BLE stack alive between writes
    delay(100);
  }

  readingBufferCount = 0;
  readingBufferHead = 0;
}

// ============================================================
// BLE Transmission
// ============================================================

/**
 * handleBLETransmit
 * ------------------
 * Called every second from the main loop tick.
 *
 * Behaviour:
 *   - Detects a new BLE connection and immediately flushes the stored reading
 *     buffer to the central (with per-reading timestamps encoded as age).
 *   - While connected: sends a live reading (age = 0) every BLE_INTERVAL ms.
 *   - While disconnected: stores one reading every BLE_INTERVAL ms to the
 *     circular buffer for later delivery.
 */
void handleBLETransmit() {
  BLE.poll();
  BLEDevice central = BLE.central();
  bool isConnected = central && central.connected();

  // ── New connection detected ───────────────────────────────────────────────
  if (isConnected && !wasConnected) {
    Serial.println("BLE: Central connected — sending current state and stored readings");

    // Send the current power state and vaccine count first
    PowerSourceState power = readPowerSources();
    solarChar.writeValue((int)power.solar);
    gridChar.writeValue((int)power.grid);
    batterySourceChar.writeValue((int)power.battery);
    vaccineChar.writeValue(vials);

    // Flush all readings accumulated while disconnected
    flushReadingBuffer();

    // Reset the live-send timer so the next live reading goes out after a
    // full BLE_INTERVAL rather than immediately after the flush
    lastBLESent = millis();
  }

  wasConnected = isConnected;

  // ── Periodic update (live reading or buffer store) ────────────────────────
  if (millis() - lastBLESent < BLE_INTERVAL) return;
  lastBLESent = millis();

  // Only record/send a reading if sensors have been discovered and a valid
  // temperature has been obtained
  if (totalSensorCount <= 0 || isnan(temperature)) return;

  PowerSourceState power = readPowerSources();

  if (isConnected) {
    // Live reading: age = 0 (reading taken right now)
    solarChar.writeValue((int)power.solar);
    gridChar.writeValue((int)power.grid);
    batterySourceChar.writeValue((int)power.battery);
    vaccineChar.writeValue(vials);
    writeTempPacket(temperature, 0);

    Serial.print("BLE Live -> Temp: ");
    Serial.print(temperature);
    Serial.print("  Vials: ");
    Serial.print(vials);
    Serial.print("  Solar: ");
    Serial.print(power.solar);
    Serial.print("  Grid: ");
    Serial.print(power.grid);
    Serial.print("  Battery: ");
    Serial.println(power.battery);
  } else {
    // No central connected — store reading for later delivery
    storeReading(temperature, power.solar, power.grid, power.battery);

    Serial.print("Stored reading (buffer ");
    Serial.print(readingBufferCount);
    Serial.print("/");
    Serial.print(READING_BUFFER_SIZE);
    Serial.print(") -> Temp: ");
    Serial.println(temperature);
  }
}

void updateDisplay() {
  char bufferTemp[20];
  char bufferVials[20];
  char bufferGrid[20];
  char bufferBattery[20];

  float vadp = readSourceVoltage(VADP_PIN, VADP_RTOP, VADP_RBOT);
  float vbat = readSourceVoltage(VBAT_PIN, VBAT_RTOP, VBAT_RBOT);

  u8g2.clearBuffer();

  u8g2.setFont(u8g2_font_6x10_tf);

  u8g2.drawStr(0, 20, "Temperature:");
  sprintf(bufferTemp, "%.1f %cC", temperature, 176);
  u8g2.drawStr(80, 20, bufferTemp);

  u8g2.drawStr(0, 40, "Vials:");
  sprintf(bufferVials, "%d", vials);
  u8g2.drawStr(60, 40, bufferVials);

  u8g2.setFont(u8g2_font_4x6_tf);

  if (vadp >= 6) {
    sprintf(bufferGrid, "%.1fV", vadp);
  } else sprintf(bufferGrid, "OFF");


  if (vbat >= 6) {
    sprintf(bufferBattery, "%.1fV", vbat);
  } else sprintf(bufferBattery, "OFF");


  u8g2.drawStr(0, 60, "Grid:");
  u8g2.drawStr(20, 60, bufferGrid);

  u8g2.drawStr(50, 60, "Battery:");
  u8g2.drawStr(85, 60, bufferBattery);

  u8g2.sendBuffer();
}

void printPowerSourceVoltages() {
  float vbat = readSourceVoltage(VBAT_PIN, VBAT_RTOP, VBAT_RBOT);
  float vadp = readSourceVoltage(VADP_PIN, VADP_RTOP, VADP_RBOT);

  Serial.print("VBAT: ");
  Serial.print(vbat, 3);
  Serial.println(" V");

  Serial.print("VADP: ");
  Serial.print(vadp, 3);
  Serial.println(" V");

  Serial.println();
}

// ============================================================
// Arduino Setup / Loop
// ============================================================
unsigned long lastLoopTick = 0;
const unsigned long LOOP_INTERVAL = 1000;

void setup() {
  Serial.begin(9600);
  unsigned long serialStart = millis();
  while (!Serial && millis() - serialStart < 3000) {}

  Wire.begin();
  Wire.setClock(400000);
  analogReadResolution(12);

  scanI2C();
  initDigitalPot();

  Serial.println("Voltage monitor started");
  Serial.println("VBAT on A6, VADP on A7");
  Serial.println();

  initBLE();
  initDisplay();
  initButtons();
  initCompressorRelay();
  discoverTemperatureSensors();
  initPID();

  printSerialHelp();
}

// void loop() {
//   BLE.poll();
//   handleSerialCommands();
//   handleBLEInventoryUpdate();
//   handleTemperatureSensors();

//   unsigned long now = millis();
//   if (now - lastLoopTick >= LOOP_INTERVAL) {
//     lastLoopTick = now;
//     handleButtons();
//     handleCompressorSupervisor();
//     handlePIDControl();
//     handleBLETransmit();
//     updateDisplay();
//     printPowerSourceVoltages();
//   }
// }

void loop() {
  BLE.poll();
  handleSerialCommands();
  handleBLEInventoryUpdate();
  handleTemperatureSensors();

  // Poll buttons every loop for responsiveness
  handleButtons();

  unsigned long now = millis();

  // Fast-ish display refresh when needed
  if (displayNeedsUpdate || (now - lastDisplayUpdate >= DISPLAY_INTERVAL)) {
    lastDisplayUpdate = now;
    updateDisplay();
    displayNeedsUpdate = false;
  }

  // Slower tasks can stay on the 1-second scheduler
  if (now - lastLoopTick >= LOOP_INTERVAL) {
    lastLoopTick = now;
    handleCompressorSupervisor();
    handlePIDControl();
    handleBLETransmit();
    printPowerSourceVoltages();
  }
}
