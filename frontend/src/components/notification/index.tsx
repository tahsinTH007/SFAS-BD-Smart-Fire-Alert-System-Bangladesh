"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAlertById,
  fetchAlertsByPriority,
} from "@/redux/slices/alertSlice";
import { RootState, AppDispatch } from "@/redux/store";

import { TopStatusStrip } from "./components/TopStatusStrip";
import { NotificationHero } from "./components/NotificationHero";
import { AlertSummary } from "./components/AlertSummary";
import { RelatedAlerts } from "./components/RelatedAlerts";
import { FooterBranding } from "./components/FooterBranding";

const SingleNotificationPage = () => {
  const { id }: { id: string } = useParams();
  const dispatch = useDispatch<AppDispatch>();

  const { selectedAlert, alerts, loading, error } = useSelector(
    (state: RootState) => state.alerts,
  );

  // ✅ 1. Fetch alert by ID
  useEffect(() => {
    if (id) dispatch(fetchAlertById(id));
  }, [dispatch, id]);

  // ✅ 2. After alert loads → fetch related by priority
  useEffect(() => {
    if (selectedAlert?.priority) {
      dispatch(fetchAlertsByPriority(selectedAlert.priority));
    }
  }, [dispatch, selectedAlert]);

  if (loading) return <div>Loading alert...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!selectedAlert) return <div>No alert found</div>;

  const data = selectedAlert;

  const isCriticalUnack = data.priority === "critical" && !data.acknowledged;

  // ✅ Remove current alert from related list
  const relatedAlerts = selectedAlert?.priority
    ? alerts.filter(
        (a) =>
          a.priority === selectedAlert.priority && a.id !== selectedAlert.id,
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <TopStatusStrip
        isCriticalUnack={isCriticalUnack}
        acknowledged={data.acknowledged}
      />

      <NotificationHero
        priority={data.priority}
        title={data.title}
        incidentId={data.id}
        timestamp={data.timestamp}
        read={data.read}
        acknowledged={data.acknowledged}
        copied={false}
        isCriticalUnack={isCriticalUnack}
        onAcknowledge={() => {}}
        onMarkRead={() => {}}
        onCopyId={() => {}}
      />

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <AlertSummary
            message={data.message}
            location={data.location}
            coordinates={data.coordinates as [number, number]}
            reportedBy={data.reportedBy}
            contactNumber={data.contactNumber}
            estimatedPeople={data.estimatedPeople}
            temperature={data.temperature}
            affectedArea={data.affectedArea}
            smokeLevel={data.smokeLevel}
            gas={data.gas}
            gasType={data.gasType}
            building={data.building}
            floor={data.floor}
            room={data.room}
            type={data.type}
            status={data.status}
            deviceId={data.deviceId}
            sector={data.sector}
            read={data.read}
            acknowledged={data.acknowledged}
          />
        </div>

        {/* ✅ RIGHT SIDE */}
        <div>
          <RelatedAlerts alerts={relatedAlerts} />
        </div>
      </div>

      <FooterBranding />
    </div>
  );
};

export default SingleNotificationPage;
