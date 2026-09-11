import React from 'react';
import { Stack } from 'expo-router';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';

export default function EditProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <EditProfileScreen />
    </>
  );
}
