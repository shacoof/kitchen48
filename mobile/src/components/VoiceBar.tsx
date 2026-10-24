import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { VoiceMode, VoiceError, LastHeard } from '../hooks/useVoiceControl';

interface Props {
  available: boolean;
  mode: VoiceMode;
  listening: boolean;
  lastHeard: LastHeard | null;
  error: VoiceError | null;
  speaking: boolean;
  onToggleMic: () => void;
  onPushToTalk: () => void;
  onReadToggle: () => void;
  onHelp: () => void;
}

/**
 * Compact bottom bar for Play Mode voice. Sits below the step content and
 * never covers it. Every button here has a voice equivalent and vice versa.
 */
export function VoiceBar({
  available, mode, listening, lastHeard, error, speaking,
  onToggleMic, onPushToTalk, onReadToggle, onHelp,
}: Props) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const micOn = mode === 'continuous';

  let status: string;
  if (!available) status = t('voice.unavailable');
  else if (error === 'permission') status = t('voice.permission');
  else if (error === 'failed') status = t('voice.failed');
  else if (listening) status = t('voice.listening');
  else if (lastHeard?.command) status = t('voice.heard', { command: t(`voice.cmd.${lastHeard.command.id}.keyword`) });
  else if (lastHeard) status = t('voice.not_understood', { text: lastHeard.text });
  else if (micOn) status = t('voice.listening');
  else status = t('voice.tap_to_talk');

  return (
    <View style={[styles.bar, { paddingBottom: 8 + insets.bottom }]}>
      <Pressable
        style={[styles.iconBtn, micOn && styles.iconBtnActive, !available && styles.disabled]}
        onPress={onToggleMic}
        disabled={!available}
        accessibilityRole="switch"
        accessibilityState={{ checked: micOn }}
        accessibilityLabel={micOn ? t('voice.mic_off') : t('voice.mic_on')}
      >
        <Ionicons name={micOn ? 'mic' : 'mic-off-outline'} size={24} color={micOn ? '#ffffff' : '#334155'} />
      </Pressable>

      <Pressable
        style={[styles.talk, listening && styles.talkListening]}
        onPress={onPushToTalk}
        disabled={!available || mode !== 'off'}
        accessibilityRole="button"
        accessibilityLabel={t('voice.tap_to_talk')}
      >
        {listening ? <View style={styles.dot} /> : null}
        <Text style={styles.status} numberOfLines={1}>{status}</Text>
      </Pressable>

      <Pressable
        style={[styles.iconBtn, speaking && styles.iconBtnActive]}
        onPress={onReadToggle}
        accessibilityRole="button"
        accessibilityLabel={speaking ? t('voice.stop_reading') : t('voice.read')}
      >
        <Ionicons
          name={speaking ? 'stop' : 'volume-high-outline'}
          size={24}
          color={speaking ? '#ffffff' : '#334155'}
        />
      </Pressable>

      <Pressable
        style={styles.iconBtn}
        onPress={onHelp}
        accessibilityRole="button"
        accessibilityLabel={t('voice.help')}
      >
        <Ionicons name="help-circle-outline" size={26} color="#334155" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#fed7aa',
  },
  iconBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7ed',
  },
  iconBtnActive: { backgroundColor: '#f97316' },
  disabled: { opacity: 0.4 },
  talk: {
    flex: 1, minHeight: 48, borderRadius: 24, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9',
  },
  talkListening: { backgroundColor: '#ffedd5' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#dc2626' },
  status: { flex: 1, fontSize: 14, color: '#334155' },
});
