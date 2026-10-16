const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let c = fs.readFileSync(path, 'utf8');

c = c.split('\\n').join(String.fromCharCode(10));
fs.writeFileSync(path, c);
console.log('Fixed line 188 newlines!');
