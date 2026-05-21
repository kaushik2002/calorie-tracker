import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../../store/mealStore';
import MealCard from '../../components/MealCard';
import { colors } from '../../constants/theme';

export default function CalendarScreen() {
  const today = new Date().toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState(today);
  const { selectedDateMeals, fetchMealsByDate, isLoading } = useMealStore();

  useEffect(() => {
    fetchMealsByDate(selectedDate);
  }, [selectedDate]);

  const totalForDay = selectedDateMeals.reduce((sum, m) => sum + m.totalCalories, 0);

  // Build marked dates from today's meals (simplified — in full app you'd fetch all dates)
  const markedDates: Record<string, any> = {
    [selectedDate]: {
      selected: true,
      selectedColor: colors.accent,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal History</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Calendar
          current={today}
          onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            calendarBackground: colors.surface,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.accent,
            selectedDayTextColor: '#000',
            todayTextColor: colors.accent,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textMuted,
            dotColor: colors.accent,
            selectedDotColor: '#000',
            arrowColor: colors.accent,
            monthTextColor: colors.textPrimary,
            indicatorColor: colors.accent,
            textDayFontWeight: '500',
            textMonthFontWeight: '700',
            textDayHeaderFontWeight: '600',
            backgroundColor: colors.surface,
          }}
          style={styles.calendar}
        />

        <View style={styles.daySection}>
          <View style={styles.daySummary}>
            <Text style={styles.dayDate}>{selectedDate}</Text>
            {selectedDateMeals.length > 0 && (
              <Text style={styles.dayTotal}>{totalForDay} kcal</Text>
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
          ) : selectedDateMeals.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>No meals logged on this day</Text>
            </View>
          ) : (
            selectedDateMeals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onPress={() => router.push(`/(app)/meal/${meal.id}`)}
              />
            ))
          )}
        </View>

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  calendar: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  daySection: { paddingHorizontal: 20 },
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayDate: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  dayTotal: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 15 },
});
