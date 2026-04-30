import { ReadlineParser, SerialPort } from "serialport";

export const serialPort = new SerialPort({
  path: "COM4",
  baudRate: 9600,
});

export const serialParser = serialPort.pipe(
  new ReadlineParser({ delimiter: "\n" }),
);

serialPort.on("open", () => {
  console.log("✅ Serial Port Connected (COM4)");
});

serialPort.on("error", (err) => {
  console.error("❌ Serial Error:", err.message);
});

serialParser.on("data", (data: string) => {
  console.log("📥 RAW DATA:", data);
});
