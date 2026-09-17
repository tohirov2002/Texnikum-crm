import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { attendanceApi, groupApi, stdAttendanceApi } from '../../../src/api/resources';
import { todayStr } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadi'  },
};

export default function AdminLiveAttendance() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [staffAtt, setStaffAtt] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');
  const timerRef = useRef(null);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [att, grps] = await Promise.all([
        attendanceApi.getAll({ date: todayStr(), page_size:100 }),
        groupApi.getAll({ page_size:50 }),
      ]);
      setStaffAtt(att.results || att || []);
      setGroups(grps.results || grps || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    load();
    // Har 30 soniyada yangilash
    timerRef.current = setInterval(() => load(), 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const presentC = staffAtt.filter(a=>a.status==='present').length;
  const lateC    = staffAtt.filter(a=>a.status==='late').length;
  const absentC  = staffAtt.filter(a=>a.status==='absent').length;

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:0,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingBottom:12 }}>
          <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>📡 Jonli Davomat</Text>
          {/* Yashil pulsing dot */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:6,
            paddingHorizontal:12, paddingVertical:5, borderRadius:20,
            backgroundColor:'rgba(16,185,129,0.15)', borderWidth:1, borderColor:'rgba(16,185,129,0.3)' }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor: colors.green }} />
            <Text style={{ fontSize:12, fontWeight:'700', color: colors.green }}>LIVE</Text>
          </View>
        </View>
        {/* Tabs */}
        <View style={{ flexDirection:'row', gap:0 }}>
          {[
            { key:'staff',  label:'👥 Xodimlar' },
            { key:'groups', label:'📚 Guruhlar'  },
          ].map(tab=>(
            <TouchableOpacity key={tab.key} onPress={()=>setActiveTab(tab.key)}
              style={{ paddingHorizontal:16, paddingVertical:12, borderBottomWidth:2,
                borderBottomColor: activeTab===tab.key ? colors.brand : 'transparent' }}>
              <Text style={{ fontSize:13, fontWeight:'700',
                color: activeTab===tab.key ? colors.brand : colors.textMuted }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:16 }}>

        {activeTab==='staff' ? (
          <>
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
              {staffAtt.length>0 && (
                <ProgressBar percent={Math.round((presentC/staffAtt.length)*100)} color={colors.green} height={6} />
              )}
            </Card>

            {/* Kelganlar */}
            {['present','late','absent'].map(status=>{
              const list = staffAtt.filter(a=>a.status===status);
              if (!list.length) return null;
              const cfg = ATT[status];
              return (
                <View key={status}>
                  <SectionHeader title={`${cfg.e} ${cfg.l} (${list.length})`} />
                  <View style={{ gap:8 }}>
                    {list.map((a,i)=>(
                      <Card key={a.id||i} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                        <Ava name={a.employee_name||a.full_name||'?'} color={cfg.c} size={42} />
                        <View style={{ flex:1 }}>
                          <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                            {a.employee_name||a.full_name||'—'}
                          </Text>
                          <View style={{ flexDirection:'row', gap:10, marginTop:4 }}>
                            {a.check_in  && <Text style={{ fontSize:11, color: colors.green }}>🕐 {a.check_in?.slice(0,5)}</Text>}
                            {a.check_out && <Text style={{ fontSize:11, color: colors.blue  }}>🕓 {a.check_out?.slice(0,5)}</Text>}
                            {a.late_minutes>0 && <Text style={{ fontSize:11, color:'#f59e0b' }}>+{a.late_minutes}min</Text>}
                          </View>
                        </View>
                        <View style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:20, backgroundColor: cfg.bg }}>
                          <Text style={{ fontSize:12, fontWeight:'700', color:cfg.c }}>{cfg.e}</Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        ) : (
          /* Guruhlar davomati */
          groups.map((g,i)=>(
            <Card key={g.id}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                <View style={{ width:40, height:40, borderRadius:12,
                  backgroundColor: colors.brandBg, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:16, fontWeight:'900', color: colors.brand }}>
                    {(g.name||'G').slice(0,2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>{g.name}</Text>
                  <Text style={{ fontSize:12, color: colors.textMuted }}>🎓 {g.students_count||0} talaba</Text>
                </View>
                <Tag label={`${g.attendance_pct||0}%`} color={colors.green} />
              </View>
              <ProgressBar percent={g.attendance_pct||0} color={colors.green} height={5} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}
