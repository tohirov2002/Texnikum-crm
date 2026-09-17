import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { groupApi, studentApi, stdAttendanceApi } from '../../../src/api/resources';
import { todayStr } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadi'  },
};
const GRP_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444'];

export default function AdminGroups() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [attToday, setAttToday] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [search, setSearch] = useState('');

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await groupApi.getAll({ page_size:100 });
      setGroups(d.results || d || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const openGroup = async (g) => {
    setSelected(g);
    setActiveTab('students');
    try {
      const [studs, att] = await Promise.all([
        studentApi.getAll({ group: g.id, page_size:100 }),
        stdAttendanceApi.getAll({ group: g.id, date: todayStr(), page_size:100 }),
      ]);
      setStudents(studs.results || studs || []);
      setAttToday(att.results || att || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:14,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>
          📚 {t('groups')} ({groups.length})
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:12 }}>
        {groups.map((g,i)=>{
          const c = GRP_COLORS[i % GRP_COLORS.length];
          return (
            <TouchableOpacity key={g.id} onPress={()=>openGroup(g)} activeOpacity={0.85}>
              <Card>
                <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:12 }}>
                  <View style={{ width:48, height:48, borderRadius:14,
                    backgroundColor:`${c}20`, alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:18, fontWeight:'900', color:c }}>
                      {(g.name||'G').slice(0,2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'800', fontSize:15, color: colors.textPrimary }}>{g.name}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                      📖 {g.subject_name||g.subject||'—'} · 🏫 {g.room||'—'}
                    </Text>
                    <Text style={{ fontSize:11, color: colors.brand, marginTop:2, fontWeight:'600' }}>
                      ⏰ {(g.schedule||g.lesson_time||'—')}
                    </Text>
                  </View>
                  <Ava name={g.teacher_name||'T'} color={colors.green} size={36} />
                </View>
                <View style={{ flexDirection:'row', gap:8 }}>
                  {[
                    { l:'Talabalar', v:g.students_count||0, c: colors.green  },
                    { l:'Davomat',   v:`${g.attendance_pct||0}%`, c: colors.brand },
                    { l:"To'lov",    v:`${g.payment_pct||0}%`,    c:'#f59e0b'     },
                  ].map((s,j)=>(
                    <View key={j} style={{ flex:1, alignItems:'center', padding:8,
                      backgroundColor: colors.bgCard2, borderRadius:10 }}>
                      <Text style={{ fontSize:14, fontWeight:'800', color:s.c }}>{s.v}</Text>
                      <Text style={{ fontSize:10, color: colors.textMuted, marginTop:2 }}>{s.l}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Guruh detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSelected(null)}>
        <View style={{ flex:1, backgroundColor: colors.bgApp }}>
          {/* Modal header */}
          <View style={{ paddingTop:16, paddingHorizontal:20, paddingBottom:14,
            backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border,
            flexDirection:'row', alignItems:'center', gap:14 }}>
            <TouchableOpacity onPress={()=>setSelected(null)}
              style={{ width:36, height:36, borderRadius:10, backgroundColor: colors.bgCard2,
                alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:20, color: colors.textPrimary }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:17, fontWeight:'900', color: colors.textPrimary }}>{selected?.name}</Text>
              <Text style={{ fontSize:12, color: colors.textMuted }}>{selected?.subject_name||'—'}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection:'row', backgroundColor: colors.bgCard, paddingHorizontal:20, gap:0 }}>
            {[
              { key:'students', label:`🎓 Talabalar (${students.length})` },
              { key:'attendance', label:`📅 Bugungi davomat` },
            ].map(tab=>(
              <TouchableOpacity key={tab.key} onPress={()=>setActiveTab(tab.key)}
                style={{ paddingHorizontal:16, paddingVertical:12, borderBottomWidth:2,
                  borderBottomColor: activeTab===tab.key ? colors.brand : 'transparent' }}>
                <Text style={{ fontSize:13, fontWeight:'700',
                  color: activeTab===tab.key ? colors.brand : colors.textMuted }}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={{ padding:16, gap:10 }}>
            {activeTab==='students' ? (
              students.map(s=>{
                const att = attToday.find(a=>a.student===s.id || a.student_id===s.id);
                const cfg = att ? ATT[att.status] : null;
                return (
                  <Card key={s.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                    <Ava name={`${s.first_name} ${s.last_name}`} color={cfg?.c || colors.brand} size={44} />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                        {s.last_name} {s.first_name}
                      </Text>
                      <Text style={{ fontSize:12, color: colors.textMuted }}>{s.phone||'—'}</Text>
                      {s.debt>0 && <Text style={{ fontSize:12, color: colors.red, marginTop:2 }}>Qarzdorlik: {s.debt?.toLocaleString()} so'm</Text>}
                    </View>
                    {cfg ? (
                      <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor: cfg.bg }}>
                        <Text style={{ fontSize:13, fontWeight:'700', color:cfg.c }}>{cfg.e}</Text>
                      </View>
                    ) : <View style={{ width:34, height:34, borderRadius:17, backgroundColor: colors.bgCard2 }} />}
                  </Card>
                );
              })
            ) : (
              students.map(s=>{
                const att = attToday.find(a=>a.student===s.id || a.student_id===s.id);
                const cfg = att ? ATT[att.status] : { c: colors.textMuted, bg: colors.bgCard2, e:'❓', l:'Belgilanmagan' };
                return (
                  <Card key={s.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                    <Ava name={`${s.first_name} ${s.last_name}`} color={cfg.c} size={42} />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                        {s.last_name} {s.first_name}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:20, backgroundColor: cfg.bg }}>
                      <Text style={{ fontSize:13, fontWeight:'700', color:cfg.c }}>{cfg.e} {cfg.l}</Text>
                    </View>
                  </Card>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
