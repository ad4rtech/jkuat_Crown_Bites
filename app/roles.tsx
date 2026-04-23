import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Coffee, ChefHat, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ROLES = [
  {
    id: 'manager',
    title: 'Restaurant\nManager',
    subtitle: 'Oversee operations and reports',
    icon: Briefcase,
  },
  {
    id: 'waiter',
    title: 'Waiter',
    subtitle: 'Manage orders and serve customers',
    icon: Coffee,
  },
  {
    id: 'kitchen',
    title: 'Kitchen\nStaff',
    subtitle: 'Prepare and track meals',
    icon: ChefHat,
  },
  {
    id: 'cashier',
    title: 'Cashier',
    subtitle: 'Handle billing and payments',
    icon: CreditCard,
  },
];

export default function RolesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push({ pathname: '/pin', params: { role: selectedRole } });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Choose your role to continue</Text>
      </Animated.View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {ROLES.map((role, index) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <Animated.View 
              key={role.id} 
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => setSelectedRole(role.id)}
              >
                <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                  <Icon size={24} color={isSelected ? '#ffffff' : '#d2af8f'} strokeWidth={1.5} />
                </View>
                <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                  {role.title}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {role.subtitle}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Continue Button */}
      <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!selectedRole}
          style={[styles.button, selectedRole ? styles.buttonActive : styles.buttonDisabled]}
          onPress={handleContinue}
        >
          <Text style={[styles.buttonText, selectedRole ? styles.buttonTextActive : styles.buttonTextDisabled]}>
            Continue
          </Text>
        </TouchableOpacity>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c120f',
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'LexendBold',
    fontSize: 32,
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    color: '#b89f8d',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 48 - 16) / 2, // 2 columns, 24px padding each side, 16px gap
    backgroundColor: '#2c1e19',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 180,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: '#3d281f',
    borderColor: '#d2af8f',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3d281f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapperSelected: {
    backgroundColor: '#d2af8f',
  },
  cardTitle: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 40,
  },
  cardTitleSelected: {
    color: '#ffffff',
  },
  cardSubtitle: {
    fontFamily: 'Lexend',
    fontSize: 12,
    color: '#b89f8d',
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#241814',
  },
  buttonActive: {
    backgroundColor: '#db8221',
  },
  buttonText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 18,
  },
  buttonTextDisabled: {
    color: '#6d5b4f',
  },
  buttonTextActive: {
    color: '#ffffff',
  },
});
