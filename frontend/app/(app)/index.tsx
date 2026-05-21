import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../../store/mealStore';
import { useAuthStore } from '../../store/authStore';
import MealCard from '../../components/MealCard';
import { colors } from '../../constants/theme';

const DAILY_GOAL = 2000;

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function HomeScreen() {
  const { todayMeals, fetchTodayMeals, isLoading } = useMealStore();
  const { logout, username } = useAuthStore();

  useEffect(() => {
    fetchTodayMeals();
  }, []);

  const onRefresh = useCallback(() => {
    fetchTodayMeals();
  }, []);

  const totalCalories = todayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const progress = Math.min(totalCalories / DAILY_GOAL, 1);
  const isOver = totalCalories > DAILY_GOAL;

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(new Date())}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/(app)/calendar')} style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Calorie Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.calNumber}>{totalCalories.toLocaleString()}</Text>
          <Text style={styles.calLabel}>kcal today</Text>

          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%` as any, backgroundColor: isOver ? colors.danger : colors.accent },
              ]}
            />
          </View>

          <View style={styles.progressMeta}>
            <Text style={styles.progressGoal}>Goal: {DAILY_GOAL.toLocaleString()} kcal</Text>
            {isOver && (
              <Text style={styles.overWarning}>
                +{(totalCalories - DAILY_GOAL).toLocaleString()} over
              </Text>
            )}
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsHeader}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          <Text style={styles.mealCount}>{todayMeals.length} logged</Text>
        </View>

        {todayMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Nothing logged yet today</Text>
            <Text style={styles.emptySubtitle}>Tap + below to add your first meal</Text>
          </View>
        ) : (
          todayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onPress={() => router.push(`/(app)/meal/${meal.id}`)}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  calNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 68,
  },
  calLabel: { color: colors.textSecondary, fontSize: 16, marginBottom: 20 },
  progressBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3 },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  progressGoal: { color: colors.textMuted, fontSize: 12 },
  overWarning: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  mealCount: { color: colors.textMuted, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
});
