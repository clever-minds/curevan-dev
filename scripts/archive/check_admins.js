require('dotenv').config({ path: 'c:/curevan_node/.env' });
const { sequelize } = require('c:/curevan_node/src/config/db.js');

async function check() {
  try {
    const admins = await sequelize.query(
        "SELECT u.uid, u.email FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('admin.super', 'admin.therapy')",
        { type: sequelize.QueryTypes.SELECT }
    );
    console.log("Admin Users from query:", admins);
  } catch(e) {
      console.error("Error:", e);
  } finally {
      process.exit(0);
  }
}

check();
