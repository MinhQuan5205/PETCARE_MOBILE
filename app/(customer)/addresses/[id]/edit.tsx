import React from 'react';
import { Stack } from 'expo-router';
import { AddressFormScreen } from '@/features/addresses/screens/AddressFormScreen';

export default function EditAddressRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Edit Address' }} />
      <AddressFormScreen />
    </>
  );
}
