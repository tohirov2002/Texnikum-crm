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

export default function FounderDashboard() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const fullName = useSelector(selectFullName);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try { const d = await dashboardApi.getFounder(); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const { summary={}, texnikumlar=[], top_centers=[], monthly_trend=[] } = data || {};
  const income  = summary.total_income  || 0;
  const expense = summary.total_expense || 0;
  const profit  = income - expense;
  const profitP = pct(profit, income);

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:16, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
          <View>
            <Text style={{ fontSize:13, color: colors.textMuted, marginBottom:2 }}>👋 {t('welcome_back')}</Text>
            <Text style={{ fontSize:20, fontWeight:'900', color: colors.textPrimary }}>{fullName}</Text>
          </View>
          <View style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:20, backgroundColor:'rgba(245,158,11,0.15)', borderWidth:1, borderColor:'rgba(245,158,11,0.3)' }}>
            <Text style={{ fontSize:12, fontWeight:'700', color:'#f59e0b' }}>{t('role_founder')}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* Moliya banner */}
        <View style={{ borderRadius:20, padding:20, backgroundColor:'#1a1a3e' }}>
          <View style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:60, backgroundColor:'rgba(99,102,241,0.12)' }} />
          <Text style={{ fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.4)', letterSpacing:0.5, marginBottom:14 }}>
            📅 {t('this_month').toUpperCase()}
          </Text>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:16 }}>
            {[
              { l:t('income'),  v:fmtK(income),  c:'#34d399' },
              { l:t('expense'), v:fmtK(expense), c:'#f87171' },
              { l:t('profit'),  v:fmtK(profit),  c: profit>=0 ? '#fbbf24':'#f87171' },
            ].map((s,i)=>(
              <View key={i} style={{ alignItems:'center', flex:1 }}>
                <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontWeight:'600', marginBottom:4 }}>{s.l}</Text>
                <Text style={{ fontSize:15, fontWeight:'900', color:s.c }}>{s.v}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
            <Text style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Foyda ulushi</Text>
            <Text style={{ fontSize:11, fontWeight:'700', color:'#fbbf24' }}>{profitP}%</Text>
          </View>
          <ProgressBar percent={profitP} color="#fbbf24" height={5} />
        </View>

        {/* 4 stat */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {[
            { e:'🏫', l:'Texnikumlar',   v: summary.total_centers   ||0, c: colors.brand  },
            { e:'👥', l:t('employees'),   v: summary.total_employees ||0, c:'#f59e0b'       },
            { e:'🎓', l:t('students'),    v: summary.total_students  ||0, c: colors.green  },
            { e:'📊', l:'Davomat',        v:`${summary.avg_attendance||0}%`, c: colors.blue },
          ].map((s,i)=>(
            <View key={i} style={{ width:'48%' }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* 6 oylik trend */}
        {monthly_trend.length > 0 && (
          <View>
            <SectionHeader title="📈 6 oylik daromad" />
            <Card>
              <View style={{ flexDirection:'row', alignItems:'flex-end', gap:6, height:80 }}>
                {monthly_trend.slice(-6).map((m,i)=>{
                  const maxV = Math.max(...monthly_trend.slice(-6).map(x=>x.income||0)) || 1;
                  const h = Math.round(((m.income||0)/maxV)*68);
                  const isLast = i === monthly_trend.slice(-6).length-1;
                  return (
                    <View key={i} style={{ flex:1, alignItems:'center', gap:4 }}>
                      <View style={{ width:'100%', height:Math.max(h,4), borderRadius:5, backgroundColor: isLast ? colors.brand : colors.brandBg }} />
                      <Text style={{ fontSize:9, color: colors.textMuted, fontWeight:'700' }}>{m.month}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        {/* Top texnikumlar */}
        {top_centers.length > 0 && (
          <View>
            <SectionHeader title="🏆 Top texnikumlar" action={t('see_all')} />
            <View style={{ gap:10 }}>
              {top_centers.slice(0,5).map((c,i)=>(
                <Card key={c.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <View style={{ width:36, height:36, borderRadius:10, backgroundColor: i===0 ? 'rgba(245,158,11,0.15)' : colors.bgCard2, alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:15, fontWeight:'900', color: i===0 ? '#f59e0b' : colors.textMuted }}>{i+1}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }} numberOfLines={1}>{c.name}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>👥 {c.students_count} · 💰 {fmtK(c.monthly_income)}</Text>
                  </View>
                  <Tag label={`${c.attendance_pct||0}%`} color={colors.green} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Texnikumlar ro'yxati */}
        {texnikumlar.length > 0 && (
          <View>
            <SectionHeader title="🏫 Texnikumlar" />
            <View style={{ gap:10 }}>
              {texnikumlar.map(c=>(
                <Card key={c.id}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 }}>
                    <Ava name={c.name} color={colors.brand} size={42} />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }} numberOfLines={1}>{c.name}</Text>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>📍 {c.address||'—'}</Text>
                    </View>
                    <Tag label={c.is_active ? t('active') : t('inactive')} color={c.is_active ? colors.green : colors.textMuted} />
                  </View>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    {[
                      { l:t('students'),  v: c.students_count  ||0 },
                      { l:t('employees'), v: c.employees_count ||0 },
                      { l:t('income'),    v: fmtK(c.monthly_income||0) },
                    ].map((s,i)=>(
                      <View key={i} style={{ flex:1, alignItems:'center', padding:8, backgroundColor: colors.bgCard2, borderRadius:10 }}>
                        <Text style={{ fontSize:14, fontWeight:'800', color: colors.textPrimary }}>{s.v}</Text>
                        <Text style={{ fontSize:10, color: colors.textMuted, marginTop:2 }}>{s.l}</Text>
                      </View>
                    ))}
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
