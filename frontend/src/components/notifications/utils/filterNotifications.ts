import {
  Notification,
  Priority,
  FilterReadStatus,
} from "../types/notification";

export const filterNotifications = (
  notifications: Notification[],
  search: string,
  filterPriority: Priority | "all",
  filterRead: FilterReadStatus,
): Notification[] => {
  return notifications.filter((n) => {
    const matchesSearch =
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase()) ||
      n.location?.toLowerCase().includes(search.toLowerCase());

    const matchesPriority =
      filterPriority === "all" || n.priority === filterPriority;

    const matchesRead =
      filterRead === "all" ||
      (filterRead === "unread" && !n.read) ||
      (filterRead === "read" && n.read);

    return matchesSearch && matchesPriority && matchesRead;
  });
};
