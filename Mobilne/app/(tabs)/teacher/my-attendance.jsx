import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag } from '../../../src/components/ui';
import { attendanceApi } from '../../../src/api/resources';
import { fmtDate, todayStr } from '../../../src/utils/formatters';
import { getAttendanceLocation } from '../../../src/utils/location';

const ATT = {
  present: { l:"Keldi",    c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅' },
  late:    { l:"Kechikdi", c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱'  },
  absent:  { l:"Kelmadi",  c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌' },
};

export default function TeacherMyAttendance() {
  const { t }  = useTranslation();
  const { colors, isDark } = useTheme();
  const [records,   setRecords]   = useState([]);
  const [today,     setToday]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [checkLoading, setCheckLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [all, td] = await Promise.allSettled([
        attendanceApi.getMy(),
        attendanceApi.getMy({ date: todayStr() }),
      ]);
      if (all.status === 'fulfilled') {
        const d = all.value;
        setRecords(Array.isArray(d) ? d : d.results || []);
      }
      if (td.status === 'fulfilled') {
        const d = td.value;
        const arr = Array.isArray(d) ? d : d.results || [];
        setToday(arr.find(r => r.date === todayStr()) || null);
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleCheckIn = async () => {
    setCheckLoading(true);
    try {
      await attendanceApi.checkIn(await getAttendanceLocation());
      await load();
      Alert.alert('✅', "Kelish belgilandi!");
    } catch (e) {
      Alert.alert('❌', e.response?.data?.error || e.message || t('error'));
    } finally { setCheckLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckLoading(true);
    try {
      await attendanceApi.checkOut(await getAttendanceLocation());
      await load();
      Alert.alert('✅', "Ketish belgilandi!");
    } catch (e) {
      Alert.alert('❌', e.response?.data?.error || e.message || t('error'));
    } finally { setCheckLoading(false); }
  };

  const totalDays   = records.length;
  const presentDays = records.filter(r=>r.status==='present').length;
  const lateDays    = records.filter(r=>r.status==='late').length;
  const absentDays  = records.filter(r=>r.status==='absent').length;

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:16, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>📅 {t('my_attendance')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, gap:14, paddingBottom:100 }}
      >

        {/* Bugun karta */}
        <Card style={{ alignItems:'center', gap:12 }}>
          <Text style={{ fontSize:13, fontWeight:'700', color: colors.textMuted }}>📅 Bugun — {fmtDate(todayStr())}</Text>

          {today ? (
            <View style={{ alignItems:'center', gap:8, width:'100%' }}>
              <View style={{ flexDirection:'row', gap:16, alignItems:'center' }}>
                <View style={{ alignItems:'center' }}>
                  <Text style={{ fontSize:11, color: colors.textMuted }}>Kelish</Text>
                  <Text style={{ fontSize:16, fontWeight:'800', color: colors.green }}>{today.arrival_time?.slice(0,5) || '—'}</Text>
                </View>
                <Text style={{ fontSize:20, color: colors.textMuted }}>→</Text>
                <View style={{ alignItems:'center' }}>
                  <Text style={{ fontSize:11, color: colors.textMuted }}>Ketish</Text>
                  <Text style={{ fontSize:16, fontWeight:'800', color: today.departure_time ? colors.blue : colors.textMuted }}>{today.departure_time?.slice(0,5) || 'Hali yo\'q'}</Text>
                </View>
              </View>
              {!today.departure_time && (
                <TouchableOpacity
                  onPress={handleCheckOut}
                  disabled={checkLoading}
                  activeOpacity={0.8}
                  style={{
                    width:'100%', height:46, borderRadius:12,
                    backgroundColor: colors.blueBg, borderWidth:1.5, borderColor: colors.blue,
                    alignItems:'center', justifyContent:'center',
                  }}
                >
                  <Text style={{ fontSize:14, fontWeight:'700', color: colors.blue }}>🚪 Ketishni belgilash</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleCheckIn}
              disabled={checkLoading}
              activeOpacity={0.85}
              style={{
                width:'100%', height:52, borderRadius:14,
                backgroundColor: colors.brand,
                alignItems:'center', justifyContent:'center',
                shadowColor: colors.brand, shadowOffset:{ width:0, height:4 },
                shadowOpacity:0.35, shadowRadius:10, elevation:5,
              }}
            >
              <Text style={{ fontSize:15, fontWeight:'800', color:'#fff' }}>
                {checkLoading ? "Belgilanmoqda..." : "✅ Kelishni belgilash"}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Oylik statistika */}
        <View style={{ flexDirection:'row', gap:10 }}>
          <View style={{ flex:1 }}>
            <StatCard emoji="✅" label="Keldi"    value={presentDays} color={colors.green} />
          </View>
          <View style={{ flex:1 }}>
            <StatCard emoji="⏱"  label="Kechikdi" value={lateDays}    color={colors.yellow} />
          </View>
          <View style={{ flex:1 }}>
            <StatCard emoji="❌" label="Kelmadi"  value={absentDays}  color={colors.red} />
          </View>
        </View>

        {/* Tarix */}
        <SectionHeader title={`Davomat tarixi (${totalDays})`} />
        {records.length === 0 ? (
          <View style={{ alignItems:'center', padding:32 }}>
            <Text style={{ fontSize:40 }}>📭</Text>
            <Text style={{ fontSize:14, color: colors.textMuted, marginTop:12 }}>Yozuvlar yo'q</Text>
          </View>
        ) : (
          <Card style={{ overflow:'hidden', padding:0 }}>
            {records.map((r, i) => {
              const cfg = ATT[r.status] || ATT.absent;
              return (
                <View key={r.id || i} style={{
                  flexDirection:'row', alignItems:'center', gap:12,
                  paddingVertical:12, paddingHorizontal:16,
                  borderBottomWidth: i < records.length-1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{ fontSize:18 }}>{cfg.e}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>{fmtDate(r.date)}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                      {r.arrival_time?.slice(0,5) || '—'} → {r.departure_time?.slice(0,5) || '—'}
                    </Text>
                  </View>
                  <Tag label={cfg.l} color={cfg.c} />
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
