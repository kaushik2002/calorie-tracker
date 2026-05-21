import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../../../store/mealStore';
import { colors } from '../../../constants/theme';

function formatDateTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return ts;
  }
}

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedMeal, fetchMealById, deleteMeal, updateLabel, isLoading } = useMealStore();
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState('');

  useEffect(() => {
    if (id) fetchMealById(id);
  }, [id]);

  useEffect(() => {
    if (selectedMeal) setLabelValue(selectedMeal.label);
  }, [selectedMeal]);

  const handleDelete = () => {
    Alert.alert('Delete Meal', 'Are you sure you want to delete this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (selectedMeal) {
            await deleteMeal(selectedMeal.id);
            router.back();
          }
        },
      },
    ]);
  };

  const handleSaveLabel = async () => {
    if (selectedMeal && labelValue.trim()) {
      await updateLabel(selectedMeal.id, labelValue.trim());
      setEditingLabel(false);
    }
  };

  if (isLoading || !selectedMeal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const meal = selectedMeal;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image or banner */}
        {meal.inputType === 'image' && meal.imageUrl ? (
          <View style={styles.imageBanner}>
            <Image source={{ uri: meal.imageUrl }} style={styles.heroImage} />
            <View style={styles.imageGradient} />
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.textBanner}>
            <TouchableOpacity style={styles.backBtnDark} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.bannerEmoji}>🍽️</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Label row */}
          <View style={styles.labelRow}>
            {editingLabel ? (
              <View style={styles.labelEditRow}>
                <TextInput
                  style={styles.labelInput}
                  value={labelValue}
                  onChangeText={setLabelValue}
                  autoFocus
                  onSubmitEditing={handleSaveLabel}
                />
                <TouchableOpacity onPress={handleSaveLabel} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingLabel(true)} style={styles.labelTouchable}>
                <Text style={styles.labelText}>{meal.label}</Text>
                <Ionicons name="pencil" size={14} color={colors.textMuted} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.timeText}>Logged at {formatDateTime(meal.timestamp)}</Text>

          <Text style={styles.totalCalories}>{meal.totalCalories} <Text style={styles.kcalUnit}>kcal</Text></Text>

          {/* Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Breakdown</Text>
            {meal.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPortion}>{item.portion}</Text>
                </View>
                <Text style={styles.itemCal}>{item.calories} kcal</Text>
              </View>
            ))}
          </View>

          {/* Pros */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pros</Text>
            {meal.pros.map((p, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accent} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </View>

          {/* Cons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cons</Text>
            {meal.cons.map((c, i) => (
              <View key={i} style={styles.bulletRow}>
                <Ionicons name="close-circle" size={16} color={colors.danger} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{c}</Text>
              </View>
            ))}
          </View>

          {/* Fun Fact */}
          <View style={styles.funFactCard}>
            <Text style={styles.funFactEmoji}>💡</Text>
            <Text style={styles.funFactText}>{meal.funFact}</Text>
          </View>

          {/* Delete */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Delete Meal</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  imageBanner: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: 280 },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  textBanner: {
    height: 140,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtnDark: { position: 'absolute', top: 16, left: 16, padding: 8 },
  bannerEmoji: { fontSize: 56 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  labelRow: { marginBottom: 6 },
  labelTouchable: { flexDirection: 'row', alignItems: 'center' },
  labelText: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  labelEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  labelInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  timeText: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  totalCalories: { fontSize: 52, fontWeight: '800', color: colors.accent, letterSpacing: -1.5, marginBottom: 24 },
  kcalUnit: { fontSize: 22, fontWeight: '500', color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  itemPortion: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemCal: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletIcon: { marginRight: 8, marginTop: 1 },
  bulletText: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  funFactCard: {
    backgroundColor: colors.elevated,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  funFactEmoji: { fontSize: 22 },
  funFactText: { color: colors.textSecondary, fontSize: 14, fontStyle: 'italic', flex: 1, lineHeight: 20 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginBottom: 12,
  },
  deleteBtnText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
