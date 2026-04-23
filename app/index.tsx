import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f3efe9', '#7e6150', '#1c1614']}
        locations={[0, 0.4, 0.7]}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.contentContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Top Image */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.imageContainer}>
          <Image
            source={require('../assets/images/splash_food.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </Animated.View>

        {/* Logo Image */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.logoWrapper}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title Texts */}
        <Animated.View entering={FadeInUp.delay(500).duration(600)} style={{ alignItems: 'center' }}>
          <Text style={styles.rokmsText}>Delight in Every Bite</Text>
          <Text style={styles.subtitleText}>
            Restaurant Operations & Kitchen{'\n'}Management System
          </Text>
          <Text style={styles.readyText}>Ready for your shift</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {/* Action Button */}
        <Animated.View entering={FadeInUp.delay(700).duration(600)} style={{ width: '100%' }}>
          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => router.push('/roles')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <ArrowRight color="white" size={20} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1614',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  logoWrapper: {
    marginTop: -50,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    backgroundColor: 'transparent',
    borderRadius: 80,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontFamily: 'LexendBold',
    fontSize: 24,
    color: '#ffffff',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  rokmsText: {
    fontFamily: 'FunnelSansBold',
    fontSize: 40,
    color: '#fdfaf5',
    lineHeight: 48,
    letterSpacing: -1,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'Sansation',
    fontSize: 16,
    color: '#e4d3c3',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  readyText: {
    fontFamily: 'CourierPrimeBold',
    fontSize: 14,
    color: '#db9e21',
    marginTop: 16,
    letterSpacing: 0.5,
  },
  button: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  buttonText: {
    fontFamily: 'LexendSemiBold',
    color: '#ffffff',
    fontSize: 18,
  },
});
