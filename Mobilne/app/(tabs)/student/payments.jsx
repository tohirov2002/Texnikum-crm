import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag } from '../../../src/components/ui';
import { paymentApi } from '../../../src/api/resources';
import { fmt, fmtDate } from '../../../src/utils/formatters';

export default function StudentPayments() {
  const { t }  = useTranslation();
  const { colors, isDark } = useTheme();
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async () => {
    try { const d = await paymentApi.getMy(); setPayments(Array.isArray(d) ? d : d.results || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const totalPaid  = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+(p.amount||0),0);
  const totalDebt  = payments.filter(p=>p.status==='unpaid').reduce((s,p)=>s+(p.amount||0),0);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:16, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>💳 {t('payments')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, gap:14, paddingBottom:100 }}
      >
        {/* Stat */}
        <View style={{ flexDirection:'row', gap:10 }}>
          <View style={{ flex:1 }}>
            <StatCard emoji="✅" label="To'langan"  value={fmt(totalPaid)} color={colors.green} />
          </View>
          <View style={{ flex:1 }}>
            <StatCard emoji="⚠️" label="Qarzdorlik" value={fmt(totalDebt)} color={colors.red} />
          </View>
        </View>

        {/* Ro'yxat */}
        <SectionHeader title={`Barcha to'lovlar (${payments.length})`} />
        {payments.length === 0 ? (
          <View style={{ alignItems:'center', padding:40 }}>
            <Text style={{ fontSize:40 }}>📭</Text>
            <Text style={{ fontSize:14, color: colors.textMuted, marginTop:12 }}>To'lovlar mavjud emas</Text>
          </View>
        ) : (
          <Card style={{ overflow:'hidden', padding:0 }}>
            {payments.map((p, i) => (
              <View key={p.id || i} style={{
                flexDirection:'row', alignItems:'center', gap:12,
                paddingVertical:13, paddingHorizontal:16,
                borderBottomWidth: i < payments.length-1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}>
                <View style={{
                  width:40, height:40, borderRadius:10,
                  backgroundColor: p.status === 'paid' ? colors.greenBg : colors.redBg,
                  alignItems:'center', justifyContent:'center',
                }}>
                  <Text style={{ fontSize:18 }}>{p.status === 'paid' ? '✅' : '⚠️'}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>{fmt(p.amount || 0)}</Text>
                  <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                    {fmtDate(p.payment_date || p.date)} · {p.group_name || p.payment_type || '—'}
                  </Text>
                </View>
                <Tag
                  label={p.status === 'paid' ? t('paid') : t('unpaid')}
                  color={p.status === 'paid' ? colors.green : colors.red}
                />
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
