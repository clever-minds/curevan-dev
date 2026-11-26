const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';
let c = fs.readFileSync(path, 'utf8');

const target = `    /* ---------- CREATE INITIAL APPROVAL REQUEST ---------- */
    await sequelize.query(
      \`INSERT INTO change_requests
       (user_id, role, entity_id, section, changes)
       VALUES (:user_id, 'therapist', :user_id, 'Therapist Profile', '{}')\`,
      {
        replacements: { user_id: user.id },
        type: QueryTypes.INSERT,
        transaction: t
      }
    );`;

const replacement = `    /* ---------- CREATE INITIAL APPROVAL REQUEST ---------- */
    const initialChanges = JSON.stringify({
      "Name": { "new": fullName || "N/A" },
      "Email": { "new": email || "N/A" },
      "Phone": { "new": mobile || "N/A" },
      "State": { "new": state || "N/A" },
      "City": { "new": city || "N/A" },
      "Specialty": { "new": specialty ? (Array.isArray(specialty) ? specialty.join(", ") : specialty) : "N/A" }
    });

    await sequelize.query(
      \`INSERT INTO change_requests
       (user_id, role, entity_id, section, changes)
       VALUES (:user_id, 'therapist', :user_id, 'Therapist Profile', :changes)\`,
      {
        replacements: { user_id: user.id, changes: initialChanges },
        type: QueryTypes.INSERT,
        transaction: t
      }
    );`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync(path, c, 'utf8');
  console.log("Successfully patched initial approval request to include data!");
} else {
  console.log("Failed to find target");
}
