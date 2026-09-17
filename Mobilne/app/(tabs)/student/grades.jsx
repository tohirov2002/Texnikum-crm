import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag } from '../../../src/components/ui';
import { gradeApi } from '../../../src/api/resources';
import { fmtDate } from '../../../src/utils/formatters';

const STATUS = {
  finished: { l:'Tugadi',    c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅' },
  ongoing:  { l:'Davom etmoqda', c:'#f59e0b', bg:'rgba(245,158,11,0.12)', e:'🔄' },
  pending:  { l:'Kutilmoqda', c:'#9ba3c0', bg:'rgba(155,163,192,0.12)', e:'⏳' },
};

export default function StudentGrades() {
  const { t }  = useTranslation();
  const { colors, isDark } = useTheme();
  const [lessons,   setLessons]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const load = useCallback(async () => {
    try { const d = await gradeApi.getMy(); setLessons(Array.isArray(d) ? d : d.results || []); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  // Guruh bo'yicha guruhlash
  const byGroup = lessons.reduce((acc, ls) => {
    const key = ls.subject_name || 'Boshqa';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ls);
    return acc;
  }, {});

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:16, backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>📝 Baholarim</Text>
        <Text style={{ fontSize:13, color: colors.textMuted, marginTop:4 }}>Jami: {lessons.length} ta baho</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, gap:16, paddingBottom:100 }}
      >
        {lessons.length === 0 ? (
          <View style={{ alignItems:'center', padding:40 }}>
            <Text style={{ fontSize:40 }}>📭</Text>
            <Text style={{ fontSize:14, color: colors.textMuted, marginTop:12 }}>Baholar mavjud emas</Text>
          </View>
        ) : (
          Object.entries(byGroup).map(([groupName, groupLessons]) => (
            <View key={groupName}>
              <SectionHeader title={`📚 ${groupName} (${groupLessons.length})`} />
              <View style={{ gap:8 }}>
                {groupLessons.map((ls, i) => {
                  const cfg = ls.percentage >= 70 ? STATUS.finished : ls.percentage >= 50 ? STATUS.ongoing : STATUS.pending;
                  return (
                    <Card key={ls.id || i} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                      <View style={{
                        width:42, height:42, borderRadius:12,
                        backgroundColor: `${cfg.c}18`,
                        alignItems:'center', justifyContent:'center',
                      }}>
                        <Text style={{ fontSize:18 }}>{cfg.e}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }} numberOfLines={1}>
                          {ls.grade_type_display || 'Baho'}
                        </Text>
                        <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                          {fmtDate(ls.date)} · {ls.score}/{ls.max_score}
                        </Text>
                      </View>
                      <Tag label={`${Math.round(ls.percentage || 0)}%`} color={cfg.c} />
                    </Card>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
