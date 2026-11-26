const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';

let content = fs.readFileSync(path, 'utf8');

const targetQuery = `      WHERE tp.user_id = :userId`;
const replacementQuery = `      WHERE tp.user_id::text = :userId OR u.uid = :userId`;

if (content.includes(targetQuery)) {
  content = content.replace(targetQuery, replacementQuery);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully patched getProfile query!');
} else {
  console.log('Query not found or already patched.');
}
