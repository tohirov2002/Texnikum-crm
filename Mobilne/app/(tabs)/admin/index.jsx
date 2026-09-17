import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { dashboardApi } from '../../../src/api/resources';
import { selectFullName } from '../../../src/store/authSlice';
import { fmt, fmtK } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅' },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱'  },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌' },
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const fullName = useSelector(selectFullName);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try { const d = await dashboardApi.getAdmin(); setData(d); } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const { summary={}, groups=[], debtors=[], today_absent=[] } = data || {};

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
            backgroundColor: colors.blueBg, borderWidth:1, borderColor:'rgba(59,130,246,0.3)' }}>
            <Text style={{ fontSize:12, fontWeight:'700', color: colors.blue }}>{t('role_center_admin')}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* 4 stat */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:12 }}>
          {[
            { e:'📚', l:t('groups'),    v: summary.total_groups   ||0, c: colors.brand },
            { e:'🎓', l:t('students'),  v: summary.total_students ||0, c: colors.green },
            { e:'💳', l:t('income'),    v: fmtK(summary.monthly_income||0), c:'#f59e0b' },
            { e:'⚠️', l:t('debtors'),   v: summary.debtors_count  ||0, c: colors.red   },
          ].map((s,i)=>(
            <View key={i} style={{ width:'48%' }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* Bugungi davomat qisqacha */}
        <Card>
          <Text style={{ fontSize:14, fontWeight:'800', color: colors.textPrimary, marginBottom:14 }}>
            📅 Bugungi talabalar davomati
          </Text>
          <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom:14 }}>
            {[
              { l:t('present'), v: summary.present_today ||0, c: colors.green },
              { l:t('late'),    v: summary.late_today    ||0, c:'#f59e0b'     },
              { l:t('absent'),  v: summary.absent_today  ||0, c: colors.red   },
            ].map((s,i)=>(
              <View key={i} style={{ alignItems:'center' }}>
                <Text style={{ fontSize:24, fontWeight:'900', color:s.c }}>{s.v}</Text>
                <Text style={{ fontSize:12, color: colors.textMuted, marginTop:3 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          {summary.total_students > 0 && (
            <ProgressBar
              percent={Math.round(((summary.present_today||0)/summary.total_students)*100)}
              color={colors.green} height={6}
            />
          )}
        </Card>

        {/* Guruhlar */}
        {groups.length > 0 && (
          <View>
            <SectionHeader title={`📚 Guruhlar (${groups.length})`} action={t('see_all')} />
            <View style={{ gap:10 }}>
              {groups.slice(0,5).map(g=>(
                <Card key={g.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <View style={{ width:44, height:44, borderRadius:12,
                    backgroundColor: colors.brandBg, alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:18, fontWeight:'900', color: colors.brand }}>
                      {(g.name||'G')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>{g.name}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                      🎓 {g.students_count||0} · 🏫 {g.room||'—'}
                    </Text>
                  </View>
                  <Tag label={`${g.attendance_pct||0}%`} color={colors.green} />
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Qarzdorlar */}
        {debtors.length > 0 && (
          <View>
            <SectionHeader title={`💸 Qarzdorlar (${debtors.length})`} action={t('see_all')} />
            <View style={{ gap:10 }}>
              {debtors.slice(0,5).map(s=>(
                <Card key={s.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={`${s.first_name} ${s.last_name}`} color={colors.red} size={44} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {s.last_name} {s.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{s.group_name||'—'}</Text>
                  </View>
                  <Text style={{ fontSize:14, fontWeight:'800', color: colors.red }}>
                    -{fmtK(s.debt||0)}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Kelmagan talabalar */}
        {today_absent.length > 0 && (
          <View>
            <SectionHeader title={`❌ Bugun kelmagan (${today_absent.length})`} />
            <View style={{ gap:8 }}>
              {today_absent.slice(0,5).map(s=>(
                <Card key={s.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={`${s.first_name} ${s.last_name}`} color={colors.red} size={40} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {s.last_name} {s.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{s.group_name||'—'}</Text>
                  </View>
                  <View style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:20, backgroundColor: colors.redBg }}>
                    <Text style={{ fontSize:12, fontWeight:'700', color: colors.red }}>❌</Text>
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
