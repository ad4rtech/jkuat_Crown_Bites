import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Search, SlidersHorizontal, Plus, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

const CATEGORIES = ['Starters', 'Mains', 'Drinks', 'Desserts'];

const MENU_ITEMS = [
  // Starters
  { id: '1', category: 'Starters', title: 'Crispy Calamari', desc: 'Golden fried calamari rings served with house-made tartar', price: 650, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80', tag: 'MOST ORDERED', outOfStock: false },
  { id: '2', category: 'Starters', title: 'Classic Bruschetta', desc: 'Toasted ciabatta topped with diced roma tomatoes, fresh basil,', price: 500, image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=400&q=80', tag: "CHEF'S SPECIAL", outOfStock: false },
  { id: '3', category: 'Starters', title: 'Garlic Bread', desc: 'Oven-baked baguette slices generously coated in garlic herb', price: 550, image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&q=80', tag: null, outOfStock: true },
  { id: '4', category: 'Starters', title: 'Spring Rolls', desc: 'Crispy golden wrappers filled with seasoned vegetables,', price: 600, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&q=80', tag: null, outOfStock: false },
  
  // Mains
  { id: '5', category: 'Mains', title: 'Grilled Ribeye Steak', desc: '12oz prime ribeye grilled to perfection, served with asparagus.', price: 900, image: 'https://images.unsplash.com/photo-1544025162-8111f4e1f7b8?auto=format&fit=crop&w=400&q=80', tag: "CHEF'S SPECIAL", outOfStock: false },
  { id: '6', category: 'Mains', title: 'Truffle Mushroom Risotto', desc: 'Creamy Arborio rice with wild mushrooms and truffle oil.', price: 850, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80', tag: null, outOfStock: false },
  { id: '7', category: 'Mains', title: 'Pan-Seared Salmon', desc: 'Fresh Atlantic salmon with lemon butter caper sauce.', price: 880, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80', tag: null, outOfStock: false },
  
  // Drinks
  { id: '8', category: 'Drinks', title: 'Classic Mojito', desc: 'Refreshing blend of rum, fresh mint, lime juice, and soda.', price: 600, image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', tag: 'POPULAR', outOfStock: false },
  { id: '9', category: 'Drinks', title: 'Mango Smoothie', desc: 'Fresh tropical mango blended with creamy yogurt.', price: 500, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=400&q=80', tag: null, outOfStock: false },
  
  // Desserts
  { id: '10', category: 'Desserts', title: 'Molten Chocolate Cake', desc: 'Warm chocolate cake with a gooey center, vanilla ice cream.', price: 750, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80', tag: 'MOST ORDERED', outOfStock: false },
  { id: '11', category: 'Desserts', title: 'Classic Tiramisu', desc: 'Espresso-soaked ladyfingers layered with mascarpone cream.', price: 700, image: 'https://images.unsplash.com/photo-1571115177098-24eccfb22d10?auto=format&fit=crop&w=400&q=80', tag: null, outOfStock: true },
];

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState('Starters');
  const [searchQuery, setSearchQuery] = useState('');
  const [animationKey, setAnimationKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesCategory = item.category === activeCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const renderItem = ({ item, index }: { item: typeof MENU_ITEMS[0], index: number }) => {
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(400)}
        layout={Layout.springify()}
        style={styles.card}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image }} style={styles.cardImage} />
          {item.tag && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
          
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>Ksh {item.price}</Text>
            {item.outOfStock ? (
              <Text style={styles.outOfStockText}>Out of Stock</Text>
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Menu size={24} color="#1c120f" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity style={styles.iconButton}>
          <ShoppingBag size={24} color="#1c120f" />
          <View style={styles.cartBadge} />
        </TouchableOpacity>
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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity 
                key={cat}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <Animated.FlatList
        key={`${activeCategory}-${animationKey}`} // forces remount animation when category changes or tab focused
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found.</Text>
          </Animated.View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf5', // cream background
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
  cartBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d4f',
    borderWidth: 1,
    borderColor: '#2c1e19',
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
  tagBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#db8221',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
  },
  tagText: {
    fontFamily: 'LexendBold',
    fontSize: 9,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: 100,
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
  }
});
