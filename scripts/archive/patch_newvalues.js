const fs = require('fs');
const filePath = 'C:\\curevan_node\\src\\controllers\\auth\\authController.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = 'const newValues = clientData.data?.new || clientData;';
const replacement = 'const newValues = clientData.data?.new || clientData.data || clientData;';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched authController.js');
} else {
    console.log('Target string not found in authController.js');
}
