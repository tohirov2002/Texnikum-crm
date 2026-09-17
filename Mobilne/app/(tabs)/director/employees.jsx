import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, SectionHeader, Tag, Ava } from '../../../src/components/ui';
import { employeeApi } from '../../../src/api/resources';
import { fmtK } from '../../../src/utils/formatters';

const ATT_CFG = {
  present: { c:'#10b981', bg:'rgba(16,185,129,0.12)', e:'✅', l:'Keldi'    },
  late:    { c:'#f59e0b', bg:'rgba(245,158,11,0.12)',  e:'⏱',  l:'Kechikdi' },
  absent:  { c:'#ef4444', bg:'rgba(239,68,68,0.12)',   e:'❌', l:'Kelmadi'  },
};

const DEPT_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ef4444'];

export default function DirectorEmployees() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const d = await employeeApi.getAll({ page_size:100 });
      setEmployees(d.results || d || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.bgApp }}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );

  const filtered = employees.filter(e =>
    !search || `${e.first_name} ${e.last_name} ${e.position||''}`.toLowerCase().includes(search.toLowerCase())
  );

  // Bo'limlar bo'yicha guruhlashtirish
  const depts = [...new Set(employees.map(e=>e.department||'Boshqa'))];

  return (
    <View style={{ flex:1, backgroundColor: colors.bgApp }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ paddingTop:56, paddingHorizontal:20, paddingBottom:14,
        backgroundColor: colors.bgCard, borderBottomWidth:1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary, marginBottom:12 }}>
          👥 {t('employees')} ({employees.length})
        </Text>
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
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:16 }}>

        {/* Bo'limlar statistikasi */}
        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
          {depts.slice(0,6).map((dept,i)=>{
            const cnt = employees.filter(e=>(e.department||'Boshqa')===dept).length;
            const c = DEPT_COLORS[i % DEPT_COLORS.length];
            return (
              <TouchableOpacity key={dept} onPress={()=>setSearch(dept)} activeOpacity={0.8}
                style={{ paddingHorizontal:12, paddingVertical:7, borderRadius:20,
                  backgroundColor:`${c}15`, borderWidth:1, borderColor:`${c}30` }}>
                <Text style={{ fontSize:12, fontWeight:'700', color:c }}>{dept}: {cnt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Xodimlar ro'yxati */}
        <View style={{ gap:10 }}>
          {filtered.map(emp=>{
            const attCfg = ATT_CFG[emp.today_status];
            return (
              <Card key={emp.id}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={`${emp.first_name} ${emp.last_name}`} size={48} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'800', fontSize:15, color: colors.textPrimary }}>
                      {emp.last_name} {emp.first_name}
                    </Text>
                    <Text style={{ fontSize:13, color: colors.textMuted, marginTop:2 }}>{emp.position||'—'}</Text>
                    {emp.department && (
                      <Text style={{ fontSize:11, color: colors.brand, marginTop:2, fontWeight:'600' }}>
                        {emp.department}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems:'flex-end', gap:6 }}>
                    {attCfg && (
                      <View style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:20, backgroundColor: attCfg.bg }}>
                        <Text style={{ fontSize:12, fontWeight:'700', color: attCfg.c }}>
                          {attCfg.e} {attCfg.l}
                        </Text>
                      </View>
                    )}
                    {emp.net_salary && (
                      <Text style={{ fontSize:12, fontWeight:'700', color: colors.green }}>
                        {fmtK(emp.net_salary)}
                      </Text>
                    )}
                  </View>
                </View>
                {emp.phone && (
                  <View style={{ marginTop:10, paddingTop:10, borderTopWidth:1, borderTopColor: colors.border,
                    flexDirection:'row', gap:8 }}>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>📞 {emp.phone}</Text>
                    {emp.hire_date && (
                      <Text style={{ fontSize:12, color: colors.textMuted }}>· 📅 {emp.hire_date}</Text>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ alignItems:'center', padding:40, gap:10 }}>
              <Text style={{ fontSize:40 }}>🔍</Text>
              <Text style={{ fontSize:14, color: colors.textMuted }}>Xodim topilmadi</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
