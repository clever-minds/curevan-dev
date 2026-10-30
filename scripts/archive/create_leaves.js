const { Client } = require(process.cwd() + '/node_modules/pg');
const client = new Client({connectionString: 'postgres://postgres:postgres@localhost:5432/curevan'});

async function run() {
  await client.connect();
  
  const createTableQuery = `
    DROP TABLE IF EXISTS therapist_leaves;
    CREATE TABLE therapist_leaves (
      id SERIAL PRIMARY KEY,
      therapist_id INTEGER REFERENCES therapist_profiles(id) ON DELETE CASCADE,
      leave_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(therapist_id, leave_date)
    );
  `;
  
  await client.query(createTableQuery);
  console.log("Table 'therapist_leaves' recreated successfully with correct schema.");
  
  await client.end();
}

run().catch(console.error);
