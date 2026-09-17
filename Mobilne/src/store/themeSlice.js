import { createSlice } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: 'system', // 'light' | 'dark' | 'system'
  },
  reducers: {
    setTheme: (s, a) => {
      s.mode = a.payload;
      SecureStore.setItemAsync('met_theme', a.payload).catch(() => {});
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;

export const selectThemeMode = (s) => s.theme.mode;
