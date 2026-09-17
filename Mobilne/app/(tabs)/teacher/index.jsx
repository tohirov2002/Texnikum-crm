import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { dashboardApi } from '../../../src/api/resources';
import { selectFullName } from '../../../src/store/authSlice';
import { fmtK } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadi'  },
};

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const fullName = useSelector(selectFullName);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try { const d = await dashboardApi.getTeacher(); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const { summary={}, groups=[], today_lessons=[], recent_attendance=[] } = data || {};

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:16,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <View>
            <Text style={{ fontSize:13, color: colors.textMuted, marginBottom:2 }}>👋 {t('welcome_back')}</Text>
            <Text style={{ fontSize:20, fontWeight:'900', color: colors.textPrimary }}>{fullName}</Text>
          </View>
          <View style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:20,
            backgroundColor: colors.greenBg, borderWidth:1, borderColor:'rgba(16,185,129,0.3)' }}>
            <Text style={{ fontSize:12, fontWeight:'700', color: colors.green }}>{t('role_teacher')}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* Xodim davomat holati */}
        {summary.my_attendance && (
          <View style={{
            borderRadius:16, padding:16,
            backgroundColor: summary.my_attendance.status==='present' ? colors.greenBg
              : summary.my_attendance.status==='late' ? colors.yellowBg : colors.redBg,
            borderWidth:1,
            borderColor: summary.my_attendance.status==='present' ? colors.green
              : summary.my_attendance.status==='late' ? '#f59e0b' : colors.red,
            flexDirection:'row', alignItems:'center', gap:14,
          }}>
            <Text style={{ fontSize:28 }}>
              {ATT[summary.my_attendance.status]?.e || '❓'}
            </Text>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:14, fontWeight:'700',
                color: ATT[summary.my_attendance.status]?.c || colors.textPrimary }}>
                Bugun: {ATT[summary.my_attendance.status]?.l || 'Belgilanmagan'}
              </Text>
              {summary.my_attendance.check_in && (
                <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                  🕐 Kelish: {summary.my_attendance.check_in?.slice(0,5)}
                  {summary.my_attendance.check_out ? ` · 🕓 Ketish: ${summary.my_attendance.check_out?.slice(0,5)}` : ''}
                </Text>
              )}
            </View>
            {summary.my_attendance.late_minutes > 0 && (
              <Tag label={`+${summary.my_attendance.late_minutes}min`} color="#f59e0b" />
            )}
          </View>
        )}

        {/* 4 stat */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {[
            { e:'📚', l:t('my_groups'),     v: summary.total_groups   ||0, c: colors.brand  },
            { e:'🎓', l:t('students'),       v: summary.total_students ||0, c: colors.green  },
            { e:'📊', l:'Davomat %',         v:`${summary.att_pct     ||0}%`, c:'#f59e0b'   },
            { e:'🎯', l:"Bu oy darslar",     v: summary.lessons_month  ||0, c: colors.blue  },
          ].map((s,i)=>(
            <View key={i} style={{ width:'48%' }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* Bugungi darslar */}
        {today_lessons.length > 0 && (
          <View>
            <SectionHeader title="🎯 Bugungi darslar" />
            <View style={{ gap:10 }}>
              {today_lessons.map((l,i)=>{
                const statusCfg = {
                  pending:  { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  l:'Kutilmoqda' },
                  ongoing:  { c: colors.brand, bg: colors.brandBg,     l:'Davom etmoqda' },
                  finished: { c: colors.green, bg: colors.greenBg,     l:'Tugadi' },
                }[l.status] || { c: colors.textMuted, bg: colors.bgCard2, l:l.status };
                return (
                  <Card key={l.id||i}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:10 }}>
                      <View style={{ width:44, height:44, borderRadius:12,
                        backgroundColor: statusCfg.bg, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:20 }}>
                          {l.status==='pending'?'⏳':l.status==='ongoing'?'▶️':'✅'}
                        </Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>{l.group_name||l.group||'—'}</Text>
                        <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>{l.topic||l.subject||'—'}</Text>
                        <Text style={{ fontSize:11, color: colors.brand, marginTop:2, fontWeight:'600' }}>⏰ {l.time||l.start_time||'—'}</Text>
                      </View>
                      <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor: statusCfg.bg }}>
                        <Text style={{ fontSize:12, fontWeight:'700', color:statusCfg.c }}>{statusCfg.l}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection:'row', gap:8 }}>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>🎓 {l.students_count||0} talaba</Text>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>· 🏫 {l.room||'—'}</Text>
                    </View>
                  </Card>
                );
              })}
            </View>
          </View>
        )}

        {/* Guruhlarim */}
        {groups.length > 0 && (
          <View>
            <SectionHeader title="📚 Mening guruhlarim" action={t('see_all')} />
            <View style={{ gap:10 }}>
              {groups.map((g,i)=>(
                <Card key={g.id}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                    <View style={{ width:42, height:42, borderRadius:12,
                      backgroundColor: colors.brandBg, alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:16, fontWeight:'900', color: colors.brand }}>
                        {(g.name||'G').slice(0,2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>{g.name}</Text>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>
                        🎓 {g.students_count||0} · ⏰ {g.schedule||g.lesson_time||'—'}
                      </Text>
                    </View>
                    <Tag label={`${g.attendance_pct||0}%`}
                      color={(g.attendance_pct||0)>=75 ? colors.green : colors.red} />
                  </View>
                  <ProgressBar percent={g.attendance_pct||0}
                    color={(g.attendance_pct||0)>=75 ? colors.green : colors.red} height={5} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* So'ngi davomat */}
        {recent_attendance.length > 0 && (
          <View>
            <SectionHeader title="📅 So'ngi davomatim" />
            <Card style={{ gap:0 }}>
              {recent_attendance.slice(0,7).map((r,i)=>{
                const cfg = ATT[r.status] || { c: colors.textMuted, e:'—', l:r.status };
                return (
                  <View key={r.id||i}>
                    {i>0 && <View style={{ height:1, backgroundColor: colors.border, marginHorizontal:16 }} />}
                    <View style={{ flexDirection:'row', alignItems:'center', gap:14, padding:14 }}>
                      <View style={{ width:36, height:36, borderRadius:10,
                        backgroundColor: cfg.bg||`${cfg.c}15`, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:16 }}>{cfg.e}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:13, fontWeight:'600', color: colors.textPrimary }}>
                          {r.date}
                        </Text>
                        {r.check_in && (
                          <Text style={{ fontSize:11, color: colors.textMuted, marginTop:2 }}>
                            🕐 {r.check_in?.slice(0,5)}
                            {r.check_out ? ` · 🕓 ${r.check_out?.slice(0,5)}` : ''}
                          </Text>
                        )}
                      </View>
                      <View style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:20,
                        backgroundColor: cfg.bg||`${cfg.c}15` }}>
                        <Text style={{ fontSize:12, fontWeight:'700', color:cfg.c }}>{cfg.l}</Text>
                      </View>
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
