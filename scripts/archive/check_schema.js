const { Sequelize } = require('sequelize');
require('dotenv').config({ path: 'c:\\curevan_node\\.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'curevan',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'curevan@123',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function checkSchema() {
  try {
    const [results] = await sequelize.query("DESCRIBE users;");
    console.log(results.filter(r => r.Field.includes('token') || r.Field.includes('fcm')));
    const [results2] = await sequelize.query("DESCRIBE notifications;");
    console.log(results2);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
checkSchema();
