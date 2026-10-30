const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let c = fs.readFileSync(path, 'utf8');

const target = `    if (roles.includes("admin.super")) {
      whereClause = "WHERE cr.role = :role";
      replacements.role = "admin";
    } else if (roles.includes("admin.therapy")) {`;

const replacement = `    if (roles.includes("admin.super")) {
      whereClause = ""; // Super admin sees all requests (admin and therapist)
      // replacements are empty
    } else if (roles.includes("admin.therapy")) {`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(path, c, 'utf8');
  console.log('Successfully patched usersController.js for Super Admin!');
} else {
  console.log('Target not found!');
}
