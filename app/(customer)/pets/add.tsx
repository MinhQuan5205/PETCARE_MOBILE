import React from 'react';
import { Stack } from 'expo-router';
import { PetFormScreen } from '@/features/pets/screens/PetFormScreen';

export default function AddPetRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add Pet' }} />
      <PetFormScreen />
    </>
  );
}
