const { sequelize } = require('C:/curevan_node/src/config/db');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS therapist_availability (
        id SERIAL PRIMARY KEY,
        therapist_id INTEGER REFERENCES therapist_profiles(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(therapist_id, day_of_week)
      );
    `;

    await sequelize.query(createTableQuery);
    console.log("Table 'therapist_availability' created successfully.");

    process.exit(0);
  } catch (error) {
    console.error('Error creating schema:', error);
    process.exit(1);
  }
}

run();
