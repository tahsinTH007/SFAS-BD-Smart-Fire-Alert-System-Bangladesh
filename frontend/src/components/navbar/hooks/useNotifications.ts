"use client";
import { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchAlerts, updateAlert } from "@/redux/slices/alertSlice";
import { AlertResponse } from "@/api/alertApi";
import { Notification } from "@/components/notifications/types/notification";

function mapAlertToNotification(alert: AlertResponse): Notification {
  return {
    id: String(alert.id),
    type: alert.type,
    priority: alert.priority,
    title: alert.title,
    message: alert.message,
    location: alert.location,
    reportedBy: alert.reportedBy ?? "Unknown",
    contactNumber: alert.contactNumber,
    timestamp: alert.timestamp,
    read: alert.read,
    acknowledged: alert.acknowledged,
  };
}

export const useNotifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts, loading, error } = useSelector(
    (state: RootState) => state.alerts,
  );

  const shownAlertsRef = useRef<Set<string>>(new Set());

  const notifications: Notification[] = useMemo(
    () => alerts.map(mapAlertToNotification),
    [alerts],
  );

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  // Counts
  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter(
    (n) => !n.read && n.priority === "critical",
  ).length;

  const markRead = (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (alert) dispatch(updateAlert({ ...alert, read: true }));
  };

  const markAllRead = () => {
    alerts.forEach((a) => {
      if (!a.read) dispatch(updateAlert({ ...a, read: true }));
    });
  };

  const groupedNotifications = useMemo(() => {
    return {
      critical: notifications.filter((n) => n.priority === "critical"),
      important: notifications.filter((n) => n.priority === "important"),
      info: notifications.filter((n) => n.priority === "info"),
    };
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    criticalCount,
    markRead,
    markAllRead,
    groupedNotifications,
    loading,
    error,
  };
};
