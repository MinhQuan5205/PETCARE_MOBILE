import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Button } from '../../../core/components/Button';
import { Input } from '../../../core/components/Input';
import { Screen } from '../../../core/components/Screen';
import { colors } from '../../../core/theme/colors';
import { spacing } from '../../../core/theme/spacing';
import { typography } from '../../../core/theme/typography';
import { authApi } from '../api/authApi';
import { Icon } from '../../../core/components/Icon';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();

  const handleReset = async () => {
    if (!otp || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (password.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authApi.resetPassword({ email, token: otp, password, confirmPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại mã OTP.');
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
          
          {!success && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Icon name="arrow-left" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, success && { backgroundColor: colors.semantic.successContainer }]}>
              <Icon name={success ? "check-circle" : "shield-check"} size={32} color={success ? colors.semantic.success : colors.primary.default} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.text.primary, textAlign: 'center' }]}>
              {success ? "Thành công!" : "Đặt lại mật khẩu"}
            </Text>
            <Text style={[typography.bodyLg, { color: colors.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              {success 
                ? "Mật khẩu của bạn đã được đặt lại thành công."
                : `Mã xác thực đã được gửi đến ${email || 'email của bạn'}`}
            </Text>
          </View>

          <View style={styles.form}>
            {!success ? (
              <>
                {error ? (
                  <View style={styles.errorBox}>
                    <Icon name="alert-circle" size={16} color={colors.semantic.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="Mã OTP"
                  placeholder="Nhập mã OTP (6 số)"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  leftIcon="hash"
                />
                
                <Input
                  label="Mật khẩu mới"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon="lock"
                />

                <Input
                  label="Xác nhận mật khẩu"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  leftIcon="lock"
                />

                <Button label="Lưu Mật Khẩu"
                  onPress={handleReset}
                  isLoading={loading}
                  style={{ marginTop: spacing[4] }}
                />
              </>
            ) : (
              <Button label="Đăng nhập ngay"
                onPress={() => router.push('/(auth)/login')}
                style={{ marginTop: spacing[4], width: '100%' }}
              />
            )}
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[8],
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.container,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing[8],
  },
  form: {
    gap: spacing[4],
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
