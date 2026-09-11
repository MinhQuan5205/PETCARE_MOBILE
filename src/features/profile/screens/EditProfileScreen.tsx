import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/core/components/Screen';
import { Button } from '@/core/components/Button';
import { Input } from '@/core/components/Input';
import { Toast } from '@/core/components/Toast';
import { StatusVariant } from '@/core/components/StatusBadge';
import { theme } from '@/core/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authApi } from '@/features/auth/api/authApi';
import { mapUserResponseToUserProfile } from '@/features/auth/mappers/user.mapper';
import { ApiError } from '@/core/errors/ApiError';

export function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });
  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const validate = () => {
    const newErrors: { fullName?: string; phone?: string } = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.length > 100) {
      newErrors.fullName = 'Full name must be less than 100 characters';
    }
    
    if (phone && phone.length > 20) {
      newErrors.phone = 'Phone must be less than 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await authApi.updateProfile({ 
        fullName: fullName.trim(), 
        phone: phone.trim() || undefined 
      });
      
      if (response.success) {
        const mappedUser = mapUserResponseToUserProfile(response.data);
        updateUser(mappedUser); // Server-confirmed synchronization
        showToast('Profile updated successfully', 'success');
        router.back();
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.statusCode === 403) {
        showToast('You do not have permission to edit this profile', 'error');
      } else {
        showToast(error.message || 'Failed to update profile', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Screen backgroundColor={theme.colors.background.default}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            error={errors.fullName}
            autoCapitalize="words"
            maxLength={100}
            editable={!isSubmitting}
          />

          <Input
            label="Email"
            value={user.email}
            editable={false}
            helperText="Email cannot be changed"
            style={styles.disabledInput}
          />

          <Input
            label="Phone Number (Optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            error={errors.phone}
            keyboardType="phone-pad"
            maxLength={20}
            editable={!isSubmitting}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label="Cancel"
            variant="outline"
            onPress={() => router.back()}
            disabled={isSubmitting}
            style={styles.footerButton}
          />
          <Button
            label="Save Changes"
            variant="primary"
            onPress={handleSave}
            isLoading={isSubmitting}
            style={styles.footerButton}
          />
        </View>
      </ScrollView>
      <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: theme.spacing[6],
  },
  form: {
    flex: 1,
    gap: theme.spacing[4],
  },
  disabledInput: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing[4],
    marginTop: theme.spacing[8],
  },
  footerButton: {
    flex: 1,
  },
});
