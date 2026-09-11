# PHASE 2D: CUSTOMER PROFILE + PETS + ADDRESSES
## Technical & Product Audit Report

### 1. Executive Summary
This report audits the current PetCare mobile codebase, the Backend API implementation, and the Stitch design artifacts to prepare for the implementation of Phase 2D (Customer Profile, Pets, and Addresses).

## Audit Refinement

### Exact API Matrix

**CUSTOMER PROFILE**
- `GET /users/me`: Exists. Auth: Yes. Role: Any. Body: None. Response: publicUserSelect (id, fullName, email, phone, avatarUrl, role, isActive, createdAt, updatedAt).
- `PATCH /users/me`: Exists. Auth: Yes. Role: Any. Body JSON: `{ fullName?: string, phone?: string }`. Response: publicUserSelect.
- `PATCH /users/me/avatar`: Exists. Auth: Yes. Role: Any. Multipart: `file` (Max 5MB, png/jpeg/jpg/webp). Response: publicUserSelect.

**PETS**
- `GET /pets`: Exists. Auth: Yes. Role: CUSTOMER. Response: PetRecord[].
- `GET /pets/:id`: Exists. Auth: Yes. Role: CUSTOMER. Response: PetRecord.
- `POST /pets`: Exists. Auth: Yes. Role: CUSTOMER. Multipart: `avatar` (Max 5MB, png/jpeg/jpg/webp), Body: `name, species, breed, age, weight, gender, healthNote, behaviorNote`. Response: PetRecord.
- `PUT /pets/:id`: Exists. Auth: Yes. Role: CUSTOMER. Multipart: `avatar`, Body: Same as POST. Response: PetRecord.
- `DELETE /pets/:id`: Exists. Auth: Yes. Role: CUSTOMER. Response: void.
- Avatar operation: Handled inline with POST/PUT using `multipart/form-data`.

**ADDRESSES**
- `GET /customer-addresses`: Exists. Auth: Yes. Role: CUSTOMER. Response: CustomerAddressRecord[].
- `GET /customer-addresses/:id`: Exists. Auth: Yes. Role: CUSTOMER. Response: CustomerAddressRecord.
- `POST /customer-addresses`: Exists. Auth: Yes. Role: CUSTOMER. Body JSON: `addressLine, latitude, longitude, label, receiverName, phone, ward, district, city, formattedAddress, placeId, addressType, isDefault`. Response: CustomerAddressRecord.
- `PATCH /customer-addresses/:id`: Exists. Auth: Yes. Role: CUSTOMER. Body JSON: Partial of POST. Response: CustomerAddressRecord.
- `DELETE /customer-addresses/:id`: Exists. Auth: Yes. Role: CUSTOMER. Response: 204 No Content.
- Set-default: Handled via `isDefault` field in POST/PATCH. No dedicated endpoint.

### Response Contract

- `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/avatar`: Returns `publicUserSelect`: `{ id, fullName, email, phone, avatarUrl, role, isActive, createdAt, updatedAt }`.
- `GET /pets`, `POST /pets`, `PUT /pets`: Returns `PetRecord` (matching Prisma model).
- `GET /customer-addresses`, `POST /customer-addresses`, `PATCH /customer-addresses`: Returns `CustomerAddressRecord` (matching Prisma model).

### Pet Validation Matrix

- **species**: Enum (`Dog`, `Cat`), required.
- **gender**: String, max 20, optional.
- **name**: String, max 100, required.
- **breed**: String, max 100, optional.
- **age**: Int, positive, optional.
- **weight**: Number (Float), positive, optional.
- **healthNote**: String, optional.
- **behaviorNote**: String, optional.
- **avatar constraints**: Max 5MB, restricted to `.(png|jpeg|jpg|webp)`.

### Address Validation Matrix

- **addressLine**: String, required.
- **latitude**: Number, Min -90, Max 90, required.
- **longitude**: Number, Min -180, Max 180, required.
- **label**: String, optional.
- **receiverName**: String, optional.
- **phone**: String, optional.
- **ward, district, city, formattedAddress, placeId**: String, optional.
- **addressType**: Enum (`HOME`, `WORK`, `OTHER`), optional. Default: `OTHER`.
- **isDefault**: Boolean, optional. Default: `false`.

### Delete & Default Behavior

- **Pet deletion**: Exists (`DELETE /pets/:id`). Also cleans up the avatar image in Supabase automatically.
- **Address deletion**: Exists (`DELETE /customer-addresses/:id`). Performs soft delete (sets `deleted_at`).
- **Default address**: No dedicated endpoint. Handled via `isDefault` boolean in `POST` / `PATCH`.

### AuthContext Decision

- **Exact User Type**: `UserProfile` (`{ id, email, full_name, role, status, avatar_url, created_at }`).
- **Stored Fields**: `user`, `isAuthenticated`, `isLoading`.
- **Consumers**: App layouts for routing protection, Profile screens.
- **Mutation**: Profile mutations (`PATCH /users/me`) *must* update AuthContext.
- **Recommendation**: Do NOT create a dedicated profile state. Enhance `AuthContext` with an `updateUser(profile: Partial<UserProfile>)` method. `user` state is central to the app, avoiding state desync is preferable.

### Multipart Audit

- **Content-Type**: Configured manually per-request in `petApi.ts` (`Content-Type: multipart/form-data`).
- **FormData compatibility**: The API uses standard React Native `FormData` `{ uri, type, name }` pattern in `prepareFormData()`.
- **Interceptor Behavior**: The `apiClient` request interceptor appends `Authorization: Bearer <token>` to `config.headers`. It preserves existing headers, making it fully compatible with `multipart/form-data`.
- **Upload Helpers**: Handled per-feature in `api` files. No generic upload helper exists.

### Location Audit

- **Existing Infrastructure**: `src/infrastructure/location/index.ts` is currently completely empty.
- **Current Support**: The project currently has NO device location, coordinates, map picker, or reverse geocoding implemented.
- **Verdict**: OPEN DECISION (Map provider and location library need to be decided).

### Navigation Matrix

| Flow | Current Route | Required Route | Existing | Missing | Notes |
|---|---|---|---|---|---|
| Profile | `app/(customer)/profile.tsx` | `app/(customer)/profile.tsx` | Yes | No | Currently a placeholder. |
| Edit Profile | None | `app/(customer)/profile/edit.tsx` | No | Yes | Needed for PATCH /users/me. |
| Pets | `app/(customer)/pets/index.tsx` | `app/(customer)/pets/index.tsx` | Yes | No | Hardcoded UI present. |
| Add Pet | None | `app/(customer)/pets/add.tsx` | No | Yes | |
| Edit Pet | None | `app/(customer)/pets/[id]/edit.tsx` | No | Yes | |
| Pet Detail | None | None | No | No | Not strictly required by Stitch yet, but GET /pets/:id exists. |
| Addresses | `app/(customer)/addresses/index.tsx` | `app/(customer)/addresses/index.tsx` | Yes | No | Hardcoded UI present. |
| Add Address | None | `app/(customer)/addresses/add.tsx` | No | Yes | |
| Edit Address | None | `app/(customer)/addresses/[id]/edit.tsx` | No | Yes | |

### Stitch State Matrix

| State | Profile | Pets | Addresses | Classification |
|---|---|---|---|---|
| Loading | Full screen spinner | Skeleton list | Skeleton list | FLOW-DERIVED |
| Empty | N/A | Empty state illustration | Empty state illustration | FLOW-DERIVED |
| Loaded | Content displayed | List of cards | List of cards | STITCH DEFINED (Profile), FLOW-DERIVED (CRUD) |
| Edit | Inline form | Dedicated route | Dedicated route | FLOW-DERIVED |
| Validation | Red text under inputs | Red text under inputs | Red text under inputs | FLOW-DERIVED |
| Saving | Button loading state | Button loading state | Button loading state | IMPLEMENTATION DECISION |
| Error | Toast / Alert | Toast / Alert | Toast / Alert | IMPLEMENTATION DECISION |
| Delete Conf. | N/A | Modal dialog | Modal dialog | IMPLEMENTATION DECISION |
| Success | Toast | Toast / Go back | Toast / Go back | IMPLEMENTATION DECISION |
| Upload State | Progress/Spinner on Avatar | Spinner on Avatar | N/A | IMPLEMENTATION DECISION |

### Component Matrix

| UI Need | Existing Component | Reuse | New Component Needed | Core or Feature |
|---|---|---|---|---|
| Pet List Card | None | No | PetCard | Feature (Pets) |
| Address List Card | None | No | AddressCard | Feature (Addresses) |
| Avatar Picker | `src/core/components/Avatar` (Display only) | Yes | AvatarPicker | Feature (Profile) |
| Text Input | `src/core/components/Input` | Yes | No | Core |
| Select / Dropdown | None | No | SelectInput | Core |
| Submit Button | `src/core/components/Button` | Yes | No | Core |

### Verification Matrix

- **PROFILE**
  - load: Check `AuthContext.restoreSession` calls `/users/me`.
  - update: Check `PATCH /users/me` reflects in `AuthContext` without reload.
  - avatar: Check `PATCH /users/me/avatar` uploads correctly and updates `AuthContext`.
  - error: Verify 400/413 (File too large) handled via UI Toasts.
- **PETS**
  - list: Displays mapped `PetRecord[]`.
  - empty: Shows `EmptyState` component.
  - create: Verify multipart upload of avatar + data works.
  - edit: Verify pre-filled data and partial patch.
  - delete: Modal confirmation -> Delete -> Refresh list.
  - avatar: Image picker constraints verified before API call.
  - validation: Forms blocked if missing `name` or `species`.
- **ADDRESSES**
  - list: Displays `CustomerAddressRecord[]` with default tag.
  - empty: Shows `EmptyState`.
  - create: Coordinates fetched/picked, `addressLine` validated.
  - edit: Verify `isDefault` toggle.
  - delete: Modal confirmation -> Delete.
  - default: Patching with `isDefault=true` works.
  - location: Coordinates passed explicitly to backend.
- **NAVIGATION**
  - customer protection: Tab layout verifies `role === CUSTOMER`.
  - back navigation: Hardware back works correctly after Add/Edit.
  - tab preservation: Profile tab doesn't unmount unnecessarily.
- **AUTH**
  - session: Preserved via secure store token.
  - logout: Clears Context and token.
  - 401: Triggers interceptor -> refresh -> retry or force logout.
  - 403: Navigates to fallback / logs out if role revoked.

### Open Questions

1. **Map/Location Provider**:
   - *Why it matters*: Address creation requires `latitude` and `longitude`.
   - *Current evidence*: `src/infrastructure/location/` is empty.
   - *Recommended decision*: Decide on `expo-location` for device coordinates and implement a Google Maps Place Picker (needs API key). Until then, manual coordinate entry or default coordinates for development.

2. **Select/Dropdown Component**:
   - *Why it matters*: Pet species (`Dog` | `Cat`) requires a constrained input.
   - *Current evidence*: No standard `<Select />` component in `src/core/components`.
   - *Recommended decision*: Implement a simple `ActionSheet` or `SegmentedControl` (exists) for Pet species.

### Final Audit Verdict

AUDIT READY FOR PLAN
