import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Building2, MapPin, Phone, Mail, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';

export default function RestaurantProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('restaurant_profile')
          .select('*')
          .limit(1)
          .single();
        
        if (data && !error) {
          setName(data.name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name || !address) {
      showToast('Name and Address are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // First try to check if a row exists
      const { data: existing } = await supabase.from('restaurant_profile').select('id').limit(1).single();

      if (existing?.id) {
        // Update
        const { error } = await supabase
          .from('restaurant_profile')
          .update({ name, address, phone, email })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('restaurant_profile')
          .insert([{ name, address, phone, email }]);
        if (error) throw error;
      }

      showToast('Restaurant Profile successfully updated!', 'success');
    } catch (err) {
      console.error('Update failed:', err);
      showToast('Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#db8221" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom }]}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        
        {toastMessage && (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={[styles.toastContainer, { bottom: insets.bottom + 20, backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#10b981' }]}>
            {toastMessage.type === 'error' ? <ShieldAlert size={20} color="#fff" /> : <ShieldCheck size={20} color="#fff" />}
            <Text style={styles.toastText}>{toastMessage.text}</Text>
          </Animated.View>
        )}
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1c120f" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerSub}>ADMINISTRATION</Text>
            <Text style={styles.headerTitle}>Restaurant Profile</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <View style={styles.formCard}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Restaurant Name</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={20} color="#b89f8d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Crown Bites"
                    placeholderTextColor="#d6c6b8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Physical Address</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={20} color="#b89f8d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="e.g. 123 Main St"
                    placeholderTextColor="#d6c6b8"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color="#b89f8d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="e.g. (555) 123-4567"
                    placeholderTextColor="#d6c6b8"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Support Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#b89f8d" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. support@crownbites.com"
                    placeholderTextColor="#d6c6b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]} 
                onPress={handleSave} 
                disabled={isSaving}
                activeOpacity={0.9}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  </>
                )}
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
  
  toastContainer: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, zIndex: 100 },
  toastText: { fontFamily: 'LexendSemiBold', fontSize: 14, color: '#fff', marginLeft: 10 },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },

  formCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#f0e6d8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontFamily: 'LexendSemiBold', fontSize: 13, color: '#8a7465', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdfaf5', borderWidth: 1, borderColor: '#e8ddd4', borderRadius: 12, height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f' },
  
  saveBtn: { flexDirection: 'row', backgroundColor: '#1c120f', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontFamily: 'LexendBold', fontSize: 16, color: '#ffffff' },
});
