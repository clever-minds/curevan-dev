const fs = require('fs');

const file = 'C:/curevan_node/src/routes/therapist.routes.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('const therapistLeavesController = require("../controllers/therapist/therapistLeavesController");\n', '');
content = content.replace(/\n\/\/ --- Leaves ---\nrouter\.post\("\/leaves", authMiddleware, responseHandler, therapistLeavesController\.addLeave\);\nrouter\.get\("\/leaves", authMiddleware, responseHandler, therapistLeavesController\.listLeaves\);\nrouter\.delete\("\/leaves\/:id", authMiddleware, responseHandler, therapistLeavesController\.deleteLeave\);\n/g, '');

fs.writeFileSync(file, content, 'utf8');

try {
  fs.unlinkSync('C:/curevan_node/src/controllers/therapist/therapistLeavesController.js');
} catch (e) {}

console.log("Reverted custom routes and controller");
