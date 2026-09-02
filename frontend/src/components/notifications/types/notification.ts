export type Priority = "critical" | "important" | "info";

export type FilterReadStatus = "all" | "unread" | "read";

export type FilterPriority = Priority | "all";

export type NotificationStatus = "active" | "acknowledged" | "resolved";

/**
 * View model for a notification row.
 *
 * Nullable fields mirror the API: a device can raise an alert without a
 * resolved location or contact number, so these are optional at the source and
 * must be optional here too.
 */
export interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  location: string | null;
  reportedBy: string | null;
  contactNumber: string | null;
  timestamp: string | null;
  read: boolean;
  acknowledged: boolean;
  status: NotificationStatus;
  riskScore: number;
  riskFactors: string[];
  deviceId: string | null;
  building: string | null;
  incident: string | null;
}
