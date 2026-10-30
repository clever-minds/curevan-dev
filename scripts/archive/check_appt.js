require("dotenv").config({ path: require("path").resolve('C:\\\\curevan_node', ".env") });
const { sequelize } = require('C:\\\\curevan_node\\\\src\\\\config\\\\db');
const { QueryTypes } = require("sequelize");

async function check() {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB");
        const rows = await sequelize.query(`SELECT id, patient_name, therapist_name, therapist_id, status FROM appointments WHERE patient_name LIKE '%Arbaaz%'`, { type: QueryTypes.SELECT });
        console.log("Appointments:", rows);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
check();
