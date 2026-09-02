import { ConflictError, NotFoundError, BadRequestError } from "../../lib/error.js";
import { cacheInvalidate } from "../../config/redis.js";
import {
  repoBuildingStats,
  repoCountDevicesIn,
  repoCreateBuilding,
  repoDeleteBuilding,
  repoFindDuplicate,
  repoGetBuildingById,
  repoGetBuildings,
  repoUpdateBuilding,
} from "./building.repository.js";
import type { BuildingInput, BuildingQuery } from "./building.types.js";

export async function addNewBuilding(params: BuildingInput) {
  const duplicate = await repoFindDuplicate(params);

  if (duplicate) {
    throw new ConflictError(
      `A building named "${params.name}" already exists at "${params.address}" for this station`,
    );
  }

  // The previous version stopped here and returned undefined, so POST /buildings
  // both created nothing and never sent a response.
  const building = await repoCreateBuilding(params);
  await cacheInvalidate("buildings:*");
  return building;
}

export async function getBuildings(query: BuildingQuery) {
  const { buildings, total } = await repoGetBuildings(query);
  return {
    buildings,
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit) || 1,
  };
}

export async function getBuildingById(id: string) {
  const building = await repoGetBuildingById(id);
  if (!building) throw new NotFoundError("Building not found");
  return building;
}

export async function updateBuilding(
  id: string,
  updates: Partial<BuildingInput>,
) {
  const building = await repoUpdateBuilding(id, updates);
  if (!building) throw new NotFoundError("Building not found");
  await cacheInvalidate("buildings:*");
  return building;
}

export async function deleteBuilding(id: string) {
  const deviceCount = await repoCountDevicesIn(id);
  if (deviceCount > 0) {
    throw new BadRequestError(
      `Cannot delete: ${deviceCount} device(s) are still installed in this building. Move or remove them first.`,
    );
  }

  const deleted = await repoDeleteBuilding(id);
  if (!deleted) throw new NotFoundError("Building not found");
  await cacheInvalidate("buildings:*");
  return deleted;
}

export async function getBuildingStats(stationId?: string) {
  return repoBuildingStats(stationId);
}
