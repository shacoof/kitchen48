import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getRecipeById, deleteRecipe, type RecipeWithSteps } from '../../src/db/recipes-db';
import { deleteRecipeMedia } from '../../src/services/media-storage';
import { VideoPlayer } from '../../src/components/VideoPlayer';
import { createLogger } from '../../src/lib/logger';

const logger = createLogger('RecipeDetail');

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation('common');
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeWithSteps | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        getRecipeById(id).then(setRecipe);
      }
    }, [id])
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      t('buttons.delete'),
      `Delete "${recipe?.title}"?`,
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        {
          text: t('buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await deleteRecipeMedia(id);
            await deleteRecipe(id);
            logger.debug(`Deleted recipe: ${id}`);
            router.back();
          },
        },
      ]
    );
  }, [id, recipe?.title, t, router]);

  const handleEdit = useCallback(() => {
    router.push(`/create/manual?recipeId=${id}`);
  }, [id, router]);

  if (!recipe) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{t('messages.loading')}</Text>
      </View>
    );
  }

  const totalPrepTime = recipe.steps.reduce((sum, s) => sum + (s.prepTime ?? 0), 0);
  const totalWaitTime = recipe.steps.reduce((sum, s) => sum + (s.waitTime ?? 0), 0);
  const allIngredients = recipe.steps.flatMap((s) => s.ingredients);

  return (
    <ScrollView style={styles.container}>
      {/* Hero image */}
      {recipe.heroImagePath ? (
        <Image source={{ uri: recipe.heroImagePath }} style={styles.heroImage} />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroInitial}>{recipe.title.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      {/* Title & description */}
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description ? (
          <Text style={styles.description}>{recipe.description}</Text>
        ) : null}

        {/* Metadata row */}
        <View style={styles.metaRow}>
          {recipe.servings ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{recipe.servings}</Text>
              <Text style={styles.metaLabel}>servings</Text>
            </View>
          ) : null}
          {totalPrepTime > 0 ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{totalPrepTime}</Text>
              <Text style={styles.metaLabel}>min prep</Text>
            </View>
          ) : null}
          {totalWaitTime > 0 ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaValue}>{totalWaitTime}</Text>
              <Text style={styles.metaLabel}>min cook</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Text style={styles.metaValue}>{recipe.steps.length}</Text>
            <Text style={styles.metaLabel}>steps</Text>
          </View>
        </View>

        {/* Ingredients summary */}
        {allIngredients.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {allIngredients.map((ing) => (
              <Text key={ing.id} style={styles.ingredientItem}>
                {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.name}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Steps overview */}
        {recipe.steps.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {recipe.steps.map((step, idx) => (
              <View key={step.id} style={styles.stepItem}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepDotText}>{idx + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>
                    {step.title || `Step ${idx + 1}`}
                  </Text>
                  {step.instruction ? (
                    <Text style={styles.stepInstruction} numberOfLines={2}>
                      {step.instruction}
                    </Text>
                  ) : null}
                  {step.imagePath ? (
                    <Image source={{ uri: step.imagePath }} style={styles.stepImage} />
                  ) : null}
                  {step.videoPath ? (
                    <VideoPlayer uri={step.videoPath} height={160} />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>{t('buttons.edit')}</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>{t('buttons.delete')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#94a3b8' },
  heroImage: { width: '100%', height: 220 },
  heroPlaceholder: {
    width: '100%', height: 220, backgroundColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInitial: { fontSize: 64, fontWeight: '700', color: '#ffffff' },
  content: { padding: 20 },
  title: { fontSize: 26, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  description: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metaChip: {
    backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center',
  },
  metaValue: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  metaLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  ingredientItem: { fontSize: 15, color: '#334155', paddingVertical: 3 },
  stepItem: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#334155',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
  },
  stepDotText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  stepInstruction: { fontSize: 13, color: '#64748b', marginTop: 2 },
  stepImage: { width: '100%', height: 140, borderRadius: 8, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  editButton: {
    flex: 1, backgroundColor: '#334155', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  deleteButton: {
    flex: 1, backgroundColor: '#fee2e2', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
