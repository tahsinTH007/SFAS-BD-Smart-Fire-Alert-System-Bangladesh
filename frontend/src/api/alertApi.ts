import { axiosClient } from "@/lib/axiosClient";

export type AlertResponse = {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  deviceId: string;

  location: string;

  temperature: string;
  smokeLevel: number;
  gas: number;
  gasType: string;

  status: string;
  read: boolean;
  acknowledged: boolean;

  reportedBy: string;
  contactNumber: string;
  timestamp: string;

  coordinates?: [number, number];

  floor: string;
  building: string;
  sector: string;
  room: string;

  affectedArea: string;
  estimatedPeople: string;

  createdAt?: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
};

export const alertApi = {
  getAllAlerts: async (): Promise<AlertResponse[]> => {
    const response = await axiosClient.get<{ data: AlertResponse[] }>(
      "/alerts",
    );
    return response.data.data;
  },

  getSingleAlert: async (id: string): Promise<AlertResponse> => {
    const response = await axiosClient.get<{ data: AlertResponse }>(
      `/alerts/${id}`,
    );
    return response.data.data;
  },

  getAlertsByPriority: async (priority: string): Promise<AlertResponse[]> => {
    const response = await axiosClient.get<{ data: AlertResponse[] }>(
      `/alerts/priority/${priority}`,
    );
    return response.data.data;
  },
};
