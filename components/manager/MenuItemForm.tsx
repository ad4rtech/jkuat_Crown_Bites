import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  X, Bell, ChevronDown, ImagePlus, Plus, Trash2,
} from 'lucide-react-native';
import { useManagerMenuStore, MenuItem, MenuItemStatus, LinkedIngredient } from '../../store/managerMenuStore';
import { useStockStore } from '../../store/stockStore';
import CenterToast, { useToast } from '../../components/CenterToast';

interface Props {
  item: MenuItem | null;          // null = new item
  onClose: () => void;
  onBreadcrumb: (s: string) => void;
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sc.card}>
      <Text style={sc.title}>{title}</Text>
      {children}
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  title: { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f', marginBottom: 16 },
});

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fd.wrap}>
      <Text style={fd.label}>{label}</Text>
      {children}
    </View>
  );
}
const fd = StyleSheet.create({
  wrap:  { marginBottom: 14 },
  label: { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#8a7465', marginBottom: 6 },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MenuItemForm({ item, onClose, onBreadcrumb }: Props) {
  const { categories, addItem, updateItem, deactivateItem } = useManagerMenuStore();
  const { stations } = useStockStore();

  const isNew = !item;

  // Form state
  const [name,        setName]        = useState(item?.name        ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price,       setPrice]       = useState(item ? String(item.price) : '');
  const [categoryId,  setCategoryId]  = useState(item?.categoryId  ?? categories[0]?.id ?? '');
  const [isAvailable, setIsAvailable] = useState((item?.status ?? 'active') === 'active');
  const [catOpen,     setCatOpen]     = useState(false);

  const { toast, show: showToast } = useToast();

  useEffect(() => {
    if (item) {
      setName(item.name); setDescription(item.description ?? '');
      setPrice(String(item.price)); setCategoryId(item.categoryId);
      setIsAvailable(item.status === 'active');
    }
  }, [item?.id]);

  const catName = categories.find(c => c.id === categoryId)?.name ?? 'Select category';
  const breadcrumbTitle = isNew ? 'New Item' : item?.name ?? '';

  const handleSave = () => {
    if (!name.trim()) { showToast('Item name is required', 'error'); return; }
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed <= 0) { showToast('Please enter a valid price greater than 0', 'error'); return; }
    const data = {
      name: name.trim(), description: description.trim(),
      price: parsed, categoryId,
      status: (isAvailable ? 'active' : 'unavailable') as MenuItemStatus,
      linkedIngredients: [], photo: undefined,
    };
    if (item) updateItem(item.id, data); else addItem(data);
    onClose();
  };

  const handleDeactivate = () => {
    if (!item) return;
    Alert.alert('Deactivate Item', `Hide "${item.name}" from all waiter devices?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Deactivate', style: 'destructive', onPress: () => { deactivateItem(item.id); onClose(); } },
    ]);
  };

  return (
    <View style={styles.container}>

      {/* ── Form Header ── */}
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
          <X size={20} color="#1c120f" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>CROWN BITES ROKMS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Menu › {breadcrumbTitle}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Scrollable Content ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* Basic Info */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)}>
          <SectionCard title="Basic Info">
            <Field label="Item Name">
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Grilled Chicken"
                placeholderTextColor="#c4a882"
              />
            </Field>

            <Field label="Category">
              <TouchableOpacity
                style={[styles.input, styles.selectRow]}
                onPress={() => setCatOpen(v => !v)}
              >
                <Text style={styles.selectText}>{catName}</Text>
                <ChevronDown size={16} color="#8a7465" />
              </TouchableOpacity>
              {catOpen && (
                <View style={styles.dropdown}>
                  {categories.filter(c => c.isActive).map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.dropOption, categoryId === c.id && styles.dropOptionActive]}
                      onPress={() => { setCategoryId(c.id); setCatOpen(false); }}
                    >
                      <Text style={[styles.dropOptionText, categoryId === c.id && { color: '#db8221' }]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Field>

            <Field label="Description">
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholder="Describe the dish (shows on receipt)"
                placeholderTextColor="#c4a882"
              />
            </Field>

            {/* Photo Upload Placeholder */}
            <TouchableOpacity style={styles.photoUpload}>
              <ImagePlus size={28} color="#c4a882" />
              <Text style={styles.photoUploadText}>Upload Photo (Optional)</Text>
            </TouchableOpacity>
          </SectionCard>
        </Animated.View>

        {/* Pricing */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          <SectionCard title="Pricing">
            <Field label="Price (KES)">
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="e.g. 1,200"
                placeholderTextColor="#c4a882"
              />
            </Field>
            <Text style={styles.priceNote}>
              Price changes apply immediately to all new orders.
            </Text>
          </SectionCard>
        </Animated.View>

        {/* Availability */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
          <SectionCard title="Availability">
            <View style={styles.availRow}>
              <Text style={styles.availText}>
                Toggling off instantly marks this item as{'\n'}out-of-stock on all waiter devices.
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: '#e2d5c8', true: '#22c55e' }}
                thumbColor="#ffffff"
              />
            </View>
          </SectionCard>
        </Animated.View>



        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Fixed Footer ── */}
      <View style={styles.footer}>
        {!isNew ? (
          <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
            <Text style={styles.deactivateBtnText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Item</Text>
        </TouchableOpacity>
      </View>
      <CenterToast {...toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#faf5ef' },

  // Form header (replaces manager.tsx header when form is shown)
  formHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#faf5ef', borderBottomWidth: 1, borderColor: '#f0e6d8' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerBrand:  { fontFamily: 'Lexend', fontSize: 10, color: '#8a7465', letterSpacing: 0.8, textTransform: 'uppercase' },
  headerTitle:  { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  iconBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f0e6d8' },

  scroll:       { padding: 16 },

  // Input
  input:        { backgroundColor: '#fdfaf5', borderWidth: 1.5, borderColor: '#e8ddd4', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Lexend', fontSize: 15, color: '#1c120f' },
  textarea:     { height: 90, textAlignVertical: 'top', paddingTop: 12 },
  selectRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText:   { fontFamily: 'Lexend', fontSize: 15, color: '#1c120f', flex: 1 },
  dropdown:     { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8ddd4', borderRadius: 12, marginTop: 4, overflow: 'hidden', zIndex: 50 },
  dropOption:   { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderColor: '#f4ebe1' },
  dropOptionActive: { backgroundColor: '#fff7ed' },
  dropOptionText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#1c120f' },

  // Photo upload
  photoUpload:  { borderWidth: 1.5, borderColor: '#e8ddd4', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 28, alignItems: 'center', gap: 8, marginTop: 4 },
  photoUploadText: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#c4a882' },

  // Price note
  priceNote:    { fontFamily: 'Lexend', fontSize: 12, color: '#db8221', marginTop: 4 },

  // Availability
  availRow:     { flexDirection: 'row', alignItems: 'center', gap: 16 },
  availText:    { fontFamily: 'Lexend', fontSize: 13, color: '#705f55', flex: 1, lineHeight: 20 },


  // Footer
  footer:         { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f0e6d8' },
  deactivateBtn:  { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: '#db8221', alignItems: 'center' },
  deactivateBtnText: { fontFamily: 'LexendBold', fontSize: 15, color: '#db8221' },
  cancelBtn:      { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: '#f4ebe1', alignItems: 'center' },
  cancelBtnText:  { fontFamily: 'LexendBold', fontSize: 15, color: '#705f55' },
  saveBtn:        { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: '#db8221', alignItems: 'center' },
  saveBtnText:    { fontFamily: 'LexendBold', fontSize: 15, color: '#fff' },
});
