const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';
let c = fs.readFileSync(path, 'utf8');

const userTarget = `    const user = userResult[0][0];

    /* ---------- SPECIALTY ---------- */`;
    
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
    
c = c.replace(userTarget, userReplacement);

const therapistTarget = `    const therapist = profileResult[0][0];

    /* ---------- AVAILABILITY (NEW) ---------- */`;
    
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

c = c.replace(therapistTarget, therapistReplacement);

fs.writeFileSync(path, c, 'utf8');
console.log('Successfully patched correctly!');
