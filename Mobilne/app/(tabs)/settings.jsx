import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { Ava, Card, ListItem, Divider, Input, Button } from '../../src/components/ui';
import { logoutUser, selectUser, selectFullName } from '../../src/store/authSlice';
import { setTheme, selectThemeMode } from '../../src/store/themeSlice';
import { changeLang } from '../../src/i18n';
import { LANGUAGES } from '../../src/constants';
import api from '../../src/api/axios';

// ── Tema variantlari ──────────────────────────────────────────────────────────
const THEMES = [
  { key: 'light',  emoji: '☀️',  labelKey: 'theme_light'  },
  { key: 'dark',   emoji: '🌙',  labelKey: 'theme_dark'   },
  { key: 'system', emoji: '📱',  labelKey: 'theme_system' },
];

// ── Rol rangi ─────────────────────────────────────────────────────────────────
const ROLE_COLOR = {
  founder:      '#f59e0b',
  director:     '#6366f1',
  center_admin: '#3b82f6',
  teacher:      '#10b981',
  student:      '#8b5cf6',
  superadmin:   '#ef4444',
};

export default function SettingsScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const { colors, isDark, mode } = useTheme();
  const user     = useSelector(selectUser);
  const fullName = useSelector(selectFullName);
  const themeMode = useSelector(selectThemeMode);

  const [passSheet,    setPassSheet]    = useState(false);
  const [profileSheet, setProfileSheet] = useState(false);
  const [langSheet,    setLangSheet]    = useState(false);
  const [themeSheet,   setThemeSheet]   = useState(false);

  const roleColor = ROLE_COLOR[user?.role] || colors.brand;
  const roleLabelKey = `role_${user?.role}`;
  const currentLang  = LANGUAGES.find(l => l.code === (i18n.language?.slice(0, 2) || 'uz')) || LANGUAGES[0];

  // ── Chiqish ──────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('logout_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'), style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  // ── Parol o'zgartirish ────────────────────────────────────────────────────
  const PasswordSheet = () => {
    const [old,  setOld]  = useState('');
    const [newP, setNewP] = useState('');
    const [conf, setConf] = useState('');
    const [errs, setErrs] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
      const e = {};
      if (!old)  e.old  = t('password_req');
      if (!newP) e.newP = t('password_req');
      if (newP !== conf) e.conf = 'Parollar mos kelmaydi';
      setErrs(e);
      if (Object.keys(e).length) return;
      setLoading(true);
      try {
        await api.post('/api/auth/change-password/', { old_password: old, new_password: newP });
        Alert.alert('✅', t('saved'));
        setPassSheet(false);
      } catch (err) {
        const msg = err.response?.data?.old_password?.[0] || err.response?.data?.detail || t('error');
        Alert.alert('❌', msg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <BottomModal open={passSheet} onClose={() => setPassSheet(false)} title={`🔐 ${t('change_password')}`}>
        <View style={{ padding: 20, gap: 14 }}>
          <Input label={t('old_password')} value={old} onChangeText={setOld} secureTextEntry error={errs.old} />
          <Input label={t('new_password')} value={newP} onChangeText={setNewP} secureTextEntry error={errs.newP} />
          <Input label={t('confirm_password')} value={conf} onChangeText={setConf} secureTextEntry error={errs.conf} />
          <Button title={t('save')} onPress={handleSave} loading={loading} fullWidth style={{ marginTop: 8 }} />
        </View>
      </BottomModal>
    );
  };

  // ── Profil tahrirlash ─────────────────────────────────────────────────────
  const ProfileSheet = () => {
    const [firstName, setFirstName] = useState(user?.first_name || '');
    const [lastName,  setLastName]  = useState(user?.last_name  || '');
    const [phone,     setPhone]     = useState(user?.phone      || '');
    const [loading,   setLoading]   = useState(false);

    const handleSave = async () => {
      setLoading(true);
      try {
        await api.patch('/api/auth/me/', { first_name: firstName, last_name: lastName, phone });
        Alert.alert('✅', t('saved'));
        setProfileSheet(false);
      } catch {
        Alert.alert('❌', t('error'));
      } finally {
        setLoading(false);
      }
    };

    return (
      <BottomModal open={profileSheet} onClose={() => setProfileSheet(false)} title={`✏️ ${t('profile')}`}>
        <View style={{ padding: 20, gap: 14 }}>
          <Input label={t('last_name') || 'Familiya'} value={lastName}  onChangeText={setLastName}  placeholder="Karimov" />
          <Input label={t('first_name') || 'Ism'}     value={firstName} onChangeText={setFirstName} placeholder="Jasur" />
          <Input label={t('phone')}                   value={phone}     onChangeText={setPhone}     placeholder="+998901234567" keyboardType="phone-pad" />
          <Button title={t('save')} onPress={handleSave} loading={loading} fullWidth style={{ marginTop: 8 }} />
        </View>
      </BottomModal>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── Header ── */}
      <View style={{
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
        backgroundColor: colors.bgCard,
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{t('settings')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Profil banner ── */}
        <TouchableOpacity
          onPress={() => setProfileSheet(true)}
          activeOpacity={0.85}
          style={{
            margin: 16, padding: 16,
            backgroundColor: colors.bgCard,
            borderRadius: 16, borderWidth: 1, borderColor: colors.border,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}
        >
          <Ava name={fullName} color={roleColor} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.textPrimary }} numberOfLines={1}>{fullName}</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{user?.username}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: `${roleColor}18` }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: roleColor }}>{t(roleLabelKey)}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* ── Hisob ── */}
        <SectionBlock title={t('account')} colors={colors}>
          <ListItem icon="🔐" title={t('change_password')} onPress={() => setPassSheet(true)} />
        </SectionBlock>

        {/* ── Ko'rinish ── */}
        <SectionBlock title={t('appearance')} colors={colors}>
          <ListItem
            icon="🌙"
            title={t('theme')}
            onPress={() => setThemeSheet(true)}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>
                  {THEMES.find(th => th.key === themeMode)?.emoji} {t(THEMES.find(th => th.key === themeMode)?.labelKey)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            }
          />
          <Divider />
          <ListItem
            icon="🌍"
            title={t('language')}
            onPress={() => setLangSheet(true)}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>{currentLang.flag}</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{currentLang.native}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            }
          />
        </SectionBlock>

        {/* ── Ilova haqida ── */}
        <SectionBlock title={t('about')} colors={colors}>
          <ListItem icon="ℹ️" title={t('version')} right={<Text style={{ fontSize: 13, color: colors.textMuted }}>1.0.0</Text>} />
          <Divider />
          <ListItem icon="📞" title={t('contact_support') || 'Aloqa'} onPress={() => {}} />
        </SectionBlock>

        {/* ── Chiqish ── */}
        <View style={{ margin: 16, marginTop: 8, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 10, height: 50, borderRadius: 14,
              backgroundColor: colors.redBg,
              borderWidth: 1.5, borderColor: colors.red,
            }}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.red }}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Sheets ── */}
      <PasswordSheet />
      <ProfileSheet />

      {/* Tema sheet */}
      <BottomModal open={themeSheet} onClose={() => setThemeSheet(false)} title={`🎨 ${t('theme')}`}>
        {THEMES.map(th => (
          <TouchableOpacity
            key={th.key}
            onPress={() => { dispatch(setTheme(th.key)); setThemeSheet(false); }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 16,
              paddingHorizontal: 20, paddingVertical: 15,
              backgroundColor: themeMode === th.key ? colors.brandBg : 'transparent',
            }}
          >
            <Text style={{ fontSize: 24 }}>{th.emoji}</Text>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: themeMode === th.key ? colors.brand : colors.textPrimary }}>
              {t(th.labelKey)}
            </Text>
            {themeMode === th.key && <Text style={{ color: colors.brand, fontSize: 18 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </BottomModal>

      {/* Til sheet */}
      <BottomModal open={langSheet} onClose={() => setLangSheet(false)} title={`🌍 ${t('choose_language')}`}>
        {LANGUAGES.map(lang => (
          <TouchableOpacity
            key={lang.code}
            onPress={async () => { await changeLang(lang.code); setLangSheet(false); }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 16,
              paddingHorizontal: 20, paddingVertical: 16,
              backgroundColor: (i18n.language?.slice(0, 2) || 'uz') === lang.code ? colors.brandBg : 'transparent',
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
      </BottomModal>
    </View>
  );
}

// ── Helper komponentlar ───────────────────────────────────────────────────────
function SectionBlock({ title, children, colors }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
        {title.toUpperCase()}
      </Text>
      <View style={{
        backgroundColor: colors.bgCard, borderRadius: 16,
        borderWidth: 1, borderColor: colors.border,
        overflow: 'hidden',
      }}>
        {children}
      </View>
    </View>
  );
}

function BottomModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <>
      <TouchableOpacity
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#14142a',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 32,
        shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
      }}>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </View>
        {title && (
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#f0f0ff', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
            {title}
          </Text>
        )}
        {children}
      </View>
    </>
  );
}
