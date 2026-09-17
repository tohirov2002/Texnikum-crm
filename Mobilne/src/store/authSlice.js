import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import api from '../api/axios';

// ── Async thunks ──────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/auth/login/', { username, password });
      await SecureStore.setItemAsync('met_access',  data.access);
      await SecureStore.setItemAsync('met_refresh', data.refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
      const me = await api.get('/api/auth/me/');
      return { user: me.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'login_error');
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const access = await SecureStore.getItemAsync('met_access');
      if (!access) return rejectWithValue('no_token');
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      const { data } = await api.get('/api/auth/me/');
      return data;
    } catch {
      return rejectWithValue('invalid_token');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    const refresh = await SecureStore.getItemAsync('met_refresh');
    if (refresh) await api.post('/api/auth/logout/', { refresh });
  } catch {}
  await SecureStore.deleteItemAsync('met_access');
  await SecureStore.deleteItemAsync('met_refresh');
  delete api.defaults.headers.common['Authorization'];
});

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    role:        null,
    isAuth:      false,
    isLoading:   false,
    isBootstrap: true,
    error:       null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    // login
    b.addCase(loginUser.pending,   (s)    => { s.isLoading = true; s.error = null; });
    b.addCase(loginUser.fulfilled, (s, a) => {
      s.isLoading = false;
      s.user   = a.payload.user;
      s.role   = a.payload.user?.role;
      s.isAuth = true;
    });
    b.addCase(loginUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload; });

    // loadUser
    b.addCase(loadUser.pending,   (s)    => { s.isBootstrap = true; });
    b.addCase(loadUser.fulfilled, (s, a) => {
      s.isBootstrap = false;
      s.user   = a.payload;
      s.role   = a.payload?.role;
      s.isAuth = true;
    });
    b.addCase(loadUser.rejected,  (s) => {
      s.isBootstrap = false;
      s.isAuth = false;
      s.user   = null;
      s.role   = null;
    });

    // logout
    b.addCase(logoutUser.fulfilled, (s) => {
      s.user = null; s.role = null; s.isAuth = false;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

export const selectUser        = (s) => s.auth.user;
export const selectRole        = (s) => s.auth.role;
export const selectIsAuth      = (s) => s.auth.isAuth;
export const selectIsLoading   = (s) => s.auth.isLoading;
export const selectIsBootstrap = (s) => s.auth.isBootstrap;
export const selectAuthError   = (s) => s.auth.error;
export const selectFullName    = (s) =>
  s.auth.user
    ? `${s.auth.user.last_name || ''} ${s.auth.user.first_name || ''}`.trim()
    : '';
