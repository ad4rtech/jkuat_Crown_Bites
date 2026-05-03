import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, ChevronRight, Receipt, Printer, WifiOff, MonitorX, HeadphonesIcon } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const ISSUES = [
    {
      id: 'order-not-sending',
      title: 'Order not sending to kitchen',
      desc: "Steps to troubleshoot when the KDS doesn't receive your order.",
      icon: <Receipt size={24} color="#db8221" />,
    },
    {
      id: 'printer-offline',
      title: 'Printer offline or out of paper',
      desc: 'How to replace paper and reset the thermal printer.',
      icon: <Printer size={24} color="#db8221" />,
    },
    {
      id: 'app-offline',
      title: 'App is offline / No connection',
      desc: 'What to do when your device loses network access.',
      icon: <WifiOff size={24} color="#db8221" />,
    },
    {
      id: 'screen-frozen',
      title: 'Screen frozen or unresponsive',
      desc: 'Quickly restart the POS application or clear cache.',
      icon: <MonitorX size={24} color="#db8221" />,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#f4ebe1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.searchBox}>
          <Search size={20} color="#8a7465" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for troubleshooting topics..."
            placeholderTextColor="#8a7465"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionTitle}>Common Issues</Text>

        <View style={styles.issuesList}>
          {ISSUES.filter(issue => issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || issue.desc.toLowerCase().includes(searchQuery.toLowerCase())).map((issue, index) => (
            <Animated.View key={issue.id} entering={FadeInDown.delay(index * 100).duration(400)}>
              <TouchableOpacity 
                style={styles.issueCard}
                onPress={() => router.push(`/help/${issue.id}`)}
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
            <Text style={styles.contactTitle}>Contact IT Support</Text>
            <Text style={styles.contactDesc}>Available 24/7 for urgent issues</Text>
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
