const { sequelize } = require('c:/curevan_node/src/config/db');

async function test() {
  try {
    const r = await sequelize.query("SELECT * FROM notifications WHERE type = 'profile_update_request' ORDER BY created_at DESC LIMIT 5;", { type: sequelize.QueryTypes.SELECT });
    console.log("Found admin notifications:", r.length);
    console.log(r);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await sequelize.close();
  }
}
test();
