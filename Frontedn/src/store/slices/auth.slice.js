import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/auth.api";
import { ROLE_META } from "../../utils/constants";

// ─── ASYNC THUNKS ─────────────────────────────────────────────────────────────
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await authApi.login(credentials);
      // Tokenlarni localStorage ga saqlash
      localStorage.setItem("access_token",  data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("role",          data.role);
      localStorage.setItem("full_name",     data.full_name);
      localStorage.setItem("user_id",       String(data.user_id));
      localStorage.setItem("texnikum_id",   String(data.texnikum_id || ""));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: "Server xatosi" });
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
    } catch {
      // Xato bo'lsa ham tozalaymiz
    } finally {
      ["access_token","refresh_token","role","full_name","user_id","texnikum_id"]
        .forEach((k) => localStorage.removeItem(k));
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  }
);

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
const initialState = {
  user:        null,
  role:        localStorage.getItem("role")      || null,
  fullName:    localStorage.getItem("full_name") || null,
  userId:      localStorage.getItem("user_id")   || null,
  texnikumId:  localStorage.getItem("texnikum_id") || null,
  isAuth:      !!localStorage.getItem("access_token"),
  loading:     false,
  error:       null,
};

// ─── SLICE ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setAuth(state, action) {
      const { role, full_name, user_id, texnikum_id } = action.payload;
      state.role       = role;
      state.fullName   = full_name;
      state.userId     = user_id;
      state.texnikumId = texnikum_id;
      state.isAuth     = true;
    },
  },
  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading    = false;
        state.isAuth     = true;
        state.role       = action.payload.role;
        state.fullName   = action.payload.full_name;
        state.userId     = action.payload.user_id;
        state.texnikumId = action.payload.texnikum_id;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload?.error || "Login yoki parol noto'g'ri";
      });

    // LOGOUT
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.isAuth     = false;
      state.user       = null;
      state.role       = null;
      state.fullName   = null;
      state.userId     = null;
      state.texnikumId = null;
    });

    // FETCH ME
    builder
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setAuth } = authSlice.actions;

// ─── SELECTORS ────────────────────────────────────────────────────────────────
export const selectAuth       = (s) => s.auth;
export const selectIsAuth     = (s) => s.auth.isAuth;
export const selectRole       = (s) => s.auth.role;
export const selectFullName   = (s) => s.auth.fullName;
export const selectTexnikumId = (s) => s.auth.texnikumId;
export const selectRoleMeta   = (s) => ROLE_META[s.auth.role] || {};

export default authSlice.reducer;