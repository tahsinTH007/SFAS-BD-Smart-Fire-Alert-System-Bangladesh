// import { deviceCreateLimiter } from "./device.rateLimit.js";

// export async function checkDeviceCreateRateLimit(
//   deviceCode: string,
// ): Promise<void> {
//   await deviceCreateLimiter.consume(`device:create:${deviceCode}`);
// }

// export async function checkDeviceHeartbeatRateLimit(
//   deviceCode: string,
// ): Promise<void> {
//   await deviceCreateLimiter({
//     key: `device:heartbeat:${deviceCode}`,
//     limit: 60,
//     windowSec: 60,
//   });
// }

// export async function checkDeviceSensorRateLimit(
//   deviceCode: string,
// ): Promise<void> {
//   await checkRateLimit({
//     key: `device:sensor:${deviceCode}`,
//     limit: 120,
//     windowSec: 60,
//   });
// }
