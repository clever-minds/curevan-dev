const fs = require('fs');
const path = 'C:\\curevan_node\\src\\controllers\\therapist\\therapistController.js';

let content = fs.readFileSync(path, 'utf8');

const target = "    const therapist = profileResult[0][0];";
const replacement = `    const therapist = profileResult[0][0];

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
    );`;

if (!content.includes('/* ---------- CREATE INITIAL APPROVAL REQUEST ---------- */')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Successfully added change_requests insertion!');
} else {
  console.log('Already added.');
}
