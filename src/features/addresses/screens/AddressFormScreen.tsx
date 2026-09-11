import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/core/components/Screen';
import { Button } from '@/core/components/Button';
import { Input } from '@/core/components/Input';
import { SegmentedControl } from '@/core/components/SegmentedControl';
import { Toast } from '@/core/components/Toast';
import { StatusVariant } from '@/core/components/StatusBadge';
import { Loading } from '@/core/components/Loading';
import { theme } from '@/core/theme';
import { addressApi } from '../api/addressApi';
import { DevCoordinateFallback } from '../components/DevCoordinateFallback';
import { AddressType } from '../types/address.types';

export function AddressFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });
  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addressLine, setAddressLine] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('OTHER');
  const [label, setLabel] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
  // Dev-only coordinates
  const [latitude, setLatitude] = useState('10.762622'); // Default to HCMC
  const [longitude, setLongitude] = useState('106.660172');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id) {
      loadAddress(id);
    }
  }, [id]);

  const loadAddress = async (addressId: string) => {
    try {
      const response = await addressApi.getAddress(addressId);
      if (response.success) {
        const addr = response.data;
        setAddressLine(addr.addressLine);
        setAddressType((addr.addressType as AddressType) || 'OTHER');
        setLabel(addr.label || '');
        setReceiverName(addr.receiverName || '');
        setPhone(addr.phone || '');
        setWard(addr.ward || '');
        setDistrict(addr.district || '');
        setCity(addr.city || '');
        setIsDefault(addr.isDefault || false);
        setLatitude(addr.latitude.toString());
        setLongitude(addr.longitude.toString());
      }
    } catch (error: any) {
      showToast('Failed to load address details', 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!addressLine.trim()) newErrors.addressLine = 'Address line is required';

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const payload: any = {
        addressLine: addressLine.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        addressType,
        label: label.trim() || undefined,
        receiverName: receiverName.trim() || undefined,
        phone: phone.trim() || undefined,
        ward: ward.trim() || undefined,
        district: district.trim() || undefined,
        city: city.trim() || undefined,
        isDefault,
      };

      if (isEditing && id) {
        await addressApi.updateAddress(id, payload);
        showToast('Address updated successfully', 'success');
      } else {
        await addressApi.createAddress(payload);
        showToast('Address added successfully', 'success');
      }
      
      router.back();
    } catch (error: any) {
      showToast(error.message || 'Failed to save address', 'error');
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
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <DevCoordinateFallback 
            latitude={parseFloat(latitude) || 0} 
            longitude={parseFloat(longitude) || 0} 
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Latitude *"
                value={latitude}
                onChangeText={setLatitude}
                placeholder="e.g. 10.762622"
                keyboardType="numbers-and-punctuation"
                error={errors.latitude}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Longitude *"
                value={longitude}
                onChangeText={setLongitude}
                placeholder="e.g. 106.660172"
                keyboardType="numbers-and-punctuation"
                error={errors.longitude}
              />
            </View>
          </View>

          <Input
            label="Address Line *"
            value={addressLine}
            onChangeText={setAddressLine}
            placeholder="Street number, street name"
            error={errors.addressLine}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Ward"
                value={ward}
                onChangeText={setWard}
                placeholder="e.g. Ward 1"
              />
            </View>
            <View style={styles.col}>
              <Input
                label="District"
                value={district}
                onChangeText={setDistrict}
                placeholder="e.g. District 1"
              />
            </View>
          </View>
          
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Ho Chi Minh City"
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Address Type</Text>
            <SegmentedControl
              segments={[
                { label: 'Home', value: 'HOME' }, 
                { label: 'Work', value: 'WORK' },
                { label: 'Other', value: 'OTHER' }
              ]}
              selectedValue={addressType}
              onValueChange={(val) => setAddressType(val as AddressType)}
            />
          </View>

          <Input
            label="Label (Optional)"
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Mom's House"
          />

          <Input
            label="Receiver Name (Optional)"
            value={receiverName}
            onChangeText={setReceiverName}
            placeholder="Name of person at this address"
            autoCapitalize="words"
          />

          <Input
            label="Phone Number (Optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="Contact number for this address"
            keyboardType="phone-pad"
          />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={theme.typography.bodyMd}>Set as default address</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.text.secondary }]}>
                This address will be pre-selected for bookings.
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: theme.colors.surface.subdued, true: theme.colors.primary.container }}
              thumbColor={isDefault ? theme.colors.primary.default : theme.colors.border.default}
            />
          </View>
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
            label={isEditing ? 'Save Changes' : 'Add Address'}
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
  formSection: {
    gap: theme.spacing[4],
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subdued,
    marginVertical: theme.spacing[6],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[2],
  },
  switchInfo: {
    flex: 1,
    paddingRight: theme.spacing[4],
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
