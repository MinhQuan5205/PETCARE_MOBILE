import React from 'react';
import { Stack } from 'expo-router';
import { AddressListScreen } from '@/features/addresses/screens/AddressListScreen';

export default function AddressesRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Addresses' }} />
      <AddressListScreen />
    </>
  );
}
