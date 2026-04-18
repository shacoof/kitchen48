import { View, Text, StyleSheet } from 'react-native';

interface Props {
  uri: string | null;
  type: 'image' | 'video';
  label?: string;
  onPick: (uri: string) => void;
  onRemove: () => void;
}

export function MediaPicker({ label }: Props) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.placeholder}>
        <Text style={styles.text}>Media picker (mobile only)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  placeholder: {
    height: 60, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center',
  },
  text: { fontSize: 12, color: '#94a3b8' },
});
