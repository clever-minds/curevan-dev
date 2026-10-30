const fs = require('fs');

const path = 'c:/Users/ujjaw/Downloads/curevan-24-07-2026/curevan-dev/src/lib/repos/categories.ts';
let code = fs.readFileSync(path, 'utf8');

const fallbackString = `  // Fallback
  return [
    { id: 1, name: "Physiotherapy" },
    { id: 2, name: "Nursing Care" },
    { id: 3, name: "Geri care Therapy" },
    { id: 4, name: "Speech Therapy" },
    { id: 5, name: "Mental Health Counseling" },
    { id: 6, name: "Dietitian/Nutritionist" },
    { id: 7, name: "Respiratory Therapy" },
    { id: 8, name: "Acupuncture" }
  ];`;

const newFallback = `  // Fallback (Updated from live API)
  return [
    { id: 1, name: "Physiotherapy" },
    { id: 2, name: "Nursing Care" },
    { id: 3, name: "Geri care Therapy" },
    { id: 4, name: "Speech Therapy" },
    { id: 5, name: "Mental Health Counseling" },
    { id: 6, name: "Dietitian/Nutritionist" },
    { id: 7, name: "Respiratory Therapy" },
    { id: 8, name: "Acupuncture" },
    { id: 13, name: "Physiotherapy" },
    { id: 14, name: "Post-Surgery Rehab" },
    { id: 15, name: "Neuro Rehab" },
    { id: 16, name: "Respiratory Therapy" },
    { id: 17, name: "Postpartum Care" },
    { id: 18, name: "Elder Care" },
    { id: 19, name: "Nursing Care" },
    { id: 20, name: "Speech Therapy" },
    { id: 21, name: "Occupational Health & Wellness" }
  ];`;

if (code.includes(fallbackString)) {
  code = code.replace(fallbackString, newFallback);
  fs.writeFileSync(path, code, 'utf8');
  console.log('Categories fallback updated');
} else {
  console.log('Could not find fallback string');
}
