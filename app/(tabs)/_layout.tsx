import { Tabs } from 'expo-router';
import React from 'react';
import { Home, ClipboardList, ConciergeBell, CreditCard } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#db8221',
        tabBarInactiveTintColor: '#705f55',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f4ebe1',
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingTop: 8,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Lexend',
          fontSize: 10,
          marginTop: 4,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="serves"
        options={{
          title: 'Serves',
          tabBarIcon: ({ color }) => <ConciergeBell size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: 'Payment',
          tabBarIcon: ({ color }) => <CreditCard size={24} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
