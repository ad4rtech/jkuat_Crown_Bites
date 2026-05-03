import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, ActivityIndicator, FlatList, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Armchair, Printer, Banknote, CheckCircle2, Smartphone, Clock, Receipt, Trash2 } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, Layout, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { useOrderStore, ActiveOrderWithItems } from '../../store/orderStore';
import { useTableStore } from '../../store/tableStore';
import dayjs from 'dayjs';
import { useBillingConfigStore, computeBill } from '../../store/billingConfigStore';
import { useReportsStore } from '../../store/reportsStore';
import CenterToast, { useToast } from '../../components/CenterToast';

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { activeOrders, paidOrders, cashRequestedOrders, markPaid, fetchActiveOrders, fetchPaidOrders, hiddenOrderIds, clearPaidOrders, requestCashPayment } = useOrderStore();
  const { resetTable, setTableEating } = useTableStore();
  const { serviceChargeRate, serviceChargeEnabled } = useBillingConfigStore();
  const { recordDiscount } = useReportsStore();

  const [selectedOrder, setSelectedOrder] = useState<ActiveOrderWithItems | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'paid' | 'failed' | 'timeout'>('idle');
  const [animationKey, setAnimationKey] = useState(0);
  const [dateFilter, setDateFilter] = useState<'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'All'>('Today');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [mpesaFlow, setMpesaFlow] = useState<'none' | 'choose' | 'paybill'>('none');
  const [customerPhone, setCustomerPhone] = useState('');

  const { toast, show: showToast } = useToast();

  // Fetch active orders on focus so the list is fresh
  useFocusEffect(
    useCallback(() => {
      fetchActiveOrders();
      fetchPaidOrders(dateFilter);
      setAnimationKey(prev => prev + 1);
    }, [dateFilter])
  );

  // Reset status when modal closes
  useEffect(() => {
    if (!showPaymentModal) {
      setPaymentStatus('idle');
    }
  }, [showPaymentModal]);

  const handleMpesaPrompt = () => {
    setMpesaFlow('choose');
  };

  const handlePaybillPaid = async () => {
    if (!selectedOrder) return;
    
    const orderId = selectedOrder.id;
    const tableId = selectedOrder.table_id;
    setShowPaymentModal(false);
    setMpesaFlow('none');
    setSelectedOrder(null);
    
    try {
      await supabase.from('orders').update({
        payment_status: 'paid',
        payment_method: 'M-Pesa (Paybill)'
        // Removed status: 'Served' so it stays in Kitchen/Waiter queue for food prep
      }).eq('id', orderId);

      // Free up the table
      await setTableEating(tableId);
      
      showToast('Marked as paid via Paybill', 'success');
      fetchActiveOrders();
      fetchPaidOrders(dateFilter);
    } catch (err) {
      console.error(err);
      showToast('Failed to mark as paid', 'error');
    }
  };

  const submitMpesaPayment = async () => {
    if (!selectedOrder) return;
    if (!customerPhone || customerPhone.length < 9) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('pending');

    const rawSubtotal = selectedOrder.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
    const { grandTotal, autoDiscount } = computeBill(rawSubtotal, serviceChargeRate, serviceChargeEnabled);

    // 1. Trigger STK push
    try {
      const { data, error } = await supabase.functions.invoke('stk-push', {
        body: {
          phone: customerPhone,
          amount: grandTotal,
          orderId: selectedOrder.id,
          tableId: selectedOrder.table_id
        }
      });

      if (error) throw error;
      
      if (autoDiscount > 0) {
        recordDiscount(
          `Auto 10% Loyalty Discount — Table ${selectedOrder.table_id}`,
          autoDiscount,
          'Bill exceeded KES 1,000',
          'Waiter',
          selectedOrder.id,
          selectedOrder.table_id
        );
      }

      if (data && data.CheckoutRequestID) {
        await supabase
          .from('orders')
          .update({ checkout_request_id: data.CheckoutRequestID })
          .eq('id', selectedOrder.id);
      }
      
      showToast('STK Push sent! Waiting for customer to enter PIN...', 'success');
      setShowPhoneInput(false);
      setCustomerPhone('');
      
    } catch (err: any) {
      console.error(err);
      setPaymentStatus('failed');
      setIsProcessing(false);
      showToast('Failed to initiate M-Pesa payment.', 'error');
      return;
    }

    // 2. Start polling every 5 seconds for up to 60 seconds
    let attempts = 0;
    const maxAttempts = 12; // 12 × 5s = 60s
    const orderIdToPoll = selectedOrder.id;

    const poll = setInterval(async () => {
      attempts++;

      const { data, error } = await supabase
        .from('orders')
        .select('payment_status, mpesa_receipt')
        .eq('id', orderIdToPoll)
        .single();

      if (error) {
        console.error('Poll error:', error);
        return;
      }

      console.log(`🔄 Poll #${attempts}: status = ${data.payment_status}`);

      if (data.payment_status === 'paid') {
        clearInterval(poll);
        setPaymentStatus('paid');
        showToast('Payment successful!', 'success');
        
        // Free up the table since the bill is fully settled
        await setTableEating(selectedOrder.table_id);
        
        // Force the global store to refresh since Realtime might be disabled
        fetchActiveOrders();
        fetchPaidOrders(dateFilter);
        
        // Auto close after 2 seconds
        setTimeout(() => {
          setShowPaymentModal(false);
          setIsProcessing(false);
          setSelectedOrder(null);
        }, 2000);

      } else if (data.payment_status === 'failed') {
        clearInterval(poll);
        setPaymentStatus('failed');
        setIsProcessing(false);
        showToast('Payment Incomplete: Wrong PIN or cancelled.', 'error');
        
        // Reset DB so they can try again
        await supabase.from('orders').update({ payment_status: 'unpaid' }).eq('id', orderIdToPoll);

      } else if (attempts >= maxAttempts) {
        // 60 seconds passed, no payment received
        clearInterval(poll);
        setPaymentStatus('timeout');
        setIsProcessing(false);
        showToast('Request Timed Out: No response received.', 'error');

        // Reset DB so they can try again
        await supabase.from('orders').update({ payment_status: 'unpaid' }).eq('id', orderIdToPoll);
      }
    }, 5000);
  };

  const handleCashPrompt = () => {
    if (!selectedOrder) return;
    requestCashPayment(selectedOrder.id);
    setShowPaymentModal(false);
    setShowPhoneInput(false);
    setSelectedOrder(null);
    showToast('Please proceed to the cashier to make the payment.');
  };

  const renderTableCard = ({ item, index }: { item: ActiveOrderWithItems; index: number }) => {
    const isPaid = item.payment_status === 'paid';
    const isCashRequested = cashRequestedOrders.includes(item.id);

    const rawSubtotal = item.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
    const { grandTotal } = computeBill(rawSubtotal, serviceChargeRate, serviceChargeEnabled);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100)} layout={Layout.springify()}>
        <TouchableOpacity 
          style={[styles.tableCard, (isPaid || isCashRequested) && styles.tableCardPaid]} 
          onPress={() => {
            if (isCashRequested) {
              showToast('Please proceed to the cashier to make the cash payment.');
            } else {
              setSelectedOrder(item);
            }
          }}
          activeOpacity={isCashRequested ? 1 : 0.8}
        >
          <View style={styles.tableCardHeader}>
            <View style={styles.tableCardLeft}>
              <Armchair size={24} color={isPaid ? "#10b981" : isCashRequested ? "#3b82f6" : "#705f55"} />
              <View style={styles.tableCardInfo}>
                <Text style={styles.tableCardTitle}>Table {item.table_id}</Text>
                <Text style={styles.tableCardTime}>{dayjs(item.created_at).format('hh:mm A')}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, isPaid ? styles.statusBadgePaid : isCashRequested ? { backgroundColor: '#eff6ff' } : styles.statusBadgePending]}>
              {isPaid ? <CheckCircle2 size={16} color="#10b981" /> : isCashRequested ? <Clock size={16} color="#3b82f6" /> : <Clock size={16} color="#f59e0b" />}
              <Text style={[styles.statusBadgeText, { color: isPaid ? '#10b981' : isCashRequested ? '#3b82f6' : '#f59e0b' }]}>
                {isPaid ? 'Paid' : isCashRequested ? 'Awaiting Cashier' : 'Pending'}
              </Text>
            </View>
          </View>
          
          <View style={styles.tableCardFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Receipt size={16} color="#705f55" />
              <Text style={styles.tableCardItems}>{item.items.reduce((sum, i) => sum + i.qty, 0)} Items</Text>
            </View>
            <Text style={styles.tableCardAmount}>Ksh {Math.max(0, grandTotal).toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderOverlays = () => (
    <>
      {/* Clear History Custom Modal */}
      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View style={styles.modalOverlayCentered}>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.modalCard}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#fee2e2' }]}>
              <Trash2 size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Clear History?</Text>
            <Text style={styles.modalDesc}>
              This will clear all currently visible paid order records from your screen. They will still be preserved in the database.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowClearModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.payBtn, { backgroundColor: '#ef4444' }]} 
                onPress={() => {
                  clearPaidOrders();
                  setShowClearModal(false);
                  showToast('History cleared');
                }}
              >
                <Text style={styles.payBtnText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );

  if (!selectedOrder) {
    // ─── LIST VIEW ─────────────────────────────────────────────────────────────
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1c120f" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Billing Overview</Text>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: '#fee2e2' }]} 
            onPress={() => {
              const visibleOrders = paidOrders.filter(o => !hiddenOrderIds.includes(o.id));
              if (visibleOrders.length === 0) {
                showToast('No visible bills to clear');
                return;
              }
              setShowClearModal(true);
            }}
          >
            <Trash2 size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Date Filter Toggle */}
        <View style={styles.filterWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContainer}
          >
            {['Today', 'Yesterday', 'This Week', 'This Month', 'All'].map((f) => (
              <TouchableOpacity 
                key={f}
                style={[styles.filterTab, dateFilter === f && styles.filterTabActive]}
                onPress={() => setDateFilter(f as any)}
              >
                <Text style={[styles.filterText, dateFilter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          key={animationKey}
          data={[...activeOrders, ...paidOrders.filter(o => !hiddenOrderIds.includes(o.id))]
            .filter((order, index, self) => index === self.findIndex(o => o.id === order.id))
            .sort((a, b) => {
              if (a.payment_status !== b.payment_status) {
                return a.payment_status === 'paid' ? 1 : -1;
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
          }
          keyExtractor={item => item.id}
          renderItem={renderTableCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeIn} style={styles.emptyContainer}>
              <Receipt size={48} color="#f0e6d8" />
              <Text style={styles.emptyText}>No active bills</Text>
            </Animated.View>
          }
        />

        {renderOverlays()}
      </View>
    );
  }

  // ─── DETAILS VIEW ─────────────────────────────────────────────────────────
  const rawSubtotal = selectedOrder.items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);
  const { baseSubtotal, vat, serviceCharge, autoDiscount, grandTotal } = computeBill(
    rawSubtotal, serviceChargeRate, serviceChargeEnabled
  );
  const isCurrentlyPaid = selectedOrder.payment_status === 'paid';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSelectedOrder(null)}>
          <ArrowLeft size={24} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Table Selection */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.tableSelectionContainer}>
          <View style={styles.tableSelectionLeft}>
            <Armchair size={22} color="#1c120f" />
            <Text style={styles.tableSelectionText}>Table Selection</Text>
          </View>
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>Table {selectedOrder.table_id}</Text>
          </View>
        </Animated.View>

        {/* Bill Receipt Card */}
        <Animated.View entering={FadeInDown.delay(200)} layout={Layout.springify()} style={styles.receiptCard}>
          
          <View style={styles.receiptHeader}>
            <Text style={styles.restaurantName}>CROWN BITES</Text>
            <Text style={styles.receiptMeta}>Order #{selectedOrder.id.slice(0, 6).toUpperCase()} • {dayjs(selectedOrder.created_at).format('DD MMM, HH:mm')}</Text>
            {isCurrentlyPaid && (
              <Animated.View entering={FadeInDown} style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>BILL PAID</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.itemsContainer}>
            {selectedOrder.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                  </View>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnitPrice}>@ Ksh {item.unit_price}</Text>
                  </View>
                </View>
                <Text style={styles.itemTotal}>Ksh {item.qty * item.unit_price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Ksh {baseSubtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>VAT 16% (statutory)</Text>
              <Text style={styles.summaryValue}>Ksh {vat.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Charge {Math.round(serviceChargeRate * 100)}%</Text>
              <Text style={styles.summaryValue}>Ksh {serviceCharge.toLocaleString()}</Text>
            </View>
            {autoDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#059669' }]}>Auto-Discount 10% 🎉</Text>
                <Text style={[styles.summaryValue, { color: '#059669' }]}>-Ksh {autoDiscount.toLocaleString()}</Text>
              </View>
            )}
          </View>

          <View style={styles.solidDivider} />

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Ksh {grandTotal.toLocaleString()}</Text>
          </View>
        </Animated.View>

        {/* Padding for bottom buttons */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.printBtn} activeOpacity={0.8}>
          <Printer size={24} color="#1c120f" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settleBtn, isCurrentlyPaid && styles.settleBtnDisabled]}
          onPress={() => setShowPaymentModal(true)}
          activeOpacity={0.8}
          disabled={isCurrentlyPaid}
        >
          <Text style={styles.settleBtnText}>{isCurrentlyPaid ? 'Already Settled' : 'Settle Bill'}</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Method Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutRight.duration(300)} style={styles.modalContent}>
            {mpesaFlow === 'choose' ? (
              <>
                <Text style={styles.modalTitle}>Choose M-Pesa Method</Text>
                
                <TouchableOpacity 
                  style={[styles.paymentMethodBtn, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]} 
                  onPress={() => { setMpesaFlow('none'); setShowPhoneInput(true); }}
                >
                  <Smartphone size={24} color="#10b981" />
                  <View style={styles.paymentMethodTextContainer}>
                    <Text style={styles.paymentMethodTitle}>STK Push</Text>
                    <Text style={styles.paymentMethodDesc}>Prompt customer's phone instantly</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.paymentMethodBtn, { borderColor: '#db8221', backgroundColor: '#fef3c7' }]}
                  onPress={() => setMpesaFlow('paybill')}
                >
                  <Banknote size={24} color="#db8221" />
                  <View style={styles.paymentMethodTextContainer}>
                    <Text style={[styles.paymentMethodTitle, { color: '#db8221' }]}>Manual Paybill</Text>
                    <Text style={[styles.paymentMethodDesc, { color: '#b45309' }]}>Customer pays via Till 5678</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setMpesaFlow('none')}>
                  <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>
              </>
            ) : mpesaFlow === 'paybill' ? (
              <>
                <Text style={styles.modalTitle}>Manual Paybill</Text>
                <View style={{ alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#fdfaf5', borderRadius: 12, borderWidth: 1, borderColor: '#f0e6d8' }}>
                  <Text style={{ fontFamily: 'Lexend', fontSize: 16, color: '#705f55', marginBottom: 8 }}>Till Number</Text>
                  <Text style={{ fontFamily: 'LexendBold', fontSize: 32, color: '#db8221', letterSpacing: 4 }}>5678</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={[styles.cancelBtn, { flex: 1, marginTop: 0 }]} onPress={() => setMpesaFlow('choose')}>
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.payBtn, { flex: 1, backgroundColor: '#10b981', marginTop: 0 }]} 
                    onPress={handlePaybillPaid}
                  >
                    <Text style={styles.payBtnText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : !showPhoneInput ? (
              <>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                
                <TouchableOpacity 
                  style={[styles.paymentMethodBtn, { borderColor: '#10b981', backgroundColor: '#ecfdf5' }]} 
                  onPress={handleMpesaPrompt}
                >
                  <Smartphone size={24} color="#10b981" />
                  <View style={styles.paymentMethodTextContainer}>
                    <Text style={styles.paymentMethodTitle}>M-Pesa</Text>
                    <Text style={styles.paymentMethodDesc}>Paybill or STK Push</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.paymentMethodBtn, { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }]}
                  onPress={handleCashPrompt}
                >
                  <Banknote size={24} color="#3b82f6" />
                  <View style={styles.paymentMethodTextContainer}>
                    <Text style={[styles.paymentMethodTitle, { color: '#3b82f6' }]}>Cash Payment</Text>
                    <Text style={[styles.paymentMethodDesc, { color: '#60a5fa' }]}>Pay at Counter</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPaymentModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Enter M-Pesa Number</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="e.g. 0712345678"
                  keyboardType="phone-pad"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.cancelBtn, { flex: 1, marginTop: 0 }]} onPress={() => setShowPhoneInput(false)}>
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.payBtn, { flex: 1, backgroundColor: '#10b981', marginTop: 0 }]} 
                    onPress={submitMpesaPayment}
                    disabled={isProcessing}
                  >
                    <Text style={styles.payBtnText}>Send Prompt</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>

        {/* Dynamic Status Overlay */}
        {paymentStatus !== 'idle' && (
          <View style={[styles.processingOverlay, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]}>
            <View style={[styles.statusBox, 
              paymentStatus === 'paid' ? { borderColor: '#10b981', backgroundColor: '#f6fdf9' } : 
              paymentStatus === 'failed' ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : 
              paymentStatus === 'timeout' ? { borderColor: '#6b7280', backgroundColor: '#f9fafb' } : 
              { borderColor: '#f59e0b', backgroundColor: '#fffbeb' }
            ]}>
              {paymentStatus === 'pending' && <ActivityIndicator color="#db8221" size="small" />}
              {paymentStatus === 'paid' && <CheckCircle2 color="#10b981" size={28} />}
              {paymentStatus === 'failed' && <CheckCircle2 color="#ef4444" size={28} />}
              {paymentStatus === 'timeout' && <Clock color="#6b7280" size={28} />}
              
              <View style={{ marginLeft: 16 }}>
                <Text style={[styles.statusBoxText, 
                  paymentStatus === 'paid' ? { color: '#10b981' } : 
                  paymentStatus === 'failed' ? { color: '#ef4444' } : 
                  paymentStatus === 'timeout' ? { color: '#6b7280' } : 
                  { color: '#db8221' }
                ]}>
                  {paymentStatus === 'pending' ? 'Waiting for M-Pesa...' : 
                   paymentStatus === 'paid' ? 'Payment Successful!' : 
                   paymentStatus === 'failed' ? 'Payment Failed' : 
                   'Request Timed Out'}
                </Text>
                
                <Text style={[styles.statusBoxSub, 
                  paymentStatus === 'paid' ? { color: '#059669' } : 
                  paymentStatus === 'failed' ? { color: '#b91c1c' } : 
                  paymentStatus === 'timeout' ? { color: '#4b5563' } : 
                  { color: '#b45309' }
                ]}>
                  {paymentStatus === 'pending' ? 'Enter your PIN on your phone' : 
                   paymentStatus === 'paid' ? 'Receipt recorded.' : 
                   paymentStatus === 'failed' ? 'Wrong PIN or cancelled. Try again.' : 
                   'No response received. Please try again.'}
                </Text>
              </View>
            </View>

            {paymentStatus === 'failed' || paymentStatus === 'timeout' ? (
              <TouchableOpacity 
                style={[styles.payBtn, { backgroundColor: '#1c120f', paddingHorizontal: 40, marginTop: 24, flex: 0 }]} 
                onPress={() => { setPaymentStatus('idle'); setIsProcessing(false); }}
              >
                <Text style={styles.payBtnText}>Try Again</Text>
              </TouchableOpacity>
            ) : paymentStatus === 'pending' ? (
              <TouchableOpacity style={{ marginTop: 24 }} onPress={() => { setShowPaymentModal(false); setShowPhoneInput(false); setPaymentStatus('idle'); setIsProcessing(false); }}>
                <Text style={[styles.cancelBtnText, { color: '#705f55' }]}>Close to Background</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </Modal>

      {renderOverlays()}
      <CenterToast {...toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
    paddingTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: '#f4ebe1',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontFamily: 'Lexend',
    fontSize: 18,
    color: '#8a7465',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee6dc',
    borderLeftWidth: 5,
    borderLeftColor: '#db8221', // Orange accent for pending
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tableCardPaid: {
    borderColor: '#d1fae5',
    borderLeftColor: '#10b981', // Green accent for paid
    backgroundColor: '#f6fdf9',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tableCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableCardInfo: {
    marginLeft: 12,
  },
  tableCardTitle: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#1c120f',
  },
  tableCardTime: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#8a7465',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgePending: {
    backgroundColor: '#fef3c7',
  },
  statusBadgePaid: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 13,
  },
  tableCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f0e6d8',
    paddingTop: 12,
  },
  tableCardItems: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#705f55',
  },
  tableCardAmount: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#db8221',
  },
  scrollContent: {
    padding: 20,
  },
  tableSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f0e6d8',
  },
  tableSelectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableSelectionText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 16,
    color: '#1c120f',
  },
  tableBadge: {
    backgroundColor: '#f4ebe1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tableBadgeText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#db8221',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f0e6d8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restaurantName: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
    letterSpacing: 2,
    marginBottom: 8,
  },
  receiptMeta: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#8a7465',
  },
  paidBadge: {
    marginTop: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paidBadgeText: {
    fontFamily: 'LexendBold',
    color: '#ffffff',
    fontSize: 14,
    letterSpacing: 1,
  },
  dashedDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 20,
  },
  itemsContainer: {
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  qtyBadge: {
    width: 28,
    height: 28,
    backgroundColor: '#f4ebe1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#1c120f',
  },
  itemName: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#1c120f',
  },
  itemUnitPrice: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#8a7465',
    marginTop: 2,
  },
  itemTotal: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#1c120f',
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#705f55',
  },
  summaryValue: {
    fontFamily: 'LexendSemiBold',
    fontSize: 14,
    color: '#1c120f',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#1c120f',
  },
  totalAmount: {
    fontFamily: 'LexendBold',
    fontSize: 24,
    color: '#db8221',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#fdfaf5',
    borderTopWidth: 1,
    borderColor: '#f0e6d8',
    gap: 16,
  },
  printBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f0e6d8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settleBtn: {
    flex: 1,
    height: 60,
    backgroundColor: '#db8221',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settleBtnDisabled: {
    backgroundColor: '#f4ebe1',
  },
  settleBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
    marginBottom: 24,
    textAlign: 'center',
  },
  paymentMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    marginBottom: 16,
  },
  paymentMethodTextContainer: {
    marginLeft: 16,
  },
  paymentMethodTitle: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
  },
  paymentMethodDesc: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#705f55',
    marginTop: 4,
  },
  cancelBtn: {
    marginTop: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 16,
    color: '#ef4444',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    width: width - 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusBoxText: {
    fontFamily: 'LexendBold',
    fontSize: 18,
  },
  statusBoxSub: {
    fontFamily: 'Lexend',
    fontSize: 13,
    marginTop: 4,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#e2d5c8',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'LexendSemiBold',
    color: '#1c120f',
    marginBottom: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
    letterSpacing: 1,
  },
  toast: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: '#1c120f', padding: 16, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, zIndex: 1000
  },
  toastText: { color: '#ffffff', fontFamily: 'LexendSemiBold', fontSize: 14, flex: 1 },
  filterWrapper: {
    height: 40,
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f4ebe1',
  },
  filterTabActive: {
    backgroundColor: '#db8221',
  },
  filterText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 12,
    color: '#8a7465',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  modalDesc: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#8a7465',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  payBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#ffffff',
  },
  modalCard: {
    width: width - 40,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
});
