import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { initials } from '@/lib/format';

interface Props {
  name: string;
  number?: number;
  size?: number;
  photoUrl?: string;
}

export function Avatar({ name, number, size = 52, photoUrl }: Props) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!photoUrl && !failed;
  const badgeSize = Math.max(20, Math.round(size * 0.38));

  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {showPhoto ? (
          <Image
            source={{ uri: photoUrl }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials(name)}</Text>
        )}
      </View>
      {!!number && (
        <View style={[styles.badge, { minWidth: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, right: -size * 0.08 }]}>
          <Text style={[styles.badgeText, { fontSize: badgeSize * 0.52 }]}>{number}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.cardRaised,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { color: colors.white, fontWeight: '800' },
  badge: {
    position: 'absolute',
    bottom: -3,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontWeight: '800' },
});
