import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  message: string;
  visible: boolean;
  type?: 'error' | 'info';
}

export default function Toast({ message, visible, type = 'error' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: colors.elevated,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.danger,
    zIndex: 999,
  },
  text: { color: colors.textPrimary, fontSize: 14, textAlign: 'center' },
});
