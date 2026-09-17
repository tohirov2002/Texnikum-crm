import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Button, Input } from '../../src/components/ui';
import { loginUser, clearError, selectIsLoading, selectAuthError } from '../../src/store/authSlice';
import { ROLE_HOME, LANGUAGES } from '../../src/constants';
import { changeLang } from '../../src/i18n';

export default function LoginScreen() {
  const router    = useRouter();
  const dispatch  = useDispatch();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();

  const isLoading = useSelector(selectIsLoading);
  const authError = useSelector(selectAuthError);

  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [langModal, setLangModal] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === (i18n.language?.slice(0, 2) || 'uz')) || LANGUAGES[0];

  useEffect(() => {
    if (authError) dispatch(clearError());
  }, [username, password]);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = t('username_req');
    if (!password.trim()) e.password = t('password_req');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const res = await dispatch(loginUser({ username: username.trim(), password }));
    if (loginUser.fulfilled.match(res)) {
      const role = res.payload?.user?.role;
      const home = ROLE_HOME[role] || '/(auth)/login';
      router.replace(home);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgApp }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Til tanlash (top right) ── */}
        <View style={{ alignItems: 'flex-end', paddingTop: 60, paddingHorizontal: 24 }}>
          <TouchableOpacity
            onPress={() => setLangModal(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              backgroundColor: colors.brandBg,
              borderWidth: 1, borderColor: colors.brandBorder,
            }}
          >
            <Text style={{ fontSize: 16 }}>{currentLang.flag}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand }}>{currentLang.native}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Logo ── */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 48 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 24,
            backgroundColor: colors.brand,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            shadowColor: colors.brand,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
          }}>
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff' }}>MT</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: colors.textPrimary, marginBottom: 6 }}>
            {t('welcome_back')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>
            {t('enter_creds')}
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={{ paddingHorizontal: 28, gap: 14 }}>

          {/* Server xato */}
          {authError && (
            <View style={{
              padding: 14, borderRadius: 12,
              backgroundColor: colors.redBg,
              borderWidth: 1, borderColor: colors.red,
              flexDirection: 'row', alignItems: 'center', gap: 10,
            }}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.red, flex: 1 }}>
                {t('login_error')}
              </Text>
            </View>
          )}

          <Input
            label={t('username')}
            value={username}
            onChangeText={(v) => { setUsername(v); setErrors(p => ({ ...p, username: '' })); }}
            placeholder="username"
            leftIcon={<Text style={{ fontSize: 18 }}>👤</Text>}
            error={errors.username}
            autoCapitalize="none"
          />

          <Input
            label={t('password')}
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
            placeholder="••••••••"
            secureTextEntry={!showPass}
            leftIcon={<Text style={{ fontSize: 18 }}>🔒</Text>}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPass(p => !p)}>
                <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            }
            error={errors.password}
          />

          <Button
            title={t('login_btn')}
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />

          <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.brand }}>
              {t('forgot_password')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>© 2025 MET Texnikum CRM</Text>
        </View>
      </ScrollView>

      {/* ── Til tanlash modal ── */}
      {langModal && (
        <TouchableOpacity
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setLangModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{
              backgroundColor: colors.bgCard, borderRadius: 20,
              paddingBottom: 32,
              shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
            }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                {t('choose_language')}
              </Text>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={async () => { await changeLang(lang.code); setLangModal(false); }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 16,
                    paddingHorizontal: 20, paddingVertical: 16,
                    backgroundColor: (i18n.language?.slice(0, 2) || 'uz') === lang.code
                      ? colors.brandBg : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{lang.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{lang.native}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{lang.label}</Text>
                  </View>
                  {(i18n.language?.slice(0, 2) || 'uz') === lang.code && (
                    <Text style={{ color: colors.brand, fontSize: 18, fontWeight: '800' }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}
