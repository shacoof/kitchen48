import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, ActionSheetIOS, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { createLogger } from '../lib/logger';

const logger = createLogger('MediaPicker');

interface Props {
  uri: string | null;
  type: 'image' | 'video';
  label?: string;
  onPick: (uri: string) => void;
  onRemove: () => void;
}

export function MediaPicker({ uri, type, label, onPick, onRemove }: Props) {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('messages.error'), 'Media library permission is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' ? ['images'] : ['videos'],
        quality: 0.8,
        allowsEditing: type === 'image',
        aspect: type === 'image' ? [16, 9] : undefined,
      });

      if (!result.canceled && result.assets[0]) {
        onPick(result.assets[0].uri);
        logger.debug(`Picked ${type} from gallery`);
      }
    } catch (err) {
      logger.error(`Gallery pick failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('messages.error'), 'Camera permission is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === 'image' ? ['images'] : ['videos'],
        quality: 0.8,
        allowsEditing: type === 'image',
        aspect: type === 'image' ? [16, 9] : undefined,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets[0]) {
        onPick(result.assets[0].uri);
        logger.debug(`Captured ${type} from camera`);
      }
    } catch (err) {
      logger.error(`Camera capture failed: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', ...(uri ? ['Remove'] : [])],
          cancelButtonIndex: 0,
          destructiveButtonIndex: uri ? 3 : undefined,
        },
        (index) => {
          if (index === 1) pickFromCamera();
          else if (index === 2) pickFromGallery();
          else if (index === 3) onRemove();
        }
      );
    } else {
      Alert.alert(
        label ?? (type === 'image' ? 'Add Image' : 'Add Video'),
        undefined,
        [
          { text: 'Camera', onPress: pickFromCamera },
          { text: 'Gallery', onPress: pickFromGallery },
          ...(uri ? [{ text: 'Remove', style: 'destructive' as const, onPress: onRemove }] : []),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  };

  if (uri && type === 'image') {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Pressable onPress={showOptions}>
          <Image source={{ uri }} style={styles.preview} />
          <View style={styles.changeOverlay}>
            <Text style={styles.changeText}>Tap to change</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  if (uri && type === 'video') {
    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Pressable style={styles.videoBadge} onPress={showOptions}>
          <Text style={styles.videoBadgeText}>Video attached</Text>
          <Text style={styles.changeTextSmall}>Tap to change</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        style={styles.placeholder}
        onPress={showOptions}
        disabled={isLoading}
      >
        <Text style={styles.placeholderIcon}>{type === 'image' ? '+' : '+'}</Text>
        <Text style={styles.placeholderText}>
          {isLoading ? t('buttons.loading') : `Add ${type}`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  placeholder: {
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  placeholderIcon: { fontSize: 28, color: '#94a3b8', marginBottom: 2 },
  placeholderText: { fontSize: 13, color: '#94a3b8' },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
  },
  changeText: { color: '#ffffff', fontSize: 12 },
  changeTextSmall: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  videoBadge: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  videoBadgeText: { fontSize: 14, fontWeight: '500', color: '#334155' },
});
