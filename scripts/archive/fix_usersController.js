const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\users\\\\usersController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

// The faulty string has the literal backslash and 'n'
const faultyString = "const profileId = profile?.id || null;\\n    const isNewRegistration = profile?.profile_status !== 'approved';";
const fixedString = `const profileId = profile?.id || null;
    const isNewRegistration = profile?.profile_status !== 'approved';`;

if(code.includes(faultyString)) {
    code = code.replace(faultyString, fixedString);
    fs.writeFileSync(controllerPath, code, 'utf8');
    console.log("Successfully fixed the syntax error in usersController.js");
} else {
    console.log("Could not find the faulty string.");
}
