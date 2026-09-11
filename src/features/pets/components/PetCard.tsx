import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pet } from '../types/pet.types';
import { Avatar } from '@/core/components/Avatar';
import { Icon } from '@/core/components/Icon';
import { theme } from '@/core/theme';

interface PetCardProps {
  pet: Pet;
  onPress?: () => void;
  onDelete?: () => void;
}

export function PetCard({ pet, onPress, onDelete }: PetCardProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.7} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <Avatar 
          source={pet.avatarUrl ? { uri: pet.avatarUrl } : undefined} 
          initials={pet.name} 
          size="md" 
          shape="circle" 
        />
        <View style={styles.info}>
          <Text style={[theme.typography.h3, styles.name]} numberOfLines={1}>
            {pet.name}
          </Text>
          <Text style={[theme.typography.bodyMd, styles.details]} numberOfLines={1}>
            {pet.species} {pet.breed ? `• ${pet.breed}` : ''}
          </Text>
          {pet.age !== undefined && pet.weight !== undefined && (
            <Text style={[theme.typography.caption, styles.subDetails]}>
              {pet.age} {pet.age === 1 ? 'year' : 'years'} • {pet.weight} kg
            </Text>
          )}
        </View>
        {onDelete && (
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDelete}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Icon name="trash-2" size={20} color={theme.colors.semantic.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    ...theme.shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: theme.spacing[4],
    marginRight: theme.spacing[2],
  },
  name: {
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  details: {
    color: theme.colors.text.secondary,
  },
  subDetails: {
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  deleteButton: {
    padding: theme.spacing[2],
  },
});
