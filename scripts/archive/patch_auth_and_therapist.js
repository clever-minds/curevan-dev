const fs = require('fs');

// Patch authController.js
const authPath = 'C:\\curevan_node\\src\\controllers\\auth\\authController.js';
let authContent = fs.readFileSync(authPath, 'utf8');

const targetAuth = `    /* ---------- Build final changes object ---------- */
    const changes = {};
    const allKeys = new Set([...Object.keys(newValues), ...Object.keys(extraFields)]);

    allKeys.forEach((key) => {
      // old value from DB
      let oldVal = oldData[fieldMapping[key] || key] ?? null;

      // new value from request or extra fields
      let newVal = newValues[key] ?? extraFields[key];`;

const replacementAuth = `    /* ---------- Build final changes object ---------- */
    const changes = {};
    const allKeys = new Set(Object.keys(newValues));

    allKeys.forEach((key) => {
      // old value from DB
      let oldVal = oldData[fieldMapping[key] || key] ?? null;

      // new value from request
      let newVal = newValues[key];`;

if (authContent.includes(targetAuth)) {
  authContent = authContent.replace(targetAuth, replacementAuth);
  fs.writeFileSync(authPath, authContent, 'utf8');
  console.log('Successfully patched authController.js!');
} else {
  console.log('Target content not found in authController.js or already patched.');
}

// Patch therapistController.js
const therPath = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';
let therContent = fs.readFileSync(therPath, 'utf8');

const targetTher1 = `    let specArray = Array.isArray(profile.specialty)
      ? profile.specialty
      : profile.specialty
      ? profile.specialty.replace(/[{}]/g, "").split(",")
      : [];
      
    profile.specialty = specArray.map(id => idToName[id] || id);`;

const replacementTher1 = `    let specArray = Array.isArray(profile.specialty)
      ? profile.specialty
      : profile.specialty
      ? profile.specialty.replace(/[{}]/g, "").split(",")
      : [];
      
    profile.specialtyIds = specArray.map(id => Number(id) || id);
    profile.specialty = specArray.map(id => idToName[id] || id);`;

if (therContent.includes(targetTher1)) {
  therContent = therContent.replace(targetTher1, replacementTher1);
  fs.writeFileSync(therPath, therContent, 'utf8');
  console.log('Successfully patched therapistController.js!');
} else {
  console.log('Target content 1 not found in therapistController.js or already patched.');
}
