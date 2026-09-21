const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Fix acceptBookingRequest condition
const targetAccept = `    const isAvailable = 
      appt.status === 'Searching' || 
      appt.status === 'Searching Therapist' || 
      (appt.status === 'Pending' && !appt.therapist_id) ||
      appt.status === 'Pending Approval';`;
const replaceAccept = `    const isAvailable = 
      appt.status === 'Searching' || 
      appt.status === 'Searching Therapist' || 
      appt.status === 'Pending' ||
      appt.status === 'Pending Approval';`;

if (content.includes(targetAccept)) {
    content = content.replace(targetAccept, replaceAccept);
    console.log("Fixed accept condition");
} else {
    console.log("targetAccept not found");
}

// Fix rejectBookingRequest function
const targetReject = `exports.rejectBookingRequest = async (req, res) => {
  const { id } = req.params;
  const { therapistId } = req.body || {};

  try {
    const [appt] = await sequelize.query(
      \`SELECT status, therapist_id FROM appointments WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!appt || appt.status !== 'Pending Approval' || appt.therapist_id != therapistId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }`;

const replaceReject = `exports.rejectBookingRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [appt] = await sequelize.query(
      \`SELECT status, therapist_id FROM appointments WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }`;

if (content.includes(targetReject)) {
    content = content.replace(targetReject, replaceReject);
    console.log("Fixed reject function");
} else {
    console.log("targetReject not found");
}

fs.writeFileSync(controllerPath, content, 'utf8');
