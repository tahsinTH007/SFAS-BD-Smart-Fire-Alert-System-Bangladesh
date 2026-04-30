export interface ISensorData {
  deviceCode: string;
  apiKey: string;
  buildingId: string;
  stationId: string;
  firmwareVersion: string;
  ipAddress: string;
  location: string;
  coordinates: string; // "lat,lng" format
  smoke: number;
  gas: number;
  gasType: string;
  fire: number; // 0 or 1
  temp: number;
  humidity: number;
  reportedBy: string;
  contactNumber: string;
  affectedArea: string;
  estimatedPeople: number;
  sector: string;
  building: string;
  floor: number;
  room: string;
}
