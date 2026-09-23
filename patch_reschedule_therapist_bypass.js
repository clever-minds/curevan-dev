const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const regex = /const isPatient = \(appt\.patient_id == userId\);\s*if \(!isAdmin && !isAssignedTherapist && !isPatient\) \{/g;

if (regex.test(content)) {
    content = content.replace(regex, `const isPatient = (appt.patient_id == userId);\n        const isTherapist = (userRole === 'therapist');\n\n        if (!isAdmin && !isAssignedTherapist && !isPatient && !isTherapist) {`);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Patched auth to allow all therapists successfully!");
} else {
    console.log("Could not find the target string.");
}
