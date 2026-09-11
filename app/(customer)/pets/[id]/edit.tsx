import React from 'react';
import { Stack } from 'expo-router';
import { PetFormScreen } from '@/features/pets/screens/PetFormScreen';

export default function EditPetRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Edit Pet' }} />
      <PetFormScreen />
    </>
  );
}
