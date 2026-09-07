import React from 'react';
import { HomeScreen } from '@/features/home';

export default function RootIndexRoute() {
  // TEMPORARY bootstrap route. 
  // Future implementation: verify auth and role state here, then redirect 
  // or conditionally render the appropriate navigator.
  return <HomeScreen />;
}
