import React from 'react';
import { Stack } from 'expo-router';
import { PetListScreen } from '@/features/pets/screens/PetListScreen';

export default function PetsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Pets' }} />
      <PetListScreen />
    </>
  );
}
