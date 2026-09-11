# Phase 2D Implementation Plan V2.1

## 1. Executive Summary
This Phase 2D Implementation Plan V2.1 details the blueprint for building Customer Profile, Pets, and Addresses features for PetCare Mobile. It adheres strictly to the existing API contracts, mobile architecture, and design system. Crucially, it resolves earlier planning issues by introducing a strict Backend-to-Mobile User Mapper, explicitly separating API multipart constraints (e.g., `file` vs `avatar`), implementing safe "server-confirmed synchronization" for the AuthContext, and establishing a safe, explicitly labeled development boundary for required location coordinates.

## 2. Approved Scope
**Included:**
- **Customer Profile**: View profile, edit full name/phone, upload avatar.
- **Customer Pets**: List, add, edit, delete pets, and upload pet avatars.
- **Customer Addresses**: List, add, edit, delete, and set default addresses.
- **Navigation**: Customer routes within `app/(customer)`.
- **Home Integration**: Display authenticated user's name and avatar from `AuthContext`.
- **AuthContext**: Server-confirmed synchronization after successful profile mutations.

**Out of Scope:**
- Provider features, booking, payment, wallet, chat, reviews, support.
- Map SDK, `expo-location`, reverse geocoding, device GPS.
- Redux, Zustand, TanStack Query, or new global state management.
- Generic CRUD frameworks or auto-magical UI components.

## 3. Architecture Rules
- `app/`: Thin Expo Router files only. No API calls or business logic.
- `src/features/`: Feature-scoped screens, components, API adapters, and business logic.
- `src/core/`: Generic reusable UI only.
- `src/infrastructure/`: HTTP integrations via existing Axios `client.ts`.
- **State**: No duplicated global profile stores. Local form state for UI, `AuthContext` for the authenticated user session.

## 4. Backend API Contract
**CUSTOMER PROFILE**
- `GET /users/me`: Returns `publicUserSelect` (id, fullName, email, phone, avatarUrl, role, isActive, createdAt, updatedAt).
- `PATCH /users/me`: Accepts JSON `{ fullName?: string, phone?: string }`.
- `PATCH /users/me/avatar`: Accepts `multipart/form-data` with field name `file` (Max 5MB, png/jpeg/jpg/webp).

**PETS**
- `GET /pets`: Returns `PetRecord[]`.
- `GET /pets/:id`: Returns `PetRecord`.
- `POST /pets` & `PUT /pets/:id`: Accepts `multipart/form-data` with file field `avatar` (Max 5MB). Other fields: `name`, `species` (Dog|Cat), `breed`, `age`, `weight`, `gender`, `healthNote`, `behaviorNote`.
- `DELETE /pets/:id`: Returns `void`. Deletes pet and cleans up Supabase image.

**ADDRESSES**
- `GET /customer-addresses`: Returns `CustomerAddressRecord[]`.
- `GET /customer-addresses/:id`: Returns `CustomerAddressRecord`.
- `POST /customer-addresses`: Accepts JSON for `addressLine`, `latitude`, `longitude`, `label`, `receiverName`, `phone`, `ward`, `district`, `city`, `formattedAddress`, `placeId`, `addressType`, `isDefault`.
- `PATCH /customer-addresses/:id`: Accepts partial update JSON. Used to set `isDefault: true`.
- `DELETE /customer-addresses/:id`: Returns `204 No Content` (Soft delete).

## 5. User Model Mapping (CRITICAL)
**Issue**: Backend response uses `camelCase`, while the mobile `UserProfile` type uses `snake_case`.

**Action**: We will create a strict mapping boundary.
- **File**: `src/features/auth/mappers/user.mapper.ts`
- **Types**: 
  - `BackendUserResponse` (matching `publicUserSelect`)
  - Mobile `UserProfile` (existing, with `phone?: string` added).
- **Mapping Logic**:
  - `fullName` -> `full_name` (fallback to `''` if null)
  - `avatarUrl` -> `avatar_url`
  - `createdAt` -> `created_at`
  - `isActive` -> `status` (Mobile union is `'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'`. Map `isActive === true ? 'ACTIVE' : 'SUSPENDED'`).
  - `phone` -> mapped as string or undefined if null.

*Direct spreading of backend responses into AuthContext state is strictly forbidden.*

## 6. AuthContext Synchronization
**Method**: `updateUser(profile: Partial<UserProfile>)` will be added to `AuthContext`.
**Terminology**: This is **Server-confirmed synchronization**, NOT optimistic UI.
**Flow**:
1. Form calls API (`PATCH /users/me` or `/users/me/avatar`).
2. API succeeds, returning the updated user object.
3. The response is passed through `mapUserResponseToUserProfile`.
4. `updateUser(mappedProfile)` updates the Context state.
5. `restoreSession()` remains the authoritative fetch mechanism on startup. Profile screen relies on Context, preventing redundant `GET /users/me` calls.

## 7. Profile Feature
- **ProfileScreen**: Displays Context data. Provides Edit and Avatar upload actions.
- **EditProfileScreen**: Hydrates form from Context. Mutates via API -> Syncs Context -> Navigates back.
- **AvatarPicker**: Resides at `src/features/profile/components/AvatarPicker.tsx`. Opens picker, handles `PATCH /users/me/avatar` (`file` field), maps response, syncs Context.
- **Dependency**: Check for `expo-image-picker`. **Do not install without explicit user approval**.

## 8. Pet Feature
- **PetListScreen**: Fetches list. Handles empty state and delete confirmations. Uses `useFocusEffect` to refetch on focus.
- **PetFormScreen**: Shared form for Add/Edit. 
  - **Edit Hydration**: Uses `petId` from route params to fetch `GET /pets/:id`.
  - **Separation of Types**: Converts numeric/nullable API `PetRecord` fields into string-based `PetFormState` for inputs, then maps back for API submission.
  - **Multipart**: Uses `avatar` field for images.

## 9. Address Feature
- **AddressListScreen**: Displays addresses with default badges. Handles deletion. Uses `useFocusEffect` for refetching.
- **AddressFormScreen**: Shared form for Add/Edit. 
  - **Edit Hydration**: Uses `addressId` from route to fetch data.
  - **Default Setting**: Controlled via a toggle mapping to `isDefault` field.
  - **Delete**: Expects `204`, triggering local list refresh.

## 10. Location Boundary
**Constraint**: No real location SDKs or map pickers.
**Requirement**: Backend strictly requires `latitude` (-90..90) and `longitude` (-180..180).
**Solution**: Create a `DevCoordinateFallback` component clearly marked as DEVELOPMENT ONLY. It will provide static valid coordinates (e.g., center of HCMC) to satisfy the form without silently faking a production location. This isolates the development hack for easy removal later.

## 11. Navigation
Route wrappers in `app/(customer)/`:
- `profile.tsx`, `profile/edit.tsx`
- `pets/index.tsx`, `pets/add.tsx`, `pets/[id]/edit.tsx`
- `addresses/index.tsx`, `addresses/add.tsx`, `addresses/[id]/edit.tsx`
*Routes contain no API calls or feature business logic.*

## 12. Components
- **Core Reuse**: `Screen`, `Button`, `Input`, `Card`, `Avatar`, `Icon`, `Toast`, `EmptyState`, `SegmentedControl`.
- **Feature Components**: `PetCard` (pets), `AddressCard` (addresses), `AvatarPicker` (profile), `DevCoordinateFallback` (addresses).
- **Constraints**: No generic select inputs. `SegmentedControl` handles enums (e.g., Species: Dog/Cat, AddressType: HOME/WORK/OTHER).

## 13. Form Validation
- **Profile**: Name (max 100), Phone (max 20).
- **Pets**: Name (required, max 100), Species (required, Dog|Cat), Age (>0 int), Weight (>0 float), Avatar (<5MB).
- **Addresses**: AddressLine (required), Lat/Lng (via DevCoordinateFallback, within bounds).

## 14. State Management
- **Auth**: `AuthContext`.
- **Lists/Forms**: Local component state (`useState`). Refetches via `useFocusEffect` upon returning to list screens. No generic caching layer.

## 15. Error Handling
- Leverages existing `ApiError` class.
- **401**: Relies on existing Axios interceptor.
- **403**: Feature-level UX gracefully handles forbidden access.
- **400/413/500**: Displayed via UI Toast.
- Excludes sensitive technical logs. Treats image picker cancellations as expected user behavior.

## 16. Profile + Home Integration
- `HomeScreen` accesses `useAuth()` to display `user.full_name` and `user.avatar_url`. No independent API calls are made for the home screen header.

## 17. File Change Plan

| File | Action | Reason | Dependencies |
|---|---|---|---|
| `src/features/auth/types/auth.types.ts` | MODIFY | Add `phone` to `UserProfile`, declare `BackendUserResponse` | None |
| `src/features/auth/mappers/user.mapper.ts` | CREATE | Strict normalization of backend to mobile model | `auth.types.ts` |
| `src/features/auth/api/authApi.ts` | MODIFY | Add `updateProfile`, `uploadAvatar` (using `file` field) | Mapper, Axios |
| `src/features/auth/context/AuthContext.tsx` | MODIFY | Add `updateUser(profile: Partial<UserProfile>)` for server-sync | None |
| `src/features/profile/components/AvatarPicker.tsx`| CREATE | Dedicated profile avatar picker | `expo-image-picker` |
| `src/features/profile/screens/ProfileScreen.tsx` | CREATE | Display Context user, link to edit/upload | Context |
| `src/features/profile/screens/EditProfileScreen.tsx`| CREATE | Form logic for name/phone | Context, API |
| `app/(customer)/profile.tsx` | MODIFY | Route to ProfileScreen | Screen |
| `app/(customer)/profile/edit.tsx` | CREATE | Route to EditProfileScreen | Screen |
| `src/features/pets/components/PetCard.tsx` | CREATE | UI for pet list item | None |
| `src/features/pets/screens/PetListScreen.tsx` | MODIFY | Logic for fetching/deleting/displaying | API, Card |
| `src/features/pets/screens/PetFormScreen.tsx` | CREATE | Unified Add/Edit. Hydrates via `GET /pets/:id`. Uses `avatar` multipart field. | API |
| `app/(customer)/pets/add.tsx` | CREATE | Route | Screen |
| `app/(customer)/pets/[id]/edit.tsx` | CREATE | Route | Screen |
| `src/features/addresses/components/AddressCard.tsx`| CREATE | UI for address list item | None |
| `src/features/addresses/components/DevCoordinateFallback.tsx`| CREATE | Explicitly named dev fallback for coordinates | None |
| `src/features/addresses/screens/AddressListScreen.tsx`| MODIFY | Logic for fetching/deleting/displaying | API, Card |
| `src/features/addresses/screens/AddressFormScreen.tsx`| CREATE | Unified Add/Edit. Hydrates via `GET`. Uses `DevCoordinateFallback`. | API |
| `app/(customer)/addresses/add.tsx` | CREATE | Route | Screen |
| `app/(customer)/addresses/[id]/edit.tsx` | CREATE | Route | Screen |
| `package.json` | NO CHANGE | Will evaluate `expo-image-picker` status during implementation phase. | None |

## 18. Implementation Order
1. **Step 0**: Dependency verification (`expo-image-picker`). Stop if missing.
2. **Step 1**: Typed backend/user response models & mapper (`user.mapper.ts`).
3. **Step 2**: AuthContext `updateUser` synchronization logic.
4. **Step 3**: Profile API, `AvatarPicker`, Profile screens.
5. **Step 4**: Pets API and Pet screens (List, Form).
6. **Step 5**: Addresses API, `DevCoordinateFallback`, Address screens.
7. **Step 6**: Navigation wiring in `app/(customer)`.
8. **Step 7**: Verification against matrix.

## 19. Verification Matrix
- **PROFILE**: Display existing user, edit valid name/phone, server-sync Context, successful/failed avatar upload (`file` field), cancel edit.
- **PETS**: Fetch lists, add/edit pets with/without `avatar` field, handle GET hydration on edit, enum/age validation, confirm/execute deletion.
- **ADDRESSES**: Fetch lists, create address with dev coordinates, toggle `isDefault`, handle `204` delete gracefully.
- **AUTH/NAV**: Prevent provider access, test unauthenticated redirects, confirm list refreshes on navigation return. Ensure Phase 2A/2B/2C features do not regress.

## 20. Risk Register
1. **CamelCase vs snake_case mapping**: *Mitigation*: Strict typed mapper (`user.mapper.ts`).
2. **isActive/status mismatch**: *Mitigation*: Explicit mapping verified against `UserProfile.status` union (`true -> 'ACTIVE', false -> 'SUSPENDED'`).
3. **Phone nullability**: *Mitigation*: Mapper explicitly converts nulls to undefined or strings.
4. **Multipart field collision (`file` vs `avatar`)**: *Mitigation*: Separate FormData preparation functions for Profile vs Pets.
5. **Fake dev coordinates**: *Mitigation*: `DevCoordinateFallback` explicitly labeled and isolated.
6. **`expo-image-picker` dependency**: *Mitigation*: Implementation step 0 verifies and requests approval if missing.
7. **Stale AuthContext**: *Mitigation*: Server-confirmed synchronization strategy only updates Context after successful PATCH.
8. **FormData compatibility**: *Mitigation*: Reuse proven Phase 2A/2C patterns.

## 21. Non-Goals
- No maps, GPS, reverse geocoding, or map pickers.
- No Provider, Booking, Payment, Chat, or Wallet features.
- No Redux, Zustand, or TanStack Query.
- No generic CRUD abstraction.
- No dependency installation without explicit approval.

## 22. Definition of Done
- Profile viewing, editing, and avatar upload function smoothly.
- Pet and Address full CRUD (with avatars and default settings) is fully operational.
- Route and feature separation is maintained; no API logic in route wrappers.
- `AuthContext` seamlessly performs server-confirmed synchronization.
- Backend responses are cleanly mapped to Mobile models.
- UX handles loading, error, empty, and destructive action states.
- Code compiles (`tsc --noEmit`) with no regressions to earlier phases.

## 23. Final Plan Verdict
PLAN V2.1 READY FOR REVIEW
