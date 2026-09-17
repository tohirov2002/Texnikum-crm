import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar } from '../../../src/components/ui';
import { dashboardApi } from '../../../src/api/resources';
import { fmt, fmtK, pct } from '../../../src/utils/formatters';

const PERIODS = ['today','this_month','this_year'];

export default function FounderFinance() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState('this_month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try { const d = await dashboardApi.getFounderFin({ period }); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [period]);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const { summary={}, centers=[], expenses=[], trend=[] } = data || {};
  const income  = summary.income  || 0;
  const expense = summary.expense || 0;
  const profit  = income - expense;

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:14, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary, marginBottom:12 }}>💰 {t('income')}</Text>
        {/* Period tabs */}
        <View style={{ flexDirection:'row', backgroundColor: colors.bgCard2, borderRadius:12, padding:3 }}>
          {PERIODS.map(p=>(
            <TouchableOpacity key={p} onPress={()=>setPeriod(p)} activeOpacity={0.8}
              style={{ flex:1, paddingVertical:8, borderRadius:10, alignItems:'center',
                backgroundColor: period===p ? colors.brand : 'transparent' }}>
              <Text style={{ fontSize:12, fontWeight:'700', color: period===p ? '#fff' : colors.textMuted }}>
                {t(p)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* 3 asosiy karta */}
        <View style={{ flexDirection:'row', gap:12 }}>
          {[
            { e:'📈', l:t('income'),  v:fmtK(income),  c: colors.green },
            { e:'📉', l:t('expense'), v:fmtK(expense), c: colors.red   },
            { e:'💵', l:t('profit'),  v:fmtK(profit),  c: profit>=0 ? '#f59e0b' : colors.red },
          ].map((s,i)=>(
            <View key={i} style={{ flex:1 }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* Foyda progress */}
        <Card>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
            <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>Foyda ulushi</Text>
            <Text style={{ fontSize:14, fontWeight:'900', color:'#f59e0b' }}>{pct(profit,income)}%</Text>
          </View>
          <ProgressBar percent={pct(profit,income)} color="#f59e0b" height={8} />
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8 }}>
            <Text style={{ fontSize:12, color: colors.textMuted }}>Jami daromad: {fmtK(income)}</Text>
            <Text style={{ fontSize:12, color: colors.textMuted }}>Sof foyda: {fmtK(profit)}</Text>
          </View>
        </Card>

        {/* Trend chart */}
        {trend.length > 0 && (
          <View>
            <SectionHeader title="📊 Daromad trendi" />
            <Card>
              <View style={{ flexDirection:'row', alignItems:'flex-end', gap:5, height:90 }}>
                {trend.slice(-7).map((m,i)=>{
                  const maxV = Math.max(...trend.slice(-7).map(x=>x.income||0)) || 1;
                  const h = Math.round(((m.income||0)/maxV)*78);
                  const expH = Math.round(((m.expense||0)/maxV)*78);
                  const isLast = i === trend.slice(-7).length-1;
                  return (
                    <View key={i} style={{ flex:1, alignItems:'center', gap:3 }}>
                      <View style={{ width:'100%', gap:2, alignItems:'center' }}>
                        <View style={{ width:'80%', height:Math.max(h,3), borderRadius:4, backgroundColor: isLast ? colors.green : colors.greenBg }} />
                        <View style={{ width:'80%', height:Math.max(expH,2), borderRadius:4, backgroundColor: isLast ? colors.red : colors.redBg }} />
                      </View>
                      <Text style={{ fontSize:8, color: colors.textMuted, fontWeight:'700' }}>{m.label || m.month}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection:'row', justifyContent:'center', gap:16, marginTop:10 }}>
                {[{ c:colors.green, l:'Daromad' },{ c:colors.red, l:'Xarajat' }].map((s,i)=>(
                  <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                    <View style={{ width:10, height:10, borderRadius:3, backgroundColor:s.c }} />
                    <Text style={{ fontSize:11, color: colors.textMuted }}>{s.l}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Texnikumlar bo'yicha */}
        {centers.length > 0 && (
          <View>
            <SectionHeader title="🏫 Texnikumlar bo'yicha" />
            <View style={{ gap:10 }}>
              {centers.map((c,i)=>(
                <Card key={c.id||i}>
                  <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }} numberOfLines={1}>{c.name}</Text>
                    <Tag label={fmtK(c.income||0)} color={colors.green} />
                  </View>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>Daromad ulushi</Text>
                    <Text style={{ fontSize:12, fontWeight:'700', color: colors.brand }}>{pct(c.income, income)}%</Text>
                  </View>
                  <ProgressBar percent={pct(c.income, income)} color={colors.brand} height={5} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* So'ngi xarajatlar */}
        {expenses.length > 0 && (
          <View>
            <SectionHeader title="💸 Xarajatlar" action={t('see_all')} />
            <Card style={{ gap:0 }}>
              {expenses.slice(0,6).map((e,i)=>(
                <View key={e.id||i}>
                  {i>0 && <View style={{ height:1, backgroundColor: colors.border, marginHorizontal:16 }} />}
                  <View style={{ flexDirection:'row', alignItems:'center', gap:14, padding:14 }}>
                    <View style={{ width:38, height:38, borderRadius:10, backgroundColor: colors.redBg, alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:18 }}>💸</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:14, fontWeight:'600', color: colors.textPrimary }} numberOfLines={1}>{e.description||e.category||'Xarajat'}</Text>
                      <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>{e.date || '—'}</Text>
                    </View>
                    <Text style={{ fontSize:14, fontWeight:'800', color: colors.red }}>-{fmtK(e.amount||0)}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
