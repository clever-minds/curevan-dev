const { Client } = require(process.cwd() + '/node_modules/pg');
const client = new Client({connectionString: 'postgres://postgres:postgres@localhost:5432/curevan'});

async function run() {
  await client.connect();
  
  const createTableQuery = `
    DROP TABLE IF EXISTS therapist_leaves;
    CREATE TABLE therapist_leaves (
      id SERIAL PRIMARY KEY,
      therapist_id INTEGER REFERENCES therapist_profiles(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      reason TEXT,
      status VARCHAR(50) DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await client.query(createTableQuery);
  console.log("Table 'therapist_leaves' recreated successfully with start_date and end_date.");
  
  await client.end();
}

run().catch(console.error);
