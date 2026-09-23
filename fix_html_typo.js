const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/<\/\/p>/g, "</p>");
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed typo");
