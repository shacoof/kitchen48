import { Modal, View, Text, Pressable, ScrollView, Switch, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { VOICE_COMMANDS } from '../voice/commands';

interface Props {
  visible: boolean;
  autoRead: boolean;
  onAutoReadChange: (value: boolean) => void;
  onClose: () => void;
}

export function VoiceHelpModal({ visible, autoRead, onAutoReadChange, onClose }: Props) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
          <Text style={styles.title}>{t('voice.help_title')}</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('voice.auto_read')}</Text>
            <Switch
              value={autoRead}
              onValueChange={onAutoReadChange}
              trackColor={{ true: '#f97316', false: '#cbd5e1' }}
            />
          </View>

          <ScrollView style={styles.list}>
            {VOICE_COMMANDS.map((cmd) => (
              <View key={cmd.id} style={styles.row}>
                <Text style={styles.keyword}>{t(`voice.cmd.${cmd.id}.keyword`)}</Text>
                <Text style={styles.desc}>{t(`voice.cmd.${cmd.id}.desc`)}</Text>
              </View>
            ))}
            <Text style={styles.hint}>{t('voice.help_hint')}</Text>
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>{t('voice.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: {
    maxHeight: '85%', backgroundColor: '#ffffff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 48, paddingVertical: 4, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  settingLabel: { flex: 1, fontSize: 15, color: '#334155' },
  list: { flexGrow: 0 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  keyword: { fontSize: 15, fontWeight: '700', color: '#f97316' },
  desc: { fontSize: 14, color: '#475569', marginTop: 2 },
  hint: { fontSize: 13, color: '#94a3b8', marginTop: 12 },
  closeBtn: {
    marginTop: 16, minHeight: 48, borderRadius: 12, backgroundColor: '#f97316',
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
