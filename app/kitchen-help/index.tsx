import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, ChevronRight, HeadphonesIcon, ChefHat, Zap, Thermometer, BookOpen, ShieldAlert } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function KitchenHelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const ISSUES = [
    {
      id: 'managing-orders',
      title: 'Managing Orders',
      desc: 'Tap "Track kitchen" to move a Pending order to In Prep. Tap again to mark it Ready for pickup.',
      icon: <ChefHat size={24} color="#db8221" />,
    },
    {
      id: 'pickup-queue',
      title: 'Pickup Queue',
      desc: 'Orders marked Ready appear highlighted in green. The waiter will collect within 5 minutes.',
      icon: <Zap size={24} color="#db8221" />,
    },
    {
      id: 'stock-alerts',
      title: 'Stock Alerts',
      desc: 'Red alerts indicate items trending low. Notify your manager immediately to avoid service gaps.',
      icon: <Thermometer size={24} color="#db8221" />,
    },
    {
      id: 'ingredient-substitution',
      title: 'Ingredient Substitutions',
      desc: 'Approved alternatives for 86\'d ingredients to keep service moving.',
      icon: <BookOpen size={24} color="#db8221" />,
    },
    {
      id: 'food-safety',
      title: 'Food Safety',
      desc: 'Maintain HACCP standards. Temperature logs and allergen checks are mandatory before each service.',
      icon: <ShieldAlert size={24} color="#db8221" />,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#f4ebe1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kitchen Help</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.searchBox}>
          <Search size={20} color="#8a7465" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search kitchen guides..."
            placeholderTextColor="#8a7465"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionTitle}>Guides & Protocols</Text>

        <View style={styles.issuesList}>
          {ISSUES.filter(issue => issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || issue.desc.toLowerCase().includes(searchQuery.toLowerCase())).map((issue, index) => (
            <Animated.View key={issue.id} entering={FadeInDown.delay(index * 100).duration(400)}>
              <TouchableOpacity 
                style={styles.issueCard}
                onPress={() => router.push((`/kitchen-help/${issue.id}` as any))}
                activeOpacity={0.8}
              >
                <View style={styles.issueIconBox}>
                  {issue.icon}
                </View>
                <View style={styles.issueTextContainer}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueDesc}>{issue.desc}</Text>
                </View>
                <ChevronRight size={20} color="#8a7465" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <View style={{ height: 40 }} />

        <TouchableOpacity style={styles.contactCard} activeOpacity={0.9}>
          <View style={styles.contactIconCircle}>
            <HeadphonesIcon size={28} color="#ffffff" />
          </View>
          <View style={styles.contactTextContainer}>
            <Text style={styles.contactTitle}>Contact Head Chef</Text>
            <Text style={styles.contactDesc}>Available for urgent kitchen overrides</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c120f', // Very dark brown background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#2a1a14',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#251713',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 32,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#ffffff',
  },
  sectionTitle: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  issuesList: {
    gap: 16,
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#251713',
    borderWidth: 1,
    borderColor: '#3a2720',
    borderRadius: 12,
    padding: 16,
  },
  issueIconBox: {
    width: 48,
    height: 48,
    backgroundColor: '#2e1d16',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  issueTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  issueTitle: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 4,
  },
  issueDesc: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#a38a7a',
    lineHeight: 18,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#db8221',
    borderRadius: 12,
    padding: 20,
  },
  contactIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 4,
  },
  contactDesc: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
});
