import { Building } from "../../db/models/building.model.js";
import { BuildingInput } from "./building.types.js";

export async function isExistingBuilding(newBuilding: BuildingInput) {
  const existingBuilding = await Building.findOne({
    stationId: newBuilding.stationId,
    name: newBuilding.name,
    address: newBuilding.address,
    "location.coordinates": newBuilding.coordinates,
  });

  return existingBuilding;
}
