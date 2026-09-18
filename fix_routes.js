const fs = require('fs');
const filePath = 'C:\\curevan_node\\src\\routes\\therapist.routes.js';
let content = fs.readFileSync(filePath, 'utf8');

// Remove old leave routes
content = content.replace('// Leaves (Unavailable Dates)\n', '');
content = content.replace('router.post("/leave", authMiddleware, responseHandler, therapistController.addLeave);\n', '');
content = content.replace('router.delete("/leave/:date", authMiddleware, responseHandler, therapistController.removeLeave);\n', '');
content = content.replace('router.get("/leaves/:therapistId", authMiddleware, responseHandler, therapistController.getLeaves);\n', '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Old leave routes removed.');
