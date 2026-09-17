import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../src/theme';
import { LANGUAGES } from '../../src/constants';
import { changeLang } from '../../src/i18n';

const { width } = Dimensions.get('window');

// ── Har bir onboarding sahifa ─────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'welcome',
    emoji:    '🎓',
    titleKey: 'onb_title_1',
    subKey:   'onb_sub_1',
    gradient: ['#1a1a3e', '#0d2a1a'],
    accentColor: '#6366f1',
  },
  {
    key: 'language',
    emoji:    '🌍',
    titleKey: 'onb_title_2',
    subKey:   'onb_sub_2',
    gradient: ['#1a1a3e', '#1a0d2a'],
    accentColor: '#8b5cf6',
    isLangSlide: true,
  },
  {
    key: 'ready',
    emoji:    '🚀',
    titleKey: 'onb_title_3',
    subKey:   'onb_sub_3',
    gradient: ['#0d2a1a', '#1a1a3e'],
    accentColor: '#10b981',
  },
];

export default function OnboardingScreen() {
  const { t, i18n }  = useTranslation();
  const router        = useRouter();
  const { isDark }    = useTheme();
  const [current, setCurrent] = useState(0);
  const [selectedLang, setSelectedLang] = useState(i18n.language?.slice(0, 2) || 'uz');
  const flatRef = useRef(null);

  const slide = SLIDES[current];

  const handleLangSelect = async (code) => {
    setSelectedLang(code);
    await changeLang(code);
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
      setCurrent(current + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await SecureStore.setItemAsync('met_onboarded', '1');
    router.replace('/(auth)/login');
  };

  const renderSlide = ({ item }) => (
    <View style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>

      {/* Logo / Emoji */}
      <View style={{
        width: 100, height: 100, borderRadius: 28,
        backgroundColor: `${item.accentColor}25`,
        borderWidth: 2, borderColor: `${item.accentColor}40`,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 32,
      }}>
        <Text style={{ fontSize: 48 }}>{item.emoji}</Text>
      </View>

      {/* MT badge */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
        backgroundColor: `${item.accentColor}20`,
        borderWidth: 1, borderColor: `${item.accentColor}35`,
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: item.accentColor }}>MET Texnikum</Text>
      </View>

      <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>
        {t(item.titleKey)}
      </Text>
      <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22 }}>
        {t(item.subKey)}
      </Text>

      {/* Til tanlash */}
      {item.isLangSlide && (
        <View style={{ width: '100%', marginTop: 32, gap: 10 }}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleLangSelect(lang.code)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 16,
                padding: 16, borderRadius: 14,
                backgroundColor: selectedLang === lang.code
                  ? `${item.accentColor}22`
                  : 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor: selectedLang === lang.code
                  ? item.accentColor
                  : 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ fontSize: 30 }}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: selectedLang === lang.code ? item.accentColor : '#fff' }}>
                  {lang.native}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{lang.label}</Text>
              </View>
              {selectedLang === lang.code && (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: item.accentColor, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0c0c18' }}>
      <StatusBar style="light" />

      {/* Skip */}
      {current < SLIDES.length - 1 && (
        <TouchableOpacity
          onPress={handleFinish}
          style={{ position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 8 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' }}>
            {t('skip')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={s => s.key}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      {/* Pastki qism */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 48, gap: 20 }}>

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              style={{
                height: 6,
                width: i === current ? 22 : 6,
                borderRadius: 3,
                backgroundColor: i === current ? slide.accentColor : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </View>

        {/* Tugma */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={{
            height: 52, borderRadius: 14,
            backgroundColor: slide.accentColor,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: slide.accentColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
            {current === SLIDES.length - 1 ? t('get_started') : t('next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
