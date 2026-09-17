import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { payrollApi } from '../../../src/api/resources';
import { fmt, fmtK, pct } from '../../../src/utils/formatters';

export default function DirectorPayroll() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  });

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await payrollApi.getAll({ month, page_size:100 });
      setRecords(d.results || d || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [month]);

  useEffect(() => { setLoading(true); load(); }, [month]);

  const totalSalary  = records.reduce((s,r)=>s+(r.base_salary||0),0);
  const totalBonus   = records.reduce((s,r)=>s+(r.bonus||0),0);
  const totalPenalty = records.reduce((s,r)=>s+(r.penalty||0),0);
  const totalNet     = records.reduce((s,r)=>s+(r.net_salary||0),0);
  const paidCount    = records.filter(r=>r.is_paid).length;

  const changeMonth = (delta) => {
    const [y,m] = month.split('-').map(Number);
    const d = new Date(y, m-1+delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  };

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:14,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary, marginBottom:12 }}>💳 {t('salary')}</Text>
        {/* Oy tanlash */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between',
          backgroundColor: colors.bgCard2, borderRadius:12, padding:10 }}>
          <TouchableOpacity onPress={()=>changeMonth(-1)}
            style={{ width:36,height:36,borderRadius:10,backgroundColor: colors.bgInput,alignItems:'center',justifyContent:'center' }}>
            <Text style={{ fontSize:18, color: colors.textPrimary }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize:15, fontWeight:'700', color: colors.textPrimary }}>{month}</Text>
          <TouchableOpacity onPress={()=>changeMonth(1)}
            style={{ width:36,height:36,borderRadius:10,backgroundColor: colors.bgInput,alignItems:'center',justifyContent:'center' }}>
            <Text style={{ fontSize:18, color: colors.textPrimary }}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
          contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

          {/* Xulosa kartalar */}
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
            {[
              { e:'💰', l:'Asosiy maosh', v: fmtK(totalSalary),  c: colors.brand  },
              { e:'🎁', l:t('bonus'),     v: fmtK(totalBonus),   c: colors.green  },
              { e:'⚠️', l:t('penalty'),   v: fmtK(totalPenalty), c: colors.red    },
              { e:'💵', l:t('net_salary'),v: fmtK(totalNet),     c:'#f59e0b'      },
            ].map((s,i)=>(
              <View key={i} style={{ width:'48%' }}>
                <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
              </View>
            ))}
          </View>

          {/* To'lov holati */}
          <Card>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>To'lov holati</Text>
              <Text style={{ fontSize:14, fontWeight:'700', color: colors.green }}>{paidCount}/{records.length}</Text>
            </View>
            <ProgressBar percent={pct(paidCount, records.length)} color={colors.green} height={8} />
          </Card>

          {/* Xodimlar maoshi */}
          <View>
            <SectionHeader title={`👥 Xodimlar (${records.length})`} />
            <View style={{ gap:10 }}>
              {records.map((r,i)=>(
                <Card key={r.id||i}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:10 }}>
                    <Ava name={r.employee_name || r.full_name || '?'} size={44} />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                        {r.employee_name || r.full_name || '—'}
                      </Text>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>{r.position||'—'}</Text>
                    </View>
                    <Tag
                      label={r.is_paid ? "✅ To'landi" : "⏳ Kutilmoqda"}
                      color={r.is_paid ? colors.green : '#f59e0b'}
                    />
                  </View>
                  <View style={{ flexDirection:'row', gap:8 }}>
                    {[
                      { l:'Maosh',    v: fmtK(r.base_salary||0),  c: colors.brand  },
                      { l:'Bonus',    v: fmtK(r.bonus||0),        c: colors.green  },
                      { l:'Jarima',   v: fmtK(r.penalty||0),      c: colors.red    },
                      { l:'Sof',      v: fmtK(r.net_salary||0),   c:'#f59e0b'      },
                    ].map((s,j)=>(
                      <View key={j} style={{ flex:1, alignItems:'center', padding:6,
                        backgroundColor: colors.bgCard2, borderRadius:8 }}>
                        <Text style={{ fontSize:12, fontWeight:'800', color:s.c }}>{s.v}</Text>
                        <Text style={{ fontSize:9, color: colors.textMuted, marginTop:2 }}>{s.l}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ))}
              {records.length===0 && (
                <View style={{ alignItems:'center', padding:40 }}>
                  <Text style={{ fontSize:36 }}>📭</Text>
                  <Text style={{ fontSize:14, color: colors.textMuted, marginTop:10 }}>Bu oy uchun ma'lumot yo'q</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
