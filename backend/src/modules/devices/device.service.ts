import { client } from "../../config/redis.js";
import { InternalServerError, ValidationError } from "../../lib/error.js";
import { createCacheKey } from "../../utils/cache-key.js";
import {
  repoAddNewDevice,
  repoFindByDeviceCode,
  repoGetAllDevices,
} from "./device.repository.js";
import {
  DeviceDocument,
  DeviceInput,
  GetAllDevicesQuery,
} from "./device.types.js";
import { prepareDeviceForDb } from "./device.util.js";

export async function addNewDevice(
  params: DeviceInput,
): Promise<DeviceDocument> {
  try {
    const { deviceCode } = params;

    const existingDevice = await repoFindByDeviceCode(deviceCode);

    if (existingDevice !== null) {
      throw new ValidationError("Device code already exists");
    }

    const { device } = await prepareDeviceForDb(params);

    const newDevice = await repoAddNewDevice(device);

    await client.del("devices:*");

    return newDevice;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new InternalServerError("Failed to create device", error);
  }
}

export async function getAllDevices(params: GetAllDevicesQuery): Promise<{
  devices: DeviceDocument[];
  total: number;
  page: number;
  limit: number;
}> {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    buildingId,
    floor,
    sortBy = "lastSeenAt",
    sortOrder = "desc",
  } = params;

  const cacheKey = createCacheKey("devices", {
    page,
    limit,
    search,
    status,
    buildingId,
    floor,
    sortBy,
    sortOrder,
  });

  const cached = await client.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const query: any = {};
  if (search) {
    query.deviceCode = { $regex: search, $options: "i" };
  }
  if (status) query.status = status;
  if (buildingId) query.buildingId = buildingId;
  if (floor) query.floor = Number(floor);

  const { devices, total } = await repoGetAllDevices({
    query,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const result = { devices, total, page, limit };

  await client.set(cacheKey, JSON.stringify(result), "EX", 60);

  return result;
}
