import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Address } from '../types/address.types';
import { Icon } from '@/core/components/Icon';
import { theme } from '@/core/theme';

interface AddressCardProps {
  address: Address;
  onPress?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export function AddressCard({ address, onPress, onDelete, onSetDefault }: AddressCardProps) {
  const getIconForType = () => {
    switch (address.addressType) {
      case 'HOME': return 'home';
      case 'WORK': return 'briefcase';
      default: return 'map-pin';
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        address.isDefault && styles.defaultContainer
      ]} 
      activeOpacity={0.7} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon 
            name={getIconForType()} 
            size={24} 
            color={address.isDefault ? theme.colors.primary.default : theme.colors.text.secondary} 
          />
        </View>
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={[theme.typography.h3, styles.type]}>
              {address.label || address.addressType}
            </Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          
          <Text style={[theme.typography.bodyMd, styles.addressLine]} numberOfLines={2}>
            {address.addressLine}
          </Text>
          
          {address.formattedAddress ? (
            <Text style={[theme.typography.caption, styles.subDetails]} numberOfLines={2}>
              {address.formattedAddress}
            </Text>
          ) : (
            <Text style={[theme.typography.caption, styles.subDetails]} numberOfLines={2}>
              {[address.ward, address.district, address.city].filter(Boolean).join(', ')}
            </Text>
          )}

          {address.receiverName && address.phone && (
            <Text style={[theme.typography.caption, styles.contact]}>
              {address.receiverName} • {address.phone}
            </Text>
          )}
        </View>
      </View>

      {(onSetDefault || onDelete) && (
        <View style={styles.actions}>
          {!address.isDefault && onSetDefault && (
            <TouchableOpacity onPress={onSetDefault} style={styles.actionButton}>
              <Text style={styles.setDefaultText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          <View style={styles.spacer} />
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Icon name="trash-2" size={18} color={theme.colors.semantic.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.default,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border.subdued,
    ...theme.shadows.sm,
  },
  defaultContainer: {
    borderColor: theme.colors.primary.default,
    backgroundColor: theme.colors.primary.container,
  },
  content: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  type: {
    color: theme.colors.text.primary,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary.default,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  defaultBadgeText: {
    ...theme.typography.caption,
    color: '#FFF',
    fontWeight: '600',
  },
  addressLine: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  subDetails: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  contact: {
    color: theme.colors.text.muted,
    marginTop: theme.spacing[1],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subdued,
  },
  spacer: {
    flex: 1,
  },
  actionButton: {
    paddingVertical: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },
  setDefaultText: {
    ...theme.typography.button,
    color: theme.colors.primary.default,
  },
  deleteButton: {
    padding: theme.spacing[1],
  }
});
