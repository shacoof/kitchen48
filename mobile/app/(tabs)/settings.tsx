import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t } = useTranslation('common');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('navigation.settings', 'Settings')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '600', color: '#0f172a' },
});
