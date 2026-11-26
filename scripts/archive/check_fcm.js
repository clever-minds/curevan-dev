require('dotenv').config({ path: 'c:/curevan_node/.env' });
const { sequelize } = require('c:/curevan_node/src/config/db.js');

async function check() {
  try {
    const rows = await sequelize.query("SELECT uid, email, fcm_token FROM users WHERE fcm_token IS NOT NULL");
    console.log("Users with FCM tokens:", rows[0]);
  } catch(e) {
      console.error("Error:", e);
  } finally {
      process.exit(0);
  }
}

check();
