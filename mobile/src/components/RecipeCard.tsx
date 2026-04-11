import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import type { Recipe } from '../db/recipes.db';

interface Props {
  recipe: Recipe;
  onPress: () => void;
}

export function RecipeCard({ recipe, onPress }: Props) {
  const date = new Date(recipe.updatedAt).toLocaleDateString();

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {recipe.heroImagePath ? (
        <Image source={{ uri: recipe.heroImagePath }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>
            {recipe.title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
        {recipe.description ? (
          <Text style={styles.description} numberOfLines={2}>{recipe.description}</Text>
        ) : null}
        <View style={styles.meta}>
          {recipe.servings ? (
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
          ) : null}
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
