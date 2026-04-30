import { Device } from "../../db/models/device.model.js";
import { DeviceDocument, DeviceInputRepo } from "./device.types.js";

export async function repoFindByDeviceCode(
  deviceCode: string,
): Promise<DeviceDocument | null> {
  return await Device.findOne({ deviceCode });
}

export async function repoAddNewDevice(
  data: DeviceInputRepo,
): Promise<DeviceDocument> {
  return await Device.create(data);
}

export async function repoGetAllDevices({
  query,
  page,
  limit,
  sortBy,
  sortOrder,
}: {
  query: any;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}): Promise<{
  devices: DeviceDocument[];
  total: number;
}> {
  const devices = await Device.find(query, { apiKeyHash: 0, __v: 0 })
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Device.countDocuments(query);

  return {
    devices,
    total,
  };
}
