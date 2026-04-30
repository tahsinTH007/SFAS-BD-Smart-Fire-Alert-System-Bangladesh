import { InternalServerError, ValidationError } from "../../lib/error.js";
import { isExistingBuilding } from "./building.repository.js";
import { BuildingInput } from "./building.types.js";

export async function addNewBuilding(params: BuildingInput) {
  try {
    const existingBuilding = await isExistingBuilding(params);

    if (existingBuilding !== null) {
      throw new ValidationError(
        `Building already exists with station ID "${params.stationId}", ` +
          `name "${params.name}", address "${params.address}", ` +
          `and coordinates [${params.coordinates.join(", ")}]`,
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new InternalServerError("Failed to create building", error);
  }
}
