import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Percent, Receipt } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { useBillingConfigStore, FIXED_VAT_RATE } from '../../store/billingConfigStore';

export default function TaxSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { serviceChargeRate, updateServiceCharge } = useBillingConfigStore();
  const [serviceCharge, setServiceCharge] = useState(
    Math.round(serviceChargeRate * 100).toString()
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = () => {
    const parsed = parseFloat(serviceCharge);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      updateServiceCharge(parsed / 100);
      setToastMessage('Service charge updated successfully.');
    } else {
      setToastMessage('Please enter a valid percentage (0–100).');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        
        {toastMessage && (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.toastContainer, { bottom: insets.bottom + 20 }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1c120f" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerSub}>ADMINISTRATION</Text>
            <Text style={styles.headerTitle}>Tax & Service</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.infoBanner}>
              <Receipt size={24} color="#db8221" />
              <View style={styles.infoBannerText}>
                <Text style={styles.infoBannerTitle}>Billing Configuration</Text>
                <Text style={styles.infoBannerDesc}>Set the default VAT and Service Charge percentages applied to all bills.</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View style={styles.formCard}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Value Added Tax (VAT) %</Text>
                <View style={[styles.inputWrapper, { backgroundColor: '#f0ebe4' }]}>
                  <Percent size={20} color="#b89f8d" style={styles.inputIcon} />
                  <Text style={[styles.input, { color: '#8a7465' }]}>
                    {Math.round(FIXED_VAT_RATE * 100)}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Lexend', fontSize: 11, color: '#db8221', marginTop: 6 }}>
                  VAT is fixed at 16% as per statutory requirements and cannot be changed.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service Charge %</Text>
                <View style={styles.inputWrapper}>
                  <Percent size={20} color="#b89f8d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={serviceCharge}
                    onChangeText={setServiceCharge}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.9}>
                <Save size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

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
  
  toastContainer: { position: 'absolute', alignSelf: 'center', backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, zIndex: 100 },
  toastText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#fff' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  infoBanner: { flexDirection: 'row', backgroundColor: '#fffbf7', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f0e6d8', marginBottom: 28, alignItems: 'center' },
  infoBannerText: { marginLeft: 14, flex: 1 },
  infoBannerTitle: { fontFamily: 'LexendBold', fontSize: 15, color: '#1c120f', marginBottom: 2 },
  infoBannerDesc: { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', lineHeight: 18 },

  formCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  
  inputGroup: { marginBottom: 24 },
  inputLabel: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfaf5', borderWidth: 1, borderColor: '#e8ddd4', borderRadius: 12, height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: 'LexendBold', fontSize: 18, color: '#1c120f' },
  
  saveBtn: { flexDirection: 'row', backgroundColor: '#db8221', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#ffffff' },
});
