const { sequelize } = require('c:/curevan_node/src/config/db');

async function test() {
  try {
    const r = await sequelize.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;", { type: sequelize.QueryTypes.SELECT });
    console.log(r);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await sequelize.close();
  }
}
test();
