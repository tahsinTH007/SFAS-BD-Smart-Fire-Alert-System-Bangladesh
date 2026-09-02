import { configureStore } from "@reduxjs/toolkit";
import alertReducer from "./slices/alertSlice";
import telemetryReducer from "./slices/telemetrySlice";
import sessionReducer from "./slices/sessionSlice";

export const store = configureStore({
  reducer: {
    alerts: alertReducer,
    telemetry: telemetryReducer,
    session: sessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
