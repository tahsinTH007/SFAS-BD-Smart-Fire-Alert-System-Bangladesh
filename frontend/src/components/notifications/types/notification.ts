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

export type FilterReadStatus = "all" | "unread" | "read";
