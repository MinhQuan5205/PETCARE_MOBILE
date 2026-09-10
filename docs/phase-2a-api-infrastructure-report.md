# Phase 2A: API Infrastructure Foundation Report

## 1. Summary
The Phase 2A implementation audited and improved the core API infrastructure for PetCare Mobile. The goal was to establish a solid foundation before implementing business features. The existing robust mechanisms (e.g., SecureStore caching, queued 401 refresh logic) were preserved, while strict type safety and a formalized error boundary were introduced.

## 2. Existing Infrastructure Audit
- **HTTP Client**: Uses `axios` (`src/infrastructure/api/client.ts`).
- **Token Handling**: Uses `expo-secure-store` to cache the `accessToken`. Includes an in-memory cache variable to avoid async I/O on every request.
- **Refresh Token Logic**: The 401 response interceptor elegantly implements a lock (`isRefreshing`) and a promise queue (`failedQueue`). It uses `withCredentials: true` to pass backend HttpOnly cookies during `/auth/refresh`.
- **Error Normalization**: Interceptors caught errors but rejected with raw JavaScript objects, and there was a heavy reliance on the `any` type for destructuring responses.

## 3. Files Modified
- **`src/infrastructure/api/client.ts`**:
  - Removed all `any` usages and replaced them with `unknown` and proper type guarding.
  - Substituted raw object rejections with instances of `ApiError`.
  - Migrated configuration lookup from raw `process.env` to the centralized `env` object.
- **`C:\Users\ACER\.gemini\antigravity-ide\brain\5ec022bf-9aa9-4ee2-9744-a44c7b04dbeb\task.md`**: Tracked execution steps.

## 4. Files Created
- **`src/core/config/env.ts`**: A centralized, strictly-typed configuration module that parses and validates `process.env`. Throw errors synchronously on app startup if required config (like `EXPO_PUBLIC_API_URL`) is missing. No silent fallbacks to `localhost`.
- **`src/core/errors/ApiError.ts`**: An explicit error class representing backend contract errors, supporting `instanceof ApiError`.

## 5. Token Lifecycle
1. **Login/Register**: Backend returns an `accessToken` in the JSON response, and sets the `refreshToken` in an HttpOnly cookie.
2. **Storage**: The mobile `client.ts` extracts the `accessToken` via `setAccessToken` and persists it using `expo-secure-store`.
3. **Usage**: Every request passes through a request interceptor that dynamically reads the `accessToken` and sets the `Authorization: Bearer <token>` header.
4. **Refresh**: When a 401 is encountered, `client.ts` locks subsequent requests into a promise queue. It makes a `withCredentials: true` request to `/auth/refresh`. If successful, the new token is stored, and queued requests are flushed and retried.
5. **Logout / Expiration**: If refresh fails, `clearAuth()` wipes local storage and rejects the promise. `AuthContext` catches this unrecoverable state during session restoration and clears the UI state, kicking the user to the login screen.

## 6. API Response Handling
The existing convention established in `authApi.ts` is preserved: 
Feature API adapters explicitly unwrap `response.data` and map it to interface contracts. This ensures feature code (e.g. `useAuth()`) never deals with Axios response wrappers and only receives standard business primitives (`ApiResponse<T>`). No second convention was introduced.

## 7. Error Handling
Errors are caught in the global Axios response interceptor. They are coerced into the `ApiError` class, which conforms precisely to the backend schema:
```typescript
{
  success: false,
  statusCode: number,
  message: string,
  error: string | null,
  timestamp: string,
  path: string,
}
```
Validation errors, 401, 404, 500, network loss, and timeouts are all normalized at this boundary. Features never see raw Axios errors.

## 8. Environment Configuration
Environment config relies on `expo-env` bundled constants (`EXPO_PUBLIC_`). The `env.ts` wrapper enforces validation. If `EXPO_PUBLIC_API_URL` is omitted, the app will throw a fatal error immediately, preventing confusing edge cases where API calls silently fail against undefined URLs.

## 9. Multipart Support
No generic upload business API was created per directives. The current infrastructure natively handles file uploads because `axios` properly intercepts `FormData` bodies and dynamically sets the `Content-Type: multipart/form-data` header alongside the appropriate boundary. Feature layers (like `usersApi.ts` when implemented) will simply pass `FormData` instances directly to `apiClient.patch()`.

## 10. Architecture Decisions
- Preserved the rule: **Feature code must never import Axios**.
- `client.ts` acts as the definitive Infrastructure Adapter boundary.
- Type casting via `as any` was universally replaced with schema checks (`typeof data === 'object' && data !== null`).
- Maintained the clean separation: `Screen` -> `Context/UseCase` -> `authApi.ts` (Port) -> `client.ts` (Adapter).

## 11. Remaining Risks
- **HttpOnly Cookie in React Native**: While `withCredentials` works on React Native, behavior can occasionally differ on older iOS/Android webview engines. Cross-Origin configurations on the backend MUST correctly list the mobile app origin (or allow-all if using custom native schemes) to allow cookies to persist.
- **Token Invalidation on Uninstalls**: SecureStore persists across app uninstalls on iOS (Keychain). This is standard but can result in ghost sessions if the user reinstall the app.

## 12. Verification Results
- Ran `npx tsc --noEmit`. No type errors were found.
- The 401 refresh mechanism remains functionally equivalent to its original working state but is now strictly typed.

## 13. Recommended Next Implementation Phase
**Phase 2B: Core State & Navigation Setup**
- Finalizing the global routing guards (`expo-router` auth groups).
- Scaffolding the bottom tab navigation.
- Establishing basic domain models for Pets and Users.
