import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { studentApi, groupApi } from '../../../src/api/resources';
import { fmtK } from '../../../src/utils/formatters';

export default function AdminStudents() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState(null);
  const [showDebtors, setShowDebtors] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [studs, grps] = await Promise.all([
        studentApi.getAll({ page_size:200 }),
        groupApi.getAll({ page_size:50 }),
      ]);
      setStudents(studs.results || studs || []);
      setGroups(grps.results || grps || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  let filtered = students;
  if (search) filtered = filtered.filter(s =>
    `${s.first_name} ${s.last_name} ${s.phone||''}`.toLowerCase().includes(search.toLowerCase()));
  if (groupFilter) filtered = filtered.filter(s => s.group===groupFilter || s.group_id===groupFilter);
  if (showDebtors) filtered = filtered.filter(s => (s.debt||0) > 0);

  const debtTotal = filtered.filter(s=>s.debt>0).reduce((sum,s)=>sum+(s.debt||0),0);

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
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary, marginBottom:12 }}>
          🎓 {t('students')} ({students.length})
        </Text>
        {/* Qidiruv */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:10,
          backgroundColor: colors.bgInput, borderRadius:12, paddingHorizontal:14,
          height:44, borderWidth:1, borderColor: colors.borderInput }}>
          <Text style={{ fontSize:16 }}>🔍</Text>
          <TextInput value={search} onChangeText={setSearch}
            placeholder={t('search')} placeholderTextColor={colors.textMuted}
            style={{ flex:1, fontSize:14, color: colors.textPrimary }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ paddingBottom:90 }}>

        {/* Filterlar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding:16, gap:8 }}>
          <TouchableOpacity onPress={()=>{setGroupFilter(null);setShowDebtors(false);}} activeOpacity={0.8}
            style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
              backgroundColor: !groupFilter&&!showDebtors ? colors.brand : colors.bgCard,
              borderWidth:1.5, borderColor: !groupFilter&&!showDebtors ? colors.brand : colors.border }}>
            <Text style={{ fontSize:13, fontWeight:'700', color: !groupFilter&&!showDebtors ? '#fff' : colors.textMuted }}>
              Barchasi ({students.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>{setShowDebtors(p=>!p); setGroupFilter(null);}} activeOpacity={0.8}
            style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
              backgroundColor: showDebtors ? colors.red : colors.bgCard,
              borderWidth:1.5, borderColor: showDebtors ? colors.red : colors.border }}>
            <Text style={{ fontSize:13, fontWeight:'700', color: showDebtors ? '#fff' : colors.textMuted }}>
              💸 Qarzdorlar ({students.filter(s=>s.debt>0).length})
            </Text>
          </TouchableOpacity>
          {groups.slice(0,8).map(g=>(
            <TouchableOpacity key={g.id} onPress={()=>{setGroupFilter(p=>p===g.id?null:g.id); setShowDebtors(false);}} activeOpacity={0.8}
              style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
                backgroundColor: groupFilter===g.id ? colors.brand : colors.bgCard,
                borderWidth:1.5, borderColor: groupFilter===g.id ? colors.brand : colors.border }}>
              <Text style={{ fontSize:13, fontWeight:'700', color: groupFilter===g.id ? '#fff' : colors.textMuted }}>
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Xulosa */}
        {showDebtors && debtTotal > 0 && (
          <View style={{ marginHorizontal:16, marginBottom:12, padding:14, borderRadius:14,
            backgroundColor: colors.redBg, borderWidth:1, borderColor: colors.red }}>
            <Text style={{ fontSize:13, fontWeight:'700', color: colors.red }}>
              💸 Jami qarzdorlik: {fmtK(debtTotal)}
            </Text>
          </View>
        )}

        {/* Talabalar */}
        <View style={{ padding:16, gap:10 }}>
          {filtered.map(s=>(
            <Card key={s.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
              <Ava name={`${s.first_name} ${s.last_name}`}
                color={(s.debt||0)>0 ? colors.red : colors.brand} size={48} />
              <View style={{ flex:1 }}>
                <Text style={{ fontWeight:'800', fontSize:15, color: colors.textPrimary }}>
                  {s.last_name} {s.first_name}
                </Text>
                <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                  {groups.find(g=>g.id===(s.group||s.group_id))?.name || s.group_name || '—'}
                </Text>
                <Text style={{ fontSize:11, color: colors.textMuted, marginTop:2 }}>
                  📞 {s.phone || '—'}
                </Text>
              </View>
              <View style={{ alignItems:'flex-end', gap:6 }}>
                {s.attendance_pct !== undefined && (
                  <Tag label={`${s.attendance_pct}%`} color={s.attendance_pct>=75 ? colors.green : colors.red} />
                )}
                {(s.debt||0)>0 && (
                  <Text style={{ fontSize:12, fontWeight:'800', color: colors.red }}>
                    -{fmtK(s.debt)}
                  </Text>
                )}
              </View>
            </Card>
          ))}
          {filtered.length===0 && (
            <View style={{ alignItems:'center', padding:40 }}>
              <Text style={{ fontSize:40 }}>🔍</Text>
              <Text style={{ fontSize:14, color: colors.textMuted, marginTop:10 }}>Talaba topilmadi</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
