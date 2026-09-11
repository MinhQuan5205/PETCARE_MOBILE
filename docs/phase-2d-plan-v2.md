# Phase 2D Implementation Plan (V2)

## 1. Executive Summary
This revised V2 implementation plan outlines the exact blueprint for delivering Phase 2D of the PetCare Mobile Application, encompassing Customer Profile, Pet Management, and Customer Addresses. This plan strictly follows existing repository conventions, the approved Phase 2D Audit, and the explicit architecture constraints. It enforces boundaries on location services, explicitly maps backend responses to existing mobile types, and defers unrelated features.

## 2. Approved Scope
**Included (Phase 2D Only):**
A. **Customer Profile**: View, Edit full name/phone, Upload avatar.
B. **Customer Pets**: List, Create, Edit, Delete, Upload avatar.
C. **Customer Addresses**: List, Create, Edit, Delete, Set Default.
D. **Navigation**: Routes within `app/(customer)` supporting these flows.
E. **Home Integration**: Minimal display of user name/avatar in `HomeScreen`.
F. **AuthContext**: Synchronization of state after profile mutation (NOT optimistic UI).

**STRICTLY Out of Scope:**
- Providers, Booking, Payments, Wallet, Chat, Reviews, etc.
- Map SDKs, `expo-location`, location picking, reverse geocoding.
- New global state managers (Redux/Zustand) or generic CRUD frameworks.
- Installing dependencies without approval.

## 3. Architecture
- **Routes (`app/`)**: Thin wrappers. NO API calls. NO business logic.
- **Features (`src/features/`)**: Contain screens, local components, API adapters, types, and business logic.
- **Core (`src/core/`)**: Generic UI only.
- **Infrastructure (`src/infrastructure/`)**: HTTP clients (Axios).
- **Existing Contracts**: Strict adherence to existing `client.ts`, `AuthContext`, and backend responses.

## 4. Backend API Contract
**Profile**:
- `GET /users/me` -> `{ id, fullName, email, phone, avatarUrl, role, isActive, createdAt, updatedAt }`
- `PATCH /users/me` -> `{ fullName?: string, phone?: string }`
- `PATCH /users/me/avatar` -> (Multipart: `file` - 5MB max, png/jpeg/jpg/webp)

**Pets**:
- `GET /pets` -> `PetRecord[]`
- `GET /pets/:id` -> `PetRecord`
- `POST /pets` -> (Multipart: `avatar`, body fields)
- `PUT /pets/:id` -> (Multipart: `avatar`, body fields)
- `DELETE /pets/:id` -> `void`
- *Constraints*: `species` (Dog|Cat), `name` (required, max 100), `avatar` (5MB max). Note the multipart field name is `avatar`.

**Addresses**:
- `GET /customer-addresses` -> `CustomerAddressRecord[]`
- `GET /customer-addresses/:id` -> `CustomerAddressRecord`
- `POST /customer-addresses` -> Body fields (requires `addressLine`, `latitude`, `longitude`)
- `PATCH /customer-addresses/:id` -> Body fields (used for setting `isDefault: true`)
- `DELETE /customer-addresses/:id` -> `204 No Content`
- *Constraints*: `latitude` (-90 to 90), `longitude` (-180 to 180), `addressType` (HOME|WORK|OTHER).

## 5. Critical User Model Mapping
**Issue**: The backend returns camelCase (`fullName`, `avatarUrl`, `isActive`), but the mobile `UserProfile` in `src/features/auth/types/auth.types.ts` uses snake_case (`full_name`, `avatar_url`, `status`).

**Strategy**:
1. Update `UserProfile` in `auth.types.ts` to add the missing `phone?: string` field.
2. Create a mapper function `mapUserResponseToUserProfile(response: any): UserProfile` in `src/features/auth/api/authApi.ts` (or a dedicated mapper file).
3. **Mapping Rules**:
   - `id` -> `id`
   - `email` -> `email`
   - `fullName` -> `full_name`
   - `phone` -> `phone`
   - `avatarUrl` -> `avatar_url`
   - `role` -> `role`
   - `isActive` (boolean) -> `status` (mapped to `'ACTIVE'` if true, otherwise fallback)
   - `createdAt` -> `created_at`

**Rule**: We will NEVER directly spread `response.data` into `AuthContext` user state.

## 6. AuthContext Synchronization
- **Modification**: Add `updateUser(profile: Partial<UserProfile>)` to `AuthContext`.
- **Flow**: 
  1. Submit `PATCH /users/me`
  2. Await success response.
  3. Map the backend response using `mapUserResponseToUserProfile()`.
  4. Call `updateUser()` with the mapped data to sync `AuthContext`.
- **Note**: This is Server-Synchronized state, NOT optimistic UI. `restoreSession()` remains the authoritative source on startup.

## 7. Profile Feature Plan
- **ProfileScreen**: Reads `AuthContext`, displays data, provides Logout and Avatar upload buttons.
- **EditProfileScreen**: Form (Name, Phone). Submits to API -> Maps response -> Updates Context.
- **AvatarPicker**: Create `src/features/profile/components/AvatarPicker.tsx`. Opens picker, validates size/type, calls API, maps response, updates Context.
- **Dependency Status**: `expo-image-picker` is currently **MISSING** from `package.json`. It MUST be installed prior to implementation.

## 8. Pet Feature Plan
- **PetListScreen**: Fetches list. Uses `useFocusEffect` to refetch on screen focus. Shows EmptyState or PetCards.
- **PetFormScreen**: 
  - Passes ONLY `petId` via route params (not the full object).
  - Fetches GET `/pets/:id` for hydration if editing.
  - Normalization boundary: Maps `PetRecord` (nullable/undefined numeric fields) to string-based form state.
  - Submits via POST/PUT with multipart field explicitly named `avatar`.

## 9. Address Feature Plan
- **AddressListScreen**: Fetches list, shows AddressCards with default badges. `useFocusEffect` for refetching.
- **AddressFormScreen**: 
  - Shared Add/Edit form. Passes ONLY `addressId` via route.
  - Set Default: Exposes a toggle. When true, patches with `isDefault: true`.
- **Delete**: Expects `204 No Content`. On success, pops screen or refetches list.

## 10. Location Boundary
- **Phase 2D Constraint**: NO Maps, NO GPS, NO `expo-location`.
- **Backend Requirement**: Needs `latitude` and `longitude`.
- **Implementation**: Create a strictly named development component: `src/features/addresses/components/DevCoordinateFallback.tsx`.
- **Behavior**: This component will silently inject fixed valid coordinates (e.g., center of HCMC) into the form state. It will be clearly marked with comments so future map integration can seamlessly swap it out without altering the parent form's API submission logic.

## 11. Navigation Plan
Add the following thin wrappers to `app/(customer)`:
- `app/(customer)/profile.tsx` (Update to render ProfileScreen)
- `app/(customer)/profile/edit.tsx` (Renders EditProfileScreen)
- `app/(customer)/pets/add.tsx` (Renders PetFormScreen)
- `app/(customer)/pets/[id]/edit.tsx` (Renders PetFormScreen)
- `app/(customer)/addresses/add.tsx` (Renders AddressFormScreen)
- `app/(customer)/addresses/[id]/edit.tsx` (Renders AddressFormScreen)

*Existing `index.tsx` files for pets and addresses will be wired to list screens.*

## 12. Component Plan
- **Core Reusables**: Screen, Button, Input, Card, Avatar, Toast, EmptyState, SegmentedControl.
- **Feature Specific**: `PetCard`, `AddressCard`, `AvatarPicker`, `DevCoordinateFallback`.
- **Constraints**: No generic form framework, Select input, or generic CRUD wrappers will be built. `SegmentedControl` will handle enums like Species and AddressType.

## 13. Form Validation
- **Profile**: Name (max 100), Phone (max 20).
- **Pets**: Name (required, max 100), Species (Dog|Cat), Age (>0 integer), Weight (>0 float), Avatar (<5MB, valid extensions).
- **Addresses**: AddressLine (required), Lat/Lng (enforced via DevCoordinateFallback).

## 14. State Management
- **Profile**: `AuthContext`.
- **Pets/Addresses**: React `useState` for lists. `useFocusEffect` for automatic refetching after navigating back from a successful mutation. No caching layer needed.

## 15. Error Handling
- Leverages existing `ApiError`.
- **400**: Display Toast for validation failures.
- **413**: Display Toast for oversized images.
- **401/403**: Handled by existing Axios interceptors (refresh/logout).
- **500**: Generic Toast.
- User cancellation of image picker is quietly ignored.

## 16. Customer Home Integration
- `HomeScreen` will consume `useAuth()` to extract the `user.full_name` and `user.avatar_url`.
- NO independent `GET /users/me` request will be made here.

## 17. File Change Plan

| File | Action | Reason | Dependencies | Risk |
|---|---|---|---|---|
| `package.json` | MODIFY | Install `expo-image-picker` | Requires approval | Low |
| `src/features/auth/types/auth.types.ts` | MODIFY | Add `phone` to `UserProfile` | None | Low |
| `src/features/auth/api/authApi.ts` | MODIFY | Add mapper, `updateProfile`, `uploadAvatar` | `client.ts` | Medium |
| `src/features/auth/context/AuthContext.tsx` | MODIFY | Add `updateUser` | `UserProfile` | Medium |
| `app/(customer)/profile.tsx` | MODIFY | Connect route | ProfileScreen | Low |
| `app/(customer)/profile/edit.tsx` | CREATE | Connect route | EditProfileScreen | Low |
| `src/features/profile/screens/ProfileScreen.tsx` | CREATE | UI Screen | AuthContext | Low |
| `src/features/profile/screens/EditProfileScreen.tsx`| CREATE | Form Screen | AuthContext, API | Low |
| `src/features/profile/components/AvatarPicker.tsx` | CREATE | Image handling | `expo-image-picker` | High |
| `app/(customer)/pets/add.tsx` | CREATE | Connect route | PetFormScreen | Low |
| `app/(customer)/pets/[id]/edit.tsx` | CREATE | Connect route | PetFormScreen | Low |
| `src/features/pets/components/PetCard.tsx` | CREATE | UI component | None | Low |
| `src/features/pets/screens/PetListScreen.tsx` | MODIFY | Implement logic | API, Card | Low |
| `src/features/pets/screens/PetFormScreen.tsx` | CREATE | Add/Edit logic | API | Medium |
| `app/(customer)/addresses/add.tsx` | CREATE | Connect route | AddressFormScreen | Low |
| `app/(customer)/addresses/[id]/edit.tsx` | CREATE | Connect route | AddressFormScreen | Low |
| `src/features/addresses/components/AddressCard.tsx`| CREATE | UI component | None | Low |
| `src/features/addresses/components/DevCoordinateFallback.tsx` | CREATE | Mock coordinates | None | Low |
| `src/features/addresses/screens/AddressListScreen.tsx`| MODIFY | Implement logic | API, Card | Low |
| `src/features/addresses/screens/AddressFormScreen.tsx`| CREATE | Add/Edit logic | API | Medium |

## 18. Implementation Order
1. **Repository Verification**: Approve dependency installation (`expo-image-picker`).
2. **Types & Mapping**: Modify `auth.types.ts` and create `mapUserResponseToUserProfile`.
3. **AuthContext**: Implement `updateUser` synchronization.
4. **Profile API & UI**: Build `AvatarPicker`, `ProfileScreen`, `EditProfileScreen`, link routes.
5. **Pets API & UI**: Build `PetCard`, `PetFormScreen`, wire up List, link routes.
6. **Addresses API & UI**: Build `DevCoordinateFallback`, `AddressCard`, `AddressFormScreen`, wire up List, link routes.
7. **Home Integration**: Sync `HomeScreen` with `useAuth`.
8. **UX Polish**: Error handling, loading states, empty states.
9. **Verification**: Run tests outlined in matrix.

## 19. Verification Matrix
- **PROFILE**: Display maps correctly. Name/Phone edits update UI without reload. Avatar upload handles cancellation and 5MB limit smoothly.
- **PETS**: Fetching empty/populated list. Creation respects multipart payload with `avatar`. Edit hydrates correctly from `id` route. Deletion confirms and refreshes list.
- **ADDRESSES**: Fetching list. Creation injects fake coordinates via `DevCoordinateFallback`. `isDefault` toggle successfully patches. Deletion handles 204 successfully.
- **AUTH/NAV**: Protected routes remain secure. Back navigation triggers `useFocusEffect` data refresh. No regressions for Phase 2A/B/C.

## 20. Risk Register

| Risk | Probability | Impact | Mitigation | Detection | Owner |
|---|---|---|---|---|---|
| Backend camelCase vs mobile snake_case mismatch | High | High | Implement strict `mapUserResponseToUserProfile` normalization boundary. | TS Compilation | Implementation |
| Multipart field mismatch (`file` vs `avatar`) | Medium | High | Hardcode explicit field names in separate API payload builders. | Integration Testing | Implementation |
| Dev coordinates leak into production assumptions | Low | High | Use distinctly named `DevCoordinateFallback` and document limitation. | Code Review | Implementation |
| Missing `expo-image-picker` dependency | High | High | BLOCK plan. Request explicit user approval for installation. | Build Step | Planning |
| AuthContext stale state | Medium | Medium | Update Context only *after* API success using mapped response data. | Manual Testing | Implementation |
| React Native FormData bounds issues | Low | Medium | Use strict `{ uri, type, name }` object structure. | Device Testing | Implementation |

## 21. Non-Goals
- NO Maps, GPS, or Reverse Geocoding.
- NO Provider features, Booking, Payments, Chat, Wallet, or Notifications.
- NO Redux/Zustand or generic CRUD abstractions.
- NO Unrelated refactoring.
- NO Dependency installation without explicit approval.

## 22. Definition of Done
- Customer can fully view and edit profile/avatar.
- Customer can fully CRUD pets (with avatars) and addresses.
- `AuthContext` seamlessly synchronizes profile updates.
- Backend/Mobile data mapping operates flawlessly across the application boundary.
- UI implements loading, empty, validation, and error feedback cleanly.
- `DevCoordinateFallback` provides safe mock coordinates.
- Application compiles safely (`tsc --noEmit`) and existing features are unregressed.

## 23. Final Plan Verdict
**PLAN V2 BLOCKED — expo-image-picker dependency missing in package.json.**
*(Please approve the installation of `expo-image-picker` to unblock implementation).*
