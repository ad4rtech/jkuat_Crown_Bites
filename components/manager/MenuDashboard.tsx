import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Plus, FolderPlus, Pencil, MoreHorizontal, X } from 'lucide-react-native';
import { useManagerMenuStore, MenuItem, MenuItemStatus } from '../../store/managerMenuStore';
import MenuItemForm from './MenuItemForm';
import CategoryModal from './CategoryModal';

// ─── Status pill config ───────────────────────────────────────────────────────
function statusCfg(status: MenuItemStatus) {
  if (status === 'active')      return { label: 'ACTIVE',  bg: '#dcfce7', text: '#16a34a' };
  if (status === 'unavailable') return { label: 'UNAVAIL', bg: '#fef9c3', text: '#ca8a04' };
  return                               { label: 'HIDDEN',  bg: '#f1f5f9', text: '#64748b' };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <View style={[kpi.card, highlight && kpi.cardHighlight]}>
      <Text style={[kpi.value, highlight && kpi.valueHighlight]}>{value}</Text>
      <Text style={[kpi.label, highlight && kpi.labelHighlight]}>{label}</Text>
    </View>
  );
}
const kpi = StyleSheet.create({
  card:           { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 4, alignItems: 'center', borderWidth: 1.5, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardHighlight:  { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  value:          { fontFamily: 'LexendBold', fontSize: 32, color: '#1c120f', marginBottom: 4 },
  valueHighlight: { color: '#d97706' },
  label:          { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', textAlign: 'center' },
  labelHighlight: { color: '#d97706' },
});

// ─── Item Row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item, catName, onEdit, index,
  onDropdownOpen,
}: { item: MenuItem; catName: string; onEdit: () => void; index: number; onDropdownOpen: (id: string) => void }) {
  const { toggleAvailability, deactivateItem } = useManagerMenuStore();
  const sc = statusCfg(item.status);
  const isActive = item.status === 'active';
  const isDeactivated = item.status === 'deactivated';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <View style={row.container}>
        {/* Left: item details */}
        <View style={row.details}>
          <Text style={row.name} numberOfLines={1}>{item.name}</Text>
          <Text style={row.meta}>{catName} • KES {item.price.toLocaleString()}</Text>
        </View>

        {/* Status pill + toggle */}
        <View style={row.statusCol}>
          <View style={[row.pill, { backgroundColor: sc.bg }]}>
            <Text style={[row.pillText, { color: sc.text }]}>{sc.label}</Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={() => { if (!isDeactivated) toggleAvailability(item.id); }}
            trackColor={{ false: '#e2d5c8', true: '#22c55e' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            disabled={isDeactivated}
          />
        </View>

        {/* Actions */}
        <View style={row.actions}>
          <TouchableOpacity style={row.actionIcon} onPress={onEdit}>
            <Pencil size={16} color="#b89f8d" />
          </TouchableOpacity>
          <TouchableOpacity style={row.actionIcon} onPress={() => onDropdownOpen(item.id)}>
            <MoreHorizontal size={16} color="#b89f8d" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={row.divider} />
    </Animated.View>
  );
}
const row = StyleSheet.create({
  container:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  details:    { flex: 1 },
  name:       { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 3 },
  meta:       { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },
  statusCol:  { flexDirection: 'row', alignItems: 'center', gap: 6, width: 130 },
  pill:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  pillText:   { fontFamily: 'LexendBold', fontSize: 10, letterSpacing: 0.3 },
  actions:    { flexDirection: 'row', gap: 4 },
  actionIcon: { padding: 6 },
  divider:    { height: 1, backgroundColor: '#f4ebe1', marginHorizontal: 16 },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MenuDashboard({ onBreadcrumb }: { onBreadcrumb: (s: string) => void }) {
  const { categories, items } = useManagerMenuStore();
  const [activeFilter,   setActiveFilter]   = useState('all');
  const [editingItem,    setEditingItem]    = useState<MenuItem | null | 'new'>(null);
  const [catModalOpen,   setCatModalOpen]   = useState(false);
  const [dropdownItemId, setDropdownItemId] = useState<string | null>(null);
  const { deactivateItem, activateItem } = useManagerMenuStore();

  // If form is open, render it
  if (editingItem !== null) {
    return (
      <MenuItemForm
        item={editingItem === 'new' ? null : editingItem}
        onClose={() => { setEditingItem(null); onBreadcrumb(''); }}
        onBreadcrumb={onBreadcrumb}
      />
    );
  }

  const sortedCats = [...categories].filter(c => c.isActive).sort((a, b) => a.order - b.order);
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name ?? '—';

  const filtered = activeFilter === 'all'
    ? items
    : items.filter(i => i.categoryId === activeFilter);

  const activeCount      = items.filter(i => i.status === 'active').length;
  const unavailableCount = items.filter(i => i.status === 'unavailable').length;

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    onBreadcrumb(item.name);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* KPI Cards */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.kpiRow}>
          <KpiCard value={activeCount}       label={`Active\nItems`} />
          <KpiCard value={unavailableCount}  label={`Currently\nUnavailable`} highlight={unavailableCount > 0} />
          <KpiCard value={sortedCats.length} label={`Menu\nCategories`} />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.actionRow}>
          <TouchableOpacity style={styles.addItemBtn} onPress={() => { setEditingItem('new'); onBreadcrumb('New Item'); }}>
            <Text style={styles.addItemBtnText}>Add New Item</Text>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addCatBtn} onPress={() => setCatModalOpen(true)}>
            <Text style={styles.addCatBtnText}>Add Category</Text>
            <FolderPlus size={16} color="#1c120f" />
          </TouchableOpacity>
        </Animated.View>

        {/* Category Filter Pills */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
            <TouchableOpacity
              style={[styles.pill, activeFilter === 'all' && styles.pillActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[styles.pillText, activeFilter === 'all' && styles.pillTextActive]}>All</Text>
            </TouchableOpacity>
            {sortedCats.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, activeFilter === cat.id && styles.pillActive]}
                onPress={() => setActiveFilter(cat.id)}
              >
                <Text style={[styles.pillText, activeFilter === cat.id && styles.pillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Table */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, { flex: 1 }]}>ITEM DETAILS</Text>
            <Text style={[styles.th, { width: 130 }]}>STATUS</Text>
            <Text style={[styles.th, { width: 70 }]}>ACTIONS</Text>
          </View>

          {/* Rows */}
          {filtered.map((item, i) => (
            <ItemRow
              key={item.id}
              item={item}
              catName={getCatName(item.categoryId)}
              onEdit={() => handleEdit(item)}
              index={i}
              onDropdownOpen={(id) => setDropdownItemId(prev => prev === id ? null : id)}
            />
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No items in this category</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Full-screen dropdown modal to prevent clipping */}
      <Modal visible={dropdownItemId !== null} transparent animationType="fade" onRequestClose={() => setDropdownItemId(null)}>
        <TouchableOpacity style={styles.dropOverlay} activeOpacity={1} onPress={() => setDropdownItemId(null)}>
          <View style={styles.dropCard}>
            <Text style={styles.dropCardTitle} numberOfLines={1}>
              {dropdownItemId ? items.find(i => i.id === dropdownItemId)?.name : ''}
            </Text>
            <TouchableOpacity style={styles.dropCardItem} onPress={() => { if (dropdownItemId) { deactivateItem(dropdownItemId); setDropdownItemId(null); } }}>
              <Text style={[styles.dropCardText, { color: '#ef4444' }]}>Deactivate</Text>
            </TouchableOpacity>
            {items.find(i => i.id === dropdownItemId)?.status === 'deactivated' && (
              <TouchableOpacity style={styles.dropCardItem} onPress={() => { if (dropdownItemId) { activateItem(dropdownItemId); setDropdownItemId(null); } }}>
                <Text style={[styles.dropCardText, { color: '#059669' }]}>Activate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.dropCardItem} onPress={() => { const it = items.find(i => i.id === dropdownItemId); if (it) { handleEdit(it); setDropdownItemId(null); } }}>
              <Text style={styles.dropCardText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dropCardItem, { borderTopWidth: 1, borderColor: '#f0e6d8' }]} onPress={() => setDropdownItemId(null)}>
              <Text style={[styles.dropCardText, { color: '#8a7465' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <CategoryModal visible={catModalOpen} onClose={() => setCatModalOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#faf5ef' },
  scroll:       { padding: 16 },
  kpiRow:       { flexDirection: 'row', marginBottom: 16 },
  actionRow:    { flexDirection: 'row', gap: 12, marginBottom: 16 },
  addItemBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#db8221', borderRadius: 14, paddingVertical: 14 },
  addItemBtnText: { fontFamily: 'LexendBold', fontSize: 15, color: '#fff' },
  addCatBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: '#e8ddd4' },
  addCatBtnText:{ fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f' },
  filterPills:  { gap: 8, paddingBottom: 16, paddingTop: 4 },
  pill:         { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e8ddd4' },
  pillActive:   { backgroundColor: '#1c120f', borderColor: '#1c120f' },
  pillText:     { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#705f55' },
  pillTextActive:{ color: '#fff' },
  table:        { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#f0e6d8' },
  tableHead:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#f4ebe1', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  th:           { fontFamily: 'LexendBold', fontSize: 10, color: '#8a7465', textTransform: 'uppercase', letterSpacing: 0.8 },
  empty:        { padding: 40, alignItems: 'center' },
  emptyText:    { fontFamily: 'Lexend', fontSize: 14, color: '#8a7465' },
  dropOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  dropCard:     { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingTop: 8 },
  dropCardTitle:{ fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f0e6d8' },
  dropCardItem: { paddingHorizontal: 20, paddingVertical: 16 },
  dropCardText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f' },
});
