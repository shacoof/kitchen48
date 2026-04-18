import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av';
import { createLogger } from '../lib/logger';

const logger = createLogger('VideoPlayer');

interface Props {
  uri: string;
  posterUri?: string;
  height?: number;
}

export function VideoPlayer({ uri, posterUri, height = 220 }: Props) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const handlePlaybackUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  if (error) {
    return (
      <View style={[styles.errorContainer, { height }]}>
        <Text style={styles.errorText}>Video unavailable</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={togglePlay} style={[styles.container, { height }]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        posterSource={posterUri ? { uri: posterUri } : undefined}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackUpdate}
        onError={(err) => {
          logger.error(`Video error: ${err}`);
          setError(true);
        }}
      />
    </Pressable>
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
