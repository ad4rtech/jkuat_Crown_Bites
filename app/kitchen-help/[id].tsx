import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, AlertCircle, CheckCircle2, ChefHat, Zap, Thermometer, BookOpen, ShieldAlert } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const HELP_CONTENT = {
  'managing-orders': {
    title: 'Managing Orders',
    icon: <ChefHat size={32} color="#db8221" />,
    steps: [
      'Locate the new order in the "Pending" column of your Kitchen Display.',
      'Tap "Track kitchen" to move the order into "In Prep". This alerts the waiter that you have started.',
      'Prepare the dishes according to the ticket notes and specifications.',
      'Once completely plated and at the pass, tap the ticket again to mark it "Ready".',
    ],
  },
  'pickup-queue': {
    title: 'Pickup Queue',
    icon: <Zap size={32} color="#db8221" />,
    steps: [
      'Orders marked "Ready" are placed in the pickup queue.',
      'The corresponding table number will blink green on the Waiter\'s tablet.',
      'If an order has been sitting in the pickup queue for more than 5 minutes, use the buzzer to physically alert the floor staff.',
      'The ticket will automatically disappear when the waiter marks it "Served".',
    ],
  },
  'stock-alerts': {
    title: 'Stock Alerts',
    icon: <Thermometer size={32} color="#db8221" />,
    steps: [
      'A red alert on your dashboard indicates an ingredient has fallen below its safety threshold.',
      'Navigate to the "Stock" tab to see exactly which items are low.',
      'Check the physical dry store or walk-in to confirm the low quantity.',
      'Inform the Head Chef or Manager immediately to trigger a supplier re-order.',
    ],
  },
  'ingredient-substitution': {
    title: 'Ingredient Substitutions',
    icon: <BookOpen size={32} color="#db8221" />,
    steps: [
      'If an item is completely 86\'d (out of stock), check the authorized substitution chart on the kitchen wall.',
      'Do NOT substitute known allergens (e.g., swapping peanut oil for vegetable oil) without manager approval.',
      'Inform the floor staff immediately of the 86\'d item so they can stop selling it.',
      'Note any substitutions on the physical ticket before passing it to the waiter.',
    ],
  },
  'food-safety': {
    title: 'Food Safety',
    icon: <ShieldAlert size={32} color="#db8221" />,
    steps: [
      'Always log fridge and freezer temperatures at 8:00 AM, 2:00 PM, and 8:00 PM.',
      'Use the color-coded cutting boards: Red for raw meat, Blue for fish, Green for veg, Yellow for poultry.',
      'If a ticket indicates an allergy, change your gloves, wipe down your station, and use dedicated allergy utensils.',
      'Ensure all hot food leaves the pass at a minimum of 75°C (165°F).',
    ],
  },
};

export default function KitchenHelpDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const contentId = (Array.isArray(id) ? id[0] : id) as keyof typeof HELP_CONTENT;
  const content = HELP_CONTENT[contentId] || HELP_CONTENT['managing-orders'];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 }]}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#f4ebe1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kitchen Guides</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.titleCard}>
          <View style={styles.titleIconBox}>
            {content.icon}
          </View>
          <Text style={styles.titleText}>{content.title}</Text>
        </View>

        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#f59e0b" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>Follow standard kitchen operating procedures. Ensure quality and safety at all times.</Text>
        </View>

        <Text style={styles.stepsHeading}>Protocol Details</Text>

        <View style={styles.stepsContainer}>
          {content.steps.map((step, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 150).duration(400)} style={styles.stepRow}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepDesc}>{step}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(content.steps.length * 150 + 200).duration(500)}>
          <TouchableOpacity style={styles.resolvedBtn} onPress={() => router.back()}>
            <CheckCircle2 size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.resolvedBtnText}>I understand</Text>
          </TouchableOpacity>
        </Animated.View>

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
  titleCard: {
    alignItems: 'center',
    backgroundColor: '#251713',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3a2720',
    marginBottom: 24,
  },
  titleIconBox: {
    width: 64,
    height: 64,
    backgroundColor: '#2e1d16',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontFamily: 'LexendBold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  infoText: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#b45309',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  stepsHeading: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 16,
  },
  stepsContainer: {
    backgroundColor: '#251713',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a2720',
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingRight: 16,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3a2720',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#db8221',
  },
  stepDesc: {
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#e5e5e5',
    lineHeight: 24,
    flex: 1,
    marginTop: 2,
  },
  resolvedBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981', // Green for success
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  resolvedBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#ffffff',
  },
});
