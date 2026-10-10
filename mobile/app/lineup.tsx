import React from 'react';
import { LineupScreen } from '@/components/LineupScreen';

/**
 * Lineup as a pushed screen (it used to be a tab). Without `embedded` it gets
 * the close button and the bottom safe area, since there is no tab bar under it.
 */
export default function LineupRoute() {
  return <LineupScreen />;
}
