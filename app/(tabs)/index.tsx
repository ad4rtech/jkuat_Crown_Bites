import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Search, SlidersHorizontal, Plus, HelpCircle, X, LayoutDashboard, Utensils, LayoutGrid, ClipboardList, Clock, Settings, LogOut, BookOpen, ShieldAlert, UserCircle2, CreditCard, Bell } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, Layout, SlideInLeft, SlideOutLeft, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useFocusEffect, useRouter } from 'expo-router';
import { useManagerMenuStore } from '../../store/managerMenuStore';
import { DbMenuItem } from '../../lib/supabase';
import { Modal } from 'react-native';
import { useNotificationStore } from '../../store/notificationStore';
import CenterToast, { useToast } from '../../components/CenterToast';

const ICON_MAP: Record<string, string> = {
  Starters: 'Starters 🥗',
  Mains: 'Mains 🥩',
  Drinks: 'Drinks 🍹',
  Desserts: 'Desserts 🍰',
  Grills: 'Grills 🔥',
  Sides: 'Sides 🥗',
};

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items: managerItems, categories: managerCategories, fetchMenu } = useManagerMenuStore();
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const { unreadCount, initStore } = useNotificationStore();
  const { toast, show, confirm } = useToast();

  // Modal states
  const [showSidebar, setShowSidebar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchMenu();
      initStore('Waiter');
    }, [])
  );

  // Build active category list from manager store
  const activeCategories = useMemo(() => 
    managerCategories.filter(c => c.isActive).sort((a, b) => a.order - b.order),
    [managerCategories]
  );

  // Auto-select first category
  React.useEffect(() => {
    if (activeCategories.length > 0 && !activeCategory) {
      setActiveCategory(activeCategories[0].id);
    }
  }, [activeCategories]);

  // Map manager items to DbMenuItem-like shape for display, include unavailable (grayed), hide deactivated
  const items = useMemo(() =>
    managerItems.filter(i => i.status !== 'deactivated').map(i => ({
      id: i.id,
      title: i.name,
      description: i.description || '',
      price: i.price,
      image_url: i.photo || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
      category: i.categoryId,
      available: i.status === 'active',
      created_at: '',
    })),
    [managerItems]
  );

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = item.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const loading = false;

  const renderItem = ({ item, index }: { item: DbMenuItem; index: number }) => {
    const isUnavailable = !item.available;
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80).duration(400)}
        layout={Layout.springify()}
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          {isUnavailable && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableOverlayText}>Out of Stock</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>Ksh {item.price}</Text>
            {isUnavailable ? (
              <Text style={styles.outOfStockText}>Unavailable</Text>
            ) : (
              <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
                <Plus size={20} color="#ffffff" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <CenterToast {...toast} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setShowSidebar(true)}>
          <Menu size={24} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/help')}>
            <HelpCircle size={24} color="#1c120f" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
            <Bell size={24} color="#1c120f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color="#8a7465" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor="#8a7465"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {activeCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{ICON_MAP[cat.name] || cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading Skeleton */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db8221" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      )}

      {/* List */}
      {!loading && (
        <Animated.FlatList
          key={activeCategory}
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No items match your search.' : 'No items in this category.'}
              </Text>
            </Animated.View>
          }
        />
      )}

      {/* Left Sidebar Modal */}
      <Modal visible={showSidebar} transparent animationType="none" onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.modalOverlayDark}>
          <Animated.View entering={SlideInLeft.duration(300)} exiting={SlideOutLeft.duration(300)} style={styles.sidebarContainerDark}>
            
            <View style={styles.sidebarHeaderDark}>
              <View style={styles.sidebarAvatar}>
                <UserCircle2 size={48} color="#db8221" />
              </View>
              <View style={styles.sidebarUserInfo}>
                <Text style={styles.sidebarRoleDark}>Waiter Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSidebar(false)} style={styles.closeBtnDark}>
                <X size={20} color="#f4ebe1" />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarLinksDark}>
              <TouchableOpacity style={styles.sidebarLinkDark} onPress={() => { setShowSidebar(false); router.push('/(tabs)/payment'); }}>
                <CreditCard size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkTextDark}>Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sidebarLinkDark, styles.sidebarLinkActiveDark]} onPress={() => setShowSidebar(false)}>
                <Utensils size={22} color="#ffffff" />
                <Text style={[styles.sidebarLinkTextDark, styles.sidebarLinkTextActiveDark]}>Menu</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarLinkDark} onPress={() => { setShowSidebar(false); router.push('/(tabs)/orders'); }}>
                <LayoutGrid size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkTextDark}>Floor Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarLinkDark} onPress={() => { setShowSidebar(false); router.push('/(tabs)/serves'); }}>
                <ClipboardList size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkTextDark}>My Orders</Text>
              </TouchableOpacity>

              <View style={styles.sidebarDividerDark} />

              <TouchableOpacity style={styles.sidebarLinkDark} onPress={() => { setShowSidebar(false); router.push('/settings'); }}>
                <Settings size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkTextDark}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarLinkDark} onPress={() => { setShowSidebar(false); router.push('/help'); }}>
                <HelpCircle size={22} color="#f4ebe1" />
                <Text style={styles.sidebarLinkTextDark}>Help & Support</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarFooterDark}>
              <View style={styles.sidebarDividerDark} />
              <TouchableOpacity style={styles.sidebarLinkLogoutDark} onPress={() => {
                setShowSidebar(false);
                confirm({
                  message: 'Sign Out?',
                  subMessage: 'Are you sure you want to sign out?',
                  confirmLabel: 'Sign Out',
                  cancelLabel: 'Cancel',
                  onConfirm: () => {
                    show({ message: 'Signed out', type: 'success', autoDismissMs: 1200 });
                    setTimeout(() => router.replace('/roles'), 1300);
                  },
                });
              }}>
                <LogOut size={22} color="#ef4444" />
                <Text style={styles.sidebarLinkTextLogoutDark}>Log Out</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowSidebar(false)} activeOpacity={1} />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#1c120f',
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: '#db8221',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesWrapper: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 12,
  },
  categoryTab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryTabActive: {
    backgroundColor: '#db8221',
  },
  categoryText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 15,
    color: '#705f55',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Lexend',
    fontSize: 15,
    color: '#8a7465',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableOverlayText: {
    fontFamily: 'LexendBold',
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 100,
    paddingVertical: 4,
  },
  cardTitle: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Lexend',
    fontSize: 12,
    color: '#705f55',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardPrice: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#db8221',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 13,
    color: '#8a7465',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Lexend',
    fontSize: 16,
    color: '#8a7465',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  modalDismiss: {
    flex: 1,
  },
  sidebarContainer: {
    width: '75%',
    backgroundColor: '#fdfaf5',
    height: '100%',
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  helpContainer: {
    width: '80%',
    backgroundColor: '#fdfaf5',
    height: '100%',
    padding: 24,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 40,
    marginBottom: 40,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#f4ebe1',
    borderRadius: 20,
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
  },
  sidebarContainerDark: {
    width: '80%',
    backgroundColor: '#1c120f', // Very dark brown background
    height: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
    justifyContent: 'space-between',
  },
  sidebarHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#251713', // Slightly lighter for header
    borderBottomWidth: 1,
    borderColor: '#3a2720',
  },
  sidebarAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3a2720',
  },
  sidebarUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sidebarRoleDark: {
    fontFamily: 'LexendSemiBold',
    fontSize: 16,
    color: '#db8221',
  },
  closeBtnDark: {
    padding: 8,
    backgroundColor: '#3a2720',
    borderRadius: 20,
  },
  sidebarLinksDark: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sidebarLinkDark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  sidebarLinkActiveDark: {
    backgroundColor: '#db8221',
  },
  sidebarLinkTextDark: {
    fontFamily: 'LexendSemiBold',
    fontSize: 16,
    color: '#f4ebe1',
    marginLeft: 16,
  },
  sidebarLinkTextActiveDark: {
    color: '#ffffff',
  },
  sidebarDividerDark: {
    height: 1,
    backgroundColor: '#3a2720',
    marginVertical: 12,
    marginHorizontal: 16,
  },
  sidebarFooterDark: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  sidebarLinkLogoutDark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sidebarLinkTextLogoutDark: {
    fontFamily: 'LexendSemiBold',
    fontSize: 16,
    color: '#ef4444',
    marginLeft: 16,
  },
  helpTitle: {
    fontFamily: 'LexendBold',
    fontSize: 22,
    color: '#1c120f',
  },
  helpScroll: {
    flex: 1,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0e6d8',
    gap: 16,
  },
  helpCardText: {
    flex: 1,
  },
  helpCardTitle: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#1c120f',
    marginBottom: 4,
  },
  helpCardDesc: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#705f55',
    lineHeight: 18,
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  bellBadgeText: {
    fontFamily: 'LexendBold',
    fontSize: 9,
    color: '#fff',
  },
});
