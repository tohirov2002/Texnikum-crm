import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { dashboardApi, employeeApi } from '../../../src/api/resources';
import { fmtK } from '../../../src/utils/formatters';

const ATT_CFG = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅' },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱'  },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌' },
};

export default function FounderHR() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [d, emps] = await Promise.all([
        dashboardApi.getFounderHR(),
        employeeApi.getAll({ page_size:50 }),
      ]);
      setData(d);
      setEmployees(emps.results || emps || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const { summary={}, attendance_today=[], top_employees=[] } = data || {};
  const filtered = employees.filter(e =>
    !search || `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = attendance_today.filter(a=>a.status==='present').length;
  const lateCount    = attendance_today.filter(a=>a.status==='late').length;
  const absentCount  = attendance_today.filter(a=>a.status==='absent').length;

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:14, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>👥 HR — {t('employees')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* 4 stat */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {[
            { e:'👥', l:t('employees'),  v: summary.total||0,        c: colors.brand  },
            { e:'📅', l:'Bugun keldi',   v: presentCount,             c: colors.green  },
            { e:'⏱',  l:'Kechikdi',     v: lateCount,                c:'#f59e0b'      },
            { e:'❌', l:'Kelmadi',       v: absentCount,              c: colors.red    },
          ].map((s,i)=>(
            <View key={i} style={{ width:'48%' }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* Bugungi davomat */}
        {attendance_today.length > 0 && (
          <View>
            <SectionHeader title="📅 Bugungi davomat" />
            <Card>
              <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom:14 }}>
                {[
                  { l:'Keldi',    v:presentCount, c: colors.green },
                  { l:'Kechikdi', v:lateCount,    c:'#f59e0b'     },
                  { l:'Kelmadi',  v:absentCount,  c: colors.red   },
                ].map((s,i)=>(
                  <View key={i} style={{ alignItems:'center' }}>
                    <Text style={{ fontSize:24, fontWeight:'900', color:s.c }}>{s.v}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>{s.l}</Text>
                  </View>
                ))}
              </View>
              <ProgressBar
                percent={pct(presentCount, attendance_today.length)}
                color={colors.green} height={6}
              />
            </Card>
          </View>
        )}

        {/* Top xodimlar */}
        {top_employees.length > 0 && (
          <View>
            <SectionHeader title="🏆 Top xodimlar" />
            <View style={{ gap:10 }}>
              {top_employees.slice(0,5).map((emp,i)=>(
                <Card key={emp.id||i} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <View style={{ width:32, height:32, borderRadius:8,
                    backgroundColor: i===0 ? 'rgba(245,158,11,0.15)' : colors.bgCard2,
                    alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontWeight:'900', color: i===0 ? '#f59e0b' : colors.textMuted }}>{i+1}</Text>
                  </View>
                  <Ava name={`${emp.first_name} ${emp.last_name}`} size={38} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {emp.last_name} {emp.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{emp.position||'—'}</Text>
                  </View>
                  <Tag label={`${emp.attendance_pct||0}%`} color={colors.green} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Xodimlar ro'yxati */}
        <View>
          <SectionHeader title={`👤 Barcha xodimlar (${filtered.length})`} />
          {/* Qidiruv */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:10,
            backgroundColor: colors.bgInput, borderRadius:12, paddingHorizontal:14,
            height:44, marginBottom:12, borderWidth:1, borderColor: colors.borderInput }}>
            <Text style={{ fontSize:16 }}>🔍</Text>
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder={t('search')} placeholderTextColor={colors.textMuted}
              style={{ flex:1, fontSize:14, color: colors.textPrimary }}
            />
          </View>
          <View style={{ gap:10 }}>
            {filtered.slice(0,20).map(emp=>{
              const attCfg = ATT_CFG[emp.today_status] || null;
              return (
                <Card key={emp.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={`${emp.first_name} ${emp.last_name}`} size={44} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {emp.last_name} {emp.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>{emp.position||'—'}</Text>
                    <Text style={{ fontSize:11, color: colors.textMuted }}>{emp.phone||'—'}</Text>
                  </View>
                  <View style={{ alignItems:'flex-end', gap:6 }}>
                    <Tag label={`${emp.salary_pct||emp.attendance_pct||0}%`} color={colors.brand} />
                    {attCfg && (
                      <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:20, backgroundColor: attCfg.bg }}>
                        <Text style={{ fontSize:12, color: attCfg.c }}>{attCfg.e}</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function pct(a,b){ return b ? Math.round(a/b*100) : 0; }
