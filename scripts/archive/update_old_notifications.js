require('dotenv').config({ path: 'c:/curevan_node/.env' });
const { sequelize } = require('c:/curevan_node/src/config/db.js');

async function updateOldData() {
  try {
    console.log("Starting update of old notifications...");

    // Update notifications table: 
    // Set user_uid (which currently holds string UID like 'patient-02')
    // to the stringified integer ID (like '26') by matching users.uid
    const [results] = await sequelize.query(`
      UPDATE notifications
      SET user_uid = CAST(users.id AS VARCHAR)
      FROM users
      WHERE notifications.user_uid = users.uid;
    `);

    console.log("Successfully updated old notifications!");
    console.log("Update details:", results);
  } catch (error) {
    console.error("Failed to update old notifications:", error);
  } finally {
    process.exit(0);
  }
}

updateOldData();
