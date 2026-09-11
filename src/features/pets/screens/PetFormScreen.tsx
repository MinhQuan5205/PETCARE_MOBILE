import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/core/components/Screen';
import { Button } from '@/core/components/Button';
import { Input } from '@/core/components/Input';
import { SegmentedControl } from '@/core/components/SegmentedControl';
import { Avatar } from '@/core/components/Avatar';
import { Icon } from '@/core/components/Icon';
import { Toast } from '@/core/components/Toast';
import { StatusVariant } from '@/core/components/StatusBadge';
import { Loading } from '@/core/components/Loading';
import { theme } from '@/core/theme';
import { petApi } from '../api/petApi';

export function PetFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });
  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'Dog' | 'Cat'>('Dog');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [healthNote, setHealthNote] = useState('');
  const [behaviorNote, setBehaviorNote] = useState('');
  const [avatar, setAvatar] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | undefined>();

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      loadPet(id);
    }
  }, [id]);

  const loadPet = async (petId: string) => {
    try {
      const response = await petApi.getPet(petId);
      if (response.success) {
        const pet = response.data;
        setName(pet.name);
        setSpecies(pet.species);
        setBreed(pet.breed || '');
        setGender(pet.gender || '');
        setAge(pet.age !== undefined ? pet.age.toString() : '');
        setWeight(pet.weight !== undefined ? pet.weight.toString() : '');
        setHealthNote(pet.healthNote || '');
        setBehaviorNote(pet.behaviorNote || '');
        setExistingAvatarUrl(pet.avatarUrl);
      }
    } catch (error: any) {
      showToast('Failed to load pet details', 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast('Permission required to access photos', 'error');
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

      if (asset.fileSize && asset.fileSize > 5242880) {
        showToast('Image exceeds maximum size of 5MB', 'error');
        return;
      }

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (asset.mimeType && !validMimeTypes.includes(asset.mimeType)) {
        showToast('Invalid image format. Supported formats: PNG, JPG, JPEG, WEBP', 'error');
        return;
      }

      setAvatar({
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `avatar-${Date.now()}.jpg`,
      });
    } catch (error) {
      showToast('Failed to pick image', 'error');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    else if (name.length > 100) newErrors.name = 'Name must be less than 100 characters';

    if (breed.length > 100) newErrors.breed = 'Breed must be less than 100 characters';
    if (gender.length > 20) newErrors.gender = 'Gender must be less than 20 characters';

    if (age.trim()) {
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum <= 0) {
        newErrors.age = 'Age must be a positive integer';
      }
    }

    if (weight.trim()) {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum <= 0) {
        newErrors.weight = 'Weight must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        gender: gender.trim() || undefined,
        age: age.trim() ? parseInt(age, 10) : undefined,
        weight: weight.trim() ? parseFloat(weight) : undefined,
        healthNote: healthNote.trim() || undefined,
        behaviorNote: behaviorNote.trim() || undefined,
      };

      if (avatar) {
        payload.avatar = avatar;
      }

      if (isEditing && id) {
        await petApi.updatePet(id, payload);
        showToast('Pet updated successfully', 'success');
      } else {
        await petApi.createPet(payload);
        showToast('Pet added successfully', 'success');
      }
      
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to save pet', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={theme.colors.background.default}>
        <Loading fullScreen />
        <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />
    </Screen>
    );
  }

  return (
    <Screen backgroundColor={theme.colors.background.default}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
            <Avatar 
              source={avatar ? { uri: avatar.uri } : (existingAvatarUrl ? { uri: existingAvatarUrl } : undefined)} 
              initials={name || '?'} 
              size="lg" 
            />
            <View style={styles.editIconContainer}>
              <Icon name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            label="Pet Name *"
            value={name}
            onChangeText={setName}
            placeholder="E.g., Max"
            error={errors.name}
            maxLength={100}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Species *</Text>
            <SegmentedControl
              segments={[{ label: 'Dog', value: 'Dog' }, { label: 'Cat', value: 'Cat' }]}
              selectedValue={species}
              onValueChange={(val) => setSpecies(val as 'Dog' | 'Cat')}
            />
          </View>

          <Input
            label="Breed"
            value={breed}
            onChangeText={setBreed}
            placeholder="E.g., Golden Retriever"
            error={errors.breed}
            maxLength={100}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Age (years)"
                value={age}
                onChangeText={setAge}
                placeholder="E.g., 3"
                keyboardType="number-pad"
                error={errors.age}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="E.g., 12.5"
                keyboardType="decimal-pad"
                error={errors.weight}
              />
            </View>
          </View>

          <Input
            label="Gender"
            value={gender}
            onChangeText={setGender}
            placeholder="E.g., Male"
            error={errors.gender}
            maxLength={20}
          />

          <Input
            label="Health Notes"
            value={healthNote}
            onChangeText={setHealthNote}
            placeholder="Any allergies or health conditions?"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <Input
            label="Behavior Notes"
            value={behaviorNote}
            onChangeText={setBehaviorNote}
            placeholder="Friendly, shy, etc."
            multiline
            numberOfLines={3}
            style={styles.textArea}
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
            label={isEditing ? 'Save Changes' : 'Add Pet'}
            variant="primary"
            onPress={handleSave}
            isLoading={isSubmitting}
            style={styles.footerButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: theme.spacing[6],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  avatarWrapper: {
    position: 'relative',
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
  },
  form: {
    gap: theme.spacing[4],
  },
  fieldContainer: {
    gap: theme.spacing[2],
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  col: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
