import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useScreenHeader } from '../../src/hooks/useScreenHeader';

export default function SettingsScreen() {
  const { t } = useTranslation('common');

  useScreenHeader(useMemo(() => ({
    title: t('navigation.settings', 'Settings'),
  }), [t]));

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Settings coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  placeholder: { fontSize: 16, color: '#94a3b8' },
});
