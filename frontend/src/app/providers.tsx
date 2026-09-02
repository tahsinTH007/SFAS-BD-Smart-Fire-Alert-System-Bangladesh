"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReduxProvider from "@/redux/provider";
import { connectSocket, joinStation, unlockAudio } from "@/socket/socketClient";
import { fetchStations, hydrate } from "@/redux/slices/sessionSlice";
import { fetchAlerts } from "@/redux/slices/alertSlice";
import { CriticalAlertBanner } from "@/components/alerts/CriticalAlertBanner";
import type { AppDispatch, RootState } from "@/redux/store";

/**
 * Boots the console: restore the saved station/operator, load stations, open
 * the socket, and keep the socket subscribed to whichever station is active.
 */
function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const stationId = useSelector((s: RootState) => s.session.stationId);
  const hydrated = useSelector((s: RootState) => s.session.hydrated);

  useEffect(() => {
    dispatch(hydrate());
    void dispatch(fetchStations());
    connectSocket();
  }, [dispatch]);

  // Re-scope the feed whenever the active station changes.
  useEffect(() => {
    if (!hydrated || !stationId) return;
    joinStation(stationId);
    void dispatch(fetchAlerts());
  }, [dispatch, stationId, hydrated]);

  // Browsers block audio until the user interacts; unlock on the first gesture
  // so the alarm tone is available when an alert actually arrives.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <>
      {children}
      <CriticalAlertBanner />
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <SessionBootstrap>{children}</SessionBootstrap>
    </ReduxProvider>
  );
}
