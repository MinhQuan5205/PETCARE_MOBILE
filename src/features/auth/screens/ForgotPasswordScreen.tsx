import { useRouter } from 'expo-router';
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await authApi.forgotPassword({ email });
      if (res.success) {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email }
        });
      } else {
        setError(res.message || 'Yêu cầu thất bại');
      }
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

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon name="key" size={32} color={colors.secondary.active} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.text.primary, textAlign: 'center' }]}>Quên mật khẩu?</Text>
            <Text style={[typography.bodyLg, { color: colors.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              Đừng lo lắng! Vui lòng nhập email của bạn, chúng tôi sẽ gửi mã khôi phục.
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={colors.semantic.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Email"
              placeholder="Nhập email của bạn"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
            />

            <Button label="Gửi Yêu Cầu"
              onPress={handleReset}
              isLoading={loading}
              style={{ marginTop: spacing[4] }}
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
