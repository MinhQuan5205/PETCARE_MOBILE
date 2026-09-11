import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, AvatarSize } from '@/core/components/Avatar';
import { Icon } from '@/core/components/Icon';
import { theme } from '@/core/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authApi } from '@/features/auth/api/authApi';
import { mapUserResponseToUserProfile } from '@/features/auth/mappers/user.mapper';
import { Toast } from '@/core/components/Toast';
import { StatusVariant } from '@/core/components/StatusBadge';

export interface AvatarPickerProps {
  currentAvatarUrl?: string;
  initials?: string;
  size?: AvatarSize;
}

export function AvatarPicker({ currentAvatarUrl, initials, size = 'lg' }: AvatarPickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { updateUser } = useAuth();
  const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });
  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'You need to grant photo library permissions to change your avatar.'
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (pickerResult.canceled) {
        return;
      }

      const asset = pickerResult.assets[0];

      // File size check (5MB = 5 * 1024 * 1024 bytes)
      if (asset.fileSize && asset.fileSize > 5242880) {
        showToast('Image exceeds maximum size of 5MB', 'error');
        return;
      }

      // Format checking
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (asset.mimeType && !validMimeTypes.includes(asset.mimeType)) {
        showToast('Invalid image format. Supported formats: PNG, JPG, JPEG, WEBP', 'error');
        return;
      }

      await uploadAvatar(asset.uri, asset.mimeType || 'image/jpeg', asset.fileName || 'avatar.jpg');
    } catch (error: any) {
      showToast('Failed to pick image', 'error');
    }
  };

  const uploadAvatar = async (uri: string, mimeType: string, fileName: string) => {
    setIsUploading(true);
    try {
      const response = await authApi.updateAvatar(uri, mimeType, fileName);
      if (response.success) {
        const mappedUser = mapUserResponseToUserProfile(response.data);
        updateUser(mappedUser);
        showToast('Avatar updated successfully', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to upload avatar', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handlePickImage} 
        disabled={isUploading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Change avatar"
      >
        <Avatar 
          source={currentAvatarUrl ? { uri: currentAvatarUrl } : undefined} 
          initials={initials} 
          size={size} 
          style={isUploading ? styles.uploadingAvatar : undefined}
        />
        <View style={styles.editIconContainer}>
          <Icon name="camera" size={16} color="#FFF" />
        </View>
      </TouchableOpacity>
      <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  uploadingAvatar: {
    opacity: 0.5,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary.default,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface.default,
  }
});
