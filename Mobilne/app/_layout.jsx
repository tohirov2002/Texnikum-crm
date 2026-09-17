import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from '../src/store';
import { loadUser, selectIsAuth, selectRole, selectIsBootstrap } from '../src/store/authSlice';
import { setTheme, selectThemeMode } from '../src/store/themeSlice';
import { loadSavedLang } from '../src/i18n';
import '../src/i18n';
import { ROLE_HOME } from '../src/constants';
import { darkColors, lightColors } from '../src/theme';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

// ── Auth guard: login/onboarding ga yo'naltirish ─────────────────────────────
function AuthGuard({ children }) {
  const router      = useRouter();
  const segments    = useSegments();
  const isAuth      = useSelector(selectIsAuth);
  const role        = useSelector(selectRole);
  const isBootstrap = useSelector(selectIsBootstrap);
  const [checked,   setChecked] = useState(false);

  useEffect(() => {
    if (isBootstrap) return;

    const inAuth       = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs       = segments[0] === '(tabs)';

    const checkOnboarded = async () => {
      const onboarded = await SecureStore.getItemAsync('met_onboarded');
      if (!onboarded) {
        router.replace('/(onboarding)');
      } else if (!isAuth) {
        router.replace('/(auth)/login');
      } else if (isAuth && (inAuth || inOnboarding)) {
        const home = ROLE_HOME[role] || '/(auth)/login';
        router.replace(home);
      }
      setChecked(true);
      await SplashScreen.hideAsync();
    };

    checkOnboarded();
  }, [isBootstrap, isAuth, role]);

  if (isBootstrap || !checked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c0c18' }}>
        <View style={{
          width: 90, height: 90, borderRadius: 26,
          backgroundColor: '#6366f1',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
          shadowColor: '#6366f1', shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.45, shadowRadius: 20,
        }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>MT</Text>
        </View>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return children;
}

// ── Bootstrap: token + tema + til yuklash ─────────────────────────────────────
function AppBootstrap({ children }) {
  const dispatch    = useDispatch();
  const themeMode   = useSelector(selectThemeMode);
  const systemScheme = useColorScheme();

  useEffect(() => {
    const init = async () => {
      // Saqlangan temani yuklash
      try {
        const savedTheme = await SecureStore.getItemAsync('met_theme');
        if (savedTheme) dispatch(setTheme(savedTheme));
      } catch {}

      // Saqlangan tilni yuklash
      await loadSavedLang();

      // Token tekshirish
      dispatch(loadUser());
    };
    init();
  }, []);

  // Status bar rangi
  const resolved = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  return (
    <>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      {children}
    </>
  );
}

// ── Stack navigatsiya ─────────────────────────────────────────────────────────
function RootStack() {
  const themeMode    = useSelector(selectThemeMode);
  const systemScheme = useColorScheme();
  const resolved = themeMode === 'system'
    ? (systemScheme === 'dark' ? 'dark' : 'light')
    : themeMode;
  const colors = resolved === 'dark' ? darkColors : lightColors;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bgApp } }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppBootstrap>
        <AuthGuard>
          <RootStack />
        </AuthGuard>
      </AppBootstrap>
    </Provider>
  );
}
