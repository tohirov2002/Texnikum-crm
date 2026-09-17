import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, ProgressBar } from '../../../src/components/ui';
import { stdAttendanceApi } from '../../../src/api/resources';
import { fmtDate, pct } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldim'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdim' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadim'  },
  excused: { c:'#3b82f6', bg:'rgba(59,130,246,0.12)',  e:'📋', l:'Sababli'   },
};

export default function StudentAttendance() {
  const { t }  = useTranslation();
  const { colors, isDark } = useTheme();
  const [records,   setRecords]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async () => {
    try { const d = await stdAttendanceApi.getMy(); setRecords(Array.isArray(d) ? d : d.results || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const total   = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const late    = records.filter(r => r.status === 'late').length;
  const absent  = records.filter(r => r.status === 'absent').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const attPct  = pct(present + late, total);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:16, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>📅 {t('attendance')}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, gap:14, paddingBottom:100 }}
      >
        {/* Statistika */}
        <Card>
          <Text style={{ fontSize:13, fontWeight:'700', color: colors.textMuted, marginBottom:12 }}>Bu oy umumiy holat</Text>
          <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
            {[
              { l:'Keldi',    v: present, c: colors.green  },
              { l:'Kechikdi', v: late,    c: colors.yellow  },
              { l:'Kelmadi',  v: absent,  c: colors.red     },
              { l:'Sababli',  v: excused, c: colors.blue    },
            ].map((s, i) => (
              <View key={i} style={{ flex:1, alignItems:'center', padding:8, backgroundColor: colors.bgCard2, borderRadius:10 }}>
                <Text style={{ fontSize:18, fontWeight:'900', color: s.c }}>{s.v}</Text>
                <Text style={{ fontSize:9, color: colors.textMuted, marginTop:2 }}>{s.l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
            <Text style={{ fontSize:12, color: colors.textMuted }}>Davomat foizi</Text>
            <Text style={{ fontSize:12, fontWeight:'700', color: colors.brand }}>{attPct}%</Text>
          </View>
          <ProgressBar percent={attPct} color={attPct > 80 ? colors.green : attPct > 60 ? colors.yellow : colors.red} />
        </Card>

        {/* Yozuvlar */}
        <SectionHeader title={`Barcha yozuvlar (${total})`} />
        {records.length === 0 ? (
          <View style={{ alignItems:'center', padding:40 }}>
            <Text style={{ fontSize:40 }}>📭</Text>
            <Text style={{ fontSize:14, color: colors.textMuted, marginTop:12 }}>Davomat yozuvlari yo'q</Text>
          </View>
        ) : (
          <Card style={{ overflow:'hidden', padding:0 }}>
            {records.map((a, i) => {
              const cfg = ATT[a.status] || ATT.absent;
              return (
                <View key={a.id || i} style={{
                  flexDirection:'row', alignItems:'center', gap:12,
                  paddingVertical:12, paddingHorizontal:16,
                  borderBottomWidth: i < records.length-1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}>
                  <Text style={{ fontSize:20 }}>{cfg.e}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>{fmtDate(a.date)}</Text>
                    {a.group_name && <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>{a.group_name}</Text>}
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
