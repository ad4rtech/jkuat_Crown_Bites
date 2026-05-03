import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Search, X, Printer, MessageCircle, Mail, ChevronRight,
  FileText, CheckCircle2,
} from 'lucide-react-native';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import { useFocusEffect } from 'expo-router';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tableLabel(id: string): string {
  return `Table ${id.replace(/\D/g, '')}`;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  return isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString()}, ${timeStr}`;
}

function trxRef(id: string): string {
  return `#TRX-${id.replace(/\D/g, '').slice(-3).padStart(3, '0')}`;
}

function getMethodColor(method?: string): string {
  const m = method?.toLowerCase() || '';
  if (m.includes('cash')) return '#15803d';
  if (m.includes('pesa')) return '#b45309';
  if (m.includes('card')) return '#1d4ed8';
  return '#15803d';
}

// ─── Latest Transaction Card ──────────────────────────────────────────────────
function LatestCard({ order, isReprinted, onPrint, onWhatsApp, onEmail }: {
  order: ActiveOrderWithItems;
  isReprinted: boolean;
  onPrint: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
}) {
  const method = order.payment_method || 'Cash';
  const orderNum = order.id.slice(-4).toUpperCase();
  
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(400)} style={lc.card}>
      <View style={lc.titleRow}>
        <Text style={lc.title}>
          {tableLabel(order.table_id)}  •  Order #{orderNum}
        </Text>
        <Text style={lc.amount}>KES {order.total_amount.toLocaleString()}</Text>
      </View>
      <Text style={lc.sub}>
        {formatDateTime(order.created_at)}  •  Cashier: Staff
      </Text>

      <View style={lc.badgeRow}>
        <View style={lc.paidBadge}>
          <CheckCircle2 size={12} color="#15803d" />
          <Text style={lc.paidText}>
            PAID  •  {method.toUpperCase()}
          </Text>
        </View>
        {isReprinted && (
          <View style={lc.reprintedBadge}>
            <Text style={lc.reprintedText}>REPRINTED</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={lc.printBtn} onPress={onPrint} activeOpacity={0.88}>
        <Printer size={18} color="#fff" />
        <Text style={lc.printBtnText}>Print Receipt</Text>
      </TouchableOpacity>

      <View style={lc.shareRow}>
        <TouchableOpacity style={lc.shareBtn} onPress={onWhatsApp} activeOpacity={0.8}>
          <MessageCircle size={16} color="#1c120f" />
          <Text style={lc.shareBtnText}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={lc.shareBtn} onPress={onEmail} activeOpacity={0.8}>
          <Mail size={16} color="#1c120f" />
          <Text style={lc.shareBtnText}>Email</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
const lc = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', flex: 1, marginRight: 8 },
  amount: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  sub: { fontFamily: 'Lexend', fontSize: 12, color: '#8a7465', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  paidText: { fontFamily: 'LexendBold', fontSize: 11, color: '#15803d' },
  reprintedBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  reprintedText: { fontFamily: 'LexendBold', fontSize: 11, color: '#64748b' },
  printBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#db8221', borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  printBtnText: { fontFamily: 'LexendBold', fontSize: 15, color: '#fff' },
  shareRow: { flexDirection: 'row', gap: 12 },
  shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f4ebe1', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#e8ddd4' },
  shareBtnText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#1c120f' },
});

// ─── History Row ──────────────────────────────────────────────────────────────
function HistoryRow({ order, isReprinted, onPress, index }: {
  order: ActiveOrderWithItems;
  isReprinted: boolean;
  onPress: () => void;
  index: number;
}) {
  const method = order.payment_method || 'Cash';
  const orderNum = order.id.slice(-4).toUpperCase();
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(350)}>
      <TouchableOpacity style={hr.row} onPress={onPress} activeOpacity={0.8}>
        <View style={hr.left}>
          <Text style={hr.title}>
            {tableLabel(order.table_id)}  •  Order #{orderNum}
          </Text>
          <Text style={hr.sub}>
            {formatDateTime(order.created_at)}  •  {method}  •  {trxRef(order.id)}
          </Text>
        </View>
        <View style={hr.right}>
          {isReprinted && (
            <View style={hr.reprintedBadge}>
              <Text style={hr.reprintedText}>REPRINTED</Text>
            </View>
          )}
          <Text style={hr.amount}>KES {order.total_amount.toLocaleString()}</Text>
          <ChevronRight size={18} color="#b89f8d" />
        </View>
      </TouchableOpacity>
      <View style={hr.divider} />
    </Animated.View>
  );
}
const hr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 10 },
  left: { flex: 1 },
  title: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#1c120f', marginBottom: 4 },
  sub: { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amount: { fontFamily: 'LexendBold', fontSize: 14, color: '#1c120f' },
  reprintedBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  reprintedText: { fontFamily: 'LexendBold', fontSize: 9, color: '#64748b' },
  divider: { height: 1, backgroundColor: '#f4ebe1' },
});

// ─── Receipt Detail Modal (shown when tapping a history row) ──────────────────

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReceiptsHistory() {
  const { paidOrders, fetchPaidOrders } = useOrderStore();
  const [query, setQuery] = useState('');
  const [reprintedIds, setReprintedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPaidOrders('Today').finally(() => setLoading(false));
    }, [])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return paidOrders;
    return paidOrders.filter(o =>
      tableLabel(o.table_id).toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      trxRef(o.id).toLowerCase().includes(q)
    );
  }, [paidOrders, query]);

  const latest = filtered[0] ?? null;
  const history = filtered.slice(1);

  const [modalType, setModalType] = useState<'summary' | 'feature_not_installed' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ActiveOrderWithItems | null>(null);
  const [featureName, setFeatureName] = useState<string>('');

  const handlePrint = (order: ActiveOrderWithItems) => {
    if (!reprintedIds.includes(order.id)) {
      setReprintedIds(prev => [...prev, order.id]);
    }
    setSelectedOrder(order);
    setModalType('summary');
    setFeatureName('Print');
  };

  const handleWhatsApp = (order: ActiveOrderWithItems) => {
    setSelectedOrder(order);
    setModalType('summary');
    setFeatureName('WhatsApp');
  };

  const handleEmail = (order: ActiveOrderWithItems) => {
    setSelectedOrder(order);
    setModalType('summary');
    setFeatureName('Email');
  };

  const handleHistoryTap = (order: ActiveOrderWithItems) => {
    setSelectedOrder(order);
    setModalType('summary');
    setFeatureName('Print');
  };

  const executeAction = () => {
    setModalType('feature_not_installed');
    setTimeout(() => {
      setModalType(null);
      setSelectedOrder(null);
    }, 2500);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf5ef' }}>
        <ActivityIndicator size="large" color="#db8221" />
      </View>
    );
  }

  return (
    <>
      {/* Custom Modals */}
      <Modal visible={modalType === 'summary'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalType(null)}>
                <X size={20} color="#1c120f" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              {selectedOrder && (
                <View style={styles.receiptPaper}>
                  <Text style={styles.receiptBrand}>CROWN BITES RESTAURANT</Text>
                  <View style={styles.receiptDivider} />
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>{tableLabel(selectedOrder.table_id)}</Text>
                    <Text style={styles.receiptLabel}>#{selectedOrder.id.slice(-4).toUpperCase()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date:</Text>
                    <Text style={styles.receiptValue}>{formatDateTime(selectedOrder.created_at)}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Cashier:</Text>
                    <Text style={styles.receiptValue}>Staff</Text>
                  </View>

                  <View style={styles.receiptDividerDashed} />

                  {selectedOrder.items.map((item, idx) => (
                    <View key={idx} style={styles.receiptItemRow}>
                      <Text style={styles.receiptItemQty}>{item.qty}x</Text>
                      <Text style={styles.receiptItemName}>{item.name}</Text>
                      <Text style={styles.receiptItemTotal}>{(item.qty * item.unit_price).toLocaleString()}</Text>
                    </View>
                  ))}

                  <View style={styles.receiptDividerDashed} />
                  
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotalLabel}>TOTAL</Text>
                    <Text style={styles.receiptTotalValue}>KES {selectedOrder.total_amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Method:</Text>
                    <Text style={styles.receiptValue}>{selectedOrder.payment_method || 'Cash'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Ref:</Text>
                    <Text style={styles.receiptValue}>{trxRef(selectedOrder.id)}</Text>
                  </View>

                  <View style={styles.receiptDivider} />
                  <Text style={styles.receiptFooter}>Thank you for dining with us!</Text>
                </View>
              )}
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalActionBtn} onPress={executeAction}>
                <Text style={styles.modalActionText}>Confirm {featureName}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'feature_not_installed'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastIconBox}>
              {featureName === 'WhatsApp' ? <MessageCircle size={24} color="#059669" /> : 
               featureName === 'Email' ? <Mail size={24} color="#059669" /> : 
               <CheckCircle2 size={24} color="#059669" />}
            </View>
            <Text style={styles.toastTitle}>{featureName} Pending</Text>
            <Text style={styles.toastDesc}>
              {featureName === 'WhatsApp' ? 'WhatsApp receipt integration is currently unavailable.' : 
               featureName === 'Email' ? 'Email delivery system is not yet configured.' : 
               `${featureName} feature yet to be installed.`}
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

      {/* Search bar */}
      <Animated.View entering={FadeIn.duration(350)} style={styles.searchBar}>
        <Search size={16} color="#8a7465" />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search table or order #..."
          placeholderTextColor="#c4a882"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={16} color="#8a7465" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {filtered.length === 0 ? (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
          <FileText size={40} color="#e2d5c8" />
          <Text style={styles.emptyTitle}>No Receipts Found</Text>
          <Text style={styles.emptySub}>
            {query ? 'Try a different search term.' : 'Receipts appear here after payment is processed.'}
          </Text>
        </Animated.View>
      ) : (
        <>
          {/* Latest Transaction */}
          {latest && (
            <>
              <Animated.View entering={FadeInDown.delay(40).duration(380)}>
                <Text style={styles.sectionTitle}>Latest Transaction</Text>
              </Animated.View>
              <LatestCard
                order={latest}
                isReprinted={reprintedIds.includes(latest.id)}
                onPrint={() => handlePrint(latest)}
                onWhatsApp={() => handleWhatsApp(latest)}
                onEmail={() => handleEmail(latest)}
              />
            </>
          )}

          {/* Receipt History */}
          {history.length > 0 && (
            <>
              <Animated.View entering={FadeInDown.delay(80).duration(380)}>
                <Text style={styles.sectionTitle}>Receipt History</Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(100).duration(380)} style={styles.historyCard}>
                {history.map((order, i) => (
                  <HistoryRow
                    key={order.id}
                    order={order}
                    isReprinted={reprintedIds.includes(order.id)}
                    onPress={() => handleHistoryTap(order)}
                    index={i}
                  />
                ))}
              </Animated.View>
            </>
          )}
        </>
      )}

      <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf5ef' },
  scroll: { padding: 16, paddingBottom: 100 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 22, borderWidth: 1, borderColor: '#f0e6d8', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  searchInput: { flex: 1, fontFamily: 'Lexend', fontSize: 14, color: '#1c120f', padding: 0 },

  historyTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f', marginBottom: 12 },
  sectionTitle: { fontFamily: 'LexendBold', fontSize: 17, color: '#1c120f', marginBottom: 12 },
  historyCard: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, overflow: 'hidden' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(28,18,15,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0e6d8', backgroundColor: '#fdfaf5' },
  modalTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  modalContent: { padding: 24, backgroundColor: '#ffffff' },
  
  // Custom Receipt Design
  receiptPaper: { backgroundColor: '#faf5ef', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd4' },
  receiptBrand: { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f', textAlign: 'center', marginBottom: 12, letterSpacing: 1 },
  receiptDivider: { height: 1, backgroundColor: '#c4a882', marginVertical: 12 },
  receiptDividerDashed: { height: 1, borderWidth: 1, borderColor: '#c4a882', borderStyle: 'dashed', marginVertical: 12, borderRadius: 1 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  receiptLabel: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#705f55' },
  receiptValue: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#1c120f' },
  receiptItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  receiptItemQty: { fontFamily: 'LexendBold', fontSize: 13, color: '#1c120f', width: 28 },
  receiptItemName: { flex: 1, fontFamily: 'LexendSemiBold', fontSize: 13, color: '#1c120f' },
  receiptItemTotal: { fontFamily: 'LexendBold', fontSize: 13, color: '#1c120f', width: 70, textAlign: 'right' },
  receiptTotalLabel: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f' },
  receiptTotalValue: { fontFamily: 'LexendBold', fontSize: 16, color: '#1c120f' },
  receiptFooter: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', textAlign: 'center', marginTop: 4, fontStyle: 'italic' },
  
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f0e6d8', backgroundColor: '#fdfaf5' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f4ebe1', alignItems: 'center', marginRight: 10 },
  modalCancelText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#8a7465' },
  modalActionBtn: { flex: 1.2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#db8221', alignItems: 'center', marginLeft: 10 },
  modalActionText: { fontFamily: 'LexendBold', fontSize: 14, color: '#ffffff' },
  
  toastCard: { width: '100%', maxWidth: 320, backgroundColor: '#ffffff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  toastIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  toastTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f', marginBottom: 8, textAlign: 'center' },
  toastDesc: { fontFamily: 'Lexend', fontSize: 14, color: '#705f55', textAlign: 'center', lineHeight: 22 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  emptySub: { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', textAlign: 'center', lineHeight: 20 },
});
