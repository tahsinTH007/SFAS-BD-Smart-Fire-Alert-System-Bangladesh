export type BuildingInput = {
  name: string;
  address: string;
  sector?: string;
  stationId: string;
  structureType?: string;
  floors: number;
  estimatedPeople: number;
  yearBuilt?: number;
  occupancyType: "residential" | "commercial";
  ownerName?: string;
  ownerContact?: string;
  /** [longitude, latitude] */
  coordinates: number[];
};

export type BuildingQuery = {
  page: number;
  limit: number;
  search?: string;
  sector?: string;
  occupancyType?: string;
  stationId?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};
