import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  const GoogleModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleModule.GoogleSignin;
  statusCodes = GoogleModule.statusCodes;
} catch (e) {
  console.warn('Google Signin is not available in Expo Go. Please use a Development Build.');
}
import { Button } from '../../../core/components/Button';
import { Input } from '../../../core/components/Input';
import { Screen } from '../../../core/components/Screen';
import { colors } from '../../../core/theme/colors';
import { spacing } from '../../../core/theme/spacing';
import { typography } from '../../../core/theme/typography';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../../../core/components/Icon';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
      });
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        await login(res.data.accessToken, res.data.user);
      } else {
        setError(res.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setError(err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!GoogleSignin) {
      alert('Đăng nhập Google yêu cầu Development Build (Không hoạt động trên Expo Go).');
      return;
    }

    try {
      setGoogleLoading(true);
      setError('');
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken; 
      
      if (idToken) {
        const res = await authApi.googleLogin({ idToken });
        if (res.success && res.data) {
          await login(res.data.accessToken, res.data.user);
        } else {
          setError(res.message || 'Đăng nhập Google thất bại');
        }
      } else {
        setError('Không thể lấy thông tin đăng nhập Google');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // already in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Thiết bị không hỗ trợ Google Play Services');
      } else {
        setError(error.message || 'Đã có lỗi xảy ra khi kết nối Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Icon name="user" size={32} color={colors.primary.default} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[typography.h1, { color: colors.text.primary, textAlign: 'center' }]}>Chào mừng trở lại!</Text>
            <Text style={[typography.bodyLg, { color: colors.text.secondary, marginTop: spacing[2], textAlign: 'center' }]}>
              Đăng nhập để tiếp tục chăm sóc thú cưng của bạn
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
              placeholder="Nhập địa chỉ email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail"
            />
            
            <View style={styles.passwordContainer}>
              <Input
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon="lock"
              />
              <TouchableOpacity 
                style={styles.forgotPassword} 
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={[typography.button, { color: colors.secondary.active }]}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            <Button label="Đăng Nhập"
              onPress={handleLogin}
              isLoading={loading}
              style={{ marginTop: spacing[4] }}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.line} />
            </View>

            <Button label="Tiếp tục với Google"
              onPress={handleGoogleLogin}
              isLoading={googleLoading}
              variant="outline"
              style={{ marginTop: spacing[2] }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[typography.bodyMd, { color: colors.text.secondary }]}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[typography.button, { color: colors.primary.default }]}>Đăng ký ngay</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[4],
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
  passwordContainer: {
    position: 'relative',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing[2],
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[4],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.muted,
    paddingHorizontal: spacing[4],
  }
});
