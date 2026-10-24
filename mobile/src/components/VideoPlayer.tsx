import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './ScaledText';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { createLogger } from '../lib/logger';

const logger = createLogger('VideoPlayer');

interface Props {
  uri: string;
  height?: number;
}

export function VideoPlayer({ uri, height = 220 }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const [error, setError] = useState(false);

  useEventListener(player, 'statusChange', ({ status, error: playerError }) => {
    if (status === 'error') {
      logger.error(`Video error: ${playerError?.message}`);
      setError(true);
    }
  });

  if (error) {
    return (
      <View style={[styles.errorContainer, { height }]}>
        <Text style={styles.errorText}>Video unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
