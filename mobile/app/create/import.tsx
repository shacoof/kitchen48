import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { importRecipeFromUrl, ImportError } from '../../src/services/recipe-import';
import { createLogger } from '../../src/lib/logger';

const logger = createLogger('ImportScreen');

export default function ImportScreen() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert(t('import.invalid_url_title'), t('import.invalid_url_body'));
      return;
    }
    setImporting(true);
    try {
      const result = await importRecipeFromUrl(trimmed);
      Alert.alert(
        t('import.done_title'),
        t('import.done_body', {
          title: result.title,
          downloaded: result.mediaDownloaded,
          skipped: result.mediaSkipped,
        }),
        [
          {
            text: t('import.view_recipe'),
            onPress: () => router.replace(`/recipe/${result.recipeId}`),
          },
          { text: t('buttons.close'), style: 'cancel', onPress: () => router.back() },
        ]
      );
    } catch (err) {
      const msg = err instanceof ImportError ? err.message : String(err);
      logger.error(`Import failed: ${msg}`);
      Alert.alert(t('import.failed_title'), msg);
    } finally {
      setImporting(false);
    }
  }, [url, t, router]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('import.title')}</Text>
      <Text style={styles.description}>{t('import.description')}</Text>

      <Text style={styles.label}>{t('import.url_label')}</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        placeholder={t('import.url_placeholder')}
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!importing}
      />

      <Text style={styles.hint}>{t('import.url_hint')}</Text>

      <Pressable
        style={[styles.button, (importing || !url.trim()) && styles.buttonDisabled]}
        onPress={handleImport}
        disabled={importing || !url.trim()}
      >
        {importing ? (
          <View style={styles.row}>
            <ActivityIndicator color="#ffffff" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>{t('import.importing')}</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{t('buttons.import')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  description: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#ffffff', color: '#0f172a',
  },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 6, marginBottom: 20, lineHeight: 18 },
  button: {
    backgroundColor: '#334155', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
