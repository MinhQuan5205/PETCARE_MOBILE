import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Screen } from '../../../core/components/Screen';
import { OTPInput } from '../../../core/components/OTPInput';
import { Button } from '../../../core/components/Button';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { typography } from '../../../core/theme/typography';
import { colors } from '../../../core/theme/colors';
import { spacing } from '../../../core/theme/spacing';
import { Icon } from '../../../core/components/Icon';

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await authApi.verifyOtp({ email: email as string, otp });
      if (res.success && res.data) {
        await login(res.data.accessToken, res.data.user);
      } else {
        setError(res.message || 'Mã OTP không hợp lệ');
      }
    } catch (err: any) {
      setError(err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResendLoading(true);
    setError('');
    try {
      const res = await authApi.resendOtp({ email: email as string });
      if (res.success) {
        setCountdown(60);
      } else {
        setError(res.message || 'Không thể gửi lại mã OTP');
      }
    } catch (err: any) {
      setError(err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setResendLoading(false);
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

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon name="mail" size={32} color={colors.secondary.active} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.text.primary, textAlign: 'center' }]}>Xác thực OTP</Text>
            <Text style={[typography.bodyLg, { color: colors.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              Mã xác thực đã được gửi đến{'\n'}
              <Text style={{ color: colors.text.primary, fontWeight: '600' }}>{email}</Text>
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={colors.semantic.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              error={error ? " " : undefined}
            />

            <Button label="Xác Nhận"
              onPress={handleVerify}
              isLoading={loading}
              style={{ marginTop: spacing[4], width: '100%' }}
            />

            <View style={styles.resendContainer}>
              <Text style={[typography.bodyMd, { color: colors.text.secondary }]}>Chưa nhận được mã? </Text>
              <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resendLoading}>
                <Text style={[
                  typography.bodyMd, 
                  { 
                    color: countdown > 0 ? colors.text.muted : colors.primary.default, 
                    fontWeight: 'bold' 
                  }
                ]}>
                  {resendLoading ? 'Đang gửi...' : (countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã')}
                </Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: colors.secondary.container,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: spacing[8],
  },
  form: {
    alignItems: 'center',
    gap: spacing[4],
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.errorContainer,
    padding: spacing[3],
    borderRadius: spacing[2],
    marginBottom: spacing[2],
    width: '100%',
  },
  errorText: {
    ...typography.bodySm,
    color: colors.semantic.error,
    marginLeft: spacing[2],
    flex: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  }
});
