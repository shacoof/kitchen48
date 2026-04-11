import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export function SaveStatus({ status }: Props) {
  const { t } = useTranslation('common');

  if (status === 'idle') return null;

  return (
    <Text style={[styles.text, status === 'error' && styles.error, status === 'saved' && styles.saved]}>
      {status === 'saving' && t('messages.saving')}
      {status === 'saved' && t('messages.saved')}
      {status === 'error' && t('messages.save_error')}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 4 },
  saved: { color: '#22c55e' },
  error: { color: '#ef4444' },
});
