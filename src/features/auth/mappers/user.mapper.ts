import { BackendUserResponse, UserProfile } from '../types/auth.types';

export const mapUserResponseToUserProfile = (response: BackendUserResponse): UserProfile => {
  // Map isActive boolean to UserProfile string status.
  // Limitation: Backend only provides boolean isActive, meaning we cannot distinguish SUSPENDED vs BANNED.
  // For now, map false to 'SUSPENDED'.
  const status: UserProfile['status'] = response.isActive ? 'ACTIVE' : 'SUSPENDED';

  return {
    id: response.id,
    email: response.email,
    full_name: response.fullName || '',
    phone: response.phone || undefined,
    role: response.role as UserProfile['role'],
    status,
    avatar_url: response.avatarUrl || undefined,
    created_at: response.createdAt,
  };
};
