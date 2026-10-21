const { Sequelize, QueryTypes } = require('sequelize');
require('dotenv').config();

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
    const [r1] = await sequelize.query('DESCRIBE users;');
    console.log("Users schema matching token/fcm:");
    console.log(r1.filter(r => r.Field.includes("token") || r.Field.includes("fcm")));
    
    const [r2] = await sequelize.query('DESCRIBE notifications;');
    console.log("Notifications schema:");
    console.log(r2);
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}
checkSchema();
