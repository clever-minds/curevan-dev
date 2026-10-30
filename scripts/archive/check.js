const { sequelize } = require('c:/curevan_node/src/config/db');

async function test() {
  try {
    const r = await sequelize.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'notifications';", { type: sequelize.QueryTypes.SELECT });
    console.log(r);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await sequelize.close();
  }
}
test();
