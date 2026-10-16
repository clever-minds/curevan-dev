const { sequelize } = require('c:/curevan_node/src/config/db');

async function test() {
  try {
    const r = await sequelize.query("SELECT u.uid FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('admin.super', 'admin.therapy');", { type: sequelize.QueryTypes.SELECT });
    console.log('Admins found:', r.length);
    console.log(r);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await sequelize.close();
  }
}
test();
