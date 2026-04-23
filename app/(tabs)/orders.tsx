import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Info, Armchair } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

type TableStatus = 'available' | 'occupied' | 'ordered';

interface TableDef {
  id: string;
  name: string;
  seats: number;
  zone: 'Main Dining' | 'Outdoor Patio';
  shape: 'rect' | 'circle' | 'rect-vertical';
}

const INITIAL_TABLES: Record<string, TableStatus> = {
  'T1': 'available',
  'T2': 'available',
  'T3': 'available',
  'T4': 'available',
  'T5': 'available',
  'T6': 'available',
  'T7': 'available',
  'T8': 'available',
  'T9': 'available',
  'T10': 'available',
};

const TABLES: TableDef[] = [
  { id: 'T1', name: 'T1', seats: 4, zone: 'Main Dining', shape: 'rect' },
  { id: 'T2', name: 'T2', seats: 4, zone: 'Main Dining', shape: 'rect' },
  { id: 'T3', name: 'T3', seats: 4, zone: 'Main Dining', shape: 'circle' },
  { id: 'T4', name: 'T4', seats: 4, zone: 'Main Dining', shape: 'circle' },
  { id: 'T5', name: 'T5', seats: 6, zone: 'Main Dining', shape: 'rect-vertical' },
  { id: 'T6', name: 'T6', seats: 2, zone: 'Outdoor Patio', shape: 'circle' },
  { id: 'T7', name: 'T7', seats: 2, zone: 'Outdoor Patio', shape: 'circle' },
  { id: 'T8', name: 'T8', seats: 4, zone: 'Outdoor Patio', shape: 'rect' },
  { id: 'T9', name: 'T9', seats: 6, zone: 'Outdoor Patio', shape: 'rect-vertical' },
  { id: 'T10', name: 'T10', seats: 4, zone: 'Outdoor Patio', shape: 'rect' },
];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [tableStatus, setTableStatus] = useState<Record<string, TableStatus>>(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const params = useLocalSearchParams();

  const [animationKey, setAnimationKey] = useState(0);

  // Trigger re-entry animations when the tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setAnimationKey(prev => prev + 1);
    }, [])
  );

  React.useEffect(() => {
    if (params.orderedTableId) {
      setTableStatus(prev => ({
        ...prev,
        [params.orderedTableId as string]: 'ordered'
      }));
      setSelectedTableId(null);
    }
  }, [params.orderedTableId]);

  const selectedTable = TABLES.find(t => t.id === selectedTableId);
  const isSelectedOccupied = selectedTableId ? tableStatus[selectedTableId] === 'occupied' || tableStatus[selectedTableId] === 'ordered' : false;
  const isSelectedOrdered = selectedTableId ? tableStatus[selectedTableId] === 'ordered' : false;

  const handleAssignTable = () => {
    if (!selectedTableId) return;
    
    setTableStatus(prev => ({
      ...prev,
      [selectedTableId]: 'occupied'
    }));
    
    showToast('Table assigned. Proceed to order.');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const renderTableShape = (table: TableDef, index: number) => {
    const isSelected = selectedTableId === table.id;
    const status = tableStatus[table.id];
    const isAvailable = status === 'available';
    const isOrdered = status === 'ordered';
    
    // Search dimming
    const isMatch = searchQuery === '' || table.name.toLowerCase().includes(searchQuery.toLowerCase());
    const opacity = isMatch ? 1 : 0.15;

    const color = isSelected ? '#10b981' : isAvailable ? '#10b981' : isOrdered ? '#f59e0b' : '#ef4444';
    const bgColor = isSelected ? (isAvailable ? '#ecfdf5' : '#fef2f2') : 'transparent';
    const borderColor = color;

    if (table.shape === 'rect') {
      return (
        <Animated.View entering={FadeInUp.delay(index * 50)} style={{ opacity }}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => isMatch && setSelectedTableId(table.id)}
            style={[styles.tableRect, { borderColor, backgroundColor: bgColor }]}
          >
            <Text style={[styles.tableName, { color: '#1c120f' }]}>{table.name}</Text>
            {/* Seats indicators */}
            <View style={[styles.seatHorizontal, { top: -6 }]} />
            <View style={[styles.seatHorizontal, { bottom: -6 }]} />
            {isSelected && <View style={[styles.selectedDot, { backgroundColor: color }]} />}
          </TouchableOpacity>
        </Animated.View>
      );
    }
    
    if (table.shape === 'circle') {
      return (
        <Animated.View entering={FadeInUp.delay(index * 50)} style={{ opacity }}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => isMatch && setSelectedTableId(table.id)}
            style={[styles.tableCircle, { borderColor, backgroundColor: bgColor }]}
          >
            <Text style={[styles.tableName, { color: '#1c120f' }]}>{table.name}</Text>
            {/* Seats indicators */}
            <View style={[styles.seatHorizontal, { top: -6 }]} />
            <View style={[styles.seatHorizontal, { bottom: -6 }]} />
            <View style={[styles.seatVertical, { left: -6 }]} />
            <View style={[styles.seatVertical, { right: -6 }]} />
            {isSelected && <View style={[styles.selectedDot, { backgroundColor: color }]} />}
          </TouchableOpacity>
        </Animated.View>
      );
    }

    if (table.shape === 'rect-vertical') {
      return (
        <Animated.View entering={FadeInUp.delay(index * 50)} style={{ opacity }}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => isMatch && setSelectedTableId(table.id)}
            style={[styles.tableRectVertical, { borderColor, backgroundColor: bgColor }]}
          >
            <Text style={[styles.tableName, { color: '#1c120f' }]}>{table.name}</Text>
            {/* Seats indicators */}
            <View style={[styles.seatVertical, { left: -6, top: 20 }]} />
            <View style={[styles.seatVertical, { left: -6, bottom: 20 }]} />
            <View style={[styles.seatVertical, { right: -6, top: 20 }]} />
            <View style={[styles.seatVertical, { right: -6, bottom: 20 }]} />
            {isSelected && <View style={[styles.selectedDot, { backgroundColor: color }]} />}
          </TouchableOpacity>
        </Animated.View>
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1c120f" />
        </TouchableOpacity>
        
        {isSearching ? (
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search table..."
              placeholderTextColor="#b89f8d"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        ) : (
          <Text style={styles.headerTitle}>Select Table</Text>
        )}
        
        <TouchableOpacity style={styles.iconButton} onPress={() => {
          setIsSearching(!isSearching);
          if (isSearching) setSearchQuery(''); // Clear search when closing
        }}>
          <Search size={24} color="#1c120f" />
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { borderColor: '#10b981' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { borderColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Occupied</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { borderColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Ordered</Text>
        </View>
      </View>

      {/* Floor Plan Canvas */}
      <ScrollView key={animationKey} style={styles.canvasContainer} contentContainerStyle={styles.canvasContent}>
        <View style={styles.canvasGrid}>
          <Text style={styles.zoneTitle}>MAIN DINING</Text>
          
          <View style={styles.floorPlan}>
            <View style={styles.column}>
              {renderTableShape(TABLES[0], 0)}
              <View style={{ height: 40 }} />
              {renderTableShape(TABLES[1], 1)}
            </View>
            
            <View style={styles.column}>
              {renderTableShape(TABLES[2], 2)}
              <View style={{ height: 40 }} />
              {renderTableShape(TABLES[3], 3)}
            </View>

            <View style={styles.columnCenter}>
              {renderTableShape(TABLES[4], 4)}
            </View>
          </View>

          <View style={styles.divider} />
          <Text style={styles.zoneTitle}>OUTDOOR PATIO</Text>
          
          <View style={styles.floorPlan}>
            <View style={styles.column}>
              {renderTableShape(TABLES[5], 5)}
              <View style={{ height: 40 }} />
              {renderTableShape(TABLES[8], 8)}
            </View>
            
            <View style={styles.column}>
              {renderTableShape(TABLES[6], 6)}
              <View style={{ height: 40 }} />
              {renderTableShape(TABLES[9], 9)}
            </View>

            <View style={styles.columnCenter}>
              {renderTableShape(TABLES[7], 7)}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {toastMessage && (
        <Animated.View entering={FadeInDown} style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Bottom Sheet */}
      {selectedTable && (
        <Animated.View entering={SlideInDown.duration(300)} style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Armchair size={24} color="#1c120f" style={{ marginRight: 8 }} />
              <Text style={styles.sheetTitle}>Table {selectedTable.name}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: isSelectedOccupied ? '#fef2f2' : '#ecfdf5' }
            ]}>
              <Text style={[
                styles.statusBadgeText, 
                { color: isSelectedOccupied ? '#ef4444' : '#10b981' }
              ]}>
                {isSelectedOccupied ? 'Occupied' : 'Available'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.sheetSubtitle}>
            {selectedTable.seats} Seats • {selectedTable.zone}
          </Text>

          <View style={[
            styles.infoBox, 
            { 
              backgroundColor: isSelectedOccupied ? '#fef2f2' : '#f8fafc',
              borderColor: isSelectedOccupied ? '#fecaca' : '#e2e8f0'
            }
          ]}>
            <Info size={20} color={isSelectedOccupied ? '#ef4444' : '#64748b'} />
            <Text style={[
              styles.infoText, 
              { color: isSelectedOccupied ? '#ef4444' : '#64748b' }
            ]}>
              {isSelectedOrdered 
                ? "Table order has been submitted to kitchen. Order cannot be modified."
                : isSelectedOccupied 
                  ? "Table is currently occupied. You can append orders to this table." 
                  : "Table is available. Assign it to start taking orders."}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.makeOrderBtn, (!isSelectedOccupied || isSelectedOrdered) && styles.btnDisabled]}
              disabled={!isSelectedOccupied || isSelectedOrdered}
              onPress={() => router.push({ pathname: '/make-order', params: { tableId: selectedTable.id } })}
            >
              <Text style={[styles.actionButtonText, (!isSelectedOccupied || isSelectedOrdered) && styles.btnTextDisabled]}>
                {isSelectedOrdered ? 'Order Submitted' : 'Make Order'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.assignBtn, isSelectedOccupied && styles.btnDisabled]}
              disabled={isSelectedOccupied}
              onPress={handleAssignTable}
            >
              <Text style={[styles.actionButtonText, isSelectedOccupied && styles.btnTextDisabled]}>
                Assign Table
              </Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Control from design */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity style={[styles.segmentBtn, styles.segmentActive]}>
              <Armchair size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={[styles.segmentText, { color: '#ffffff' }]}>Tables</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.segmentBtn}>
              <Text style={styles.segmentText}>Orders</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

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
    marginBottom: 10,
    height: 60,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f4ebe1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'LexendBold',
    fontSize: 20,
    color: '#1c120f',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
  },
  legendText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 13,
    color: '#705f55',
  },
  canvasContainer: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: '#faf6f0',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f0e6d8',
  },
  canvasContent: {
    padding: 24,
    paddingBottom: 400, // Make room for bottom sheet and extra scrolling
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
  zoneTitle: {
    fontFamily: 'LexendBold',
    fontSize: 12,
    letterSpacing: 2,
    color: '#b89f8d',
    marginBottom: 20,
  },
  canvasGrid: {
    flex: 1,
  },
  floorPlan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  column: {
    alignItems: 'center',
  },
  columnCenter: {
    justifyContent: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#f0e6d8',
    marginBottom: 20,
    borderStyle: 'dashed',
  },
  
  // Tables
  tableRect: {
    width: 80,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCircle: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableRectVertical: {
    width: 60,
    height: 100,
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableName: {
    fontFamily: 'LexendBold',
    fontSize: 14,
  },
  seatHorizontal: {
    position: 'absolute',
    width: 24,
    height: 6,
    backgroundColor: '#e4d3c3',
    borderRadius: 3,
  },
  seatVertical: {
    position: 'absolute',
    width: 6,
    height: 24,
    backgroundColor: '#e4d3c3',
    borderRadius: 3,
  },
  selectedDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fdfaf5',
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fdfaf5',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: 'LexendBold',
    fontSize: 24,
    color: '#1c120f',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: 'LexendBold',
    fontSize: 12,
  },
  sheetSubtitle: {
    fontFamily: 'Lexend',
    fontSize: 14,
    color: '#705f55',
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Lexend',
    fontSize: 13,
    lineHeight: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  makeOrderBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  assignBtn: {
    backgroundColor: '#f4ebe1',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontFamily: 'LexendBold',
    fontSize: 16,
    color: '#1c120f',
  },
  btnTextDisabled: {
    color: '#94a3b8',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4ebe1',
  },
  segmentActive: {
    backgroundColor: '#db8221',
  },
  segmentText: {
    fontFamily: 'LexendBold',
    fontSize: 15,
    color: '#705f55',
  },
  toastContainer: {
    position: 'absolute',
    top: 120,
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
  }
});
