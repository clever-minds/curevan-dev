require('dotenv').config({ path: 'c:/curevan_node/.env' });
const { sequelize } = require('c:/curevan_node/src/config/db.js');

async function check() {
  try {
    const rows = await sequelize.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5");
    console.log("Recent Notifications:", rows[0]);
  } catch(e) {
      console.error("Error:", e);
  } finally {
      process.exit(0);
  }
}

check();
