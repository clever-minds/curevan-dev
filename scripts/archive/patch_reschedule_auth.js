const fs = require('fs');
const path = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';

let content = fs.readFileSync(path, 'utf8');

const target = `      if (appt.patient_id != userId) {
        return res.status(403).json({ success: false, error: "Unauthorized to reschedule this appointment" });
      }`;

const replacement = `      const userRole = req.user.role;
      const isAdmin = ['superadmin', 'admin', 'super_admin', 'therapyAdmin'].includes(userRole);
      const isAssignedTherapist = (appt.therapist_id == userId);
      const isPatient = (appt.patient_id == userId);

      if (!isAdmin && !isAssignedTherapist && !isPatient) {
        return res.status(403).json({ success: false, error: "Unauthorized to reschedule this appointment" });
      }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Patched authentication successfully!");
} else {
    // try regex with dynamic whitespaces
    const regex = /if\s*\(\s*appt\.patient_id\s*!=\s*userId\s*\)\s*\{\s*return\s*res\.status\(403\)\.json\(\{ success: false, error: "Unauthorized to reschedule this appointment" \}\);\s*\}/;
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(path, content, 'utf8');
        console.log("Patched authentication successfully using regex!");
    } else {
        console.log("Could not find the target string.");
    }
}
