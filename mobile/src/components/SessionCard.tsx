import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { ActiveSessionSnapshot } from '../hooks/useActiveSessions';
import { computeRemainingMs, formatCountdown } from '../hooks/useSessionTimers';
import { stopSession } from '../services/play-session-service';

interface Props {
  snapshot: ActiveSessionSnapshot;
  onStopped: () => void;
}

export function SessionCard({ snapshot, onStopped }: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { session, recipe, nextTimer } = snapshot;
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);

  const handleOpen = () => {
    router.push(`/recipe/${session.recipeId}/play`);
  };

  const handleStop = () => {
    Alert.alert(
      t('play.stop_title', 'Stop cooking?'),
      t('play.stop_body', '"{{title}}" will be removed and all its timers will be lost.', {
        title: recipe?.title ?? '',
      }),
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        {
          text: t('play.stop_confirm', 'Stop'),
          style: 'destructive',
          onPress: async () => {
            await stopSession(session.id);
            onStopped();
          },
        },
      ]
    );
  };

  const title = recipe?.title ?? t('messages.loading');
  const countdown = nextTimer ? formatCountdown(computeRemainingMs(nextTimer)) : null;

  return (
    <Pressable style={styles.card} onPress={handleOpen}>
      {recipe?.heroImagePath ? (
        <Image source={{ uri: recipe.heroImagePath }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroPlaceholder]}>
          <Text style={styles.heroInitial}>{title.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {countdown ? (
          <View style={styles.countdownRow}>
            <View style={styles.countdownDot} />
            <Text style={styles.countdown}>{countdown}</Text>
            <Text style={styles.countdownKind}>
              {nextTimer?.kind === 'wait' ? t('play.wait', 'wait') : t('play.prep', 'prep')}
            </Text>
          </View>
        ) : (
          <Text style={styles.noTimer}>{t('play.no_active_timer', 'No active timer')}</Text>
        )}
      </View>
      <Pressable style={styles.stopBtn} onPress={handleStop} hitSlop={8}>
        <Text style={styles.stopBtnText}>{t('play.stop', 'Stop')}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  hero: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fb923c' },
  heroInitial: { fontSize: 26, fontWeight: '700', color: '#ffffff' },
  body: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  countdownDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', marginRight: 8,
  },
  countdown: { fontSize: 18, fontWeight: '700', color: '#f97316', fontVariant: ['tabular-nums'] },
  countdownKind: { fontSize: 12, color: '#94a3b8', marginLeft: 6, textTransform: 'uppercase' },
  noTimer: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
  stopBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  stopBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
});
