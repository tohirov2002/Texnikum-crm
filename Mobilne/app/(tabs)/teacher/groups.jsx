import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { groupApi, studentApi, stdAttendanceApi, lessonApi } from '../../../src/api/resources';
import { todayStr } from '../../../src/utils/formatters';

const ATT = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadi'  },
};
const ATT_KEYS = ['present','late','absent'];
const GRP_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6'];

export default function TeacherGroups() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [attMap, setAttMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await groupApi.getAll({ my:true, page_size:50 });
      setGroups(d.results || d || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const openGroup = async (g) => {
    setSelected(g);
    try {
      const [studs, att, lessons] = await Promise.all([
        studentApi.getAll({ group: g.id, page_size:100 }),
        stdAttendanceApi.getAll({ group: g.id, date: todayStr(), page_size:100 }),
        lessonApi.getAll({ group: g.id, date: todayStr(), page_size:5 }),
      ]);
      const studsArr = studs.results || studs || [];
      setStudents(studsArr);
      const map = {};
      studsArr.forEach(s => { map[s.id] = 'present'; });
      (att.results || att || []).forEach(a => { map[a.student || a.student_id] = a.status; });
      setAttMap(map);
      const active = (lessons.results || lessons || []).find(l => l.status === 'ongoing');
      setActiveLesson(active || null);
    } catch {}
  };

  const toggleAtt = (studentId) => {
    setAttMap(prev => {
      const cur = prev[studentId] || 'present';
      const next = ATT_KEYS[(ATT_KEYS.indexOf(cur) + 1) % ATT_KEYS.length];
      return { ...prev, [studentId]: next };
    });
  };

  const saveAttendance = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const records = students.map(s => ({ student: s.id, status: attMap[s.id] || 'present', date: todayStr() }));
      await stdAttendanceApi.bulk({ group: selected.id, date: todayStr(), records });
    } catch {}
    finally { setSaving(false); }
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
          📚 {t('my_groups')} ({groups.length})
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
                  <View style={{ width:50, height:50, borderRadius:14,
                    backgroundColor:`${c}20`, alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:18, fontWeight:'900', color:c }}>
                      {(g.name||'G').slice(0,2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'800', fontSize:15, color: colors.textPrimary }}>{g.name}</Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                      📖 {g.subject_name||g.subject||'—'}
                    </Text>
                    <Text style={{ fontSize:11, color:c, marginTop:2, fontWeight:'600' }}>
                      ⏰ {g.schedule||g.lesson_time||'—'} · 🏫 {g.room||'—'}
                    </Text>
                  </View>
                  <View style={{ alignItems:'flex-end', gap:6 }}>
                    <Tag label={`${g.students_count||0} 🎓`} color={c} />
                    <Tag label={`${g.attendance_pct||0}%`}
                      color={(g.attendance_pct||0)>=75 ? colors.green : colors.red} />
                  </View>
                </View>
                <ProgressBar percent={g.attendance_pct||0}
                  color={(g.attendance_pct||0)>=75 ? colors.green : colors.red} height={5} />
              </Card>
            </TouchableOpacity>
          );
        })}
        {groups.length===0 && (
          <View style={{ alignItems:'center', padding:40, gap:12 }}>
            <Text style={{ fontSize:48 }}>📚</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color: colors.textPrimary }}>Guruhlar yo'q</Text>
          </View>
        )}
      </ScrollView>

      {/* Guruh modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setSelected(null)}>
        <View style={{ flex:1, backgroundColor: colors.bgApp }}>
          <View style={{ paddingTop:16, paddingHorizontal:20, paddingBottom:14,
            backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border,
            flexDirection:'row', alignItems:'center', gap:14 }}>
            <TouchableOpacity onPress={()=>setSelected(null)}
              style={{ width:36,height:36,borderRadius:10,backgroundColor: colors.bgCard2,alignItems:'center',justifyContent:'center' }}>
              <Text style={{ fontSize:20, color: colors.textPrimary }}>‹</Text>
            </TouchableOpacity>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:17, fontWeight:'900', color: colors.textPrimary }}>{selected?.name}</Text>
              <Text style={{ fontSize:12, color: colors.textMuted }}>
                🎓 {students.length} talaba · {todayStr()}
              </Text>
            </View>
            <TouchableOpacity onPress={saveAttendance} disabled={saving} activeOpacity={0.85}
              style={{ paddingHorizontal:16, paddingVertical:9, borderRadius:20,
                backgroundColor: colors.green, opacity: saving?0.6:1 }}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontSize:13, fontWeight:'700', color:'#fff' }}>💾 Saqlash</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Statistika */}
          <View style={{ flexDirection:'row', padding:16, gap:10 }}>
            {ATT_KEYS.map(key=>{
              const cnt = students.filter(s=>attMap[s.id]===key).length;
              const cfg = ATT[key];
              return (
                <View key={key} style={{ flex:1, alignItems:'center', padding:12,
                  backgroundColor: cfg.bg, borderRadius:12 }}>
                  <Text style={{ fontSize:20, fontWeight:'900', color:cfg.c }}>{cnt}</Text>
                  <Text style={{ fontSize:11, color:cfg.c, fontWeight:'700', marginTop:2 }}>{cfg.l}</Text>
                </View>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={{ padding:16, gap:8, paddingBottom:40 }}>
            {students.map(s=>{
              const status = attMap[s.id] || 'present';
              const cfg    = ATT[status];
              return (
                <TouchableOpacity key={s.id} onPress={()=>toggleAtt(s.id)} activeOpacity={0.8}>
                  <Card style={{ flexDirection:'row', alignItems:'center', gap:14,
                    borderColor: cfg.c+'40', borderWidth:1.5 }}>
                    <Ava name={`${s.first_name} ${s.last_name}`} color={cfg.c} size={44} />
                    <View style={{ flex:1 }}>
                      <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                        {s.last_name} {s.first_name}
                      </Text>
                      <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                        Bosing: o'zgartirish uchun
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
                      backgroundColor: cfg.bg, borderWidth:1.5, borderColor:cfg.c }}>
                      <Text style={{ fontSize:14, fontWeight:'800', color:cfg.c }}>{cfg.e} {cfg.l}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
