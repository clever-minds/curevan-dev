const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\users\\\\usersController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const t1 = `      // skip nested objects
      if (typeof value === "object" && value !== null) continue;`;
const t2 = `      // skip nested objects\r
      if (typeof value === "object" && value !== null) continue;`;
const t3 = `      // skip nested objects\n      if (typeof value === "object" && value !== null) continue;`;

const rep = `      if (dbField === "experience_years" || dbField === "hourly_rate" || dbField === "service_radius_km") {
        if (value === "N/A" || value === "" || isNaN(Number(value))) {
          value = null;
        } else {
          value = Number(value);
        }
      }

      // skip nested objects
      if (typeof value === "object" && value !== null) continue;`;

if (code.includes(t1)) {
    code = code.replace(t1, rep);
} else if (code.includes(t2)) {
    code = code.replace(t2, rep);
} else if (code.includes(t3)) {
    code = code.replace(t3, rep);
} else {
    // If all else fails, let's just find the index of the string
    const searchStr = 'if (typeof value === "object" && value !== null) continue;';
    const index = code.indexOf(searchStr);
    if (index !== -1) {
        const start = code.lastIndexOf('// skip nested objects', index);
        const endStr = 'continue;';
        const end = code.indexOf(endStr, index) + endStr.length;
        code = code.substring(0, start) + rep + code.substring(end);
    } else {
        console.log("Could not find the target code snippet.");
        process.exit(1);
    }
}

fs.writeFileSync(controllerPath, code, 'utf8');
console.log("Successfully fixed number parsing");
