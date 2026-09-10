const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Environment Configuration Error: Missing or invalid value for ${key}`);
  }
  return value;
};

export const env = {
  get API_URL(): string {
    return getEnvVar('EXPO_PUBLIC_API_URL');
  },
  get GOOGLE_WEB_CLIENT_ID(): string {
    return getEnvVar('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  },
} as const;
