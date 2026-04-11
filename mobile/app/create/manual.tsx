import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Pressable, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  createRecipe, updateRecipe, getRecipeById,
  createStep, updateStep, deleteStep,
  createIngredient, updateIngredient, deleteIngredient,
  type RecipeWithSteps, type StepWithIngredients, type StepIngredient,
} from '../../src/db/recipes.db';
import { useAutoSave } from '../../src/hooks/useAutoSave';
import { SaveStatus } from '../../src/components/SaveStatus';
import { createLogger } from '../../src/lib/logger';

const logger = createLogger('ManualCreate');

interface StepForm {
  id: string | null;
  title: string;
  instruction: string;
  prepTime: string;
  waitTime: string;
  ingredients: IngredientForm[];
}

interface IngredientForm {
  id: string | null;
  name: string;
  quantity: string;
  unit: string;
}

export default function ManualCreateScreen() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeId?: string }>();

  const [recipeId, setRecipeId] = useState<string | null>(params.recipeId ?? null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('');
  const [steps, setSteps] = useState<StepForm[]>([]);

  const saveFn = useCallback(async (data: { title: string; description: string; servings: string }) => {
    if (!recipeId || !data.title.trim()) return;
    await updateRecipe(recipeId, {
      title: data.title.trim(),
      description: data.description.trim() || null,
      servings: data.servings ? parseInt(data.servings, 10) : null,
    });
  }, [recipeId]);

  const { status, scheduleSave, markLoaded } = useAutoSave(saveFn);

  // Load existing recipe in edit mode
  useEffect(() => {
    if (params.recipeId) {
      getRecipeById(params.recipeId).then((recipe) => {
        if (recipe) {
          setTitle(recipe.title);
          setDescription(recipe.description ?? '');
          setServings(recipe.servings?.toString() ?? '');
          setSteps(recipe.steps.map(mapStepToForm));
          setTimeout(() => markLoaded(), 100);
        }
      });
    }
  }, [params.recipeId, markLoaded]);

  function mapStepToForm(step: StepWithIngredients): StepForm {
    return {
      id: step.id,
      title: step.title ?? '',
      instruction: step.instruction ?? '',
      prepTime: step.prepTime?.toString() ?? '',
      waitTime: step.waitTime?.toString() ?? '',
      ingredients: step.ingredients.map(mapIngredientToForm),
    };
  }

  function mapIngredientToForm(ing: StepIngredient): IngredientForm {
    return {
      id: ing.id,
      name: ing.name,
      quantity: ing.quantity?.toString() ?? '',
      unit: ing.unit ?? '',
    };
  }

  const handleFieldChange = useCallback((field: string, value: string) => {
    if (field === 'title') setTitle(value);
    else if (field === 'description') setDescription(value);
    else if (field === 'servings') setServings(value);

    if (recipeId) {
      const data = {
        title: field === 'title' ? value : title,
        description: field === 'description' ? value : description,
        servings: field === 'servings' ? value : servings,
      };
      scheduleSave(data);
    }
  }, [recipeId, title, description, servings, scheduleSave]);

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;
    const id = await createRecipe({
      title: title.trim(),
      description: description.trim() || undefined,
      servings: servings ? parseInt(servings, 10) : undefined,
    });
    setRecipeId(id);
    markLoaded();
    logger.debug(`Created recipe: ${id}`);
  }, [title, description, servings, markLoaded]);

  const handleAddStep = useCallback(async () => {
    if (!recipeId) {
      await handleCreate();
      return;
    }
    const order = steps.length + 1;
    const stepId = await createStep({ recipeId, sortOrder: order });
    setSteps((prev) => [...prev, {
      id: stepId, title: '', instruction: '', prepTime: '', waitTime: '', ingredients: [],
    }]);
  }, [recipeId, steps.length, handleCreate]);

  const handleStepChange = useCallback(async (index: number, field: keyof StepForm, value: string) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    const step = steps[index];
    if (step?.id) {
      const input: Record<string, string | number | null> = {};
      if (field === 'title') input.title = value || null;
      if (field === 'instruction') input.instruction = value || null;
      if (field === 'prepTime') input.prepTime = value ? parseFloat(value) : null;
      if (field === 'waitTime') input.waitTime = value ? parseFloat(value) : null;
      if (Object.keys(input).length > 0) {
        await updateStep(step.id, input);
      }
    }
  }, [steps]);

  const handleDeleteStep = useCallback(async (index: number) => {
    const step = steps[index];
    if (step?.id) {
      await deleteStep(step.id);
    }
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }, [steps]);

  const handleAddIngredient = useCallback(async (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step?.id) return;
    const ingId = await createIngredient({
      stepId: step.id,
      name: '',
      sortOrder: step.ingredients.length + 1,
    });
    setSteps((prev) => {
      const updated = [...prev];
      updated[stepIndex] = {
        ...updated[stepIndex],
        ingredients: [...updated[stepIndex].ingredients, { id: ingId, name: '', quantity: '', unit: '' }],
      };
      return updated;
    });
  }, [steps]);

  const handleIngredientChange = useCallback(async (
    stepIndex: number, ingIndex: number, field: keyof IngredientForm, value: string
  ) => {
    setSteps((prev) => {
      const updated = [...prev];
      const updatedIngs = [...updated[stepIndex].ingredients];
      updatedIngs[ingIndex] = { ...updatedIngs[ingIndex], [field]: value };
      updated[stepIndex] = { ...updated[stepIndex], ingredients: updatedIngs };
      return updated;
    });

    const ing = steps[stepIndex]?.ingredients[ingIndex];
    if (ing?.id) {
      const input: Record<string, string | number | null> = {};
      if (field === 'name') input.name = value;
      if (field === 'quantity') input.quantity = value ? parseFloat(value) : null;
      if (field === 'unit') input.unit = value || null;
      if (Object.keys(input).length > 0) {
        await updateIngredient(ing.id, input);
      }
    }
  }, [steps]);

  const handleDeleteIngredient = useCallback(async (stepIndex: number, ingIndex: number) => {
    const ing = steps[stepIndex]?.ingredients[ingIndex];
    if (ing?.id) {
      await deleteIngredient(ing.id);
    }
    setSteps((prev) => {
      const updated = [...prev];
      updated[stepIndex] = {
        ...updated[stepIndex],
        ingredients: updated[stepIndex].ingredients.filter((_, i) => i !== ingIndex),
      };
      return updated;
    });
  }, [steps]);

  const handleDone = useCallback(async () => {
    if (!recipeId && title.trim()) {
      await handleCreate();
    }
    router.back();
  }, [recipeId, title, handleCreate, router]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <SaveStatus status={status} />

      {/* Recipe fields */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={(v) => handleFieldChange('title', v)}
        placeholder="Recipe title"
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={(v) => handleFieldChange('description', v)}
        placeholder="Short description"
        placeholderTextColor="#94a3b8"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Servings</Text>
      <TextInput
        style={styles.input}
        value={servings}
        onChangeText={(v) => handleFieldChange('servings', v)}
        placeholder="4"
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
      />

      {/* Steps */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Steps</Text>
      </View>

      {steps.map((step, stepIdx) => (
        <View key={step.id ?? stepIdx} style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <Text style={styles.stepNumber}>Step {stepIdx + 1}</Text>
            <Pressable onPress={() => handleDeleteStep(stepIdx)}>
              <Text style={styles.deleteText}>{t('buttons.delete')}</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.input}
            value={step.title}
            onChangeText={(v) => handleStepChange(stepIdx, 'title', v)}
            placeholder="Step title (optional)"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={step.instruction}
            onChangeText={(v) => handleStepChange(stepIdx, 'instruction', v)}
            placeholder="Instructions..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
          />

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.smallLabel}>Prep (min)</Text>
              <TextInput
                style={styles.inputSmall}
                value={step.prepTime}
                onChangeText={(v) => handleStepChange(stepIdx, 'prepTime', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.smallLabel}>Wait (min)</Text>
              <TextInput
                style={styles.inputSmall}
                value={step.waitTime}
                onChangeText={(v) => handleStepChange(stepIdx, 'waitTime', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Ingredients */}
          <Text style={styles.ingredientsLabel}>Ingredients</Text>
          {step.ingredients.map((ing, ingIdx) => (
            <View key={ing.id ?? ingIdx} style={styles.ingredientRow}>
              <TextInput
                style={[styles.inputSmall, { flex: 2 }]}
                value={ing.name}
                onChangeText={(v) => handleIngredientChange(stepIdx, ingIdx, 'name', v)}
                placeholder="Ingredient"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={[styles.inputSmall, { flex: 0.7 }]}
                value={ing.quantity}
                onChangeText={(v) => handleIngredientChange(stepIdx, ingIdx, 'quantity', v)}
                placeholder="Qty"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.inputSmall, { flex: 0.7 }]}
                value={ing.unit}
                onChangeText={(v) => handleIngredientChange(stepIdx, ingIdx, 'unit', v)}
                placeholder="Unit"
                placeholderTextColor="#94a3b8"
              />
              <Pressable onPress={() => handleDeleteIngredient(stepIdx, ingIdx)} style={styles.deleteIngBtn}>
                <Text style={styles.deleteIngText}>X</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addIngButton} onPress={() => handleAddIngredient(stepIdx)}>
            <Text style={styles.addIngText}>+ Ingredient</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.addStepButton} onPress={handleAddStep}>
        <Text style={styles.addStepText}>+ {t('buttons.add')} Step</Text>
      </Pressable>

      <Pressable style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </Pressable>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 4, marginTop: 12 },
  smallLabel: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  input: {
    backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4,
  },
  inputSmall: {
    backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, color: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  stepCard: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepNumber: { fontSize: 15, fontWeight: '700', color: '#334155' },
  deleteText: { fontSize: 13, color: '#ef4444' },
  timeRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  timeField: { flex: 1 },
  ingredientsLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 12, marginBottom: 6 },
  ingredientRow: { flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' },
  deleteIngBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  deleteIngText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  addIngButton: { paddingVertical: 6 },
  addIngText: { fontSize: 13, color: '#3b82f6', fontWeight: '500' },
  addStepButton: {
    backgroundColor: '#334155', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 8,
  },
  addStepText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  doneButton: {
    backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 12,
  },
  doneButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
