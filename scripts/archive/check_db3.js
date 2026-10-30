require('dotenv').config({ path: 'c:/curevan_node/.env' });
const { sequelize } = require('c:/curevan_node/src/config/db.js');

sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='therapist_profiles'")
  .then(res => console.log(JSON.stringify(res[0], null, 2)))
  .catch(console.error)
  .finally(() => process.exit(0));
