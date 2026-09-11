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
import { petApi } from '../api/petApi';
import { Pet } from '../types/pet.types';
import { PetCard } from '../components/PetCard';

export function PetListScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });
  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });

  const fetchPets = async () => {
    try {
      const response = await petApi.getPets();
      if (response.success) {
        setPets(response.data);
      }
    } catch (error: any) {
      showToast('Failed to load pets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchPets();
    }, [])
  );

  const handleDelete = (petId: string, petName: string) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${petName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await petApi.deletePet(petId);
              showToast('Pet deleted successfully', 'success');
              fetchPets();
            } catch (error: any) {
              if (error.statusCode === 403) {
                showToast('You do not have permission to delete this pet', 'error');
              } else {
                showToast(error.message || 'Failed to delete pet', 'error');
              }
            }
          }
        }
      ]
    );
  };

  if (isLoading && pets.length === 0) {
    return (
      <Screen backgroundColor={theme.colors.background.default}>
        <Loading fullScreen />
        <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.colors.background.default}>
      <FlatList
        data={pets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PetCard 
            pet={item} 
            onPress={() => router.push(`/(customer)/pets/${item.id}/edit` as any)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Pets Yet"
            description="Add your first pet to keep track of their care and records."
            icon="gitlab" // close to pet icon in lucide
            actionLabel="Add Pet"
            onAction={() => router.push('/(customer)/pets/add')}

          />
        }
      />
      
      {pets.length > 0 && (
        <View style={styles.footer}>
          <Button 
            label="Add Another Pet" 
            variant="primary" 
            onPress={() => router.push('/(customer)/pets/add')}
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
