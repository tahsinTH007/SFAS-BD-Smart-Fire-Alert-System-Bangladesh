import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AlertResponse } from "@/api/alertApi";
import axios from "axios";

// ✅ Fetch all alerts
export const fetchAlerts = createAsyncThunk<AlertResponse[]>(
  "alerts/fetchAlerts",
  async () => {
    const res = await axios.get("http://localhost:8080/api/v1/alerts");
    if (res.status !== 200) throw new Error("Failed to fetch alerts");
    return res.data.data;
  },
);

// ✅ Fetch single alert by ID
export const fetchAlertById = createAsyncThunk<AlertResponse, string>(
  "alerts/fetchAlertById",
  async (id: string) => {
    const res = await axios.get(`http://localhost:8080/api/v1/alerts/${id}`);
    if (res.status !== 200)
      throw new Error(`Failed to fetch alert with ID ${id}`);
    return res.data.data;
  },
);

// ✅ Fetch alerts by priority
export const fetchAlertsByPriority = createAsyncThunk<AlertResponse[], string>(
  "alerts/fetchAlertsByPriority",
  async (priority: string) => {
    const res = await axios.get(
      `http://localhost:8080/api/v1/alerts/priority/${priority}`,
    );

    if (res.status !== 200) {
      throw new Error("Failed to fetch alerts by priority");
    }

    return res.data.data;
  },
);

interface AlertState {
  alerts: AlertResponse[];
  selectedAlert: AlertResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alerts: [],
  selectedAlert: null,
  loading: false,
  error: null,
};

const alertSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    setAlerts: (state, action: PayloadAction<AlertResponse[]>) => {
      state.alerts = action.payload;
    },
    addAlert: (state, action: PayloadAction<AlertResponse>) => {
      state.alerts.unshift(action.payload);
    },
    updateAlert: (state, action: PayloadAction<AlertResponse>) => {
      const index = state.alerts.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) state.alerts[index] = action.payload;

      if (state.selectedAlert?.id === action.payload.id) {
        state.selectedAlert = action.payload;
      }
    },
    deleteAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);

      if (state.selectedAlert?.id === action.payload) {
        state.selectedAlert = null;
      }
    },
  },
  extraReducers: (builder) => {
    // 🔹 Fetch all alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch alerts";
      });

    // 🔹 Fetch single alert
    builder
      .addCase(fetchAlertById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedAlert = null;
      })
      .addCase(fetchAlertById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAlert = action.payload;
      })
      .addCase(fetchAlertById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch alert";
        state.selectedAlert = null;
      });

    // ✅ 🔥 Fetch alerts by priority (YOU MISSED THIS)
    builder
      .addCase(fetchAlertsByPriority.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlertsByPriority.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload; // replace list with filtered
      })
      .addCase(fetchAlertsByPriority.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to fetch alerts by priority";
      });
  },
});

export const { setAlerts, addAlert, updateAlert, deleteAlert } =
  alertSlice.actions;

export default alertSlice.reducer;
