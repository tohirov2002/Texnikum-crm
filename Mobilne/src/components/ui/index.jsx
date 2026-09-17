import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { useTheme } from '../../theme';
import { initials } from '../../utils/formatters';

// ── Ava ───────────────────────────────────────────────────────────────────────
export function Ava({ name = '?', color, size = 40 }) {
  const { colors } = useTheme();
  const c = color || colors.brand;
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.28,
      backgroundColor: `${c}22`,
      borderWidth: 1.5, borderColor: `${c}40`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: '800', color: c }}>
        {initials(name) || '?'}
      </Text>
    </View>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ title, onPress, variant = 'primary', size = 'md', fullWidth, disabled, loading, icon, style }) {
  const { colors } = useTheme();

  const sizes = {
    sm: { paddingHorizontal: 14, height: 36, fontSize: 13, borderRadius: 10 },
    md: { paddingHorizontal: 20, height: 46, fontSize: 14, borderRadius: 12 },
    lg: { paddingHorizontal: 24, height: 52, fontSize: 15, borderRadius: 14 },
  };

  const variants = {
    primary:   { bg: colors.brand,    textColor: '#fff',              borderColor: 'transparent' },
    secondary: { bg: colors.brandBg,  textColor: colors.brand,        borderColor: colors.brandBorder },
    danger:    { bg: colors.redBg,    textColor: colors.red,          borderColor: colors.red },
    ghost:     { bg: 'transparent',   textColor: colors.textSecondary,borderColor: colors.border },
    success:   { bg: colors.greenBg,  textColor: colors.green,        borderColor: colors.green },
  };

  const s = sizes[size]    || sizes.md;
  const v = variants[variant] || variants.primary;

  return (
    <TouchableOpacity
      onPress={!disabled && !loading ? onPress : undefined}
      activeOpacity={0.75}
      style={[{
        height:          s.height,
        paddingHorizontal: s.paddingHorizontal,
        borderRadius:    s.borderRadius,
        backgroundColor: v.bg,
        borderWidth:     1.5,
        borderColor:     v.borderColor,
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             6,
        width:           fullWidth ? '100%' : undefined,
        opacity:         disabled ? 0.5 : 1,
        ...(variant === 'primary' && { shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }),
      }, style]}
    >
      {loading
        ? <ActivityIndicator size="small" color={v.textColor} />
        : <>
            {icon}
            <Text style={{ fontSize: s.fontSize, fontWeight: '700', color: v.textColor }}>{title}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChangeText, placeholder, secureTextEntry, error, leftIcon, rightIcon, keyboardType, autoCapitalize = 'none', style }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ gap: 6 }, style]}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: colors.bgInput,
        borderWidth: 1.5,
        borderColor: error ? colors.red : focused ? colors.brand : colors.borderInput,
        borderRadius: 12, paddingHorizontal: 14, height: 48,
      }}>
        {leftIcon && <View style={{ opacity: 0.6 }}>{leftIcon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary }}
        />
        {rightIcon && <View>{rightIcon}</View>}
      </View>
      {error && <Text style={{ fontSize: 12, color: colors.red }}>{error}</Text>}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, onPress, style, padding = 16 }) {
  const { colors } = useTheme();
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp
      onPress={onPress}
      activeOpacity={0.85}
      style={[{
        backgroundColor: colors.bgCard,
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 16, padding,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
      }, style]}
    >
      {children}
    </Comp>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ emoji, label, value, sub, color, onPress }) {
  const { colors } = useTheme();
  const c = color || colors.brand;
  return (
    <Card onPress={onPress} style={{ flex: 1, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: -12, top: -12, width: 70, height: 70, borderRadius: 35, backgroundColor: `${c}10` }} />
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${c}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 3 }}>
        {(label || '').toUpperCase()}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary, lineHeight: 26 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{sub}</Text>}
    </Card>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
export function Tag({ label, color, bg, style }) {
  const { colors } = useTheme();
  const c = color || colors.brand;
  return (
    <View style={[{
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
      backgroundColor: bg || `${c}18`,
    }, style]}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: c }}>{label}</Text>
    </View>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.brand }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ percent = 0, color, height = 6 }) {
  const { colors } = useTheme();
  const c = color || colors.brand;
  return (
    <View style={{ width: '100%', height, backgroundColor: colors.border, borderRadius: height }}>
      <View style={{ width: `${Math.min(100, Math.max(0, percent))}%`, height: '100%', borderRadius: height, backgroundColor: c }} />
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: 4 }, style]} />;
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ emoji = '📭', title, sub }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
      <Text style={{ fontSize: 52 }}>{emoji}</Text>
      {title && <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}>{title}</Text>}
      {sub   && <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', maxWidth: 240 }}>{sub}</Text>}
    </View>
  );
}

// ── ListItem ──────────────────────────────────────────────────────────────────
export function ListItem({ icon, title, sub, right, onPress, danger }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13 }}
    >
      {icon !== undefined && (
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: danger ? colors.redBg : colors.bgCard2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: danger ? colors.red : colors.textPrimary }} numberOfLines={1}>{title}</Text>
        {sub && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{sub}</Text>}
      </View>
      {right !== undefined
        ? right
        : onPress && <Text style={{ color: colors.textMuted, fontSize: 20 }}>›</Text>
      }
    </TouchableOpacity>
  );
}

// ── Switch ────────────────────────────────────────────────────────────────────
export function Switch({ value, onChange }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      activeOpacity={0.8}
      style={{
        width: 46, height: 26, borderRadius: 13,
        backgroundColor: value ? colors.brand : colors.border,
        justifyContent: 'center', paddingHorizontal: 3,
      }}
    >
      <View style={{
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#fff',
        alignSelf: value ? 'flex-end' : 'flex-start',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
      }} />
    </TouchableOpacity>
  );
}
