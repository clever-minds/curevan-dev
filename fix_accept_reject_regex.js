const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Fix Accept condition
content = content.replace(
  /const isAvailable = [\s\S]*?appt.status === 'Pending Approval';/,
  `const isAvailable = 
      appt.status === 'Searching' || 
      appt.status === 'Searching Therapist' || 
      appt.status === 'Pending' ||
      appt.status === 'Pending Approval';`
);

// Fix Reject function
content = content.replace(
  /exports.rejectBookingRequest = async \(req, res\) => {[\s\S]*?if \(!appt \|\| appt.status !== 'Pending Approval' \|\| appt.therapist_id != therapistId\) {/,
  `exports.rejectBookingRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [appt] = await sequelize.query(
      \`SELECT status, therapist_id FROM appointments WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {`
);

// Another bug: PCR insert might fail for direct bookings if PCR already exists?
// Actually direct bookings don't create PCR. So it's fine.

fs.writeFileSync(controllerPath, content, 'utf8');
console.log("Successfully patched accept and reject in appointmentsController");
