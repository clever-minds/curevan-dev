const { sequelize } = require('./src/config/db.js');

const updateData = async () => {
  try {
    const changesJson = JSON.stringify({
      data: {
        new: {
          "Name": "Ujjawal (Test)",
          "Email": "test.email@example.com",
          "Phone": "9876543210",
          "State": "Gujarat",
          "City": "Vadodara"
        }
      }
    });

    await sequelize.query(
      "UPDATE change_requests SET changes = :changes WHERE user_id = 67",
      {
        replacements: { changes: changesJson },
        type: sequelize.QueryTypes.UPDATE
      }
    );
    console.log("Successfully updated ID 67 with dummy data!");
  } catch (err) {
    console.error("Error updating:", err);
  } finally {
    process.exit(0);
  }
};

updateData();
