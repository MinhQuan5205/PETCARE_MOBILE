import { Tabs } from 'expo-router';
import { Home, Search, Calendar, MessageCircle, User } from 'lucide-react-native';
import { colors } from '../../src/core/theme/colors';

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.default,
        tabBarInactiveTintColor: colors.text.muted,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 2,
          borderTopColor: colors.text.primary,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: colors.surface.default,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Lịch đặt',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      {/* Hidden nested routes */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="pets/index" options={{ href: null }} />
      <Tabs.Screen name="pets/add" options={{ href: null }} />
      <Tabs.Screen name="pets/[id]/edit" options={{ href: null }} />
      <Tabs.Screen name="addresses/index" options={{ href: null }} />
      <Tabs.Screen name="addresses/add" options={{ href: null }} />
      <Tabs.Screen name="addresses/[id]/edit" options={{ href: null }} />
    </Tabs>
  );
}
