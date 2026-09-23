const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const regex = /SELECT email, user_name, fcm_token FROM users/g;

if (regex.test(content)) {
    content = content.replace(regex, 'SELECT email, name, fcm_token FROM users');
    
    // Also fix the usages in the email html strings
    content = content.replace(/\$\{patient\.user_name \|\| 'Patient'\}/g, "${patient.name || 'Patient'}");
    content = content.replace(/\$\{therapist\.user_name \|\| 'Therapist'\}/g, "${therapist.name || 'Therapist'}");
    
    fs.writeFileSync(path, content, 'utf8');
    console.log("Patched column name from user_name to name successfully!");
} else {
    console.log("Could not find the target string.");
}
