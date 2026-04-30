export type Priority = "critical" | "important" | "info";

export interface MapAlert {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  location: string;
  reportedBy: string;
  contactNumber: string | number;
  timestamp: string;
  acknowledged: boolean;
  coordinates: [number, number] | null;
  estimatedPeople: number;
  temperature: string;
}
