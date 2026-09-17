import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme';
import { Card, StatCard, SectionHeader, Tag, ProgressBar, Ava } from '../../../src/components/ui';
import { paymentApi, studentApi, groupApi } from '../../../src/api/resources';
import { fmt, fmtK, fmtDate } from '../../../src/utils/formatters';

const PERIOD_TABS = ['today','this_month','all'];

export default function AdminPayments() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('this_month');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [pays, studs] = await Promise.all([
        paymentApi.getAll({ period, page_size:200 }),
        studentApi.getAll({ page_size:100 }),
      ]);
      setPayments(pays.results || pays || []);
      setStudents(studs.results || studs || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { setLoading(true); load(); }, [period]);

  const filtered = search
    ? payments.filter(p =>
        (p.student_name||p.full_name||'').toLowerCase().includes(search.toLowerCase()))
    : payments;

  const totalPaid    = filtered.filter(p=>p.is_paid||p.status==='paid').reduce((s,p)=>s+(p.amount||0),0);
  const totalPending = filtered.filter(p=>!p.is_paid&&p.status!=='paid').reduce((s,p)=>s+(p.amount||0),0);
  const paidCount    = filtered.filter(p=>p.is_paid||p.status==='paid').length;
  const debtors      = students.filter(s=>(s.debt||0)>0);

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
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>💳 {t('payments')}</Text>
          <TouchableOpacity onPress={()=>setShowAddModal(true)} activeOpacity={0.8}
            style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:20,
              backgroundColor: colors.brand, flexDirection:'row', alignItems:'center', gap:6 }}>
            <Text style={{ color:'#fff', fontSize:16 }}>+</Text>
            <Text style={{ color:'#fff', fontSize:13, fontWeight:'700' }}>To'lov</Text>
          </TouchableOpacity>
        </View>
        {/* Period tabs */}
        <View style={{ flexDirection:'row', backgroundColor: colors.bgCard2, borderRadius:12, padding:3 }}>
          {PERIOD_TABS.map(p=>(
            <TouchableOpacity key={p} onPress={()=>setPeriod(p)} activeOpacity={0.8}
              style={{ flex:1, paddingVertical:8, borderRadius:10, alignItems:'center',
                backgroundColor: period===p ? colors.brand : 'transparent' }}>
              <Text style={{ fontSize:12, fontWeight:'700', color: period===p ? '#fff' : colors.textMuted }}>
                {p==='today'?'Bugun':p==='this_month'?'Bu oy':'Barchasi'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.brand} />}
        contentContainerStyle={{ padding:16, paddingBottom:90, gap:20 }}>

        {/* Stat kartalar */}
        <View style={{ flexDirection:'row', gap:12 }}>
          {[
            { e:'✅', l:"To'langan", v: fmtK(totalPaid),    c: colors.green },
            { e:'⏳', l:'Kutilmoqda', v: fmtK(totalPending), c:'#f59e0b'    },
            { e:'⚠️', l:'Qarzdorlar', v: debtors.length,     c: colors.red  },
          ].map((s,i)=>(
            <View key={i} style={{ flex:1 }}>
              <StatCard emoji={s.e} label={s.l} value={s.v} color={s.c} />
            </View>
          ))}
        </View>

        {/* To'lov ulushi */}
        {filtered.length > 0 && (
          <Card>
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>To'lov holati</Text>
              <Text style={{ fontSize:14, fontWeight:'800', color: colors.green }}>
                {paidCount}/{filtered.length}
              </Text>
            </View>
            <ProgressBar
              percent={filtered.length ? Math.round((paidCount/filtered.length)*100) : 0}
              color={colors.green} height={8}
            />
          </Card>
        )}

        {/* Qidiruv */}
        <View style={{ flexDirection:'row', alignItems:'center', gap:10,
          backgroundColor: colors.bgInput, borderRadius:12, paddingHorizontal:14,
          height:44, borderWidth:1, borderColor: colors.borderInput }}>
          <Text style={{ fontSize:16 }}>🔍</Text>
          <TextInput value={search} onChangeText={setSearch}
            placeholder={t('search')} placeholderTextColor={colors.textMuted}
            style={{ flex:1, fontSize:14, color: colors.textPrimary }} />
        </View>

        {/* To'lovlar ro'yxati */}
        <View>
          <SectionHeader title={`📋 To'lovlar (${filtered.length})`} />
          <View style={{ gap:10 }}>
            {filtered.map((p,i)=>{
              const isPaid = p.is_paid || p.status==='paid';
              return (
                <Card key={p.id||i} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={p.student_name||p.full_name||'?'}
                    color={isPaid ? colors.green : colors.red} size={44} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }} numberOfLines={1}>
                      {p.student_name||p.full_name||'—'}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted, marginTop:2 }}>
                      {p.group_name||'—'}
                    </Text>
                    <Text style={{ fontSize:11, color: colors.textMuted, marginTop:2 }}>
                      📅 {fmtDate(p.date||p.created_at)}
                    </Text>
                  </View>
                  <View style={{ alignItems:'flex-end', gap:6 }}>
                    <Text style={{ fontSize:15, fontWeight:'900', color: isPaid ? colors.green : colors.red }}>
                      {fmtK(p.amount||0)}
                    </Text>
                    <View style={{ paddingHorizontal:10, paddingVertical:3, borderRadius:20,
                      backgroundColor: isPaid ? colors.greenBg : colors.yellowBg }}>
                      <Text style={{ fontSize:11, fontWeight:'700', color: isPaid ? colors.green : '#f59e0b' }}>
                        {isPaid ? "✅ To'landi" : "⏳ Kutilmoqda"}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
            {filtered.length===0 && (
              <View style={{ alignItems:'center', padding:40 }}>
                <Text style={{ fontSize:40 }}>📭</Text>
                <Text style={{ fontSize:14, color: colors.textMuted, marginTop:10 }}>To'lovlar topilmadi</Text>
              </View>
            )}
          </View>
        </View>

        {/* Qarzdorlar */}
        {debtors.length > 0 && (
          <View>
            <SectionHeader title={`💸 Qarzdorlar (${debtors.length})`} />
            <View style={{ gap:8 }}>
              {debtors.slice(0,5).map(s=>(
                <Card key={s.id} style={{ flexDirection:'row', alignItems:'center', gap:14 }}>
                  <Ava name={`${s.first_name} ${s.last_name}`} color={colors.red} size={42} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontWeight:'700', fontSize:14, color: colors.textPrimary }}>
                      {s.last_name} {s.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{s.group_name||'—'}</Text>
                  </View>
                  <Text style={{ fontSize:14, fontWeight:'900', color: colors.red }}>
                    -{fmtK(s.debt||0)}
                  </Text>
                </Card>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* To'lov qo'shish modal */}
      <AddPaymentModal
        visible={showAddModal}
        onClose={()=>setShowAddModal(false)}
        students={students}
        onSaved={()=>{ setShowAddModal(false); load(); }}
        colors={colors}
      />
    </View>
  );
}

function AddPaymentModal({ visible, onClose, students, onSaved, colors }) {
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState(1); // 1=student tanlash, 2=summa
  const [selectedStudent, setSelectedStudent] = useState(null);

  const filtered = students.filter(s =>
    !search || `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedStudent || !amount) return;
    setSaving(true);
    try {
      await paymentApi.create({ student: selectedStudent.id, amount: Number(amount), note });
      onSaved();
    } catch (e) {
      Alert.alert('❌', "Xatolik yuz berdi");
    } finally { setSaving(false); }
  };

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity style={{ position:'absolute', inset:0, backgroundColor:'rgba(0,0,0,0.5)' }}
        activeOpacity={1} onPress={onClose} />
      <View style={{ position:'absolute', bottom:0, left:0, right:0,
        backgroundColor: colors.bgCard, borderTopLeftRadius:20, borderTopRightRadius:20,
        paddingBottom:32, maxHeight:'80%' }}>
        <View style={{ alignItems:'center', paddingVertical:12 }}>
          <View style={{ width:36, height:4, borderRadius:2, backgroundColor: colors.border }} />
        </View>
        <Text style={{ fontSize:16, fontWeight:'800', color: colors.textPrimary,
          paddingHorizontal:20, paddingBottom:14, borderBottomWidth:1, borderBottomColor: colors.border }}>
          💳 To'lov qo'shish
        </Text>
        {step===1 ? (
          <>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10, margin:16,
              backgroundColor: colors.bgInput, borderRadius:12, paddingHorizontal:14,
              height:44, borderWidth:1, borderColor: colors.borderInput }}>
              <Text style={{ fontSize:16 }}>🔍</Text>
              <TextInput value={search} onChangeText={setSearch}
                placeholder="Talabani qidiring..." placeholderTextColor={colors.textMuted}
                style={{ flex:1, fontSize:14, color: colors.textPrimary }} />
            </View>
            <ScrollView style={{ maxHeight:300 }}>
              {filtered.slice(0,20).map(s=>(
                <TouchableOpacity key={s.id} onPress={()=>{ setSelectedStudent(s); setStep(2); }}
                  activeOpacity={0.7}
                  style={{ flexDirection:'row', alignItems:'center', gap:14,
                    paddingHorizontal:20, paddingVertical:14,
                    borderBottomWidth:1, borderBottomColor: colors.border }}>
                  <Ava name={`${s.first_name} ${s.last_name}`} size={40} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontSize:14, fontWeight:'700', color: colors.textPrimary }}>
                      {s.last_name} {s.first_name}
                    </Text>
                    <Text style={{ fontSize:12, color: colors.textMuted }}>{s.group_name||'—'}</Text>
                  </View>
                  {(s.debt||0)>0 && (
                    <Text style={{ fontSize:12, fontWeight:'700', color: colors.red }}>-{fmtK(s.debt)}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : (
          <View style={{ padding:20, gap:14 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14,
              backgroundColor: colors.bgCard2, borderRadius:12 }}>
              <Ava name={`${selectedStudent.first_name} ${selectedStudent.last_name}`} size={44} />
              <View style={{ flex:1 }}>
                <Text style={{ fontWeight:'700', color: colors.textPrimary }}>
                  {selectedStudent.last_name} {selectedStudent.first_name}
                </Text>
                <Text style={{ fontSize:12, color: colors.textMuted }}>{selectedStudent.group_name||'—'}</Text>
              </View>
              <TouchableOpacity onPress={()=>setStep(1)}>
                <Text style={{ color: colors.brand, fontSize:13, fontWeight:'600' }}>O'zgartir</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10,
              backgroundColor: colors.bgInput, borderRadius:12, paddingHorizontal:14,
              height:52, borderWidth:1.5, borderColor: colors.borderInput }}>
              <Text style={{ fontSize:18 }}>💵</Text>
              <TextInput value={amount} onChangeText={setAmount}
                placeholder="Summa (so'm)" placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={{ flex:1, fontSize:16, fontWeight:'700', color: colors.textPrimary }} />
            </View>
            <TouchableOpacity onPress={handleSave} disabled={saving || !amount} activeOpacity={0.85}
              style={{ height:50, borderRadius:14, backgroundColor: colors.brand,
                alignItems:'center', justifyContent:'center', opacity: (!amount||saving)?0.6:1 }}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontSize:15, fontWeight:'800', color:'#fff' }}>✅ Saqlash</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}
