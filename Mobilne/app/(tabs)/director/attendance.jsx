import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { attendanceApi } from '../../../src/api/resources';
import { fmtDate, todayStr } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadi'  },
  excused: { c:'#3b82f6', bg:'rgba(59,130,246,0.12)',  e:'📋', l:'Sababli'  },
};
const FILTERS = ['all','present','late','absent'];

export default function DirectorAttendance() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [date, setDate] = useState(todayStr());

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await attendanceApi.getAll({ date, page_size:100 });
      setRecords(d.results || d || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [date]);

  useEffect(() => { setLoading(true); load(); }, [date]);

  const filtered = filter==='all' ? records : records.filter(r=>r.status===filter);
  const presentC = records.filter(r=>r.status==='present').length;
  const lateC    = records.filter(r=>r.status==='late').length;
  const absentC  = records.filter(r=>r.status==='absent').length;
  const total    = records.length;

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:14,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary, marginBottom:12 }}>
          📅 {t('attendance')}
        </Text>
        {/* Sana tanlash (oddiy -/+ tugmalar) */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between',
          backgroundColor: colors.bgCard2, borderRadius:12, padding:10 }}>
          <TouchableOpacity onPress={()=>{
            const d=new Date(date); d.setDate(d.getDate()-1); setDate(d.toISOString().slice(0,10));
          }} style={{ width:36,height:36,borderRadius:10,backgroundColor: colors.bgInput,alignItems:'center',justifyContent:'center' }}>
            <Text style={{ fontSize:18, color: colors.textPrimary }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize:15, fontWeight:'700', color: colors.textPrimary }}>{fmtDate(date)}</Text>
          <TouchableOpacity onPress={()=>{
            const d=new Date(date); d.setDate(d.getDate()+1);
            const nd=d.toISOString().slice(0,10);
            if(nd<=todayStr()) setDate(nd);
          }} style={{ width:36,height:36,borderRadius:10,backgroundColor: colors.bgInput,alignItems:'center',justifyContent:'center' }}>
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
          contentContainerStyle={{ padding:16, paddingBottom:90, gap:16 }}>

          {/* Statistika */}
          <Card>
            <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom:14 }}>
              {[
                { l:t('present'), v:presentC, c: colors.green },
                { l:t('late'),    v:lateC,    c:'#f59e0b'     },
                { l:t('absent'),  v:absentC,  c: colors.red   },
              ].map((s,i)=>(
                <View key={i} style={{ alignItems:'center' }}>
                  <Text style={{ fontSize:26, fontWeight:'900', color:s.c }}>{s.v}</Text>
                  <Text style={{ fontSize:12, color: colors.textMuted, marginTop:3 }}>{s.l}</Text>
                </View>
              ))}
            </View>
            {total>0 && (
              <ProgressBar percent={Math.round((presentC/total)*100)} color={colors.green} height={6} />
            )}
          </Card>

          {/* Filter tugmalar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {FILTERS.map(f=>{
                const cfg = ATT[f] || { c: colors.brand, bg: colors.brandBg, l: t('all'), e:'📋' };
                const isActive = filter===f;
                return (
                  <TouchableOpacity key={f} onPress={()=>setFilter(f)} activeOpacity={0.8}
                    style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
                      backgroundColor: isActive ? cfg.c : colors.bgCard,
                      borderWidth:1.5, borderColor: isActive ? cfg.c : colors.border }}>
                    <Text style={{ fontSize:13, fontWeight:'700', color: isActive ? '#fff' : colors.textSecondary }}>
                      {f==='all' ? `Barchasi (${total})` : `${cfg.e} ${cfg.l} (${records.filter(r=>r.status===f).length})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Ro'yxat */}
          <View style={{ gap:10 }}>
            {filtered.map((r,i)=>{
              const cfg = ATT[r.status] || ATT.absent;
              return (
                <Card key={r.id||i} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={r.employee_name || r.full_name || '?'} color={cfg.c} size={44} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {r.employee_name || r.full_name || '—'}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>{r.position||'—'}</Text>
                    <View style={{ flexDirection:'row', gap:10, marginTop:4 }}>
                      {r.check_in  && <Text style={{ fontSize:11, color: colors.green }}>🕐 {r.check_in?.slice(0,5)}</Text>}
                      {r.check_out && <Text style={{ fontSize:11, color: colors.blue  }}>🕓 {r.check_out?.slice(0,5)}</Text>}
                      {r.late_minutes>0 && <Text style={{ fontSize:11, color:'#f59e0b' }}>⏱ +{r.late_minutes}min</Text>}
                    </View>
                  </View>
                  <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor: cfg.bg }}>
                    <Text style={{ fontSize:12, fontWeight:'700', color: cfg.c }}>{cfg.e} {cfg.l}</Text>
                  </View>
                </Card>
              );
            })}
            {filtered.length===0 && (
              <View style={{ alignItems:'center', padding:40 }}>
                <Text style={{ fontSize:36 }}>📭</Text>
                <Text style={{ fontSize:14, color: colors.textMuted, marginTop:10 }}>Ma'lumot yo'q</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
