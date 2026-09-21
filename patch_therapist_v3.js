const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';
let c = fs.readFileSync(path, 'utf8');

// Match the uncommented "const user = userResult[0][0];" 
// We use a regex that matches the exact uncommented version and the next comment
const userRegex = /    const user = userResult\[0\]\[0\];\s+\/\* ---------- SPECIALTY ---------- \*\//;
const userReplacement = `    const user = userResult[0][0];

    /* ---------- USER ROLES (Fix for Admin Panel) ---------- */
    await sequelize.query(
      \`INSERT INTO roles (name) VALUES ('therapist') ON CONFLICT (name) DO NOTHING\`,
      { type: QueryTypes.INSERT, transaction: t }
    );
    await sequelize.query(
      \`INSERT INTO user_roles (user_id, role_id)
       SELECT :user_id, id FROM roles WHERE name = 'therapist'
       ON CONFLICT DO NOTHING\`,
      {
        replacements: { user_id: user.id },
        type: QueryTypes.INSERT,
        transaction: t
      }
    );

    /* ---------- SPECIALTY ---------- */`;

if (userRegex.test(c)) {
  c = c.replace(userRegex, userReplacement);
  console.log("Successfully patched user roles!");
} else {
  console.log("Failed to patch user roles!");
}

const therapistRegex = /    const therapist = profileResult\[0\]\[0\];\s+\/\* ---------- AVAILABILITY \(NEW\) ---------- \*\//;
const therapistReplacement = `    const therapist = profileResult[0][0];

    /* ---------- CREATE INITIAL APPROVAL REQUEST ---------- */
    await sequelize.query(
      \`INSERT INTO change_requests
       (user_id, role, entity_id, section, changes)
       VALUES (:user_id, 'therapist', :user_id, 'Therapist Profile', '{}')\`,
      {
        replacements: { user_id: user.id },
        type: QueryTypes.INSERT,
        transaction: t
      }
    );

    /* ---------- AVAILABILITY (NEW) ---------- */`;

if (therapistRegex.test(c)) {
  c = c.replace(therapistRegex, therapistReplacement);
  console.log("Successfully patched change requests!");
} else {
  console.log("Failed to patch change requests!");
}

fs.writeFileSync(path, c, 'utf8');
