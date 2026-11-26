const { sequelize } = require('./src/config/db');

async function test() {
  try {
    const [userRows] = await sequelize.query("SELECT uid FROM users LIMIT 1", { type: sequelize.QueryTypes.SELECT });
    const uid = userRows ? userRows.uid || userRows[0]?.uid : null;
    
    if (!uid) {
      console.log('No user found to test');
      return;
    }
    
    console.log('Inserting notification for uid:', uid);
    
    await sequelize.query(
      "INSERT INTO notifications (user_uid, type, title, message, link) VALUES (:uid, :type, :title, :message, :link)",
      {
        replacements: {
          uid,
          type: 'test',
          title: 'Test Notification',
          message: 'This is a test',
          link: '/dashboard'
        }
      }
    );
    console.log('INSERT SUCCESS');
  } catch (e) {
    console.error('INSERT ERROR:', e.message);
  } finally {
    await sequelize.close();
  }
}
test();
