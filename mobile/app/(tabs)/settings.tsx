import { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '../../src/components/ScaledText';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useScreenHeader } from '../../src/hooks/useScreenHeader';
import { useFontScale, FONT_SIZE_LEVELS } from '../../src/config/font-scale';

export default function SettingsScreen() {
  const { t } = useTranslation('common');
  const { level, setLevel } = useFontScale();

  useScreenHeader(useMemo(() => ({
    title: t('navigation.settings', 'Settings'),
  }), [t]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.font_size')}</Text>
        <Text style={styles.hint}>{t('settings.font_size_hint')}</Text>

        <View style={styles.options}>
          {FONT_SIZE_LEVELS.map(({ level: option }) => {
            const selected = option === level;
            return (
              <Pressable
                key={option}
                onPress={() => setLevel(option)}
                style={[styles.option, selected && styles.optionSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {t(`settings.font_size_${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewText}>{t('settings.font_size_preview')}</Text>
        </View>
      </View>

      <View style={[styles.section, styles.sectionSpaced]}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <Text style={styles.hint}>
          {t('settings.version', { version: Constants.expoConfig?.version ?? '?' })}
        </Text>
        {/* Shows which OTA update is running, so a published update can be confirmed on the phone */}
        <Text style={styles.hint}>
          {Updates.isEnabled && !Updates.isEmbeddedLaunch && Updates.updateId
            ? t('settings.update_id', {
                id: Updates.updateId.slice(0, 8),
                date: Updates.createdAt?.toLocaleDateString() ?? '',
              })
            : t('settings.update_builtin')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionSpaced: { marginTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  hint: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexGrow: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  optionLabel: { fontSize: 14, color: '#0f172a' },
  optionLabelSelected: { color: '#ffffff', fontWeight: '600' },
  preview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  previewText: { fontSize: 16, color: '#0f172a' },
});
