import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Armchair, Printer, CreditCard, CheckCircle2, Smartphone } from 'lucide-react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const RECEIPT_ITEMS = [
  { id: '1', qty: 1, name: 'Classic Cheese Burger', unitPrice: 950, total: 950 },
  { id: '2', qty: 2, name: 'Crispy Fries', unitPrice: 400, total: 800 },
  { id: '3', qty: 3, name: 'Sparkling Water', unitPrice: 250, total: 750 },
  { id: '4', qty: 1, name: 'Chocolate Lava Cake', unitPrice: 650, total: 650 },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const subtotal = 3150;
  const tax = 315;
  const serviceCharge = 158;
  const totalAmount = 3623;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const handleMpesaPrompt = () => {
    setIsProcessing(true);
    // Simulate Daraja API STK Push delay
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      setIsPaid(true);
    }, 2000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
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
            <Text style={styles.tableBadgeText}>Table 03</Text>
          </View>
        </Animated.View>

        {/* Bill Receipt Card */}
        <Animated.View entering={FadeInDown.delay(200)} layout={Layout.springify()} style={styles.receiptCard}>
          
          <View style={styles.receiptHeader}>
            <Text style={styles.restaurantName}>CROWN BITES</Text>
            <Text style={styles.receiptMeta}>Order #1042 • 24 Oct, 19:30</Text>
            {isPaid && (
              <Animated.View entering={FadeInDown} style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>BILL PAID</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.itemsContainer}>
            {RECEIPT_ITEMS.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                  </View>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemUnitPrice}>@ Ksh {item.unitPrice}</Text>
                  </View>
                </View>
                <Text style={styles.itemTotal}>Ksh {item.total}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Ksh {subtotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <Text style={styles.summaryValue}>Ksh {tax}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Charge (5%)</Text>
              <Text style={styles.summaryValue}>Ksh {serviceCharge}</Text>
            </View>
          </View>

          <View style={styles.solidDivider} />

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>Ksh {totalAmount}</Text>
          </View>

        </Animated.View>

      </ScrollView>

      {/* Footer Fixed Actions */}
      <View style={[styles.fixedFooter, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.printBtn}>
          <Printer size={20} color="#2c1e19" style={{ marginRight: 8 }} />
          <Text style={styles.printBtnText}>Print</Text>
        </TouchableOpacity>

        {!isPaid ? (
          <TouchableOpacity style={styles.settleBtn} onPress={() => setShowPaymentModal(true)}>
            <CreditCard size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.settleBtnText}>Settle Ksh {totalAmount}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.settleBtn, styles.settledBtn]}>
            <CheckCircle2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.settleBtnText}>Settled</Text>
          </View>
        )}
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            
            <View style={styles.paymentOption}>
              <View style={styles.paymentOptionHeader}>
                <Smartphone size={24} color="#10b981" />
                <Text style={styles.paymentOptionTitle}>M-Pesa Till</Text>
              </View>
              <Text style={styles.tillNumber}>Till Number: <Text style={{ fontFamily: 'LexendBold', color: '#1c120f' }}>56789</Text></Text>
              
              <TouchableOpacity 
                style={[styles.promptBtn, isProcessing && styles.promptBtnDisabled]} 
                onPress={handleMpesaPrompt}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.promptBtnText}>Send Prompt</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPaymentModal(false)} disabled={isProcessing}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5', // Cream
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Make room for fixed footer
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 24,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4ebe1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
  },
  tableSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4ebe1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
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
    backgroundColor: '#2c1e19',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tableBadgeText: {
    fontFamily: 'LexendBold',
    fontSize: 13,
    color: '#ffffff',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f0e6d8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  restaurantName: {
    fontFamily: 'LexendBold',
    fontSize: 22,
    color: '#2c1e19',
    marginBottom: 4,
    letterSpacing: 1,
  },
  receiptMeta: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#8a7465',
    marginBottom: 8,
  },
  paidBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 8,
  },
  paidBadgeText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#10b981',
    letterSpacing: 1,
  },
  dashedDivider: {
    height: 1,
    backgroundColor: '#f0e6d8',
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#e5d5c5',
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
    gap: 12,
    flex: 1,
  },
  qtyBadge: {
    width: 32,
    height: 32,
    backgroundColor: '#f4ebe1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#2c1e19',
  },
  itemName: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#1c120f',
    marginBottom: 2,
  },
  itemUnitPrice: {
    fontFamily: 'Lexend',
    fontSize: 12,
    color: '#8a7465',
  },
  itemTotal: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#1c120f',
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#8a7465',
  },
  summaryValue: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#705f55',
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
    fontSize: 20,
    color: '#1c120f',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fdfaf5',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0e6d8',
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#f4ebe1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#2c1e19',
  },
  settleBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  settleBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#ffffff',
  },
  settledBtn: {
    backgroundColor: '#2c1e19',
    shadowColor: '#2c1e19',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
    marginBottom: 24,
    textAlign: 'center',
  },
  paymentOption: {
    backgroundColor: '#fdfaf5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f0e6d8',
    marginBottom: 20,
  },
  paymentOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  paymentOptionTitle: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#1c120f',
  },
  tillNumber: {
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#705f55',
    marginBottom: 20,
  },
  promptBtn: {
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptBtnDisabled: {
    opacity: 0.7,
  },
  promptBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#ffffff',
  },
  cancelBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#705f55',
  }
});
