import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type TargetRole = 'Waiter' | 'Kitchen' | 'Cashier' | 'Manager' | 'All';

export interface AppNotification {
  id: string;
  target_role: TargetRole;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  activeRole: TargetRole | null;
  sound: AudioPlayer | null;
  
  initStore: (role: TargetRole) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  emitNotification: (
    role: TargetRole,
    title: string,
    message: string,
    type?: NotificationType
  ) => Promise<void>;
  playAlert: (type?: NotificationType) => Promise<void>;
  subscribeToNotifications: () => () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  activeRole: null,
  sound: null,

  initStore: async (role) => {
    set({ activeRole: role });
    get().fetchNotifications();
    const unsub = get().subscribeToNotifications();

    // Load the notification sound from a remote generic beep URL
    try {
      const player = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      set({ sound: player });
    } catch (e) {
      console.log('Audio init skipped or failed:', e);
    }

    return unsub;
  },

  playAlert: async (type?: NotificationType) => {
    // Vibrate based on notification type
    if (Platform.OS !== 'web') {
      if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }

    const sound = get().sound;
    if (sound) {
      try {
        sound.seekTo(0);
        sound.play();
      } catch (e) {
        console.log('Failed to play sound', e);
      }
    }
  },

  fetchNotifications: async () => {
    const role = get().activeRole;
    if (!role || !isSupabaseConfigured) return;

    set({ loading: true });
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .in('target_role', [role, 'All'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      const unreadCount = data.filter((n: any) => !n.is_read).length;
      set({ notifications: data as AppNotification[], unreadCount, loading: false });
    } else {
      set({ loading: false });
    }
  },

  subscribeToNotifications: () => {
    const role = get().activeRole;
    if (!role || !isSupabaseConfigured) return () => {};

    // Remove any previously active channel to prevent duplicate listener errors
    const channelName = `public:notifications:${role}`;
    supabase.removeChannel(supabase.channel(channelName));

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const newNotif = payload.new as AppNotification;
          // Filter out if it's not for this role or 'All'
          if (newNotif.target_role !== role && newNotif.target_role !== 'All') return;

          set((state) => {
            const updated = [newNotif, ...state.notifications];
            return {
              notifications: updated,
              unreadCount: state.unreadCount + 1,
            };
          });

          get().playAlert(newNotif.type);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload: any) => {
          const updatedNotif = payload.new as AppNotification;
          set((state) => {
            const updatedList = state.notifications.map((n) =>
              n.id === updatedNotif.id ? updatedNotif : n
            );
            const unreadCount = updatedList.filter((n) => !n.is_read).length;
            return { notifications: updatedList, unreadCount };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  markAsRead: async (id) => {
    // Optimistic update
    set((state) => {
      const updatedList = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = updatedList.filter((n) => !n.is_read).length;
      return { notifications: updatedList, unreadCount };
    });

    if (isSupabaseConfigured) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  },

  markAllAsRead: async () => {
    const role = get().activeRole;
    if (!role) return;

    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    }));

    if (isSupabaseConfigured) {
      await supabase.from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)
        .in('target_role', [role, 'All']);
    }
  },

  clearAll: async () => {
    const role = get().activeRole;
    if (!role) return;

    const currentIds = get().notifications.map(n => n.id);
    if (currentIds.length === 0) return;

    set({ notifications: [], unreadCount: 0 });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('notifications')
        .delete()
        .in('id', currentIds);
        
      if (error) console.error('Error clearing notifications:', error);
    }
  },

  deleteNotification: async (id) => {
    // Optimistic delete locally
    set((state) => {
      const updatedList = state.notifications.filter((n) => n.id !== id);
      const unreadCount = updatedList.filter((n) => !n.is_read).length;
      return { notifications: updatedList, unreadCount };
    });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) console.error('Error deleting notification:', error);
    }
  },

  emitNotification: async (role, title, message, type = 'info') => {
    if (!isSupabaseConfigured) return;
    await supabase.from('notifications').insert({
      target_role: role,
      title,
      message,
      type,
    });
  },
}));
