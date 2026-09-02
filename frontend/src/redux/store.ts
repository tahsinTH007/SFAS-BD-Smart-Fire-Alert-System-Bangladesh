import { configureStore } from "@reduxjs/toolkit";
import alertReducer from "./slices/alertSlice";
import telemetryReducer from "./slices/telemetrySlice";

export const store = configureStore({
  reducer: {
    alerts: alertReducer,
    telemetry: telemetryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
