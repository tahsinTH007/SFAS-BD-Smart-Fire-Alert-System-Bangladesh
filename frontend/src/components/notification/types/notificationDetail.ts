export type Priority = "critical" | "important" | "info";

export type AlertType =
  | "fire_detected"
  | "smoke_detected"
  | "heat_surge"
  | "equipment_failure"
  | "new_report"
  | "unit_dispatched"
  | "system_update"
  | "patrol_schedule";

export interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  location: string;
  reportedBy: string;
  contactNumber: string;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
}

export interface NotificationDetail extends Notification {
  incidentId: string;
  coordinates: { lat: number; lng: number };
  affectedArea: string;
  estimatedPeople: number;
  windDirection: string;
  temperature: string;
  floorAffected: string;
  structureType: string;
  units: DispatchUnit[];
  timeline: TimelineEvent[];
  relatedAlerts: Notification[];
}

export interface DispatchUnit {
  id: string;
  name: string;
  station: string;
  status: "en_route" | "on_scene" | "standby" | "returned";
  eta: string;
  personnel: number;
}

export interface TimelineEvent {
  time: string;
  label: string;
  detail: string;
  status: "completed" | "active" | "pending";
  icon: React.FC<{ size?: number; className?: string }>;
}

export interface Comment {
  author: string;
  text: string;
  time: string;
}
