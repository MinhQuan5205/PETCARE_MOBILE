import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Screen } from '@/core/components/Screen';
import { Button } from '@/core/components/Button';
import { EmptyState } from '@/core/components/EmptyState';
import { Loading } from '@/core/components/Loading';
import { Toast } from '@/core/components/Toast';
import { StatusVariant } from '@/core/components/StatusBadge';
import { theme } from '@/core/theme';
import { addressApi } from '../api/addressApi';
import { Address } from '../types/address.types';
import { AddressCard } from '../components/AddressCard';

export function AddressListScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });
  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });

  const fetchAddresses = async () => {
    try {
      const response = await addressApi.getAddresses();
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (error: any) {
      showToast('Failed to load addresses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchAddresses();
    }, [])
  );

  const handleDelete = (addressId: string, label?: string) => {
    const addressName = label || 'this address';
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete ${addressName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Address deletion returns 204 No Content
              await addressApi.deleteAddress(addressId);
              showToast('Address deleted successfully', 'success');
              fetchAddresses();
            } catch (error: any) {
              if (error.statusCode === 403) {
                showToast('You do not have permission to delete this address', 'error');
              } else {
                showToast(error.message || 'Failed to delete address', 'error');
              }
            }
          }
        }
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressApi.updateAddress(addressId, { isDefault: true });
      showToast('Default address updated', 'success');
      fetchAddresses();
    } catch (error: any) {
      showToast(error.message || 'Failed to update default address', 'error');
    }
  };

  if (isLoading && addresses.length === 0) {
    return (
      <Screen backgroundColor={theme.colors.background.default}>
        <Loading fullScreen />
        <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </Screen>
    );
  }

  // Sort addresses so default is at the top
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  return (
    <Screen backgroundColor={theme.colors.background.default}>
      <FlatList
        data={sortedAddresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AddressCard 
            address={item} 
            onPress={() => router.push(`/(customer)/addresses/${item.id}/edit` as any)}
            onDelete={() => handleDelete(item.id, item.label)}
            onSetDefault={!item.isDefault ? () => handleSetDefault(item.id) : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Addresses"
            description="Add an address so we know where to provide care."
            icon="map-pin"
            actionLabel="Add Address"
            onAction={() => router.push('/(customer)/addresses/add')}

          />
        }
      />
      
      {addresses.length > 0 && (
        <View style={styles.footer}>
          <Button 
            label="Add New Address" 
            variant="primary" 
            onPress={() => router.push('/(customer)/addresses/add')}
            isFullWidth
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: theme.spacing[4],
    flexGrow: 1,
  },
  footer: {
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subdued,
  }
});
