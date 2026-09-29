const fs = require('fs');

// Patch authController.js
const authPath = 'C:\\curevan_node\\src\\controllers\\auth\\authController.js';
let authContent = fs.readFileSync(authPath, 'utf8');

authContent = authContent.replace(
  'const allKeys = new Set([...Object.keys(newValues), ...Object.keys(extraFields)]);',
  'const allKeys = new Set(Object.keys(newValues));'
);

authContent = authContent.replace(
  'let newVal = newValues[key] ?? extraFields[key];',
  'let newVal = newValues[key];'
);

fs.writeFileSync(authPath, authContent, 'utf8');
console.log('Successfully patched authController.js!');

// Patch therapistController.js
const therPath = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';
let therContent = fs.readFileSync(therPath, 'utf8');

therContent = therContent.replace(
  /profile\.specialty = specArray\.map\(id => idToName\[id\] \|\| id\);/g,
  'profile.specialtyIds = specArray.map(id => Number(id) || id);\n    profile.specialty = specArray.map(id => idToName[id] || id);'
);

therContent = therContent.replace(
  /user\.specialty = specArray\.map\(id => idToName\[id\] \|\| id\);/g,
  'user.specialtyIds = specArray.map(id => Number(id) || id);\n        user.specialty = specArray.map(id => idToName[id] || id);'
);

therContent = therContent.replace(
  /u\.specialty = specArray\.map\(id => idToName\[id\] \|\| id\);/g,
  'u.specialtyIds = specArray.map(id => Number(id) || id);\n        u.specialty = specArray.map(id => idToName[id] || id);'
);

fs.writeFileSync(therPath, therContent, 'utf8');
console.log('Successfully patched therapistController.js!');
