import React from 'react';
import { Stack } from 'expo-router';
import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';

export default function ProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'My Profile' }} />
      <ProfileScreen />
    </>
  );
}
