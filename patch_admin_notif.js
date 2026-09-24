const fs = require('fs');
const filePath = 'C:\\curevan_node\\src\\controllers\\auth\\authController.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `        // Notify Admins
        const admins = await sequelize.query(
          "SELECT uid FROM users WHERE role = 'admin'",
          { type: sequelize.QueryTypes.SELECT }
        );`;

const replace = `        // Notify Admins
        const admins = await sequelize.query(
          "SELECT u.uid FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('admin.super', 'admin.therapy')",
          { type: sequelize.QueryTypes.SELECT }
        );`;

if (content.includes(target)) {
  content = content.replace(target, replace);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched admin notifications in authController.js');
} else {
  console.log('Target not found in authController.js. Might already be patched.');
}
