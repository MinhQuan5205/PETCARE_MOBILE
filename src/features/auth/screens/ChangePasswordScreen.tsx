import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Button } from '../../../core/components/Button';
import { Input } from '../../../core/components/Input';
import { Screen } from '../../../core/components/Screen';
import { colors } from '../../../core/theme/colors';
import { spacing } from '../../../core/theme/spacing';
import { typography } from '../../../core/theme/typography';
import { authApi } from '../api/authApi';
import { Icon } from '../../../core/components/Icon';

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.text.primary }]}>Đổi mật khẩu</Text>
            <Text style={[typography.bodyLg, { color: colors.text.secondary, marginTop: spacing[1] }]}>
              Bảo mật tài khoản của bạn bằng mật khẩu mới
            </Text>
          </View>

          <View style={styles.form}>
            {success && (
              <View style={styles.successBox}>
                <Icon name="check-circle" size={16} color={colors.semantic.success} />
                <Text style={styles.successText}>Mật khẩu đã được cập nhật thành công!</Text>
              </View>
            )}
            
            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={colors.semantic.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <Input
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu cũ"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              leftIcon="lock"
            />
            
            <Input
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              leftIcon="shield"
            />

            <Input
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon="check-circle"
            />

            <Button label="Lưu Thay Đổi"
              onPress={handleChangePassword}
              isLoading={loading}
              style={{ marginTop: spacing[4] }}
            />
            
            <Button label="Quay Lại"
              onPress={() => router.back()}
              variant="outline"
              style={{ marginTop: spacing[2] }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[6],
    paddingTop: spacing[12],
  },
  backButton: {
    position: 'absolute',
    top: spacing[2],
    left: spacing[2],
    zIndex: 10,
    padding: spacing[2],
  },
  header: {
    marginTop: spacing[4],
    marginBottom: spacing[8],
  },
  form: {
    gap: spacing[4],
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.successContainer,
    padding: spacing[3],
    borderRadius: spacing[2],
    marginBottom: spacing[2],
  },
  successText: {
    ...typography.bodySm,
    color: colors.semantic.success,
    marginLeft: spacing[2],
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.errorContainer,
    padding: spacing[3],
    borderRadius: spacing[2],
    marginBottom: spacing[2],
  },
  errorText: {
    ...typography.bodySm,
    color: colors.semantic.error,
    marginLeft: spacing[2],
    flex: 1,
  },
});
