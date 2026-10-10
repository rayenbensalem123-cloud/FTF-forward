import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

/**
 * The "continue" chevron. Pointing right reads as "forward" in left-to-right
 * layouts, so it mirrors to the left when the UI is right-to-left (Arabic).
 */
export function ForwardChevron({ color = colors.muted, size = 18 }: { color?: string; size?: number }) {
  const { isRtl } = useLanguage();
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  return <Chevron color={color} size={size} />;
}
