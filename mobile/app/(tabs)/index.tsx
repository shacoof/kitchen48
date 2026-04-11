import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { listRecipes, type Recipe } from '../../src/db/recipes-db';
import { RecipeCard } from '../../src/components/RecipeCard';
import { SearchBar } from '../../src/components/SearchBar';

export default function HomeScreen() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    const results = await listRecipes(search || undefined);
    setRecipes(results);
    setIsLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
  }, []);

  if (!isLoading && recipes.length === 0 && !search) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Kitchen48</Text>
        <Text style={styles.emptySubtitle}>{t('messages.no_recipes')}</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => router.push('/create/manual')}
        >
          <Text style={styles.createButtonText}>{t('create.manual')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={handleSearch} />
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.noResults}>No recipes found</Text>
          ) : null
        }
        contentContainerStyle={recipes.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
