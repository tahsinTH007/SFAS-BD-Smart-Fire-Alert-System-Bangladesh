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
  coordinates: number[];
};
