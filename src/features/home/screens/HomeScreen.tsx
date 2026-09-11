import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../core/components/Screen';
import { Card } from '../../../core/components/Card';
import { Icon } from '../../../core/components/Icon';
import { Avatar } from '../../../core/components/Avatar';
import { useAuth } from '../../auth/context/AuthContext';
import { theme } from '../../../core/theme';

interface QuickActionProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const QuickAction = ({ title, icon, color, onPress }: QuickActionProps) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.quickActionWrapper}>
    <Card variant="default" padding="default" style={styles.quickActionCard}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Icon name={icon} size={28} color="#FFF" />
      </View>
      <Text style={[theme.typography.button, styles.quickActionText]}>{title}</Text>
    </Card>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Screen style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={[theme.typography.bodyLgMedium, { color: theme.colors.text.secondary }]}>
              Xin chào,
            </Text>
            <Text style={[theme.typography.h1, { color: theme.colors.text.primary }]}>
              {user?.full_name || 'Bạn'}!
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(customer)/profile')} activeOpacity={0.7}>
            <Avatar 
              source={user?.avatar_url ? { uri: user.avatar_url } : undefined} 
              initials={user?.full_name} 
              size="lg" 
            />
          </TouchableOpacity>
        </View>

        {/* Hero Banner (Retro Style) */}
        <Card style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={{ flex: 1 }}>
              <Text style={[theme.typography.h2, styles.heroTitle]}>Chăm sóc thú cưng</Text>
              <Text style={[theme.typography.bodyMd, styles.heroSubtitle]}>
                Đặt lịch hẹn ngay hôm nay để nhận ưu đãi đặc biệt!
              </Text>
            </View>
            <Icon name="heart" size={48} color={theme.colors.text.primary} style={styles.heroIcon} />
          </View>
        </Card>

        {/* Quick Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[theme.typography.h3, { color: theme.colors.text.primary }]}>Lối tắt</Text>
        </View>

        <View style={styles.grid}>
          <QuickAction 
            title="Thú cưng" 
            icon="twitter" // Lucide doesn't have a paw, Twitter bird looks like an animal placeholder or dog/cat could work. Let's use 'smile' or 'heart'. Actually 'bone' exists in Lucide! Let's try 'bone'.
            color={theme.colors.primary.default}
            onPress={() => router.push('/(customer)/pets' as any)} 
          />
          <QuickAction 
            title="Địa chỉ" 
            icon="map-pin" 
            color={theme.colors.secondary.default}
            onPress={() => router.push('/(customer)/addresses' as any)} 
          />
          <QuickAction 
            title="Lịch hẹn" 
            icon="calendar" 
            color={theme.colors.semantic.success}
            onPress={() => router.push('/(customer)/bookings' as any)} 
          />
          <QuickAction 
            title="Tin nhắn" 
            icon="message-circle" 
            color={theme.colors.semantic.warning}
            onPress={() => router.push('/(customer)/chat' as any)} 
          />
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[10],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[8],
  },
  headerTextContainer: {
    flex: 1,
  },
  heroBanner: {
    backgroundColor: theme.colors.secondary.default,
    marginBottom: theme.spacing[8],
    padding: theme.spacing[6],
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  heroSubtitle: {
    color: theme.colors.text.primary,
    opacity: 0.9,
  },
  heroIcon: {
    marginLeft: theme.spacing[4],
  },
  sectionHeader: {
    marginBottom: theme.spacing[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -theme.spacing[2],
  },
  quickActionWrapper: {
    width: '50%',
    padding: theme.spacing[2],
  },
  quickActionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[6],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
  },
  quickActionText: {
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
