const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';
let c = fs.readFileSync(path, 'utf8');

// The BAD block is between lines 96 and 110
const badBlock = `    /* ---------- USER ROLES (Fix for Admin Panel) ---------- */
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
    );`;

if (c.includes(badBlock)) {
  c = c.replace(badBlock, '');
  fs.writeFileSync(path, c, 'utf8');
  console.log('Successfully removed the bad block.');
} else {
  console.log('Bad block not found!');
}

const badBlock2 = `    /* ---------- CREATE INITIAL APPROVAL REQUEST ---------- */
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

if (c.includes(badBlock2)) {
  c = c.replace(badBlock2, '');
  fs.writeFileSync(path, c, 'utf8');
  console.log('Successfully removed the bad block 2.');
} else {
  console.log('Bad block 2 not found!');
}
