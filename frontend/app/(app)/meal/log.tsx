import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../../../store/mealStore';
import { analyzeImage, analyzeText, getPresignedUrl, uploadImageToBlob } from '../../../services/api';
import { AIAnalysisResponse } from '../../../types';
import { colors } from '../../../constants/theme';

type Step = 1 | 2 | 3 | 4;
type InputType = 'image' | 'text';

function StepIndicator({ current }: { current: Step }) {
  return (
    <View style={styles.stepRow}>
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <View key={s} style={[styles.stepDot, current >= s && styles.stepDotActive]} />
      ))}
    </View>
  );
}

export default function LogMealScreen() {
  const [step, setStep] = useState<Step>(1);
  const [inputType, setInputType] = useState<InputType>('text');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [descriptionEdited, setDescriptionEdited] = useState(false);
  const [descriptionOnlyMode, setDescriptionOnlyMode] = useState(false);
  const { logMeal, fetchTodayMeals } = useMealStore();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => (s - 1) as Step);
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 1) await launchCamera();
          if (idx === 2) await launchGallery();
        }
      );
    } else {
      Alert.alert('Select Image', '', [
        { text: 'Take Photo', onPress: launchCamera },
        { text: 'Gallery', onPress: launchGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const launchCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) await compressAndSet(result.assets[0].uri);
  };

  const launchGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Photo library permission required'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) await compressAndSet(result.assets[0].uri);
  };

  const compressAndSet = async (uri: string) => {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    setImageUri(compressed.uri);
  };

  const analyzeImageFlow = async () => {
    if (!imageUri) return;
    setIsLoading(true);
    try {
      setLoadingMsg('Uploading image...');
      const { uploadUrl, blobUrl: url } = await getPresignedUrl('meal.jpg');
      await uploadImageToBlob(uploadUrl, imageUri);
      setBlobUrl(url);

      setLoadingMsg('Identifying your meal...');
      const result = await analyzeImage(url);
      // Only store the description — full calorie analysis happens after user confirms
      setAnalysis(null);
      setEditedDescription(result.description);
      setDescriptionEdited(false);
      setDescriptionOnlyMode(true);
      setStep(3);
    } catch (e: any) {
      Alert.alert('Analysis Failed', e?.response?.data?.detail ?? 'Could not analyze image. Try describing it in text.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const analyzeTextFlow = async (desc?: string) => {
    const text = desc ?? textDescription;
    if (!text.trim()) return;
    setIsLoading(true);
    setLoadingMsg('Analyzing your meal...');
    try {
      const result = await analyzeText(text);
      setAnalysis(result);
      setEditedDescription(result.description);
      setDescriptionEdited(false);
      setDescriptionOnlyMode(false);
      setStep(3);
    } catch (e: any) {
      Alert.alert('Analysis Failed', e?.response?.data?.detail ?? 'Could not analyze. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const reanalyze = async () => {
    setIsLoading(true);
    setLoadingMsg('Re-analyzing...');
    try {
      const result = await analyzeText(editedDescription);
      setAnalysis(result);
      setEditedDescription(result.description);
      setDescriptionEdited(false);
      setStep(4);
    } catch (e: any) {
      Alert.alert('Re-analysis Failed', 'Could not re-analyze. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const acceptDescription = async () => {
    if (descriptionOnlyMode) {
      // Image flow: do full calorie analysis on the confirmed/edited description
      setIsLoading(true);
      setLoadingMsg('Calculating calories...');
      try {
        const result = await analyzeText(editedDescription);
        setAnalysis(result);
        setDescriptionOnlyMode(false);
        setStep(4);
      } catch (e: any) {
        Alert.alert('Analysis Failed', 'Could not calculate calories. Please try again.');
      } finally {
        setIsLoading(false);
        setLoadingMsg('');
      }
    } else {
      // Text flow with no edits — analysis already exists
      setStep(4);
    }
  };

  const confirmLog = async () => {
    if (!analysis) return;
    setIsLoading(true);
    try {
      const now = new Date();
      const localDate = now.toLocaleDateString('en-CA');
      const timestamp = now.toISOString();
      await logMeal({
        date: localDate,
        timestamp,
        label: 'auto',
        inputType,
        imageUrl: blobUrl ?? null,
        aiDescription: analysis.description,
        userEditedDescription: descriptionEdited ? editedDescription : null,
        items: analysis.items,
        totalCalories: analysis.totalCalories,
        pros: analysis.pros,
        cons: analysis.cons,
        funFact: analysis.funFact,
      });
      await fetchTodayMeals();
      router.replace('/(app)/');
    } catch (e: any) {
      Alert.alert('Error', 'Could not save meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{loadingMsg}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log a Meal</Text>
        <View style={{ width: 38 }} />
      </View>

      <StepIndicator current={step} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1 — Choose input type */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>How would you like to log?</Text>
              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => { setInputType('image'); setStep(2); }}
                activeOpacity={0.75}
              >
                <Text style={styles.choiceEmoji}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitle}>Take a Photo</Text>
                  <Text style={styles.choiceSub}>Snap or upload a food photo for AI analysis</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => { setInputType('text'); setStep(2); }}
                activeOpacity={0.75}
              >
                <Text style={styles.choiceEmoji}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitle}>Describe Your Meal</Text>
                  <Text style={styles.choiceSub}>Type what you ate for quick AI analysis</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Image or Text input */}
          {step === 2 && inputType === 'image' && (
            <View>
              <Text style={styles.stepTitle}>Select a food photo</Text>
              {imageUri ? (
                <View>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
                    <Text style={styles.changePhotoBtnText}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={analyzeImageFlow} activeOpacity={0.8}>
                    <Text style={styles.primaryBtnText}>Analyze Meal</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.75}>
                  <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.imagePickerText}>Tap to select a photo</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 2 && inputType === 'text' && (
            <View>
              <Text style={styles.stepTitle}>Describe your meal</Text>
              <TextInput
                style={styles.textArea}
                placeholder="e.g. '2 rotis with dal, 1 cup rice, small bowl of yogurt'"
                placeholderTextColor={colors.textMuted}
                value={textDescription}
                onChangeText={setTextDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{textDescription.length} chars</Text>
              <TouchableOpacity
                style={[styles.primaryBtn, !textDescription.trim() && styles.btnDisabled]}
                onPress={() => analyzeTextFlow()}
                disabled={!textDescription.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>Analyze Meal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3 — Review AI description */}
          {step === 3 && (analysis || descriptionOnlyMode) && (
            <View>
              <Text style={styles.stepTitle}>Does this look right?</Text>
              <Text style={styles.stepHint}>
                {descriptionOnlyMode
                  ? 'Edit quantities or details if needed — calories will be calculated from this description'
                  : 'Edit the description if anything is wrong, then accept'}
              </Text>
              <TextInput
                style={[styles.textArea, { minHeight: 120 }]}
                value={editedDescription}
                onChangeText={(t) => {
                  setEditedDescription(t);
                  if (!descriptionOnlyMode && analysis) {
                    setDescriptionEdited(t !== analysis.description);
                  }
                }}
                multiline
                textAlignVertical="top"
              />
              {/* Re-analyze only shown for text-input path when user edits */}
              {!descriptionOnlyMode && descriptionEdited && (
                <TouchableOpacity style={styles.outlineBtn} onPress={reanalyze} activeOpacity={0.8}>
                  <Text style={styles.outlineBtnText}>Re-analyze</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={acceptDescription}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryBtnText}>✓ Accept</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4 — Summary & confirmation */}
          {step === 4 && analysis && (
            <View>
              <Text style={styles.stepTitle}>Calorie Summary</Text>

              <View style={styles.totalHero}>
                <Text style={styles.totalNumber}>{analysis.totalCalories}</Text>
                <Text style={styles.totalUnit}>kcal</Text>
              </View>

              {/* Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Breakdown</Text>
                {analysis.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPortion}>{item.portion}</Text>
                    </View>
                    <Text style={styles.itemCal}>{item.calories} kcal</Text>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalCal}>{analysis.totalCalories} kcal</Text>
                </View>
              </View>

              {/* Pros */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pros</Text>
                {analysis.pros.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.accent} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{p}</Text>
                  </View>
                ))}
              </View>

              {/* Cons */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cons</Text>
                {analysis.cons.map((c, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Ionicons name="close-circle" size={16} color={colors.danger} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{c}</Text>
                  </View>
                ))}
              </View>

              {/* Fun Fact */}
              <View style={styles.funFactCard}>
                <Text style={styles.funFactEmoji}>💡</Text>
                <Text style={styles.funFactText}>{analysis.funFact}</Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={confirmLog} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>✓ Confirm & Log</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={() => router.replace('/(app)/')} activeOpacity={0.8}>
                <Text style={styles.ghostBtnText}>✗ Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: { color: colors.textPrimary, fontSize: 16, marginTop: 16, fontWeight: '500' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  stepDotActive: { backgroundColor: colors.accent },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  stepTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  stepHint: { color: colors.textSecondary, fontSize: 13, marginBottom: 16 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  choiceEmoji: { fontSize: 32 },
  choiceTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  choiceSub: { color: colors.textSecondary, fontSize: 13 },
  imagePicker: {
    height: 220,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  imagePickerText: { color: colors.textSecondary, fontSize: 15 },
  imagePreview: { width: '100%', height: 240, borderRadius: 16, marginBottom: 14 },
  changePhotoBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 14,
  },
  changePhotoBtnText: { color: colors.textSecondary, fontSize: 14 },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 160,
    marginBottom: 8,
  },
  charCount: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginBottom: 16 },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  outlineBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  outlineBtnText: { color: colors.accent, fontWeight: '600', fontSize: 15 },
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 15 },
  totalHero: { alignItems: 'center', paddingVertical: 24 },
  totalNumber: { fontSize: 72, fontWeight: '800', color: colors.accent, letterSpacing: -2, lineHeight: 76 },
  totalUnit: { color: colors.textSecondary, fontSize: 18, marginTop: -4 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  itemPortion: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  itemCal: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  totalLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  totalCal: { color: colors.accent, fontWeight: '700', fontSize: 15 },
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
    marginBottom: 24,
    gap: 12,
  },
  funFactEmoji: { fontSize: 22 },
  funFactText: { color: colors.textSecondary, fontSize: 14, fontStyle: 'italic', flex: 1, lineHeight: 20 },
});
