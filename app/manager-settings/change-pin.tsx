import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, ShieldCheck, ShieldAlert, KeyRound, Briefcase, Coffee, ChefHat, CreditCard, AlertTriangle } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, SlideInDown, SlideOutDown, ZoomIn } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

const ROLES = [
  { id: 'manager', title: 'Manager', icon: Briefcase },
  { id: 'waiter', title: 'Waitstaff', icon: Coffee },
  { id: 'kitchen', title: 'Kitchen Staff', icon: ChefHat },
  { id: 'cashier', title: 'Cashier', icon: CreditCard },
];

export default function ChangePinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Custom Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAttemptUpdate = () => {
    if (newPin.length !== 4) {
      showToast('PIN must be exactly 4 digits.', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      showToast('PINs do not match.', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeUpdate = async () => {
    setShowConfirmModal(false);
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('role_auth')
        .update({ pin: newPin })
        .eq('role', selectedRole.id);

      if (error) throw error;
      
      showToast(`Successfully updated ${selectedRole.title} PIN!`, 'success');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      console.error('Update failed:', err);
      showToast('Failed to update PIN. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        
        {/* Custom Central Toast / Modal for Confirmation */}
        <Modal visible={showConfirmModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View entering={ZoomIn.duration(300)} style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <AlertTriangle size={32} color="#f59e0b" />
              </View>
              <Text style={styles.modalTitle}>Confirm Update</Text>
              <Text style={styles.modalDesc}>
                Are you sure you want to securely change the login PIN for {selectedRole.title}? This will instantly log out affected devices.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowConfirmModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={executeUpdate}>
                  <Text style={styles.modalConfirmText}>Update PIN</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Action Toast Notification */}
        {toastMessage && (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.toastContainer, { bottom: insets.bottom + 20, backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#10b981' }]}>
            {toastMessage.type === 'error' ? <ShieldAlert size={20} color="#fff" /> : <ShieldCheck size={20} color="#fff" />}
            <Text style={styles.toastText}>{toastMessage.text}</Text>
          </Animated.View>
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1c120f" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerSub}>ADMINISTRATION</Text>
            <Text style={styles.headerTitle}>Access Control</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.infoBanner}>
              <ShieldCheck size={24} color="#059669" />
              <View style={styles.infoBannerText}>
                <Text style={styles.infoBannerTitle}>Role PIN Management</Text>
                <Text style={styles.infoBannerDesc}>Manage and update secure PINs for all staff roles. Ensure changes are communicated.</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Text style={styles.sectionTitle}>SELECT ROLE TO UPDATE</Text>
            
            <View style={styles.rolesGrid}>
              {ROLES.map(role => {
                const isActive = selectedRole.id === role.id;
                const Icon = role.icon;
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[styles.roleCard, isActive && styles.roleCardActive]}
                    onPress={() => setSelectedRole(role)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.roleIconWrap, isActive && styles.roleIconWrapActive]}>
                      <Icon size={24} color={isActive ? "#fff" : "#db8221"} />
                    </View>
                    <Text style={[styles.roleCardText, isActive && styles.roleCardTextActive]}>{role.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <KeyRound size={20} color="#1c120f" />
                <Text style={styles.formTitle}>Change PIN for {selectedRole.title}</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New 4-Digit PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5678"
                  placeholderTextColor="#b89f8d"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={newPin}
                  onChangeText={setNewPin}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New PIN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter PIN"
                  placeholderTextColor="#b89f8d"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, (newPin.length !== 4 || confirmPin.length !== 4) && styles.saveBtnDisabled]} 
                onPress={handleAttemptUpdate}
                disabled={newPin.length !== 4 || confirmPin.length !== 4 || isUpdating}
                activeOpacity={0.9}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Lock size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Update PIN</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 180 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfaf5' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  headerSub: { fontFamily: 'LexendSemiBold', fontSize: 10, color: '#db8221', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  
  toastContainer: { position: 'absolute', alignSelf: 'center', padding: 16, borderRadius: 100, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 100, paddingHorizontal: 24 },
  toastText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#ffffff', marginLeft: 12 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontFamily: 'Lexend', fontSize: 14, color: '#705f55', textAlign: 'center', lineHeight: 22, marginBottom: 24, paddingHorizontal: 10 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#f4ebe1', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#8a7465' },
  modalConfirmBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  modalConfirmText: { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#ffffff' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  infoBanner: { flexDirection: 'row', backgroundColor: '#ecfdf5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0', marginBottom: 28, alignItems: 'center' },
  infoBannerText: { marginLeft: 14, flex: 1 },
  infoBannerTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#065f46', marginBottom: 2 },
  infoBannerDesc: { fontFamily: 'Lexend', fontSize: 13, color: '#047857', lineHeight: 18 },

  sectionTitle: { fontFamily: 'LexendBold', fontSize: 12, color: '#8a7465', letterSpacing: 1, marginBottom: 16 },
  
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  roleCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0e6d8', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  roleCardActive: { borderColor: '#db8221', backgroundColor: '#fffbf7' },
  roleIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  roleIconWrapActive: { backgroundColor: '#db8221' },
  roleCardText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#705f55' },
  roleCardTextActive: { color: '#1c120f' },

  formCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
  formTitle: { fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', marginBottom: 8 },
  input: { backgroundColor: '#fdfaf5', borderWidth: 1, borderColor: '#e8ddd4', borderRadius: 12, height: 56, paddingHorizontal: 16, fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f', letterSpacing: 4 },
  
  saveBtn: { flexDirection: 'row', backgroundColor: '#1c120f', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#ffffff' },
});
