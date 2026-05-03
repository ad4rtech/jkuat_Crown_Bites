import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Platform,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import {
  Plus, Download, Search, SlidersHorizontal, Link2,
  RefreshCw, Pencil, MoreHorizontal, X, ChevronDown, TriangleAlert,
} from 'lucide-react-native';
import { useStockStore, StockItem, StockStation } from '../../store/stockStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FlatItem extends StockItem {
  stationId:   string;
  stationName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusCfg(status: StockItem['status']) {
  if (status === 'out') return { label: 'OUT OF STOCK', color: '#ef4444', bg: '#fef2f2', bar: '#ef4444' };
  if (status === 'low') return { label: 'LOW STOCK',    color: '#d97706', bg: '#fffbeb', bar: '#f59e0b' };
  return                       { label: 'IN STOCK',     color: '#059669', bg: '#ecfdf5', bar: '#10b981' };
}

function progressRatio(qty: number, threshold: number): number {
  if (threshold <= 0) return qty > 0 ? 1 : 0;
  return Math.min(qty / threshold, 1);
}

function formatTime(date: Date | null): string {
  if (!date) return '—';
  return `Today ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}

// ─── Update Qty Modal ─────────────────────────────────────────────────────────
function UpdateQtyModal({
  visible, item, stationId, onClose,
}: { visible: boolean; item: FlatItem | null; stationId: string; onClose: () => void }) {
  const { updateQuantity } = useStockStore();
  const [qty, setQty] = useState('');

  if (!item) return null;

  const handleConfirm = () => {
    const n = parseFloat(qty);
    if (isNaN(n)) { Alert.alert('Enter a valid quantity'); return; }
    
    // Add to current quantity (allow negative for deduction, but ensure it doesn't go below 0)
    const finalQty = Math.max(0, item.quantity + n);
    updateQuantity(stationId, item.id, finalQty);
    setQty('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={um.overlay}>
        <View style={um.sheet}>
          <View style={um.header}>
            <Text style={um.title}>Update Quantity</Text>
            <TouchableOpacity style={um.closeBtn} onPress={onClose}>
              <X size={18} color="#1c120f" />
            </TouchableOpacity>
          </View>
          <Text style={um.itemName}>{item.name}</Text>
          <Text style={um.current}>Current: {item.quantity} {item.unit} · Threshold: {item.threshold} {item.unit}</Text>
          <Text style={um.label}>Quantity to add / deduct ({item.unit})</Text>
          <TextInput
            style={um.input}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
            placeholder="e.g. 5 or -2"
            placeholderTextColor="#b89f8d"
            autoFocus
          />
          <TouchableOpacity style={um.confirmBtn} onPress={handleConfirm}>
            <RefreshCw size={15} color="#fff" />
            <Text style={um.confirmBtnText}>Update Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const um = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fdfaf5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title:       { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  closeBtn:    { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 14 },
  itemName:    { fontFamily: 'LexendSemiBold', fontSize: 17, color: '#db8221', marginBottom: 4 },
  current:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginBottom: 16 },
  label:       { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input:       { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f0e6d8', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: 'LexendBold', fontSize: 24, color: '#1c120f', marginBottom: 16 },
  confirmBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#db8221', borderRadius: 14, paddingVertical: 16 },
  confirmBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#fff' },
});

const COMMON_INGREDIENTS = [
  'Beef Patties', 'Brioche Buns', 'Cheddar Cheese', 'Tomatoes', 'Lettuce', 'Cucumber',
  'Onions', 'Pickles', 'Bacon', 'Chicken Breast', 'Coffee Beans', 'Lemon Syrup',
  'Sparkling Water', 'Milk', 'Sugar', 'Salt', 'Pepper', 'Ketchup', 'Mayonnaise',
  'Mustard', 'Heavy Cream', 'Butter', 'Cooking Oil', 'Pasta', 'Breadcrumbs', 'Flour', 'Eggs'
].sort();

// ─── Add Stock Item Modal ─────────────────────────────────────────────────────
function AddItemModal({ visible, stations, onClose }: {
  visible: boolean; stations: StockStation[]; onClose: () => void;
}) {
  const { addStockItem } = useStockStore();
  const [name,      setName]      = useState('');
  const [category,  setCategory]  = useState('');
  const [unit,      setUnit]      = useState('');
  const [qty,       setQty]       = useState('');
  const [threshold, setThreshold] = useState('');
  const [stationId, setStationId] = useState(stations[0]?.id ?? '');
  const [showStation, setShowStation] = useState(false);
  const [showNameDropdown, setShowNameDropdown] = useState(false);

  const reset = () => { setName(''); setCategory(''); setUnit(''); setQty(''); setThreshold(''); };

  const handleAdd = async () => {
    if (!name.trim() || !unit.trim()) { Alert.alert('Name and unit are required'); return; }
    const q = parseFloat(qty) || 0;
    const t = parseFloat(threshold) || 0;
    await addStockItem(stationId, {
      name: name.trim(), category: category.trim(), unit: unit.trim(),
      quantity: q, threshold: t, linkedMenuItemsCount: 0,
    });
    reset();
    onClose();
  };

  const selectedStation = stations.find(s => s.id === stationId)?.name ?? 'Select station';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={am.overlay}>
        <View style={am.sheet}>
          <View style={am.header}>
            <Text style={am.title}>Add Stock Item</Text>
            <TouchableOpacity style={am.closeBtn} onPress={() => { reset(); onClose(); }}>
              <X size={18} color="#1c120f" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Name selector */}
            <View style={am.field}>
              <Text style={am.label}>Item Name *</Text>
              <TouchableOpacity style={[am.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => setShowNameDropdown(v => !v)}>
                <Text style={{ fontFamily: 'Lexend', fontSize: 15, color: name ? '#1c120f' : '#c4a882' }}>{name || 'Select an ingredient'}</Text>
                <ChevronDown size={16} color="#8a7465" />
              </TouchableOpacity>
              {showNameDropdown && (
                <View style={[am.dropdown, { maxHeight: 150 }]}>
                  <ScrollView nestedScrollEnabled>
                    {COMMON_INGREDIENTS.map(ing => (
                      <TouchableOpacity key={ing} style={am.dropOption} onPress={() => { setName(ing); setShowNameDropdown(false); }}>
                        <Text style={[am.dropOptionText, name === ing && { color: '#db8221' }]}>{ing}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {[
              { label: 'Category', value: category, set: setCategory, placeholder: 'e.g. Condiment' },
              { label: 'Unit *', value: unit, set: setUnit, placeholder: 'e.g. L, kg, pcs' },
              { label: 'Initial Quantity', value: qty, set: setQty, placeholder: '0', numeric: true },
              { label: 'Low Stock Threshold', value: threshold, set: setThreshold, placeholder: 'e.g. 5', numeric: true },
            ].map(({ label, value, set, placeholder, numeric }: any) => (
              <View key={label} style={am.field}>
                <Text style={am.label}>{label}</Text>
                <TextInput
                  style={am.input}
                  value={value}
                  onChangeText={set}
                  placeholder={placeholder}
                  placeholderTextColor="#c4a882"
                  keyboardType={numeric ? 'numeric' : 'default'}
                />
              </View>
            ))}

            {/* Station selector */}
            <View style={am.field}>
              <Text style={am.label}>Station</Text>
              <TouchableOpacity style={[am.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} onPress={() => setShowStation(v => !v)}>
                <Text style={{ fontFamily: 'Lexend', fontSize: 15, color: '#1c120f' }}>{selectedStation}</Text>
                <ChevronDown size={16} color="#8a7465" />
              </TouchableOpacity>
              {showStation && (
                <View style={am.dropdown}>
                  {stations.map(s => (
                    <TouchableOpacity key={s.id} style={am.dropOption} onPress={() => { setStationId(s.id); setShowStation(false); }}>
                      <Text style={[am.dropOptionText, stationId === s.id && { color: '#db8221' }]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={am.addBtn} onPress={handleAdd}>
              <Plus size={16} color="#fff" />
              <Text style={am.addBtnText}>Add to Inventory</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const am = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fdfaf5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '90%' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:         { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  closeBtn:      { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 14 },
  field:         { marginBottom: 14 },
  label:         { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#8a7465', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:         { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f0e6d8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Lexend', fontSize: 15, color: '#1c120f' },
  dropdown:      { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f0e6d8', borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  dropOption:    { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f4ebe1' },
  dropOptionText:{ fontFamily: 'LexendSemiBold', fontSize: 14, color: '#1c120f' },
  addBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#db8221', borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  addBtnText:    { fontFamily: 'LexendBold', fontSize: 16, color: '#fff' },
});

// ─── Alerts Modal ──────────────────────────────────────────────────────────────
function AlertsModal({ visible, items, onClose, onUpdateItem }: {
  visible: boolean; items: FlatItem[]; onClose: () => void; onUpdateItem: (item: FlatItem) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={al.overlay}>
        <View style={al.sheet}>
          <View style={al.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TriangleAlert size={20} color="#ef4444" />
              <Text style={al.title}>Stock Alerts</Text>
            </View>
            <TouchableOpacity style={al.closeBtn} onPress={onClose}>
              <X size={18} color="#1c120f" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <Text style={al.emptyText}>All items are adequately stocked.</Text>
            ) : (
              items.map(item => {
                const sc = statusCfg(item.status);
                return (
                  <View key={item.id} style={al.row}>
                    <View style={al.rowLeft}>
                      <Text style={al.rowName}>{item.name}</Text>
                      <Text style={al.rowQty}>
                        Current: <Text style={{ color: sc.color, fontFamily: 'LexendBold' }}>{item.quantity} {item.unit}</Text> 
                        {'  '}·{'  '}Threshold: {item.threshold} {item.unit}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={al.updateBtn} 
                      onPress={() => { onClose(); onUpdateItem(item); }}
                    >
                      <Text style={al.updateBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const al = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#fdfaf5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:      { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  closeBtn:   { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 14 },
  emptyText:  { fontFamily: 'Lexend', fontSize: 14, color: '#8a7465', textAlign: 'center', marginTop: 20 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f0e6d8' },
  rowLeft:    { flex: 1 },
  rowName:    { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  rowQty:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  updateBtn:  { backgroundColor: '#f4ebe1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  updateBtnText: { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#db8221' },
});

// ─── Stock Item Card ──────────────────────────────────────────────────────────
function StockCard({ item, index, onUpdate }: { item: FlatItem; index: number; onUpdate: () => void }) {
  const sc  = statusCfg(item.status);
  const pct = progressRatio(item.quantity, item.threshold);
  const qtyColor = sc.color;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)} style={card.container}>
      {/* Header row */}
      <View style={card.header}>
        <Text style={card.name}>{item.name}</Text>
        <View style={[card.statusBadge, { borderColor: sc.color }]}>
          <Text style={[card.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>
      </View>

      {/* Sub row */}
      <View style={card.subRow}>
        <Text style={card.category}>{item.category}</Text>
        <Text style={card.dot}> • </Text>
        <Link2 size={12} color="#8a7465" />
        <Text style={card.linkedCount}> {item.linkedMenuItemsCount} items</Text>
      </View>

      {/* Qty + Threshold */}
      <View style={card.qtyRow}>
        <View>
          <Text style={card.qtyLabel}>QTY ON HAND</Text>
          <Text style={[card.qtyValue, { color: qtyColor }]}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        <Text style={card.threshLabel}>Thresh: {item.threshold} {item.unit}</Text>
      </View>

      {/* Progress bar */}
      <View style={card.progressBg}>
        <View style={[card.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: sc.bar }]} />
      </View>

      {/* Footer buttons */}
      <View style={card.footer}>
        <TouchableOpacity style={card.updateBtn} onPress={onUpdate}>
          <Plus size={14} color="#8a7465" />
          <Text style={card.updateBtnText}>Update Qty</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const card = StyleSheet.create({
  container:   { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name:        { fontFamily: 'LexendBold', fontSize: 17, color: '#1c120f', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1.5, backgroundColor: 'transparent' },
  statusText:  { fontFamily: 'LexendBold', fontSize: 10, letterSpacing: 0.4 },
  subRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  category:    { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  dot:         { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  linkedCount: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  qtyRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  qtyLabel:    { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  qtyValue:    { fontFamily: 'LexendBold', fontSize: 24 },
  threshLabel: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  progressBg:  { height: 7, backgroundColor: '#f4ebe1', borderRadius: 4, marginBottom: 14, overflow: 'hidden' },
  progressFill:{ height: '100%', borderRadius: 4 },
  footer:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  updateBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: '#fdfaf5', borderWidth: 1.5, borderColor: '#e8ddd4' },
  updateBtnText: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#705f55' },
  iconBtn:     { padding: 10, borderRadius: 10, backgroundColor: '#fdfaf5', borderWidth: 1, borderColor: '#f0e6d8' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventoryDashboard() {
  const { stations, lastUpdated, fetchStock, subscribeToStock } = useStockStore();
  const [search,      setSearch]      = useState('');
  const [updateTarget, setUpdateTarget] = useState<FlatItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchStock();
    const unsub = subscribeToStock();
    return unsub;
  }, []));

  // Flatten stations → items
  const flatItems: FlatItem[] = useMemo(() =>
    stations.flatMap(s =>
      s.items.map(i => ({ ...i, stationId: s.id, stationName: s.name }))
    ), [stations]
  );

  // Search filter
  const filtered = useMemo(() =>
    search.trim()
      ? flatItems.filter(i =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
        )
      : flatItems,
    [flatItems, search]
  );

  // KPIs
  const total    = flatItems.length;
  const inStock  = flatItems.filter(i => i.status === 'ok').length;
  const low      = flatItems.filter(i => i.status === 'low').length;
  const out      = flatItems.filter(i => i.status === 'out').length;
  const attention = low + out;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Last updated bar */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.updatedBar}>
          <RefreshCw size={12} color="#8a7465" />
          <Text style={styles.updatedText}>
            Last updated: {formatTime(lastUpdated)} · Auto-updates on order confirmation.
          </Text>
        </Animated.View>

        {/* 2×2 KPI grid */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{total}</Text>
              <Text style={styles.kpiLabel}>Total Stock Items</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>{inStock}</Text>
              <Text style={styles.kpiLabel}>In Stock</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#d97706' }]}>{low}</Text>
              <Text style={styles.kpiLabel}>Low Stock</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#ef4444' }]}>{out}</Text>
              <Text style={styles.kpiLabel}>Out of Stock</Text>
            </View>
          </View>
        </Animated.View>

        {/* Alert banner */}
        {attention > 0 && (
          <Animated.View entering={FadeInDown.delay(90).duration(380)} style={styles.alertBanner}>
            <TriangleAlert size={15} color="#d97706" />
            <Text style={styles.alertText}>
              {attention} item{attention > 1 ? 's' : ''} need immediate attention
            </Text>
            <TouchableOpacity onPress={() => setShowAlertsModal(true)}>
              <Text style={styles.alertLink}>View Alerts →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(110).duration(380)} style={styles.actionRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Stock Item</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Search bar */}
        <Animated.View entering={FadeInDown.delay(130).duration(380)} style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={16} color="#b89f8d" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search inventory..."
              placeholderTextColor="#b89f8d"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={14} color="#b89f8d" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal size={18} color="#705f55" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stock cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No items found</Text>
          </View>
        ) : (
          filtered.map((item, i) => (
            <StockCard
              key={item.id}
              item={item}
              index={i}
              onUpdate={() => setUpdateTarget(item)}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Update Qty Modal */}
      <UpdateQtyModal
        visible={updateTarget !== null}
        item={updateTarget}
        stationId={updateTarget?.stationId ?? ''}
        onClose={() => setUpdateTarget(null)}
      />

      {/* Add Stock Item Modal */}
      <AddItemModal
        visible={showAddModal}
        stations={stations}
        onClose={() => setShowAddModal(false)}
      />

      {/* Alerts Modal */}
      <AlertsModal
        visible={showAlertsModal}
        items={flatItems.filter(i => i.status !== 'ok')}
        onClose={() => setShowAlertsModal(false)}
        onUpdateItem={(item) => setUpdateTarget(item)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#faf5ef' },
  scroll:       { padding: 16 },

  updatedBar:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  updatedText:  { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465', flex: 1 },

  kpiGrid:      { marginBottom: 14, gap: 10 },
  kpiRow:       { flexDirection: 'row', gap: 10 },
  kpiCard:      { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  kpiValue:     { fontFamily: 'LexendBold', fontSize: 28, color: '#1c120f', marginBottom: 4 },
  kpiLabel:     { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },

  alertBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#fde68a' },
  alertText:    { fontFamily: 'LexendSemiBold', fontSize: 12, color: '#92400e', flex: 1 },
  alertLink:    { fontFamily: 'LexendBold', fontSize: 12, color: '#d97706' },

  actionRow:    { flexDirection: 'row', gap: 12, marginBottom: 14 },
  addBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: '#db8221' },
  addBtnText:   { fontFamily: 'LexendBold', fontSize: 14, color: '#fff' },
  exportBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8ddd4' },
  exportBtnText:{ fontFamily: 'LexendSemiBold', fontSize: 14, color: '#705f55' },

  searchRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBar:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: '#e8ddd4' },
  searchInput:  { flex: 1, fontFamily: 'Lexend', fontSize: 14, color: '#1c120f', padding: 0 },
  filterBtn:    { padding: 13, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#e8ddd4', justifyContent: 'center', alignItems: 'center' },

  emptyState:   { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyEmoji:   { fontSize: 40 },
  emptyTitle:   { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
});
