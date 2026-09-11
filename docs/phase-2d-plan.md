# Phase 2D Implementation Plan

## 1. Executive Summary
This implementation plan outlines the blueprint for delivering Phase 2D of the PetCare Mobile Application, covering Customer Profile, Pet Management, and Customer Address Management. The plan conforms strictly to the approved Phase 2D Audit and adheres to existing architectural constraints without introducing unnecessary global states or deviating from the design system.

## 2. Approved Scope
**Target Features:**
A. Customer Profile (View, Edit, Avatar Upload)
B. Pet Management (CRUD + Avatar)
C. Customer Address Management (CRUD + Set Default)
D. Required Navigation (within `app/(customer)`)
E. Required Customer Home integration (Profile display only)
F. AuthContext integration (Optimistic UI update)

*All other domains (Provider Discovery, Booking, Chat, etc.) are strictly out of scope for Phase 2D.*

## 3. Architecture
- **Routing**: Expo Router `app/(customer)/...`. No business logic or API calls here.
- **Features**: Scoped under `src/features/profile`, `src/features/pets`, `src/features/addresses`.
- **Infrastructure**: All HTTP integration leverages existing `src/infrastructure/api/client.ts`.
- **Core**: Reusable UI components stay in `src/core/components`.
- **State**: React Context (`AuthContext`) for auth, Local state/Hooks for feature logic. No Redux, Zustand, or TanStack Query.
- **Design System**: Reuse Phase 2A/2B Blue + Warm Yellow theme.

## 4. Backend API Contract
**Profile**:
- `GET /users/me` -> `{ id, fullName, email, phone, avatarUrl, role, isActive, createdAt, updatedAt }`
- `PATCH /users/me` -> `{ fullName?: string, phone?: string }`
- `PATCH /users/me/avatar` -> (Multipart: `file`)

**Pets**:
- `GET /pets` -> `PetRecord[]`
- `GET /pets/:id` -> `PetRecord`
- `POST /pets` -> (Multipart: `avatar`, Body fields). Returns `PetRecord`
- `PUT /pets/:id` -> (Multipart: `avatar`, Body fields). Returns `PetRecord`
- `DELETE /pets/:id` -> `void`

**Addresses**:
- `GET /customer-addresses` -> `CustomerAddressRecord[]`
- `GET /customer-addresses/:id` -> `CustomerAddressRecord`
- `POST /customer-addresses` -> Body fields. Returns `CustomerAddressRecord`
- `PATCH /customer-addresses/:id` -> Body fields (`isDefault` included). Returns `CustomerAddressRecord`
- `DELETE /customer-addresses/:id` -> `204 No Content`

## 5. Customer Profile Plan
- **Types**: Use `UserProfile` from `src/features/auth/types/auth.types.ts`.
- **API Adapter**: Add `updateProfile` and `uploadAvatar` to `src/features/auth/api/authApi.ts`.
- **Screens**: 
  - `ProfileScreen`: Displays current `user` from `AuthContext`.
  - `EditProfileScreen`: Form for `fullName` and `phone`.
- **Avatar Picker**: Use `expo-image-picker`. Upload calls `authApi.uploadAvatar`.
- **AuthContext Sync**: Upon successful PATCH, call `updateUser(response.data)` on the Context to reflect changes instantly.

## 6. AuthContext Integration
The existing `AuthContext` will be enhanced with a new `updateUser` method to support optimistic profile updates.
- **Signature**: `updateUser: (profile: Partial<UserProfile>) => void;`
- **Merge Strategy**: `setState(prev => ({ ...prev, user: { ...prev.user, ...profile } }))`
- **API Response**: The API returns the fully updated user object (`publicUserSelect`). We merge this response into the state.
- **Session Auth**: `restoreSession()` continues calling `/auth/me` to remain the authoritative source of truth upon app load.
- **Avatar Updates**: Avatar uploads return the new user profile, which is passed to `updateUser`.
- **Logout**: Resets `user` to `null`.

## 7. Pets Plan
- **Types**: Defined in `src/features/pets/types/pet.types.ts`.
- **API Adapter**: Use existing `src/features/pets/api/petApi.ts`.
- **Screens**: 
  - `PetListScreen`: Displays `PetCard`s.
  - `PetFormScreen`: Used for both Add and Edit routes.
- **Avatar**: Use `expo-image-picker`. File is appended to `FormData` (`prepareFormData`).
- **Validation**: Strict validation (name, species required) via inline React state.
- **Mutation State**: Form disabling and loading indicators during submission. Upon success, navigation pops back to List, which uses a focus effect to refetch.

## 8. Addresses Plan
- **Types**: Defined in `src/features/addresses/types/address.types.ts`.
- **API Adapter**: Use existing `src/features/addresses/api/addressApi.ts`.
- **Screens**: 
  - `AddressListScreen`: Displays `AddressCard`s.
  - `AddressFormScreen`: Used for both Add and Edit routes.
- **Set Default**: Handled within the `AddressFormScreen` as a boolean switch (`isDefault`).
- **Mutation State**: Form disabling and loading indicators during submission. Upon success, navigation pops back to List, which uses a focus effect to refetch.

## 9. Location Boundary
- **Restriction**: NO map SDK, NO `expo-location`, NO location picker in Phase 2D.
- **Backend Requirement**: `latitude` and `longitude` are required by Prisma schema for address creation.
- **Development Mechanism**: `AddressFormScreen` will include hidden or debug-only text inputs for Latitude and Longitude to allow valid API submission, pre-filled with a central city coordinate (e.g., Ho Chi Minh City: `10.8231`, `106.6297`).
- **Abstraction**: Abstract the coordinate selection into a `<LocationPickerFallback />` component that simply returns the mock coordinates, ready to be swapped for a real map picker later without changing the form logic.

## 10. Navigation Plan
We will use standard Expo Router routing inside `app/(customer)`:
- `app/(customer)/profile.tsx` (Update placeholder to import `ProfileScreen`)
- `app/(customer)/profile/edit.tsx` -> `EditProfileScreen`
- `app/(customer)/pets/index.tsx` -> `PetListScreen` (Already exists)
- `app/(customer)/pets/add.tsx` -> `PetFormScreen` (Mode: Add)
- `app/(customer)/pets/[id]/edit.tsx` -> `PetFormScreen` (Mode: Edit)
- `app/(customer)/addresses/index.tsx` -> `AddressListScreen` (Already exists)
- `app/(customer)/addresses/add.tsx` -> `AddressFormScreen` (Mode: Add)
- `app/(customer)/addresses/[id]/edit.tsx` -> `AddressFormScreen` (Mode: Edit)

## 11. Screen Plan
1. **ProfileScreen**: 
   - Source: `AuthContext`.
   - Local State: Avatar upload loading state.
   - Actions: Navigate to EditProfile, Upload Avatar, Logout.
2. **EditProfileScreen**:
   - Source: `AuthContext` (initial values).
   - Local State: Form values, loading, error.
   - API: `authApi.updateProfile`.
3. **PetListScreen**:
   - Source: `petApi.getPets()`.
   - Local State: `pets`, `isLoading`, `isError`.
   - Actions: Navigate to add/edit, Delete confirmation modal.
4. **PetFormScreen**:
   - Source: Route params (id). If id, fetch via `petApi.getPet(id)`.
   - Actions: `petApi.createPet` or `petApi.updatePet`.
5. **AddressListScreen**:
   - Source: `addressApi.getAddresses()`.
   - Local State: `addresses`, `isLoading`, `isError`.
   - Actions: Navigate to add/edit, Delete confirmation modal.
6. **AddressFormScreen**:
   - Source: Route params (id). If id, fetch via `addressApi.getAddress(id)`.
   - Actions: `addressApi.createAddress` or `addressApi.updateAddress`.

## 12. Component Plan
**Reuse (Core)**:
- `Screen`, `Button`, `Input`, `Card`, `Avatar`, `Icon`, `Toast`, `EmptyState`, `SegmentedControl`.

**New Feature Components**:
- `PetCard`: `src/features/pets/components/PetCard.tsx`
- `AddressCard`: `src/features/addresses/components/AddressCard.tsx`
- `AvatarPicker`: `src/features/auth/components/AvatarPicker.tsx` (Wraps Core Avatar with `expo-image-picker` logic).

*No generic SelectInput or CRUD framework will be created.*

## 13. API Adapter Plan
Existing Adapters:
- `src/features/auth/api/authApi.ts` (Need to add `updateProfile`, `uploadAvatar`)
- `src/features/pets/api/petApi.ts` (Already exists and complete)
- `src/features/addresses/api/addressApi.ts` (Already exists and complete)

All adapters continue to use `src/infrastructure/api/client.ts` to preserve access token, interceptors, and error handling. No raw Axios calls in screens.

## 14. Multipart Plan
- **Usage**: `PATCH /users/me/avatar`, `POST /pets`, `PUT /pets/:id`.
- **Implementation**: The `prepareFormData` utility in `petApi.ts` is confirmed to work (maps `{ uri, type, name }`). We will create a similar helper or inline logic for `authApi.ts` avatar upload.
- **Client**: `client.ts` works seamlessly with `FormData`. No changes required to Axios interceptors.

## 15. Validation Plan
**Profile**:
- `fullName`: max 100, optional (but UI should require it).
- `phone`: max 20, optional.

**Pets**:
- `name`: max 100, required.
- `species`: Enum (`Dog` | `Cat`), required. (UI: SegmentedControl).
- `breed`: max 100, optional.
- `age`: integer, >0, optional. (UI: numeric pad).
- `weight`: float, >0, optional. (UI: decimal pad).
- `gender`: max 20, optional.
- `healthNote`, `behaviorNote`: optional text.
- `avatar`: max 5MB, png/jpeg/jpg/webp.

**Addresses**:
- `addressLine`: required string.
- `latitude`, `longitude`: required numbers (-90 to 90, -180 to 180).
- `addressType`: Enum (`HOME`, `WORK`, `OTHER`), optional. (UI: SegmentedControl).
- `isDefault`: boolean, optional. (UI: Switch).

## 16. State Management Plan
- **Profile**: Reads directly from `AuthContext`.
- **Pets / Addresses**: 
  - Feature-local state (`useState`, `useEffect`) inside `PetListScreen` and `AddressListScreen`.
  - Mutation loading states handled locally in forms.
  - **List Refresh**: Use `useFocusEffect` from Expo Router in List screens to re-fetch data whenever the screen comes into focus (e.g., returning from an Add/Edit screen).

## 17. Customer Home Integration
- **Current State**: Home screen might need to say "Hello, [Name]".
- **Integration**: `HomeScreen` will consume `useAuth()` to get `user.fullName` and `user.avatarUrl`. No redundant API calls.

## 18. Error Handling
- Use the existing `ApiError` class.
- **UI Mechanism**: Catch blocks in screens call `Toast.show({ type: 'error', text: error.message })`.
- **Coverage**:
  - `400`: Validation errors (show Toast).
  - `413`: Payload too large (Avatar > 5MB - show Toast).
  - `401`: Token expired (handled by Axios interceptor queue/refresh).
  - `403`: Forbidden (show Toast, force navigation if necessary).
  - `500`: Server error (show generic fallback Toast).

## 19. Delete & Default Behavior
- **Delete Pet/Address**: 
  - UI: Provide a trash icon. On press, show a native `Alert` or modal for confirmation.
  - Action: Calls `DELETE` endpoint. On success -> Toast -> refetch list.
- **Default Address**:
  - Action: Update an address with `isDefault: true` via `PATCH`. Backend handles implicitly stripping the default flag from other addresses. Mobile UI simply refetches the list.

## 20. Design System / Stitch Mapping
- **Theme**: Stick to `src/core/theme/colors.ts` (Primary: `#2563EB`, Secondary: `#F5B82E`).
- **Typography**: Plus Jakarta Sans.
- **Visuals**: PetCards and AddressCards will be padded, rounded rectangles with subtle borders/shadows matching CUS-PROF-01 standards. Empty states will use the `EmptyState` core component with an appropriate icon.

## 21. File Change Plan

| File | Action | Purpose |
|---|---|---|
| `src/features/auth/context/AuthContext.tsx` | MODIFY | Add `updateUser` method. |
| `src/features/auth/api/authApi.ts` | MODIFY | Add `updateProfile` and `uploadAvatar`. |
| `src/features/auth/components/AvatarPicker.tsx`| CREATE | Reusable avatar picker for profile. |
| `app/(customer)/profile.tsx` | MODIFY | Import and render `ProfileScreen`. |
| `app/(customer)/profile/edit.tsx` | CREATE | Route for `EditProfileScreen`. |
| `src/features/profile/screens/ProfileScreen.tsx` | CREATE | Display user info & actions. |
| `src/features/profile/screens/EditProfileScreen.tsx`| CREATE | Form to edit fullName and phone. |
| `app/(customer)/pets/add.tsx` | CREATE | Route. |
| `app/(customer)/pets/[id]/edit.tsx` | CREATE | Route. |
| `src/features/pets/components/PetCard.tsx` | CREATE | UI for Pet item. |
| `src/features/pets/screens/PetListScreen.tsx` | MODIFY | Connect API and render PetCards. |
| `src/features/pets/screens/PetFormScreen.tsx` | CREATE | Add/Edit form for pets. |
| `app/(customer)/addresses/add.tsx` | CREATE | Route. |
| `app/(customer)/addresses/[id]/edit.tsx` | CREATE | Route. |
| `src/features/addresses/components/AddressCard.tsx`| CREATE | UI for Address item. |
| `src/features/addresses/screens/AddressListScreen.tsx`| MODIFY | Connect API and render AddressCards. |
| `src/features/addresses/screens/AddressFormScreen.tsx`| CREATE | Add/Edit form for addresses. |
| `package.json` | NO CHANGE | `expo-image-picker` should already be installed, if not, wait for approval. |

## 22. Implementation Order
1. **Types & Context**: Update `AuthContext` to support `updateUser`.
2. **API Adapters**: Enhance `authApi.ts`.
3. **Profile Feature**: Build `AvatarPicker`, `ProfileScreen`, `EditProfileScreen`, and link routes.
4. **Pets Feature**: Build `PetCard`, `PetFormScreen`, wire up `PetListScreen`, link routes.
5. **Addresses Feature**: Build `AddressCard`, `AddressFormScreen`, wire up `AddressListScreen`, link routes.
6. **Home Integration**: Ensure Home displays user name/avatar via Context.
7. **UX Polish & Verification**: Add Toasts, Loaders, and test Error states.

## 23. Verification Plan
- **TypeScript**: Run `npx tsc --noEmit` to ensure no typing errors.
- **Profile**: Verify `GET /users/me` loads in AuthContext. Verify `PATCH /users/me` updates the UI immediately. Verify Avatar upload respects 5MB limit.
- **Pets**: Verify list population, successful Add/Edit with/without avatar, and Delete confirmation. Verify SegmentedControl for Species.
- **Addresses**: Verify Add/Edit, including toggling `isDefault`. Verify mock coordinates pass validation.
- **Auth/Navigation**: Verify protected routes work, and `useFocusEffect` properly re-fetches lists on back navigation.

## 24. Risk Register

| Risk | Probability | Impact | Mitigation | Phase |
|---|---|---|---|---|
| Multipart FormData compatibility fails on specific RN version | Low | High | Use precise `{ uri, type, name }` format. Test Android/iOS boundaries early. | Implementation |
| AuthContext sync issues causing stale profile data | Low | Medium | Ensure `updateUser` strictly merges partial profiles and `restoreSession` acts as source of truth. | Implementation |
| Expo Router dynamic route typos (`[id]/edit`) | Low | High | Follow exact folder structure from plan. Avoid `as any` where typed routes allow. | Implementation |
| Missing Location SDK blocks address creation | Medium | High | Hardcode valid default coordinates in a hidden fallback component for Phase 2D MVP. | Implementation |

## 25. Scope Boundary
Out of scope: Location/Map SDKs, complex Select dropdowns (using generic UI elements instead), dedicated Profile Context (using AuthContext), and any Provider/Booking functionality.

## 26. Definition of Done
- Customer can view and edit profile (Name, Phone).
- Customer can upload profile avatar.
- Customer can perform full CRUD on Pets, including avatars.
- Customer can perform full CRUD on Addresses, including setting a default.
- Address form successfully bypasses the lack of maps by providing static valid coordinates.
- UI handles Loading, Empty, and Error states cleanly via Toasts/Skeletons.
- TypeScript compiles cleanly (`tsc --noEmit`).
- No regressions on Phase 2A/B/C features.

## 27. Plan Verdict
**PLAN READY FOR REVIEW**
