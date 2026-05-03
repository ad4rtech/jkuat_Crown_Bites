import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { X, Plus, GripVertical, Pencil, Check, Trash2 } from 'lucide-react-native';
import { useManagerMenuStore } from '../../store/managerMenuStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CategoryModal({ visible, onClose }: Props) {
  const { categories, addCategory, renameCategory, deleteCategory, toggleCategoryActive } = useManagerMenuStore();
  const [newCatName, setNewCatName] = useState('');
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [editingVal, setEditingVal] = useState('');

  const sorted = [...categories].sort((a, b) => a.order - b.order);

  const handleAdd = () => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim());
    setNewCatName('');
  };

  const startRename = (id: string, current: string) => {
    setEditingId(id);
    setEditingVal(current);
  };

  const commitRename = () => {
    if (editingId && editingVal.trim()) {
      renameCategory(editingId, editingVal.trim());
    }
    setEditingId(null);
    setEditingVal('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Manage Categories</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#1c120f" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sub}>Reorder, rename or deactivate menu categories</Text>

          {/* Category List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {sorted.map(cat => {
              const isEditing  = editingId === cat.id;
              const itemCount  = useManagerMenuStore.getState().items.filter(i => i.categoryId === cat.id).length;
              return (
                <View key={cat.id} style={[styles.catRow, !cat.isActive && styles.catRowInactive]}>
                  <GripVertical size={18} color="#c4a882" style={{ marginRight: 4 }} />

                  {isEditing ? (
                    <TextInput
                      style={styles.renameInput}
                      value={editingVal}
                      onChangeText={setEditingVal}
                      autoFocus
                      onSubmitEditing={commitRename}
                    />
                  ) : (
                    <View style={styles.catInfo}>
                      <Text style={[styles.catName, !cat.isActive && styles.catNameInactive]}>
                        {cat.name}
                      </Text>
                      <Text style={styles.catCount}>{itemCount} items</Text>
                    </View>
                  )}

                  <View style={styles.catActions}>
                    {isEditing ? (
                      <TouchableOpacity style={styles.iconBtn} onPress={commitRename}>
                        <Check size={16} color="#059669" />
                      </TouchableOpacity>
                    ) : (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => startRename(cat.id, cat.name)}>
                          <Pencil size={15} color="#8a7465" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => deleteCategory(cat.id)}>
                          <Trash2 size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                    <Switch
                      value={cat.isActive}
                      onValueChange={() => toggleCategoryActive(cat.id)}
                      trackColor={{ false: '#e2d5c8', true: '#db8221' }}
                      thumbColor="#ffffff"
                      style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Add Category */}
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="New category name…"
              placeholderTextColor="#b89f8d"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              style={[styles.addBtn, !newCatName.trim() && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!newCatName.trim()}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:        { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop:       { position: 'absolute', inset: 0 },
  modal:          { width: '100%', maxHeight: '75%', backgroundColor: '#fdfaf5', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', elevation: 16 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f0e6d8' },
  title:          { fontFamily: 'LexendBold', fontSize: 20, color: '#1c120f' },
  closeBtn:       { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 14 },
  sub:            { fontFamily: 'Lexend', fontSize: 13, color: '#8a7465', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  list:           { maxHeight: 340, paddingHorizontal: 16 },
  catRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f0e6d8', gap: 8 },
  catRowInactive: { opacity: 0.5 },
  catInfo:        { flex: 1 },
  catName:        { fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f' },
  catNameInactive:{ color: '#b89f8d' },
  catCount:       { fontFamily: 'Lexend', fontSize: 11, color: '#8a7465', marginTop: 2 },
  catActions:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:        { padding: 6, backgroundColor: '#f4ebe1', borderRadius: 8 },
  renameInput:    { flex: 1, fontFamily: 'LexendSemiBold', fontSize: 15, color: '#1c120f', borderBottomWidth: 1.5, borderColor: '#db8221', paddingVertical: 4 },
  addRow:         { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderColor: '#f0e6d8', backgroundColor: '#fff' },
  addInput:       { flex: 1, backgroundColor: '#fdfaf5', borderWidth: 1.5, borderColor: '#f0e6d8', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Lexend', fontSize: 14, color: '#1c120f' },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#db8221', borderRadius: 12 },
  addBtnText:     { fontFamily: 'LexendBold', fontSize: 14, color: '#fff' },
});
