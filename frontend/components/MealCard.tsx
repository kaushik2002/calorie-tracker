import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../types';
import { colors } from '../constants/theme';

interface Props {
  meal: Meal;
  onPress: () => void;
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

export default function MealCard({ meal, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconBox}>
        {meal.inputType === 'image' && meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.thumbnail} />
        ) : (
          <Text style={styles.foodEmoji}>🍽️</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>{meal.label}</Text>
        <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
      </View>

      <View style={styles.calBadge}>
        <Text style={styles.calText}>{meal.totalCalories}</Text>
        <Text style={styles.calUnit}>kcal</Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: { width: 44, height: 44 },
  foodEmoji: { fontSize: 22 },
  info: { flex: 1 },
  label: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  time: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  calBadge: { alignItems: 'flex-end', marginRight: 8 },
  calText: { color: colors.accent, fontWeight: '700', fontSize: 18 },
  calUnit: { color: colors.textMuted, fontSize: 11 },
  chevron: { marginLeft: 2 },
});
