const fs = require('fs');
const file = 'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/app/dashboard/admin/profile-approvals/page.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  /if \(lowerName\.includes\('document'\) \|\| lowerName\.includes\('image'\) \|\| lowerName\.includes\('proof'\) \|\| lowerName\.includes\('license'\)\)/,
  "if (lowerName.includes('document') || lowerName.includes('image') || lowerName.includes('proof') || lowerName.includes('license') || lowerName.includes('file') || lowerName.includes('media') || lowerName.includes('kyc') || lowerName.includes('doc'))"
);
fs.writeFileSync(file, code);
