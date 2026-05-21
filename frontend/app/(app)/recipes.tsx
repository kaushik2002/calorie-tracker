import { useState } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { analyzeRecipesFromImage, analyzeRecipesFromText, getPresignedUrl, uploadImageToBlob } from '../../services/api';
import { RecipeAnalysisResponse, Recipe, EnhancedRecipe } from '../../types';
import { colors } from '../../constants/theme';

type Step = 1 | 2 | 3;
type InputType = 'image' | 'text';

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy: colors.accent,
  Medium: colors.warning,
  Hard: colors.danger,
};

function RecipeModal({ recipe, enhanced, onClose }: {
  recipe: Recipe | EnhancedRecipe | null;
  enhanced: boolean;
  onClose: () => void;
}) {
  if (!recipe) return null;
  const enhancedRecipe = recipe as EnhancedRecipe;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modal.container}>
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={modal.headerTitle} numberOfLines={1}>{recipe.name}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modal.scroll}>
          {/* Hero info */}
          <View style={modal.heroRow}>
            <View style={modal.heroBadge}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={modal.heroBadgeText}>Serves {recipe.servings}</Text>
            </View>
            <View style={modal.heroBadge}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={modal.heroBadgeText}>{recipe.prepTime} prep</Text>
            </View>
            <View style={modal.heroBadge}>
              <Ionicons name="flame-outline" size={14} color={colors.textSecondary} />
              <Text style={modal.heroBadgeText}>{recipe.cookTime} cook</Text>
            </View>
            <View style={[modal.heroBadge, { borderColor: DIFFICULTY_COLOR[recipe.difficulty] }]}>
              <Text style={[modal.heroBadgeText, { color: DIFFICULTY_COLOR[recipe.difficulty] }]}>
                {recipe.difficulty}
              </Text>
            </View>
          </View>

          <Text style={modal.description}>{recipe.description}</Text>

          <View style={modal.calCard}>
            <Text style={modal.calNumber}>{recipe.caloriesPerServing}</Text>
            <Text style={modal.calLabel}>kcal per serving</Text>
          </View>

          {/* Extra ingredients needed (enhanced only) */}
          {enhanced && enhancedRecipe.extraIngredients?.length > 0 && (
            <View style={modal.section}>
              <View style={modal.sectionHeadRow}>
                <Ionicons name="cart-outline" size={16} color={colors.warning} />
                <Text style={[modal.sectionTitle, { color: colors.warning }]}>PICK UP THESE EXTRAS</Text>
              </View>
              {enhancedRecipe.extraIngredients.map((extra, i) => (
                <View key={i} style={modal.extraRow}>
                  <View style={modal.extraLeft}>
                    <Text style={modal.extraName}>{extra.name}</Text>
                    <Text style={modal.extraQty}>{extra.quantity}</Text>
                  </View>
                  <Text style={modal.extraWhy}>{extra.why}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={modal.section}>
            <View style={modal.sectionHeadRow}>
              <Ionicons name="list-outline" size={16} color={colors.textSecondary} />
              <Text style={modal.sectionTitle}>INGREDIENTS</Text>
            </View>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={modal.ingRow}>
                <View style={modal.ingDot} />
                <Text style={modal.ingName}>{ing.name}</Text>
                <Text style={modal.ingQty}>{ing.quantity}</Text>
              </View>
            ))}
          </View>

          {/* Steps */}
          <View style={modal.section}>
            <View style={modal.sectionHeadRow}>
              <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
              <Text style={modal.sectionTitle}>METHOD</Text>
            </View>
            {recipe.steps.map((step, i) => (
              <View key={i} style={modal.stepRow}>
                <View style={modal.stepNum}>
                  <Text style={modal.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={modal.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RecipeCard({ recipe, enhanced, onPress }: {
  recipe: Recipe | EnhancedRecipe;
  enhanced: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.recipeCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.recipeCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.recipeDesc} numberOfLines={2}>{recipe.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
      <View style={styles.recipeCardMeta}>
        <View style={styles.metaChip}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaChipText}>Serves {recipe.servings}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaChipText}>{recipe.prepTime} + {recipe.cookTime}</Text>
        </View>
        <View style={[styles.metaChip, { borderColor: DIFFICULTY_COLOR[recipe.difficulty] + '44' }]}>
          <Text style={[styles.metaChipText, { color: DIFFICULTY_COLOR[recipe.difficulty] }]}>
            {recipe.difficulty}
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={[styles.metaChipText, { color: colors.accent }]}>{recipe.caloriesPerServing} kcal</Text>
        </View>
      </View>
      {enhanced && (
        <View style={styles.extraBadge}>
          <Ionicons name="cart-outline" size={11} color={colors.warning} />
          <Text style={styles.extraBadgeText}>
            +{(recipe as EnhancedRecipe).extraIngredients?.length ?? 0} extra items
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const [step, setStep] = useState<Step>(1);
  const [inputType, setInputType] = useState<InputType>('text');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState<RecipeAnalysisResponse | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | EnhancedRecipe | null>(null);
  const [selectedEnhanced, setSelectedEnhanced] = useState(false);

  const reset = () => {
    setStep(1);
    setImageUri(null);
    setTextInput('');
    setResult(null);
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
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!res.canceled) await compressAndSet(res.assets[0].uri);
  };

  const launchGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Photo library permission required'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!res.canceled) await compressAndSet(res.assets[0].uri);
  };

  const compressAndSet = async (uri: string) => {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    setImageUri(compressed.uri);
  };

  const analyzeImage = async () => {
    if (!imageUri) return;
    setIsLoading(true);
    try {
      setLoadingMsg('Uploading photo...');
      const { uploadUrl, blobUrl } = await getPresignedUrl('ingredients.jpg');
      await uploadImageToBlob(uploadUrl, imageUri);
      setLoadingMsg('Finding recipes...');
      const data = await analyzeRecipesFromImage(blobUrl);
      setResult(data);
      setStep(3);
    } catch (e: any) {
      Alert.alert('Analysis Failed', e?.response?.data?.detail ?? 'Could not analyze image. Try describing your ingredients.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const analyzeText = async () => {
    if (!textInput.trim()) return;
    setIsLoading(true);
    setLoadingMsg('Finding recipes...');
    try {
      const data = await analyzeRecipesFromText(textInput.trim());
      setResult(data);
      setStep(3);
    } catch (e: any) {
      Alert.alert('Analysis Failed', e?.response?.data?.detail ?? 'Could not find recipes. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  const openRecipe = (recipe: Recipe | EnhancedRecipe, enhanced: boolean) => {
    setSelectedRecipe(recipe);
    setSelectedEnhanced(enhanced);
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>{loadingMsg}</Text>
        </View>
      )}

      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={step === 3 ? reset : () => setStep(1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
        <Text style={styles.headerTitle}>Healthy Recipes</Text>
        {step === 3 ? (
          <TouchableOpacity onPress={reset} style={styles.backBtn}>
            <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — Choose input */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>What's in your kitchen?</Text>
              <Text style={styles.stepSub}>Photo your ingredients or list what you have — AI finds the best recipes for you.</Text>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => { setInputType('image'); setStep(2); }}
                activeOpacity={0.75}
              >
                <Text style={styles.choiceEmoji}>📷</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceTitle}>Photo Your Ingredients</Text>
                  <Text style={styles.choiceSub}>Snap what's in your fridge or pantry</Text>
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
                  <Text style={styles.choiceTitle}>List Your Ingredients</Text>
                  <Text style={styles.choiceSub}>Type what you have available</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Input */}
          {step === 2 && inputType === 'image' && (
            <View>
              <Text style={styles.stepTitle}>Photo your ingredients</Text>
              <Text style={styles.stepSub}>Take a clear photo of your ingredients and we'll find recipes that match.</Text>
              {imageUri ? (
                <View>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                    <Text style={styles.changeBtnText}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={analyzeImage} activeOpacity={0.8}>
                    <Ionicons name="leaf-outline" size={18} color="#000" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Find Recipes</Text>
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
              <Text style={styles.stepTitle}>List your ingredients</Text>
              <Text style={styles.stepSub}>Be as specific as you like — the more detail, the better the recipes.</Text>
              <TextInput
                style={styles.textArea}
                placeholder={"e.g. chicken breast, garlic, onions, tomatoes, olive oil, pasta, basil..."}
                placeholderTextColor={colors.textMuted}
                value={textInput}
                onChangeText={setTextInput}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{textInput.length} chars</Text>
              <TouchableOpacity
                style={[styles.primaryBtn, !textInput.trim() && styles.btnDisabled]}
                onPress={analyzeText}
                disabled={!textInput.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="leaf-outline" size={18} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Find Recipes</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3 — Results */}
          {step === 3 && result && (
            <View>
              {/* Detected ingredients */}
              <View style={styles.ingredientsPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
                <Text style={styles.ingredientsText}>
                  Detected: {result.ingredientsIdentified.join(', ')}
                </Text>
              </View>

              {/* Recipes you can make now */}
              <Text style={styles.sectionHeading}>Ready to Cook</Text>
              <Text style={styles.sectionSubheading}>Recipes using exactly what you have</Text>
              {result.recipes.map((recipe, i) => (
                <RecipeCard
                  key={i}
                  recipe={recipe}
                  enhanced={false}
                  onPress={() => openRecipe(recipe, false)}
                />
              ))}

              {/* Enhanced recipes */}
              {result.enhancedRecipes.length > 0 && (
                <View style={styles.enhancedSection}>
                  <View style={styles.enhancedHeadRow}>
                    <Ionicons name="sparkles" size={18} color={colors.warning} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.enhancedHeading}>Level Up Your Meal</Text>
                      <Text style={styles.enhancedSubheading}>
                        Grab a few extra items to make something truly incredible
                      </Text>
                    </View>
                  </View>
                  {result.enhancedRecipes.map((recipe, i) => (
                    <RecipeCard
                      key={i}
                      recipe={recipe}
                      enhanced
                      onPress={() => openRecipe(recipe, true)}
                    />
                  ))}
                </View>
              )}

              <View style={{ height: 40 }} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <RecipeModal
        recipe={selectedRecipe}
        enhanced={selectedEnhanced}
        onClose={() => setSelectedRecipe(null)}
      />
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  stepTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  stepSub: { color: colors.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 20 },
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
    height: 200,
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
  imagePreview: { width: '100%', height: 220, borderRadius: 16, marginBottom: 14 },
  changeBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 14 },
  changeBtnText: { color: colors.textSecondary, fontSize: 14 },
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  ingredientsPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  ingredientsText: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  sectionHeading: { color: colors.textPrimary, fontSize: 19, fontWeight: '800', marginBottom: 4 },
  sectionSubheading: { color: colors.textSecondary, fontSize: 13, marginBottom: 16 },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipeCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  recipeName: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  recipeDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  recipeCardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipText: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  extraBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  extraBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  enhancedSection: {
    marginTop: 8,
    backgroundColor: colors.elevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.warning + '33',
  },
  enhancedHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  enhancedHeading: { color: colors.warning, fontSize: 17, fontWeight: '800' },
  enhancedSubheading: { color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  calCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calNumber: { fontSize: 48, fontWeight: '800', color: colors.accent, letterSpacing: -1 },
  calLabel: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  extraLeft: { width: 130 },
  extraName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  extraQty: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  extraWhy: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  ingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  ingName: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  ingQty: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: colors.accent, fontSize: 13, fontWeight: '700' },
  stepText: { color: colors.textPrimary, fontSize: 14, flex: 1, lineHeight: 21, paddingTop: 4 },
});
