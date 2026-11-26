const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\users\\\\usersController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const t1 = `      // convert array to Postgres array if needed
      if (dbField === "specialty" && Array.isArray(value)) {
        value = \`{\${value.join(",")}}\`;
      }`;

const t2 = `      // convert array to Postgres array if needed\r
      if (dbField === "specialty" && Array.isArray(value)) {\r
        value = \`{\${value.join(",")}}\`;\r
      }`;

const t3 = `      // convert array to Postgres array if needed\n      if (dbField === "specialty" && Array.isArray(value)) {\n        value = \`{\${value.join(",")}}\`;\n      }`;

const rep = `      // convert array to Postgres array if needed
      if (dbField === "specialty") {
        if (Array.isArray(value)) {
          value = \`{\${value.join(",")}}\`;
        } else if (typeof value === "string" && !value.startsWith("{")) {
          value = \`{\${value}}\`;
        }
      }`;

if (code.includes(t1)) {
    code = code.replace(t1, rep);
} else if (code.includes(t2)) {
    code = code.replace(t2, rep);
} else if (code.includes(t3)) {
    code = code.replace(t3, rep);
} else {
    // If all else fails, let's just find the index of the string
    const searchStr = 'if (dbField === "specialty" && Array.isArray(value)) {';
    const index = code.indexOf(searchStr);
    if (index !== -1) {
        const start = code.lastIndexOf('// convert array to Postgres array if needed', index);
        const endStr = '      }';
        const end = code.indexOf(endStr, index) + endStr.length;
        code = code.substring(0, start) + rep + code.substring(end);
    } else {
        console.log("Could not find the target code snippet.");
        process.exit(1);
    }
}

fs.writeFileSync(controllerPath, code, 'utf8');
console.log("Successfully fixed specialty array parsing");
