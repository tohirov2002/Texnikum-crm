import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { dashboardApi } from '../../../src/api/resources';
import { selectFullName } from '../../../src/store/authSlice';
import { fmtK, pct } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', e:'❌', l:'Kelmadi'  },
};

export default function DirectorDashboard() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const fullName = useSelector(selectFullName);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try { const d = await dashboardApi.getDirector(); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const { summary={}, attendance_today=[], week_chart=[], absent_today=[] } = data || {};
  const presentC = attendance_today.filter(a=>a.status==='present').length;
  const lateC    = attendance_today.filter(a=>a.status==='late').length;
  const absentC  = attendance_today.filter(a=>a.status==='absent').length;
  const totalAtt = attendance_today.length;

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
            backgroundColor: colors.brandBg, borderWidth:1, borderColor: colors.brandBorder }}>
            <Text style={{ fontSize:12, fontWeight:'700', color: colors.brand }}>{t('role_director')}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* 4 stat */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {[
            { e:'👥', l:t('employees'),  v: summary.total_employees||0,  c: colors.brand  },
            { e:'📊', l:'Davomat %',     v:`${summary.att_pct||0}%`,     c: colors.green  },
            { e:'💳', l:'Maosh (oy)',    v: fmtK(summary.total_salary||0), c:'#f59e0b'    },
            { e:'⚠️', l:'Kelmadi',       v: summary.absent_today||0,     c: colors.red    },
          ].map((s,i)=>(
            <View key={i} style={{ width:'48%' }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* Bugungi davomat */}
        <View>
          <SectionHeader title="📅 Bugungi davomat" />
          <Card>
            <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom:16 }}>
              {[
                { l:'Keldi',    v:presentC, c: colors.green },
                { l:'Kechikdi', v:lateC,    c:'#f59e0b'     },
                { l:'Kelmadi',  v:absentC,  c: colors.red   },
              ].map((s,i)=>(
                <View key={i} style={{ alignItems:'center' }}>
                  <Text style={{ fontSize:26, fontWeight:'900', color:s.c }}>{s.v}</Text>
                  <Text style={{ fontSize:12, color: colors.textMuted, marginTop:3 }}>{s.l}</Text>
                </View>
              ))}
            </View>
            {totalAtt > 0 && (
              <>
                <View style={{ flexDirection:'row', height:8, borderRadius:4, overflow:'hidden', marginBottom:8 }}>
                  {[
                    { v:presentC, c: colors.green },
                    { v:lateC,    c:'#f59e0b'     },
                    { v:absentC,  c: colors.red   },
                  ].map((s,i)=>
                    s.v > 0 ? <View key={i} style={{ flex: s.v/totalAtt, backgroundColor:s.c }} /> : null
                  )}
                </View>
                <Text style={{ fontSize:12, color: colors.textMuted, textAlign:'center' }}>
                  Jami: {totalAtt} xodim
                </Text>
              </>
            )}
          </Card>
        </View>

        {/* Haftalik davomat grafigi */}
        {week_chart.length > 0 && (
          <View>
            <SectionHeader title="📈 Haftalik davomat" />
            <Card>
              <View style={{ flexDirection:'row', alignItems:'flex-end', gap:6, height:80 }}>
                {week_chart.map((d,i)=>{
                  const maxV = Math.max(...week_chart.map(x=>x.count||0)) || 1;
                  const h = Math.round(((d.count||0)/maxV)*70);
                  const isToday = i === week_chart.length-1;
                  const DAYS = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
                  return (
                    <View key={i} style={{ flex:1, alignItems:'center', gap:4 }}>
                      <View style={{ width:'100%', height:Math.max(h,4), borderRadius:5,
                        backgroundColor: isToday ? colors.brand : colors.brandBg }} />
                      <Text style={{ fontSize:9, color: colors.textMuted, fontWeight:'700' }}>
                        {DAYS[d.day_of_week] || d.label || ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        {/* Kelmagan xodimlar */}
        {absent_today.length > 0 && (
          <View>
            <SectionHeader title={`❌ Kelmagan xodimlar (${absent_today.length})`} />
            <View style={{ gap:10 }}>
              {absent_today.slice(0,5).map(emp=>(
                <Card key={emp.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={`${emp.first_name} ${emp.last_name}`} color={colors.red} size={42} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {emp.last_name} {emp.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{emp.position||'—'}</Text>
                  </View>
                  <View style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:20, backgroundColor: colors.redBg }}>
                    <Text style={{ fontSize:12, fontWeight:'700', color: colors.red }}>❌ Kelmadi</Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
