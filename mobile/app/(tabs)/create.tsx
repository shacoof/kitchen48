import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface OptionProps {
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
}

function OptionCard({ title, description, onPress, disabled }: OptionProps) {
  return (
    <Pressable
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.cardTitle, disabled && styles.textDisabled]}>{title}</Text>
      <Text style={[styles.cardDesc, disabled && styles.textDisabled]}>{description}</Text>
      {disabled && <Text style={styles.comingSoon}>Coming soon</Text>}
    </Pressable>
  );
}

export default function CreateScreen() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('create.title')}</Text>

      <OptionCard
        title={t('create.manual')}
        description={t('create.manual_desc')}
        onPress={() => router.push('/create/manual')}
      />
      <OptionCard
        title={t('create.photos')}
        description={t('create.photos_desc')}
        onPress={() => {}}
        disabled
      />
      <OptionCard
        title={t('create.url')}
        description={t('create.url_desc')}
        onPress={() => {}}
        disabled
      />
      <OptionCard
        title={t('create.import')}
        description={t('create.import_desc')}
        onPress={() => {}}
        disabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  header: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardDisabled: { opacity: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#64748b' },
  textDisabled: { color: '#94a3b8' },
  comingSoon: { fontSize: 12, color: '#cbd5e1', marginTop: 4, fontStyle: 'italic' },
});
