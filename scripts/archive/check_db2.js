require('dotenv').config({ path: 'C:\\curevan_node\\.env' });
const { sequelize } = require('C:\\curevan_node\\src\\config\\db');

async function checkDates() {
  try {
    const [results] = await sequelize.query(`
      SELECT id, title, status, published_at FROM knowledge_base WHERE title LIKE '%Structure of the Vertebrae%'
    `);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkDates();
