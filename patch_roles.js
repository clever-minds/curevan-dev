const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\users\\usersController.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /let whereClause = "";\s*let replacements = {};\s*if \(roles\.includes\("admin\.super"\)\) {\s*whereClause = "";/g;

const newStr = `let whereClause = "WHERE cr.role IN ('super admin', 'super_admin', 'therapist', 'ecom admin', 'ecom_admin', 'admin.super', 'admin.ecom', 'admin.therapy', 'admin')";
    let replacements = {};

    if (roles.includes("admin.super")) {
      // Use default whereClause`;

if (regex.test(content)) {
    content = content.replace(regex, newStr);
    
    // Also, we need to update the second condition to include the base whereClause for therapist if it's admin.therapy
    const adminTherapyRegex = /whereClause = "WHERE cr\.role = :role AND u\.state = :state";/g;
    const newAdminTherapyStr = `whereClause = "WHERE cr.role = :role AND u.state = :state AND cr.role IN ('super admin', 'super_admin', 'therapist', 'ecom admin', 'ecom_admin', 'admin.super', 'admin.ecom', 'admin.therapy', 'admin')";`;
    
    content = content.replace(adminTherapyRegex, newAdminTherapyStr);

    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched usersController.js');
} else {
    console.log('Target string not found, patch failed or already applied.');
}
