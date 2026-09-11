import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/core/theme';
import { Icon } from '@/core/components/Icon';

export interface DevCoordinateFallbackProps {
  latitude: number;
  longitude: number;
}

/**
 * DEVELOPMENT ONLY
 * This component is a placeholder for a real map or location picker.
 * It strictly displays test coordinates and does NOT represent the user's real location.
 * It must be replaced by a real map implementation in a future phase.
 */
export function DevCoordinateFallback({ latitude, longitude }: DevCoordinateFallbackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="map-pin" size={16} color={theme.colors.semantic.warning} />
        <Text style={styles.title}>Development Location Fallback</Text>
      </View>
      <Text style={styles.description}>
        This is a dev-only placeholder. The coordinates below do not represent your real location.
        A real map integration will be added in a future phase.
      </Text>
      <View style={styles.coordinates}>
        <Text style={styles.coordText}>Lat: {latitude.toFixed(6)}</Text>
        <Text style={styles.coordText}>Lng: {longitude.toFixed(6)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.semantic.warning + '15', // light warning background
    borderWidth: 1,
    borderColor: theme.colors.semantic.warning,
    borderRadius: theme.radius.md,
    padding: theme.spacing[4],
    marginVertical: theme.spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  title: {
    ...theme.typography.button,
    color: theme.colors.semantic.warning,
    marginLeft: theme.spacing[2],
  },
  description: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  coordinates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface.default,
    padding: theme.spacing[2],
    borderRadius: theme.radius.sm,
  },
  coordText: {
    ...theme.typography.bodyMd,
    fontFamily: 'monospace',
    color: theme.colors.text.primary,
  }
});
