const axios = require('axios');
require('dotenv').config({ path: 'C:\\\\curevan_node\\\\.env' });
const { Sequelize, QueryTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
});

async function testAccept() {
    // Find a pending appointment
    const [appt] = await sequelize.query(
        `SELECT id, patient_id, service_type_id, therapist_id, date FROM appointments WHERE status = 'Pending' LIMIT 1`,
        { type: QueryTypes.SELECT }
    );
    if (!appt) {
        console.log("No pending appointments found");
        return;
    }
    console.log("Found appointment:", appt.id);

    try {
        const id = appt.id;
        const therapistId = appt.therapist_id || 5; // some therapist id

        const t = await sequelize.transaction();

        try {
            await sequelize.query(
              `UPDATE appointments 
               SET therapist_id = :therapistId, 
                   therapist_name = 'Test', 
                   therapist_phone = '1234567890',
                   status = 'Payment Pending'
               WHERE id = :id`,
              {
                replacements: { id, therapistId },
                type: QueryTypes.UPDATE,
                transaction: t
              }
            );
            console.log("Updated appointments table");

            await sequelize.query(
              `INSERT INTO pcr (
                appointment_id, patient_id, therapist_id, service_type_id,
                chief_complaint, assessment, diagnosis, treatment_provided, plan_of_care,
                bp, hr, rr, temp, status, version, created_at, locked_at, history
              ) VALUES (
                :id, :patientId, :therapistId, :serviceTypeId,
                '', '', '', '', '', '', '', '', '',
                'not_started', 1, NOW(), NOW(), '[]'
              )`,
              {
                replacements: {
                  id,
                  patientId: appt.patient_id,
                  therapistId,
                  serviceTypeId: appt.service_type_id || 1
                },
                type: QueryTypes.INSERT,
                transaction: t
              }
            );
            console.log("Inserted into pcr table");
            await t.rollback();
            console.log("Test successful (rolled back)");
        } catch (e) {
            await t.rollback();
            console.error("Error during transaction:", e.message);
        }
    } catch(e) {
        console.error(e);
    }
    process.exit();
}
testAccept();
