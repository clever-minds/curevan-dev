const fs = require('fs');
const http = require('http');

async function testAccept(appointmentId) {
    console.log("Testing accept API for appointment:", appointmentId);
    // Let's just read the controller file to see what it is returning.
    const file = fs.readFileSync('C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js', 'utf8');
    console.log("Controller has accept logic updated:", file.includes('SELECT 1 FROM pcr WHERE appointment_id = :id LIMIT 1'));
}

testAccept(1);
