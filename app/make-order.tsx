import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Bell, Plus, Sandwich, Drumstick, Utensils, CupSoda, Minus, Armchair, ArrowLeft, CheckCircle } from 'lucide-react-native';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useManagerMenuStore } from '../store/managerMenuStore';
import { useOrderStore } from '../store/orderStore';
import { useTableStore } from '../store/tableStore';

const { width, height } = Dimensions.get('window');

type CartItem = { id: string; title: string; price: number; quantity: number };

const ICON_MAP: Record<string, React.ElementType> = {
  Starters: Sandwich,
  Mains: Utensils,
  Drinks: CupSoda,
  Desserts: Drumstick,
  Grills: Utensils,
  Sides: Sandwich,
};

const DEFAULT_ICON = Utensils;

export default function MakeOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const tableId = (params.tableId as string) || 'T1';

  // Manager store is the single source of truth for menu items
  const { items: managerItems, categories: managerCategories, fetchMenu } = useManagerMenuStore();
  const { cart, addToCart, removeFromCart, cartTotal, cartCount, submitOrder } = useOrderStore();
  const { markOrdered } = useTableStore();

  const [activeCategory, setActiveCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch menu on mount if not already loaded
  React.useEffect(() => { fetchMenu(); }, []);

  // Derive active categories dynamically from manager store
  const activeCategories = useMemo(() => {
    return managerCategories
      .filter(c => c.isActive)
      .sort((a, b) => a.order - b.order);
  }, [managerCategories]);

  // Set first active category as default once loaded
  React.useEffect(() => {
    if (activeCategories.length > 0 && !activeCategory) {
      setActiveCategory(activeCategories[0].id);
    }
  }, [activeCategories]);

  // Convert manager items to display shape — show active AND unavailable, hide only deactivated
  const allMenuItems = useMemo(() => {
    return managerItems
      .filter(i => i.status !== 'deactivated')
      .map(i => ({
        id: i.id,
        title: i.name,
        description: i.description || '',
        price: i.price,
        image_url: i.photo || `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80`,
        category: i.categoryId,
        available: i.status === 'active',
        created_at: '',
      }));
  }, [managerItems]);

  const filteredItems = useMemo(() => {
    return allMenuItems.filter(item => {
      const matchesCat = item.category === activeCategory;
      const matchesSearch = searchQuery === '' || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allMenuItems, activeCategory, searchQuery]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    const result = await submitOrder(tableId as string);
    setIsSubmitting(false);
    if (result) {
      await markOrdered(tableId as string);
      setToastMessage('Order sent to kitchen');
      setTimeout(() => {
        router.replace({ pathname: '/(tabs)/orders', params: { orderedTableId: tableId } });
      }, 1500);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Toast */}
      {toastMessage && (
        <Animated.View entering={FadeInDown} style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1c120f" />
          </TouchableOpacity>

          {isSearching ? (
            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu..."
                placeholderTextColor="#b89f8d"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          ) : (
            <View style={styles.tableSelector}>
              <Armchair size={18} color="#1c120f" style={{ marginRight: 6 }} />
              <Text style={styles.tableSelectorLabel}>Table </Text>
              <Text style={styles.tableSelectorValue}>{tableId}</Text>
            </View>
          )}
          
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => {
              setIsSearching(!isSearching);
              if (isSearching) setSearchQuery('');
            }}>
              <Search size={22} color="#1c120f" />
            </TouchableOpacity>

          </View>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {activeCategories.map(cat => {
            const isActive = activeCategory === cat.id;
            const Icon = ICON_MAP[cat.name] || DEFAULT_ICON;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Icon size={20} color={isActive ? '#ffffff' : '#705f55'} />
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Menu Items */}
        <Text style={styles.sectionTitle}>Menu Items</Text>
        <View style={styles.menuContainer}>
          {filteredItems.map((item, index) => (
            <Animated.View key={item.id} entering={FadeInDown.delay(index * 100)}>
              <View style={[styles.menuCard, !item.available && styles.menuCardDisabled]}>
                <Image source={{ uri: item.image_url }} style={styles.menuImage} />
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.menuFooter}>
                    <Text style={styles.menuPrice}>Ksh {item.price}</Text>
                    {item.available ? (
                      <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => addToCart(item)}
                      >
                        <Plus size={20} color="#ffffff" />
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.unavailableText}>Unavailable</Text>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
        
        {/* Padding for bottom sheet */}
        {cart.length > 0 && <View style={{ height: 250 }} />}
      </ScrollView>

      {/* Floating Order Summary Bottom Sheet */}
      {cart.length > 0 && (
        <Animated.View entering={SlideInDown} style={[styles.bottomSheet, { paddingBottom: insets.bottom || 24 }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitleRow}>
              <Armchair size={20} color="#1c120f" style={{ marginRight: 8 }} />
              <Text style={styles.summaryTitle}>Table {tableId}</Text>
            </View>
            <Text style={styles.summaryTotalText}>
              {totalItems} Items • Ksh {totalPrice}
            </Text>
          </View>
          
          <View style={styles.summaryDivider} />

          <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
            {cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemLeft}>
                  <Text style={styles.cartItemQty}>{item.quantity}x</Text>
                  <View>
                    <Text style={styles.cartItemTitle}>{item.title}</Text>
                    <Text style={styles.cartItemPrice}>Ksh {item.price * item.quantity}</Text>
                  </View>
                </View>
                <View style={styles.cartItemActions}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                    <Minus size={16} color="#705f55" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                    <Plus size={16} color="#705f55" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitOrder}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CheckCircle size={22} color="#ffffff" style={{ marginRight: 10 }} />
              <Text style={styles.submitBtnText}>Submit Order</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5', // Cream background
  },
  scrollContent: {
    paddingBottom: 24,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 50,
  },
  toastText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  tableSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tableSelectorLabel: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#705f55',
  },
  tableSelectorValue: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#1c120f',
  },
  searchWrapper: {
    flex: 1,
    marginHorizontal: 16,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#1c120f',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4ebe1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#f4ebe1',
  },
  sectionTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryPillActive: {
    backgroundColor: '#db8221',
  },
  categoryPillText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 14,
    color: '#705f55',
  },
  categoryPillTextActive: {
    color: '#ffffff',
    fontFamily: 'LexendBold',
  },
  menuContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  menuCardDisabled: {
    opacity: 0.6,
  },
  menuImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  menuTitle: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
    marginBottom: 6,
  },
  menuDesc: {
    fontFamily: 'Lexend',
    fontSize: 12,
    color: '#705f55',
    lineHeight: 18,
    marginBottom: 12,
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuPrice: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#db8221',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: height * 0.5, // max half screen
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#1c120f',
  },
  summaryTotalText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 14,
    color: '#db8221',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0e6d8',
    marginVertical: 16,
    borderStyle: 'dashed',
  },
  cartList: {
    marginBottom: 20,
    maxHeight: 150,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartItemQty: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#db8221',
    width: 30,
  },
  cartItemTitle: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#1c120f',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#705f55',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4ebe1',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#1c120f',
    marginHorizontal: 8,
  },
  submitBtn: {
    backgroundColor: '#10b981', // Bright Green
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 18,
    color: '#ffffff',
  }
});
