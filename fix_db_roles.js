const { QueryTypes } = require('sequelize');
const { sequelize } = require('C:\\curevan_node\\src\\config\\db.js');

async function fixRoles() {
  try {
    // 1. Insert missing user_roles
    await sequelize.query(
      `INSERT INTO roles (name) VALUES ('therapist') ON CONFLICT (name) DO NOTHING`,
      { type: QueryTypes.INSERT }
    );
    const [roleResults] = await sequelize.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT u.id, r.id 
       FROM users u, roles r 
       WHERE u.role = 'therapist' AND r.name = 'therapist'
       ON CONFLICT DO NOTHING
       RETURNING *`,
      { type: QueryTypes.INSERT }
    );
    
    // 2. Insert missing change_requests for unapproved therapists
    const [crResults] = await sequelize.query(
      `INSERT INTO change_requests (user_id, role, entity_id, section, changes)
       SELECT u.id, 'therapist', u.id, 'Therapist Profile', '{}'
       FROM users u
       JOIN therapist_profiles tp ON tp.user_id = u.id
       WHERE u.role = 'therapist' AND tp.profile_status = 'pending'
       ON CONFLICT DO NOTHING
       RETURNING *`,
      { type: QueryTypes.INSERT }
    );

    console.log(`Fixed roles for ${roleResults.length} therapists.`);
    console.log(`Created approval requests for ${crResults.length} pending therapists.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fixRoles();
