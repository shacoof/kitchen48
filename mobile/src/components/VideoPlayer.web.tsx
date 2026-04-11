import { View, Text, StyleSheet } from 'react-native';

interface Props {
  uri: string;
  posterUri?: string;
  height?: number;
}

export function VideoPlayer({ height = 220 }: Props) {
  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.text}>Video player (mobile only)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10, backgroundColor: '#1e293b',
    alignItems: 'center', justifyContent: 'center',
  },
  text: { color: '#94a3b8', fontSize: 12 },
});
