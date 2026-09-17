import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, Ava } from '../../../src/components/ui';
import { lessonApi, groupApi } from '../../../src/api/resources';
import { fmtDate, todayStr } from '../../../src/utils/formatters';

const STATUS_CFG = {
  pending:  { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',   e:'⏳', l:'Kutilmoqda'    },
  ongoing:  { c:'#6366f1', bg:'rgba(99,102,241,0.12)',   e:'▶️',  l:'Davom etmoqda' },
  finished: { c:'#10b981', bg:'rgba(16,185,129,0.12)',   e:'✅', l:'Tugadi'         },
};
const FILTER_TABS = ['all','pending','ongoing','finished'];

export default function TeacherLessons() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [ls, gs] = await Promise.all([
        lessonApi.getAll({ page_size:100 }),
        groupApi.getAll({ my:true, page_size:50 }),
      ]);
      setLessons(ls.results || ls || []);
      setGroups(gs.results || gs || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const handleFinish = (lesson) => {
    Alert.alert('Darsni tugatish', `"${lesson.topic||lesson.group_name}" darsini tugatmoqchimisiz?`, [
      { text: t('cancel'), style:'cancel' },
      { text:'✅ Tugatish', onPress: async () => {
        try { await lessonApi.finish(lesson.id); load(); } catch {}
      }},
    ]);
  };

  const filtered = filter==='all' ? lessons : lessons.filter(l=>l.status===filter);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:0,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingBottom:12 }}>
          <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>🎯 {t('lessons')}</Text>
          <TouchableOpacity onPress={()=>setShowAdd(true)} activeOpacity={0.8}
            style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
              backgroundColor: colors.brand, flexDirection:'row', alignItems:'center', gap:6 }}>
            <Text style={{ color:'#fff', fontSize:16 }}>+</Text>
            <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>Dars</Text>
          </TouchableOpacity>
        </View>
        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8, paddingBottom:12 }}>
          {FILTER_TABS.map(f=>{
            const cfg = STATUS_CFG[f];
            const cnt = f==='all' ? lessons.length : lessons.filter(l=>l.status===f).length;
            const isActive = filter===f;
            return (
              <TouchableOpacity key={f} onPress={()=>setFilter(f)} activeOpacity={0.8}
                style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
                  backgroundColor: isActive ? (cfg?.c||colors.brand) : colors.bgCard,
                  borderWidth:1.5, borderColor: isActive ? (cfg?.c||colors.brand) : colors.border }}>
                <Text style={{ fontSize:12, fontWeight:'700',
                  color: isActive ? '#fff' : colors.textMuted }}>
                  {cfg ? `${cfg.e} ${cfg.l}` : 'Barchasi'} ({cnt})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:10 }}>
        {filtered.map((l,i)=>{
          const cfg = STATUS_CFG[l.status] || STATUS_CFG.pending;
          return (
            <Card key={l.id||i}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:10 }}>
                <View style={{ width:46, height:46, borderRadius:13,
                  backgroundColor: cfg.bg, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ fontSize:22 }}>{cfg.e}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontWeight:'800', fontSize:15, color: colors.textPrimary }}>
                    {l.group_name || l.group || '—'}
                  </Text>
                  <Text style={{ fontSize:13, color: colors.textMuted, marginTop:2 }}>
                    📖 {l.topic || l.subject || '—'}
                  </Text>
                  <Text style={{ fontSize:11, color: colors.brand, marginTop:2, fontWeight:'600' }}>
                    📅 {fmtDate(l.date)} · ⏰ {l.start_time||l.time||'—'}
                  </Text>
                </View>
                <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:20, backgroundColor: cfg.bg }}>
                  <Text style={{ fontSize:12, fontWeight:'700', color:cfg.c }}>{cfg.l}</Text>
                </View>
              </View>

              <View style={{ flexDirection:'row', gap:10, flexWrap:'wrap' }}>
                <Text style={{ fontSize:12, color: colors.textMuted }}>🎓 {l.students_count||0} talaba</Text>
                {l.present_count !== undefined && (
                  <Text style={{ fontSize:12, color: colors.green }}>✅ {l.present_count} keldi</Text>
                )}
                {l.absent_count > 0 && (
                  <Text style={{ fontSize:12, color: colors.red }}>❌ {l.absent_count} kelmadi</Text>
                )}
              </View>

              {l.status === 'ongoing' && (
                <TouchableOpacity onPress={()=>handleFinish(l)} activeOpacity={0.85}
                  style={{ marginTop:12, paddingVertical:10, borderRadius:12,
                    backgroundColor: colors.greenBg, borderWidth:1, borderColor: colors.green,
                    alignItems:'center' }}>
                  <Text style={{ fontSize:14, fontWeight:'700', color: colors.green }}>
                    ✅ {t('finish_lesson')}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}
        {filtered.length===0 && (
          <View style={{ alignItems:'center', padding:40, gap:12 }}>
            <Text style={{ fontSize:48 }}>🎯</Text>
            <Text style={{ fontSize:14, color: colors.textMuted }}>Darslar topilmadi</Text>
          </View>
        )}
      </ScrollView>

      {/* Dars qo'shish modal */}
      <AddLessonModal
        visible={showAdd} onClose={()=>setShowAdd(false)}
        groups={groups} onSaved={()=>{ setShowAdd(false); load(); }}
        colors={colors} t={t}
      />
    </View>
  );
}

function AddLessonModal({ visible, onClose, groups, onSaved, colors, t }) {
  const [groupId, setGroupId] = useState('');
  const [topic, setTopic] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!groupId) return;
    setSaving(true);
    try {
      await lessonApi.create({ group: groupId, topic, date: todayStr(), status:'ongoing' });
      onSaved();
    } catch { Alert.alert('❌', t('error')); }
    finally { setSaving(false); }
  };

  if (!visible) return null;
  return (
    <>
      <TouchableOpacity style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.5)' }}
        activeOpacity={1} onPress={onClose} />
      <View style={{ position:'absolute', bottom:0, left:0, right:0,
        backgroundColor: colors.bgCard, borderTopLeftRadius:20, borderTopRightRadius:20, paddingBottom:32 }}>
        <View style={{ alignItems:'center', paddingVertical:12 }}>
          <View style={{ width:36, height:4, borderRadius:2, backgroundColor: colors.border }} />
        </View>
        <Text style={{ fontSize:16, fontWeight:'800', color: colors.textPrimary,
          paddingHorizontal:20, paddingBottom:16, borderBottomWidth:1, borderBottomColor: colors.border }}>
          🎯 Yangi dars
        </Text>
        <View style={{ padding:20, gap:14 }}>
          {/* Guruh tanlash */}
          <Text style={{ fontSize:13, fontWeight:'600', color: colors.textSecondary }}>Guruh</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:8 }}>
            {groups.map(g=>(
              <TouchableOpacity key={g.id} onPress={()=>setGroupId(g.id)} activeOpacity={0.8}
                style={{ paddingHorizontal:14, paddingVertical:9, borderRadius:20,
                  backgroundColor: groupId===g.id ? colors.brand : colors.bgCard,
                  borderWidth:1.5, borderColor: groupId===g.id ? colors.brand : colors.border }}>
                <Text style={{ fontSize:13, fontWeight:'700',
                  color: groupId===g.id ? '#fff' : colors.textMuted }}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection:'row', alignItems:'center', gap:10,
            backgroundColor: colors.bgInput, borderRadius:12, paddingHorizontal:14,
            height:48, borderWidth:1, borderColor: colors.borderInput }}>
            <Text style={{ fontSize:18 }}>📖</Text>
            <TextInput value={topic} onChangeText={setTopic}
              placeholder="Dars mavzusi" placeholderTextColor={colors.textMuted}
              style={{ flex:1, fontSize:14, color: colors.textPrimary }} />
          </View>

          <TouchableOpacity onPress={handleSave} disabled={saving||!groupId} activeOpacity={0.85}
            style={{ height:50, borderRadius:14, backgroundColor: colors.brand,
              alignItems:'center', justifyContent:'center', opacity:(!groupId||saving)?0.6:1 }}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize:15, fontWeight:'800', color:'#fff' }}>▶️ Darsni boshlash</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
