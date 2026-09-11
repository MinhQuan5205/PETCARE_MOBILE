import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/core/components/Screen';
import { Button } from '@/core/components/Button';
import { Card } from '@/core/components/Card';
import { Icon } from '@/core/components/Icon';
import { theme } from '@/core/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AvatarPicker } from '../components/AvatarPicker';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <Screen backgroundColor={theme.colors.background.default}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AvatarPicker 
            currentAvatarUrl={user.avatar_url} 
            initials={user.full_name} 
            size="lg" 
          />
          <Text style={[theme.typography.h2, styles.name]}>{user.full_name}</Text>
          <Text style={[theme.typography.bodyMd, styles.email]}>{user.email}</Text>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Icon name="user" size={20} color={theme.colors.primary.default} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[theme.typography.caption, styles.infoLabel]}>Full Name</Text>
              <Text style={theme.typography.bodyMd}>{user.full_name}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Icon name="phone" size={20} color={theme.colors.primary.default} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[theme.typography.caption, styles.infoLabel]}>Phone Number</Text>
              <Text style={theme.typography.bodyMd}>
                {user.phone || 'Not provided'}
              </Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Icon name="mail" size={20} color={theme.colors.primary.default} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[theme.typography.caption, styles.infoLabel]}>Email</Text>
              <Text style={theme.typography.bodyMd}>{user.email}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button 
            label="Edit Profile" 
            variant="primary" 
            leftIcon="edit-2"
            onPress={() => router.push('/(customer)/profile/edit')}
            style={styles.actionButton}
          />
          <Button 
            label="Logout" 
            variant="outline" 
            leftIcon="log-out"
            onPress={logout}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: theme.spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  name: {
    marginTop: theme.spacing[4],
    color: theme.colors.text.primary,
  },
  email: {
    marginTop: theme.spacing[1],
    color: theme.colors.text.secondary,
  },
  infoCard: {
    marginBottom: theme.spacing[8],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary.container,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subdued,
    marginLeft: 56, // Icon width + margin
  },
  actions: {
    gap: theme.spacing[4],
  },
  actionButton: {
    width: '100%',
  }
});
