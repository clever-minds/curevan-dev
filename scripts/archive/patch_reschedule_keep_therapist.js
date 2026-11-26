const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const regex = /UPDATE appointments SET date = :date, time = :time, status = 'Searching Therapist', therapist_id = NULL WHERE id = :id/g;

if (regex.test(content)) {
    content = content.replace(regex, `UPDATE appointments SET date = :date, time = :time WHERE id = :id`);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Patched UPDATE query successfully to keep therapist assigned!");
} else {
    console.log("Could not find the target string.");
}
