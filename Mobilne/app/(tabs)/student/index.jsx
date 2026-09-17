import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar } from '../../../src/components/ui';
import { dashboardApi, stdAttendanceApi } from '../../../src/api/resources';
import { selectFullName } from '../../../src/store/authSlice';
import { fmt, fmtDate, pct } from '../../../src/utils/formatters';
import { getAttendanceLocation } from '../../../src/utils/location';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldim'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdim' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadim'  },
  excused: { c:'#3b82f6', bg:'rgba(59,130,246,0.12)',  e:'📋', l:'Sababli'   },
};

export default function StudentDashboard() {
  const { t }     = useTranslation();
  const { colors, isDark } = useTheme();
  const fullName  = useSelector(selectFullName);
  const [data,      setData]       = useState(null);
  const [loading,   setLoading]    = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const load = useCallback(async () => {
    try { const d = await dashboardApi.getStudent(); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const {
    groups = [], recent_attendance = [], payment_summary = {},
    upcoming_lessons: legacyUpcoming = [], student_info = {},
  } = data || {};
  const upcoming_lessons = legacyUpcoming.length ? legacyUpcoming : data?.today_lessons || [];

  const attPct = pct(
    (student_info.present_days || 0) + (student_info.late_days || 0),
    student_info.total_days || 1
  );
  const activeLesson = upcoming_lessons.find((lesson) => !lesson.is_finished);

  const markAttendance = async (action) => {
    if (!activeLesson) {
      Alert.alert('Davomat', 'Bugun faol dars topilmadi.');
      return;
    }
    setAttendanceLoading(true);
    try {
      const coords = await getAttendanceLocation();
      if (action === 'in') {
        await stdAttendanceApi.checkIn({ ...coords, lesson_id: activeLesson.id });
      } else {
        await stdAttendanceApi.checkOut({ lesson_id: activeLesson.id, ...coords });
      }
      await load();
      Alert.alert('✅', action === 'in' ? 'Darsga kelish davomati qabul qilindi.' : 'Darsdan chiqish davomati qabul qilindi.');
    } catch (error) {
      Alert.alert('❌', error.response?.data?.error || error.message || 'Davomatni saqlab bo‘lmadi.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={{
        paddingTop:56, paddingHorizontal:20, paddingBottom:16,
        backgroundColor: colors.bgCard,
        borderBottomWidth:1, borderBottomColor: colors.border,
        flexDirection:'row', alignItems:'center', justifyContent:'space-between',
      }}>
        <View>
          <Text style={{ fontSize:12, color: colors.textMuted, marginBottom:2 }}>👋 Salom!</Text>
          <Text style={{ fontSize:20, fontWeight:'900', color: colors.textPrimary }}>{fullName}</Text>
        </View>
        <View style={{
          paddingHorizontal:12, paddingVertical:6, borderRadius:20,
          backgroundColor:'rgba(139,92,246,0.12)',
          borderWidth:1, borderColor:'rgba(139,92,246,0.25)',
        }}>
          <Text style={{ fontSize:12, fontWeight:'700', color:'#8b5cf6' }}>{t('role_student')}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, gap:16, paddingBottom:100 }}
      >

        {/* Davomat karta */}
        <View style={{ borderRadius:20, padding:20, backgroundColor:'#1a1a3a', overflow:'hidden' }}>
          <View style={{ position:'absolute', right:-20, top:-20, width:100, height:100, borderRadius:50, backgroundColor:'rgba(139,92,246,0.10)' }} />
          <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:'700', marginBottom:14, letterSpacing:0.5 }}>
            📊 DAVOMAT HOLATI
          </Text>
          <View style={{ flexDirection:'row', gap:0, marginBottom:16 }}>
            {[
              { l:'Jami dars', v: student_info.total_days   || 0, c:'#fff' },
              { l:'Keldim',    v: student_info.present_days || 0, c:'#34d399' },
              { l:'Kelmadim',  v: student_info.absent_days  || 0, c:'#f87171' },
            ].map((s,i) => (
              <View key={i} style={{ flex:1, alignItems:'center' }}>
                <Text style={{ fontSize:20, fontWeight:'900', color:s.c }}>{s.v}</Text>
                <Text style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{s.l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Davomat foizi</Text>
            <Text style={{ fontSize:11, fontWeight:'700', color:'#a5b4fc' }}>{attPct}%</Text>
          </View>
          <ProgressBar percent={attPct} color="#818cf8" height={6} />
        </View>

        {/* To'lov xulosa */}
        <View style={{ flexDirection:'row', gap:10 }}>
          <View style={{ flex:1 }}>
            <StatCard emoji="💳" label="Qarzdorlik" value={fmt(payment_summary.debt || 0)} color={colors.red} />
          </View>
          <View style={{ flex:1 }}>
            <StatCard emoji="✅" label="To'langan"  value={fmt(payment_summary.paid || 0)} color={colors.green} />
          </View>
        </View>

        <Card>
          <Text style={{ fontSize:14, fontWeight:'800', color: colors.textPrimary, marginBottom:10 }}>📍 Bugungi dars davomati</Text>
          <Text style={{ fontSize:12, color: colors.textMuted, marginBottom:14 }}>
            {activeLesson ? `${activeLesson.group_name || ''} · ${activeLesson.start_time?.slice(0, 5) || '—'}` : 'Bugun faol dars yo‘q'}
          </Text>
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity disabled={attendanceLoading || !activeLesson} onPress={() => markAttendance('in')} style={{ flex:1, alignItems:'center', padding:12, borderRadius:10, backgroundColor: colors.green, opacity: activeLesson ? 1 : .5 }}>
              <Text style={{ color:'#fff', fontWeight:'800' }}>{attendanceLoading ? 'Kutilmoqda…' : '✅ Darsga keldim'}</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={attendanceLoading || !activeLesson} onPress={() => markAttendance('out')} style={{ flex:1, alignItems:'center', padding:12, borderRadius:10, backgroundColor: colors.blue, opacity: activeLesson ? 1 : .5 }}>
              <Text style={{ color:'#fff', fontWeight:'800' }}>🚪 Darsdan ketdim</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Guruhlarim */}
        {groups.length > 0 && (
          <View>
            <SectionHeader title="📚 Guruhlarim" />
            <View style={{ gap:10 }}>
              {groups.map(g => (
                <Card key={g.id}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                    <View style={{
                      width:42, height:42, borderRadius:12,
                      backgroundColor: colors.brandBg,
                      alignItems:'center', justifyContent:'center',
                    }}>
                      <Text style={{ fontSize:20 }}>📚</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:15, fontWeight:'800', color: colors.textPrimary }} numberOfLines={1}>{g.name}</Text>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>{g.subject} · {g.room || '—'}</Text>
                    </View>
                    <Tag label={g.is_active ? 'Faol' : 'Tugagan'} color={g.is_active ? colors.green : colors.textMuted} />
                  </View>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    {[
                      { l:"O'qituvchi", v: g.teacher_name || '—' },
                      { l:'Dars vaqti', v: `${g.start_time?.slice(0,5) || '—'}–${g.end_time?.slice(0,5) || '—'}` },
                      { l:"To'lov",     v: fmt(g.monthly_fee || 0) },
                    ].map((s,i) => (
                      <View key={i} style={{ flex:1, padding:8, backgroundColor: colors.bgCard2, borderRadius:10 }}>
                        <Text style={{ fontSize:12, fontWeight:'700', color: colors.textPrimary }} numberOfLines={1}>{s.v}</Text>
                        <Text style={{ fontSize:10, color: colors.textMuted, marginTop:2 }}>{s.l}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Yaqin darslar */}
        {upcoming_lessons.length > 0 && (
          <View>
            <SectionHeader title="🎯 Bugungi darslar" />
            <View style={{ gap:8 }}>
              {upcoming_lessons.slice(0,3).map(ls => (
                <Card key={ls.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <View style={{ width:42, height:42, borderRadius:12, backgroundColor: colors.brandBg, alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:18 }}>🎯</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }} numberOfLines={1}>{ls.group_name}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{ls.start_time?.slice(0,5)}–{ls.end_time?.slice(0,5)} · {ls.room || '—'}</Text>
                  </View>
                  <Tag label={ls.topic || 'Mavzu'} color={colors.blue} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* So'nggi davomat */}
        {recent_attendance.length > 0 && (
          <View>
            <SectionHeader title="📅 So'nggi davomat" />
            <Card style={{ overflow:'hidden' }}>
              {recent_attendance.slice(0,7).map((a, i) => {
                const cfg = ATT[a.status] || ATT.absent;
                return (
                  <View key={i} style={{
                    flexDirection:'row', alignItems:'center',
                    paddingVertical:10, paddingHorizontal:4,
                    borderBottomWidth: i < 6 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}>
                    <Text style={{ fontSize:18, marginRight:10 }}>{cfg.e}</Text>
                    <Text style={{ flex:1, fontSize:13, color: colors.textSecondary }}>{fmtDate(a.date)}</Text>
                    <View style={{ paddingHorizontal:10, paddingVertical:3, borderRadius:20, backgroundColor:cfg.bg }}>
                      <Text style={{ fontSize:12, fontWeight:'700', color:cfg.c }}>{cfg.l}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
