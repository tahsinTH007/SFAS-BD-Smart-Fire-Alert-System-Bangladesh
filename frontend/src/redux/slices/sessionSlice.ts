import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { stationApi } from "@/api/systemApi";
import { toApiError } from "@/lib/axiosClient";
import type { Station } from "@/api/types";

/**
 * Who is using this console, and which station it is deployed for.
 *
 * SFAS-BD is installed per fire station — an Uttara operator sees Uttara's
 * buildings, units and incidents and nothing else. Until real auth exists the
 * station and operator identity live here, persisted to localStorage.
 */

const STORAGE_KEY = "sfas.session.v1";

export interface OperatorProfile {
  name: string;
  rank: string;
  badgeId: string;
  phone: string;
  email: string;
  shift: "day" | "night" | "rotating";
}

export interface NotificationPrefs {
  /** Full-screen takeover for critical alerts. */
  criticalBanner: boolean;
  sound: boolean;
  /** Browser Notification API (needs permission). */
  desktop: boolean;
  /** Minimum priority that triggers a toast. */
  minPriority: "critical" | "important" | "info";
  /** Repeat the tone while a critical alert is unacknowledged. */
  repeatUntilAcknowledged: boolean;
}

interface Persisted {
  stationId: string | null;
  operator: OperatorProfile;
  prefs: NotificationPrefs;
}

const DEFAULT_OPERATOR: OperatorProfile = {
  name: "Control Room Operator",
  rank: "Station Officer",
  badgeId: "—",
  phone: "",
  email: "",
  shift: "day",
};

const DEFAULT_PREFS: NotificationPrefs = {
  criticalBanner: true,
  sound: true,
  desktop: false,
  minPriority: "important",
  repeatUntilAcknowledged: true,
};

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { stationId: null, operator: DEFAULT_OPERATOR, prefs: DEFAULT_PREFS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        stationId: null,
        operator: DEFAULT_OPERATOR,
        prefs: DEFAULT_PREFS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      stationId: parsed.stationId ?? null,
      operator: { ...DEFAULT_OPERATOR, ...parsed.operator },
      prefs: { ...DEFAULT_PREFS, ...parsed.prefs },
    };
  } catch {
    return { stationId: null, operator: DEFAULT_OPERATOR, prefs: DEFAULT_PREFS };
  }
}

function persist(state: SessionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        stationId: state.stationId,
        operator: state.operator,
        prefs: state.prefs,
      }),
    );
  } catch {
    /* private mode or blocked storage — preferences just won't persist */
  }
}

export const fetchStations = createAsyncThunk<
  Station[],
  void,
  { rejectValue: string }
>("session/fetchStations", async (_, { rejectWithValue }) => {
  try {
    const res = await stationApi.list({ limit: 100 });
    return res.items;
  } catch (err) {
    return rejectWithValue(toApiError(err).message);
  }
});

interface SessionState {
  stationId: string | null;
  stations: Station[];
  operator: OperatorProfile;
  prefs: NotificationPrefs;
  loading: boolean;
  /** True once localStorage has been read (client-side only). */
  hydrated: boolean;
  error: string | null;
}

const initialState: SessionState = {
  stationId: null,
  stations: [],
  operator: DEFAULT_OPERATOR,
  prefs: DEFAULT_PREFS,
  loading: false,
  hydrated: false,
  error: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    hydrate: (state) => {
      const p = loadPersisted();
      state.stationId = p.stationId;
      state.operator = p.operator;
      state.prefs = p.prefs;
      state.hydrated = true;
    },
    setStation: (state, action: PayloadAction<string>) => {
      state.stationId = action.payload;
      persist(state);
    },
    updateOperator: (
      state,
      action: PayloadAction<Partial<OperatorProfile>>,
    ) => {
      state.operator = { ...state.operator, ...action.payload };
      persist(state);
    },
    updatePrefs: (state, action: PayloadAction<Partial<NotificationPrefs>>) => {
      state.prefs = { ...state.prefs, ...action.payload };
      persist(state);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchStations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStations.fulfilled, (state, action) => {
        state.loading = false;
        state.stations = action.payload;
        state.error = null;

        // First run with no saved choice: adopt the station with the most
        // coverage, so a fresh install lands on a useful console.
        if (!state.stationId && action.payload.length) {
          const best = [...action.payload].sort(
            (a, b) => (b.deviceCount ?? 0) - (a.deviceCount ?? 0),
          )[0];
          state.stationId = best._id;
          persist(state);
        }
      })
      .addCase(fetchStations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Could not load stations";
      });
  },
});

export const { hydrate, setStation, updateOperator, updatePrefs } =
  sessionSlice.actions;

export default sessionSlice.reducer;

/** The active station record, or null while loading. */
export const selectActiveStation = (s: {
  session: SessionState;
}): Station | null =>
  s.session.stations.find((st) => st._id === s.session.stationId) ?? null;
