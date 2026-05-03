import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput,
} from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import {
  Flame, Snowflake, Coffee, Package, Milk,
  Flag, TriangleAlert, XCircle, History, RefreshCw, X,
} from 'lucide-react-native';
import { useStockStore, StockItem, StockStatus } from '../store/stockStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusDotColor(status: StockStatus) {
  if (status === 'ok')  return '#10b981';
  if (status === 'low') return '#f59e0b';
  return '#ef4444';
}

function stationIcon(iconKey: string, color: string) {
  const size = 20;
  if (iconKey === 'grill')     return <Flame     size={size} color={color} />;
  if (iconKey === 'cold')      return <Snowflake  size={size} color={color} />;
  if (iconKey === 'beverages') return <Coffee     size={size} color={color} />;
  if (iconKey === 'dairy')     return <Milk       size={size} color={color} />;
  return                              <Package    size={size} color={color} />;
}

function stationAccent(iconKey: string) {
  if (iconKey === 'grill')     return '#db8221';
  if (iconKey === 'cold')      return '#3b82f6';
  if (iconKey === 'beverages') return '#6d4c41';
  if (iconKey === 'dairy')     return '#8b5cf6';
  return '#6b7280';
}

// ─── Restock Modal ────────────────────────────────────────────────────────────
function RestockModal({
  visible, item, stationId, onClose,
}: { visible: boolean; item: StockItem | null; stationId: string; onClose: () => void }) {
  const { restockItem } = useStockStore();
  const [qty, setQty] = useState('');

  if (!item) return null;

  const handleConfirm = () => {
    const num = parseFloat(qty);
    if (!isNaN(num) && num > 0) {
      restockItem(stationId, item.id, num);
      setQty('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.sheetHeader}>
            <Text style={ms.sheetTitle}>Restock Item</Text>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
              <X size={20} color="#1c120f" />
            </TouchableOpacity>
          </View>
          <Text style={ms.sheetItem}>{item.name}</Text>
          <Text style={ms.sheetLabel}>New quantity ({item.unit})</Text>
          <TextInput
            style={ms.input}
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
            placeholder={`e.g. 50`}
            placeholderTextColor="#b89f8d"
            autoFocus
          />
          <TouchableOpacity style={ms.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <RefreshCw size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={ms.confirmBtnText}>Mark as Restocked</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item, stationId, index,
}: { item: StockItem; stationId: string; index: number }) {
  const { flagLow, flagOut } = useStockStore();
  const [restockVisible, setRestockVisible] = useState(false);

  const dotColor = statusDotColor(item.status);
  const isOk  = item.status === 'ok';
  const isLow = item.status === 'low';
  const isOut = item.status === 'out';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(350)}
      layout={Layout.springify()}
      style={styles.itemRow}
    >
      {/* Status Dot */}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />

      {/* Name + Qty */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQty}>
          <Text style={styles.itemQtyBold}>{item.quantity}</Text>
          {' '}{item.unit}
        </Text>
      </View>

      {/* Action */}
      {isOut ? (
        <View style={styles.outBadge}>
          <XCircle size={14} color="#dc2626" />
          <Text style={styles.outBadgeText}>Out of{'\n'}Stock</Text>
        </View>
      ) : isLow ? (
        <TouchableOpacity
          style={styles.flagOutBtn}
          onPress={() => flagOut(stationId, item.id)}
          activeOpacity={0.8}
        >
          <TriangleAlert size={13} color="#f59e0b" />
          <Text style={styles.flagOutBtnText}>Flag{'\n'}Out</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.flagLowBtn}
          onPress={() => flagLow(stationId, item.id)}
          activeOpacity={0.8}
        >
          <Flag size={13} color="#8a7465" />
          <Text style={styles.flagLowBtnText}>Flag{'\n'}Low</Text>
        </TouchableOpacity>
      )}

      {/* Restock tap (long press on any item) */}
      <TouchableOpacity style={styles.restockTap} onPress={() => setRestockVisible(true)}>
        <RefreshCw size={14} color="#b89f8d" />
      </TouchableOpacity>

      <RestockModal
        visible={restockVisible}
        item={item}
        stationId={stationId}
        onClose={() => setRestockVisible(false)}
      />
    </Animated.View>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function KitchenStockView() {
  const { stations, makeableFilterOn, toggleMakeableFilter } = useStockStore();

  // Summary counts
  const allItems   = stations.flatMap(s => s.items);
  const lowCount   = allItems.filter(i => i.status === 'low').length;
  const outCount   = allItems.filter(i => i.status === 'out').length;

  // Makeable filter: show only stations that have NO "out" items
  const visibleStations = makeableFilterOn
    ? stations.map(s => ({
        ...s,
        items: s.items.filter(i => i.status !== 'out'),
      })).filter(s => s.items.length > 0)
    : stations;

  return (
    <View style={styles.container}>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        {outCount > 0 && (
          <View style={[styles.summaryPill, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <XCircle size={13} color="#dc2626" />
            <Text style={[styles.summaryText, { color: '#dc2626' }]}>{outCount} out of stock</Text>
          </View>
        )}
        {lowCount > 0 && (
          <View style={[styles.summaryPill, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <TriangleAlert size={13} color="#d97706" />
            <Text style={[styles.summaryText, { color: '#d97706' }]}>{lowCount} running low</Text>
          </View>
        )}
        {lowCount === 0 && outCount === 0 && (
          <View style={[styles.summaryPill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <Text style={[styles.summaryText, { color: '#059669' }]}>✓ All stock levels OK</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* "What can we still make?" Card */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.makeableCard}>
          <View style={styles.makeableLeft}>
            <Text style={styles.makeableTitle}>What can we still make?</Text>
            <Text style={styles.makeableSub}>Filter menu by available stock</Text>
          </View>
          <Switch
            value={makeableFilterOn}
            onValueChange={toggleMakeableFilter}
            trackColor={{ false: '#e2d5c8', true: '#db8221' }}
            thumbColor="#ffffff"
          />
        </Animated.View>

        {/* Stations */}
        {visibleStations.map((station, si) => {
          const accent = stationAccent(station.iconKey);
          return (
            <Animated.View
              key={station.id}
              entering={FadeInDown.delay(100 + si * 60).duration(400)}
            >
              {/* Station Header */}
              <View style={styles.stationHeader}>
                {stationIcon(station.iconKey, accent)}
                <Text style={[styles.stationName, { color: '#1c120f' }]}>{station.name}</Text>
              </View>

              {/* Items */}
              <View style={styles.stationCard}>
                {station.items.map((item, ii) => (
                  <React.Fragment key={item.id}>
                    <ItemRow item={item} stationId={station.id} index={ii} />
                    {ii < station.items.length - 1 && <View style={styles.itemDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </Animated.View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fdfaf5' },
  scroll:         { paddingHorizontal: 16, paddingBottom: 20 },

  summaryBar:     { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8, flexWrap: 'wrap' },
  summaryPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  summaryText:    { fontFamily: 'LexendSemiBold', fontSize: 12 },

  makeableCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1.5, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  makeableLeft:   { flex: 1, marginRight: 12 },
  makeableTitle:  { fontFamily: 'LexendBold', fontSize: 15, color: '#db8221', marginBottom: 3 },
  makeableSub:    { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465' },

  stationHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 },
  stationName:    { fontFamily: 'LexendBold', fontSize: 17 },

  stationCard:    { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 4, marginBottom: 20, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  itemDivider:    { height: 1, backgroundColor: '#f4ebe1', marginHorizontal: 16 },

  itemRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  dot:            { width: 12, height: 12, borderRadius: 6 },
  itemInfo:       { flex: 1 },
  itemName:       { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  itemQty:        { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465' },
  itemQtyBold:    { fontFamily: 'LexendBold', color: '#1c120f' },

  flagLowBtn:     { alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fdfaf5', borderWidth: 1, borderColor: '#e2d5c8', minWidth: 62 },
  flagLowBtnText: { fontFamily: 'LexendSemiBold', fontSize: 11, color: '#8a7465', textAlign: 'center' },

  flagOutBtn:     { alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fffbeb', borderWidth: 1.5, borderColor: '#f59e0b', minWidth: 62 },
  flagOutBtnText: { fontFamily: 'LexendBold', fontSize: 11, color: '#d97706', textAlign: 'center' },

  outBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fca5a5', minWidth: 70 },
  outBadgeText:   { fontFamily: 'LexendBold', fontSize: 11, color: '#dc2626' },

  restockTap:     { padding: 8 },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#fdfaf5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 },
  sheetHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle:     { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  closeBtn:       { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 16 },
  sheetItem:      { fontFamily: 'LexendSemiBold', fontSize: 16, color: '#db8221', marginBottom: 20 },
  sheetLabel:     { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', marginBottom: 8 },
  input:          { height: 52, borderWidth: 1.5, borderColor: '#f0e6d8', borderRadius: 14, paddingHorizontal: 16, fontFamily: 'LexendBold', fontSize: 22, color: '#1c120f', marginBottom: 20, backgroundColor: '#fff' },
  confirmBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#db8221', borderRadius: 14, paddingVertical: 16 },
  confirmBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#fff' },
});
