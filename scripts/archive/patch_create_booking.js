const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const regex = /SELECT email, user_name FROM users WHERE id = :patientId[^}]*replacements: { patientId: appt\.patient_id }[\s\S]*?Hi \$\{patientInfo\.user_name\},<\/p>[\s\S]*?request for \$\{appt\.date\}\.</g;

content = content.replace(/\{ replacements: \{ patientId: appt\.patient_id \}, type: QueryTypes\.SELECT, transaction: t \}/g, "{ replacements: { patientId: bookingData.patientId }, type: QueryTypes.SELECT, transaction: t }");
content = content.replace(/SELECT email, user_name FROM users WHERE id = :patientId/g, "SELECT email, name FROM users WHERE id = :patientId");
content = content.replace(/Hi \$\{patientInfo\.user_name\},/g, "Hi ${patientInfo.name},");
content = content.replace(/request for \$\{appt\.date\}\.</g, "request for ${bookingData.date}.</");

fs.writeFileSync(path, content, 'utf8');
console.log("Patched via regex successfully!");
