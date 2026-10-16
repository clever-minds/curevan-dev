require('dotenv').config({ path: 'c:/curevan_node/.env' });
const { sequelize } = require('c:/curevan_node/src/config/db.js');

sequelize.query("INSERT INTO notifications (user_uid, type, title, message, link) VALUES ('test-uid', 'test', 'title', 'msg', '/link') RETURNING id")
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
