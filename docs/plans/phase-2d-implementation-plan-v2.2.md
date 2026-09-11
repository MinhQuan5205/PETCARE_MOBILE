# Phase 2D Implementation Plan V2.2

## 1. Executive Summary
This Phase 2D Implementation Plan V2.2 details the precise blueprint for building Customer Profile, Pets, and Addresses features for PetCare Mobile. It enforces strict separation of types (Backend vs Form vs UI), detailed validation rules, explicit development-only location fallbacks, and a gated dependency workflow.

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
- `POST /pets` & `PUT /pets/:id`: Accepts `multipart/form-data` with file field `avatar` (Max 5MB). Other fields: `name`, `species`, `breed`, `age`, `weight`, `gender`, `healthNote`, `behaviorNote`.
- `DELETE /pets/:id`: Returns `void`.

**ADDRESSES**
- `GET /customer-addresses`: Returns `CustomerAddressRecord[]`.
- `GET /customer-addresses/:id`: Returns `CustomerAddressRecord`.
- `POST /customer-addresses`: Accepts JSON for `addressLine`, `latitude`, `longitude`, `label`, `receiverName`, `phone`, `ward`, `district`, `city`, `formattedAddress`, `placeId`, `addressType`, `isDefault`.
- `PATCH /customer-addresses/:id`: Accepts partial update JSON.
- `DELETE /customer-addresses/:id`: Returns `204 No Content`.

## 5. User Model Mapping (CRITICAL)
**Issue**: Backend response uses `camelCase`, while the mobile `UserProfile` type uses `snake_case`.

**Action**: We will create a strict mapping boundary at `src/features/auth/mappers/user.mapper.ts`.
- **Types**: 
  - `BackendUserResponse` (matching `publicUserSelect`)
  - `UserProfile` (existing mobile type, adding `phone?: string`).
- **Mapping Logic**:
  - `fullName` -> `full_name`
  - `avatarUrl` -> `avatar_url`
  - `createdAt` -> `created_at`
  - `phone` -> Maps string, or `undefined` if null.
- **Limitation on `isActive` -> `status` mapping**:
  - *Source inspected*: Mobile `UserProfile.status` allows `'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED'`. The backend contract only provides `isActive: boolean`.
  - *Limitation*: We cannot definitively map `isActive: false` to a specific negative status (Suspended vs Banned).
  - *Recommendation*: Map `isActive === true` to `'ACTIVE'`. For `isActive === false`, map to `'SUSPENDED'` as a temporary safe default, but flag this API mismatch for a future backend update to expose the literal status string.

*Direct spreading (`...response`) of backend data into AuthContext state is strictly forbidden.*

## 6. Type Separation
We enforce strict separation to avoid bleeding API types into Form state:
- **Profile**: `BackendUserResponse` -> `UserProfile` -> `ProfileFormState`
- **Pets**: `PetRecord` -> `PetFormState` (where numeric fields like age/weight become strings for UI inputs).
- **Addresses**: `CustomerAddressRecord` -> `AddressFormState`

## 7. AuthContext Synchronization
**Method**: `updateUser(profile: Partial<UserProfile>)` will be added to `AuthContext`.
**Terminology**: This is **Server-confirmed synchronization**, NOT optimistic UI.
**Flow**:
1. Form calls API (`PATCH /users/me` or `/users/me/avatar`).
2. API succeeds, returning the updated `BackendUserResponse`.
3. The response is explicitly mapped using `mapUserResponseToUserProfile`.
4. `updateUser(mappedProfile)` updates the Context state.
5. No redundant `GET /users/me` is needed.

## 8. Profile Feature
- **ProfileScreen**: Displays Context data. Provides Edit and Avatar upload actions.
- **EditProfileScreen**: Hydrates `ProfileFormState` from Context. Mutates via API -> Syncs Context -> Navigates back.
- **AvatarPicker**: Resides at `src/features/profile/components/AvatarPicker.tsx`. Opens picker, handles `PATCH /users/me/avatar` (multipart field: `file`), maps response, syncs Context.

## 9. Pet Feature & Validation
- **PetListScreen**: Fetches `PetRecord[]`. Uses `useFocusEffect` to refetch on focus.
- **PetFormScreen**: Shared form for Add/Edit. 
  - **Edit Hydration**: Uses `petId` from route to fetch `GET /pets/:id`.
  - **Validation & Transformation**:
    - `name`: required, max 100
    - `species`: required, `Dog | Cat`
    - `breed`: optional, max 100
    - `gender`: optional, max 20
    - `age`: optional, string in UI -> validated as positive integer -> numeric in API payload
    - `weight`: optional, string in UI -> validated as positive float -> numeric in API payload
    - `healthNote`: optional
    - `behaviorNote`: optional
    - `avatar`: optional, max 5MB, png/jpeg/jpg/webp (multipart field: `avatar`)

## 10. Address Feature & Validation
- **AddressListScreen**: Displays `CustomerAddressRecord[]` with default badges. Handles deletion. Uses `useFocusEffect` for refetching.
- **AddressFormScreen**: Shared form for Add/Edit. 
  - **Edit Hydration**: Uses `addressId` from route to fetch `GET /customer-addresses/:id`.
  - **Validation**:
    - `addressLine`: required
    - `latitude`: required, -90..90
    - `longitude`: required, -180..180
    - `label`: optional string
    - `receiverName`: optional string
    - `phone`: optional string
    - `ward`, `district`, `city`, `formattedAddress`, `placeId`: optional strings
    - `addressType`: `HOME | WORK | OTHER` (Default: `OTHER`)
    - `isDefault`: boolean, default `false` (handled in form, no separate default endpoint)

## 11. Dev Coordinate Fallback
**Constraint**: No real location SDKs. Backend requires Lat/Lng.
**Solution**: Create `src/features/addresses/components/DevCoordinateFallback.tsx`.
- **Rules**:
  - Explicitly marked DEVELOPMENT ONLY.
  - Does NOT represent the user's real location.
  - Does NOT use GPS, Maps, or reverse geocoding.
  - Does NOT silently fake production data.
  - Configures static test coordinates explicitly in this one file, making it easy to rip out later when a real map SDK is approved.

## 12. Implementation Prerequisites (STEP 0 GATE)
**`expo-image-picker` Approval Gate**:
1. Inspect `package.json` and dependency tree.
2. If `expo-image-picker` exists and is compatible -> reuse.
3. If missing -> **STOP avatar implementation**.
4. Request explicit user approval to install. Do NOT modify `package.json` without approval.

## 13. File Change Plan

| File | Action | Purpose | Dependencies |
|---|---|---|---|
| `src/features/auth/types/auth.types.ts` | MODIFY | Add `phone`, declare `BackendUserResponse` | None |
| `src/features/auth/mappers/user.mapper.ts` | CREATE | Strict normalization of backend to mobile model | `auth.types.ts` |
| `src/features/auth/api/authApi.ts` | MODIFY | Add `updateProfile`, `uploadAvatar` (uses `file`) | Mapper, Axios |
| `src/features/auth/context/AuthContext.tsx` | MODIFY | Add `updateUser` for server-sync | None |
| `src/features/profile/components/AvatarPicker.tsx`| CREATE | Dedicated profile avatar picker | `expo-image-picker` |
| `src/features/profile/screens/ProfileScreen.tsx` | CREATE | Display user, link to edit/upload | Context |
| `src/features/profile/screens/EditProfileScreen.tsx`| CREATE | Form logic for name/phone | Context, API |
| `app/(customer)/profile.tsx` | MODIFY | Route to ProfileScreen | Screen |
| `app/(customer)/profile/edit.tsx` | CREATE | Route to EditProfileScreen | Screen |
| `src/features/pets/components/PetCard.tsx` | CREATE | UI for pet list item | None |
| `src/features/pets/screens/PetListScreen.tsx` | MODIFY | Logic for fetching/deleting | API, Card |
| `src/features/pets/screens/PetFormScreen.tsx` | CREATE | Add/Edit logic. Uses `avatar` multipart field. | API |
| `app/(customer)/pets/add.tsx` | CREATE | Route | Screen |
| `app/(customer)/pets/[id]/edit.tsx` | CREATE | Route | Screen |
| `src/features/addresses/components/AddressCard.tsx`| CREATE | UI for address list item | None |
| `src/features/addresses/components/DevCoordinateFallback.tsx`| CREATE | Explicit dev fallback for lat/lng | None |
| `src/features/addresses/screens/AddressListScreen.tsx`| MODIFY | Logic for fetching/deleting | API, Card |
| `src/features/addresses/screens/AddressFormScreen.tsx`| CREATE | Add/Edit logic. Uses DevCoordinateFallback. | API |
| `app/(customer)/addresses/add.tsx` | CREATE | Route | Screen |
| `app/(customer)/addresses/[id]/edit.tsx` | CREATE | Route | Screen |
| `package.json` | NO CHANGE | Wait for explicit user approval to install missing deps. | None |

## 14. Implementation Order
**STEP 0**: Dependency verification (`expo-image-picker` gate).
**STEP 1**: Typed API models + mapper (`user.mapper.ts`).
**STEP 2**: AuthContext synchronization.
**STEP 3**: Profile (API + UI).
**STEP 4**: Pets (API + UI).
**STEP 5**: Addresses (API + UI).
**STEP 6**: Navigation routes.
**STEP 7**: Verification checklist.

## 15. Verification Checklist

**PROFILE:**
- [ ] loading
- [ ] success
- [ ] valid full name
- [ ] valid phone
- [ ] invalid name
- [ ] invalid phone
- [ ] PATCH success
- [ ] PATCH 400
- [ ] PATCH 401
- [ ] PATCH 403
- [ ] PATCH 500
- [ ] AuthContext updated after success
- [ ] AuthContext unchanged after failure
- [ ] avatar picker cancel
- [ ] avatar success
- [ ] avatar invalid type
- [ ] avatar >5MB
- [ ] avatar upload failure
- [ ] edit cancel
- [ ] back navigation

**PETS:**
- [ ] loading
- [ ] empty
- [ ] populated
- [ ] GET error
- [ ] create valid pet
- [ ] required name validation
- [ ] species validation
- [ ] breed max length
- [ ] gender max length
- [ ] age positive integer
- [ ] weight positive float
- [ ] healthNote
- [ ] behaviorNote
- [ ] avatar validation
- [ ] avatar cancel
- [ ] avatar upload failure
- [ ] POST failure
- [ ] POST success
- [ ] edit route receives petId
- [ ] GET /pets/:id hydration
- [ ] edit numeric fields correctly normalized
- [ ] PUT success
- [ ] PUT failure
- [ ] delete confirmation
- [ ] delete cancel
- [ ] delete success
- [ ] delete failure
- [ ] 401
- [ ] 403
- [ ] return to list refresh

**ADDRESSES:**
- [ ] loading
- [ ] empty
- [ ] populated
- [ ] GET error
- [ ] addressLine required
- [ ] invalid latitude
- [ ] invalid longitude
- [ ] valid coordinates
- [ ] addressType HOME
- [ ] addressType WORK
- [ ] addressType OTHER
- [ ] isDefault false
- [ ] isDefault true
- [ ] create success
- [ ] create failure
- [ ] edit hydration
- [ ] PATCH success
- [ ] PATCH failure
- [ ] change default
- [ ] delete confirmation
- [ ] delete cancel
- [ ] DELETE 204 success
- [ ] delete failure
- [ ] 401
- [ ] 403
- [ ] return to list refresh

**AUTH/NAVIGATION:**
- [ ] unauthenticated -> login
- [ ] CUSTOMER -> customer routes
- [ ] PROVIDER cannot access customer routes
- [ ] direct route access
- [ ] back navigation
- [ ] nested route navigation
- [ ] add/edit -> list refresh
- [ ] no duplicate stack
- [ ] Phase 2A regression
- [ ] Phase 2B regression
- [ ] Phase 2C regression

## 16. Risk Register
1. **CamelCase vs snake_case mapping**: Strict typed mapper `user.mapper.ts` prevents spreading invalid data.
2. **`isActive` to `status` mapping limitation**: Backend provides boolean, Mobile expects specific strings. Mitigated by explicit mapping and flagging for future backend contract updates.
3. **Phone nullability**: Explicitly normalized to string or undefined in mapper.
4. **Multipart field collision (`file` vs `avatar`)**: Distinct prepare functions handle respective endpoints properly.
5. **Fake dev coordinates**: `DevCoordinateFallback` explicitly labeled as development-only.
6. **Missing `expo-image-picker`**: Step 0 gate prevents blocked execution by checking dependencies first and pausing for user approval if missing.
7. **Stale AuthContext**: Server-confirmed synchronization prevents optimistic data mismatches.

## 17. Final Plan Verdict
PLAN V2.2 READY FOR REVIEW
