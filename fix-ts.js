const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(([search, replace]) => {
    content = content.split(search).join(replace);
  });
  fs.writeFileSync(filePath, content, 'utf8');
};

const screens = [
  'src/features/addresses/components/AddressCard.tsx',
  'src/features/addresses/components/DevCoordinateFallback.tsx',
  'src/features/addresses/screens/AddressFormScreen.tsx',
  'src/features/addresses/screens/AddressListScreen.tsx',
  'src/features/pets/components/PetCard.tsx',
  'src/features/pets/screens/PetFormScreen.tsx',
  'src/features/pets/screens/PetListScreen.tsx',
  'src/features/profile/components/AvatarPicker.tsx',
  'src/features/profile/screens/EditProfileScreen.tsx',
  'src/features/profile/screens/ProfileScreen.tsx',
];

const generalReplacements = [
  ['theme.colors.background.alt', 'theme.colors.background.default'],
  ['theme.typography.body', 'theme.typography.bodyMd'],
  ["import { useToast } from '@/core/components/Toast';", "import { Toast } from '@/core/components/Toast';\nimport { StatusVariant } from '@/core/components/StatusBadge';"],
  ['const { showToast } = useToast();', 'const [toast, setToast] = useState({ visible: false, message: "", variant: "success" as StatusVariant });\n  const showToast = (message: string, variant: StatusVariant = "success") => setToast({ visible: true, message, variant });'],
  ["showToast('", "showToast('"], // just keeping it
];

screens.forEach(file => {
  replaceInFile(path.join(__dirname, file), generalReplacements);
});

// Specific replacements
replaceInFile(path.join(__dirname, 'src/features/addresses/types/address.types.ts'), [
  ['export interface Address {', "export type AddressType = 'HOME' | 'WORK' | 'OTHER';\n\nexport interface Address {"]
]);

replaceInFile(path.join(__dirname, 'src/features/addresses/screens/AddressListScreen.tsx'), [
  ['CustomerAddress', 'Address'],
  ["router.push(`/(customer)/addresses/${item.id}/edit`)", "router.push(`/(customer)/addresses/${item.id}/edit` as any)"],
  ["action={{", "actionLabel=\"Add Address\"\n            onAction={() => router.push('/(customer)/addresses/add')}"]
]);
// Remove the leftover action object
replaceInFile(path.join(__dirname, 'src/features/addresses/screens/AddressListScreen.tsx'), [
  ["              label: 'Add Address',\n              onPress: () => router.push('/(customer)/addresses/add')\n            }}", ""]
]);

replaceInFile(path.join(__dirname, 'src/features/pets/screens/PetListScreen.tsx'), [
  ["router.push(`/(customer)/pets/${item.id}/edit`)", "router.push(`/(customer)/pets/${item.id}/edit` as any)"],
  ["action={{", "actionLabel=\"Add Pet\"\n            onAction={() => router.push('/(customer)/pets/add')}"]
]);
replaceInFile(path.join(__dirname, 'src/features/pets/screens/PetListScreen.tsx'), [
  ["              label: 'Add Pet',\n              onPress: () => router.push('/(customer)/pets/add')\n            }}", ""]
]);

replaceInFile(path.join(__dirname, 'src/features/profile/screens/EditProfileScreen.tsx'), [
  ["import { ApiError } from '@/infrastructure/api/client';", "import { ApiError } from '@/core/errors/ApiError';"],
  ["helpText=", "helperText="]
]);

replaceInFile(path.join(__dirname, 'src/features/addresses/screens/AddressFormScreen.tsx'), [
  ['theme.colors.primary.light', 'theme.colors.primary.container']
]);

// Add <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} /> to screens that use showToast
const addToastComponent = (filePath) => {
  const p = path.join(__dirname, filePath);
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('showToast')) {
    content = content.replace('</Screen>', '  <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />\n    </Screen>');
    fs.writeFileSync(p, content, 'utf8');
  }
};

const screensWithToast = [
  'src/features/addresses/screens/AddressFormScreen.tsx',
  'src/features/addresses/screens/AddressListScreen.tsx',
  'src/features/pets/screens/PetFormScreen.tsx',
  'src/features/pets/screens/PetListScreen.tsx',
  'src/features/profile/screens/EditProfileScreen.tsx',
];

screensWithToast.forEach(addToastComponent);

// For AvatarPicker which is not a Screen, we need to add <Toast> at the end of the return statement
let avatarPickerContent = fs.readFileSync(path.join(__dirname, 'src/features/profile/components/AvatarPicker.tsx'), 'utf8');
avatarPickerContent = avatarPickerContent.replace('</View>\n  );', '  <Toast visible={toast.visible} message={toast.message} variant={toast.variant} onHide={() => setToast(prev => ({ ...prev, visible: false }))} />\n    </View>\n  );');
fs.writeFileSync(path.join(__dirname, 'src/features/profile/components/AvatarPicker.tsx'), avatarPickerContent, 'utf8');

console.log('Fixed TS errors.');
