import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

/**
 * The app background: the squad photo under a heavy navy wash, with a faint
 * red aura at the top. It sits behind the screen's content as plain absolute
 * layers, so it costs no layout and scrolls with nothing.
 *
 * The photo is deliberately faint (0.16 with a 0.82-0.94 navy gradient over
 * it): this is a backdrop, not a banner, and body text has to read over it
 * everywhere. Screens keep their solid navy SafeAreaView behind it for the
 * overscroll areas.
 */
export function ScreenBackground() {
  return (
    <View style={styles.layers} pointerEvents="none">
      <Image source={require('../assets/home-bg.jpg')} style={styles.photo} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(12,31,61,0.80)', 'rgba(11,17,30,0.94)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.fill}
      />
      <LinearGradient
        colors={['rgba(227,6,19,0.12)', 'rgba(227,6,19,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.aura}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layers: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.16 },
  aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
});
