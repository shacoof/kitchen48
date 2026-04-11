import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation('common');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kitchen48</Text>
      <Text style={styles.subtitle}>{t('messages.loading', 'No recipes yet')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b' },
});
