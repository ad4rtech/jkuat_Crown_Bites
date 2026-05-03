import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Animated,
} from 'react-native';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react-native';

export type ToastType = 'success' | 'warning' | 'error' | 'info' | 'confirm';

export interface ToastConfig {
  visible: boolean;
  message: string;
  subMessage?: string;
  type?: ToastType;
  autoDismissMs?: number;
  onDismiss?: () => void;
  onConfirm?: () => void;    // for confirm dialogs
  confirmLabel?: string;
  cancelLabel?: string;
}

const TYPE_CONFIG = {
  success: { icon: CheckCircle, color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  warning: { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  error:   { icon: XCircle,      color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  info:    { icon: Info,         color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  confirm: { icon: AlertTriangle, color: '#db8221', bg: '#fff7ed', border: '#fdba74' },
};

export default function CenterToast({
  visible,
  message,
  subMessage,
  type = 'info',
  autoDismissMs,
  onDismiss,
  onConfirm,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
}: ToastConfig) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.info;
  const IconComp = cfg.icon;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 160, friction: 9 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      if (autoDismissMs && onDismiss) {
        const id = setTimeout(onDismiss, autoDismissMs);
        return () => clearTimeout(id);
      }
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { borderColor: cfg.border, backgroundColor: cfg.bg, transform: [{ scale: scaleAnim }] }]}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: cfg.color + '18' }]}>
            <IconComp size={32} color={cfg.color} />
          </View>

          {/* Text */}
          <Text style={[styles.message, { color: '#1c120f' }]}>{message}</Text>
          {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}

          {/* Buttons */}
          {type === 'confirm' && onConfirm ? (
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onDismiss}>
                <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: cfg.color }]} onPress={onConfirm}>
                <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.dismissBtn, { backgroundColor: cfg.color }]} onPress={onDismiss}>
              <Text style={styles.dismissBtnText}>OK</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Helper hook ────────────────────────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = React.useState<ToastConfig>({ visible: false, message: '' });

  const show = (configOrMessage: string | Omit<ToastConfig, 'visible' | 'onDismiss'>, type?: ToastType) => {
    if (typeof configOrMessage === 'string') {
      setToast({
        message: configOrMessage,
        type: type || 'info',
        visible: true,
        onDismiss: () => setToast(prev => ({ ...prev, visible: false })),
      });
    } else {
      setToast({
        ...configOrMessage,
        visible: true,
        onDismiss: () => setToast(prev => ({ ...prev, visible: false })),
      });
    }
  };

  const confirm = (config: Omit<ToastConfig, 'visible' | 'type' | 'onDismiss'> & { onConfirm: () => void }) => {
    setToast({
      ...config,
      type: 'confirm',
      visible: true,
      onDismiss: () => setToast(prev => ({ ...prev, visible: false })),
      onConfirm: () => {
        setToast(prev => ({ ...prev, visible: false }));
        config.onConfirm();
      },
    });
  };

  return { toast, show, confirm };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: 'LexendBold',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
  },
  subMessage: {
    fontFamily: 'Lexend',
    fontSize: 13,
    color: '#705f55',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#e2d5c8',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontFamily: 'LexendSemiBold',
    fontSize: 14,
    color: '#705f55',
  },
  confirmBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#fff',
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  dismissBtnText: {
    fontFamily: 'LexendBold',
    fontSize: 14,
    color: '#fff',
  },
});
