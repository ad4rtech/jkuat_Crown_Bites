import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Briefcase, Coffee, ChefHat, CreditCard, ScanFace, Delete } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ROLE_INFO: Record<string, { title: string; icon: any; pin: string }> = {
  manager: { title: 'Restaurant Manager', icon: Briefcase, pin: '1234' },
  waiter: { title: 'Waiter', icon: Coffee, pin: '2345' },
  kitchen: { title: 'Kitchen Staff', icon: ChefHat, pin: '3456' },
  cashier: { title: 'Cashier', icon: CreditCard, pin: '4567' },
};

const NUMBERS = [
  { val: '1', letters: '' },
  { val: '2', letters: 'ABC' },
  { val: '3', letters: 'DEF' },
  { val: '4', letters: 'GHI' },
  { val: '5', letters: 'JKL' },
  { val: '6', letters: 'MNO' },
  { val: '7', letters: 'PQRS' },
  { val: '8', letters: 'TUV' },
  { val: '9', letters: 'WXYZ' },
];

export default function PinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams();
  const [pin, setPin] = useState('');

  const currentRole = typeof role === 'string' && ROLE_INFO[role] ? ROLE_INFO[role] : ROLE_INFO['manager'];
  const RoleIcon = currentRole.icon;

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === currentRole.pin) {
        // Correct pin, navigate to dashboard
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        // Incorrect pin, alert and reset
        setTimeout(() => {
          Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.', [
            { text: 'OK', onPress: () => setPin('') }
          ]);
        }, 100);
      }
    }
  }, [pin]);

  const handleKeyPress = (val: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      
      {/* Back Button */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
      </Animated.View>

      {/* Header Info */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.header}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Enter PIN</Text>
        <Text style={styles.subtitle}>Enter your 4-digit passcode to sign in</Text>

        <View style={styles.roleBadge}>
          <RoleIcon color="#d2af8f" size={20} strokeWidth={2} />
          <Text style={styles.roleText}>{currentRole.title}</Text>
        </View>
      </Animated.View>

      {/* PIN Dots */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => {
          const isFilled = index < pin.length;
          return (
            <View
              key={index}
              style={[
                styles.pinDot,
                isFilled && styles.pinDotFilled
              ]}
            />
          );
        })}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Numpad */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.numpadContainer}>
        <View style={styles.row}>
          {NUMBERS.slice(0, 3).map((num) => (
            <TouchableOpacity key={num.val} style={styles.keyButton} onPress={() => handleKeyPress(num.val)}>
              <Text style={styles.keyText}>{num.val}</Text>
              <Text style={styles.keyLetters}>{num.letters}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {NUMBERS.slice(3, 6).map((num) => (
            <TouchableOpacity key={num.val} style={styles.keyButton} onPress={() => handleKeyPress(num.val)}>
              <Text style={styles.keyText}>{num.val}</Text>
              <Text style={styles.keyLetters}>{num.letters}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          {NUMBERS.slice(6, 9).map((num) => (
            <TouchableOpacity key={num.val} style={styles.keyButton} onPress={() => handleKeyPress(num.val)}>
              <Text style={styles.keyText}>{num.val}</Text>
              <Text style={styles.keyLetters}>{num.letters}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {/* Biometric Auth Logic */}}>
            <ScanFace color="#ffffff" size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.keyButton, { backgroundColor: '#1f1310' }]} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
            <Text style={styles.keyLetters}></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Delete color="#ffffff" size={28} />
          </TouchableOpacity>
        </View>
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
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2c1e19',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: -20,
    marginBottom: 40,
  },
  headerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'LexendBold',
    fontSize: 32,
    color: '#ffffff',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    color: '#b89f8d',
    marginBottom: 24,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#30221c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  roleText: {
    fontFamily: 'LexendSemiBold',
    color: '#d2af8f',
    marginLeft: 8,
    fontSize: 14,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2c1e19',
  },
  pinDotFilled: {
    backgroundColor: '#db8221',
  },
  numpadContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 24,
  },
  keyButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a1b18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontFamily: 'LexendBold',
    fontSize: 28,
    color: '#ffffff',
    marginBottom: -4,
  },
  keyLetters: {
    fontFamily: 'Lexend',
    fontSize: 10,
    color: '#b89f8d',
    marginTop: 4,
    letterSpacing: 1,
  },
  actionButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
