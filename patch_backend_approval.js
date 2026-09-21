const fs = require('fs');

const controllerPath = 'C:\\curevan_node\\src\\controllers\\appointments\\appointmentsController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

// 1. Update INSERT statement
code = code.replace(
  `      \`INSERT INTO appointments (
        patient_id, patient_name, date_of_birth, service_type_id, therapy_type,
        service_amount, total_amount, date, time, mode, notes, service_address_id,
        status, verification_status, payment_status, pcr_status, reports, created_at
      ) VALUES (
        :patientId, :patientName, :dateofbirth, :serviceTypeId, :therapyType,
        :serviceAmount, :totalAmount, :date, :time, :mode, :notes, :serviceAddress,
        'Searching Therapist', 'Not Verified', 'Pending', 'not_started', :reports, NOW()
      ) RETURNING id\`,`,
  `      \`INSERT INTO appointments (
        patient_id, patient_name, date_of_birth, service_type_id, therapy_type,
        service_amount, total_amount, date, time, mode, notes, service_address_id,
        status, verification_status, payment_status, pcr_status, reports, created_at, therapist_id
      ) VALUES (
        :patientId, :patientName, :dateofbirth, :serviceTypeId, :therapyType,
        :serviceAmount, :totalAmount, :date, :time, :mode, :notes, :serviceAddress,
        :initialStatus, 'Not Verified', 'Pending', 'not_started', :reports, NOW(), :therapistId
      ) RETURNING id\`,`
);

// 2. Update replacements
code = code.replace(
  `          reports: bookingData.reports ? JSON.stringify(bookingData.reports) : null,
        },`,
  `          reports: bookingData.reports ? JSON.stringify(bookingData.reports) : null,
          therapistId: bookingData.therapistId || null,
          initialStatus: bookingData.therapistId ? 'Pending Approval' : 'Searching Therapist',
        },`
);

// 3. Update FCM notification to notify only specific therapist if provided
code = code.replace(
  `    try {
      // Fetch FCM tokens of ACTIVE therapists with matching specialty who are FREE at this date & time`,
  `    try {
      // If a specific therapist is requested, only notify them
      if (bookingData.therapistId) {
         const tq = await sequelize.query(
           "SELECT fcm_token FROM users WHERE id = :therapistId",
           { replacements: { therapistId: bookingData.therapistId }, type: QueryTypes.SELECT }
         );
         if (tq.length > 0 && tq[0].fcm_token) {
           await firebaseNotifier.sendToMultipleTherapists(
             [tq[0].fcm_token],
             "New Booking Request",
             "You have a new booking request pending your approval."
           );
         }
         return res.status(201).json({ success: true, appointmentId, message: "Booking requested, pending therapist approval" });
      }

      // Fetch FCM tokens of ACTIVE therapists with matching specialty who are FREE at this date & time`
);

// 4. Update acceptBookingRequest to handle 'Pending Approval' and set status to 'Pending Payment'
code = code.replace(
  `    const isAvailable = 
      appt.status === 'Searching' || 
      appt.status === 'Searching Therapist' || 
      (appt.status === 'Pending' && !appt.therapist_id);

    if (!isAvailable) {`,
  `    const isAvailable = 
      appt.status === 'Searching' || 
      appt.status === 'Searching Therapist' || 
      appt.status === 'Pending Approval' ||
      (appt.status === 'Pending' && !appt.therapist_id);

    if (!isAvailable) {`
);

code = code.replace(
  `    await sequelize.query(
      \`UPDATE appointments 
       SET therapist_id = :therapistId, 
           therapist_name = :therapistName, 
           therapist_phone = :therapistPhone,
           status = 'Accepted'
       WHERE id = :id\`,`,
  `    await sequelize.query(
      \`UPDATE appointments 
       SET therapist_id = :therapistId, 
           therapist_name = :therapistName, 
           therapist_phone = :therapistPhone,
           status = 'Accepted'
       WHERE id = :id\`,`
);

// 5. Add rejectBookingRequest
if (!code.includes('rejectBookingRequest')) {
  code = code.replace(
    `// ✅ 4. UPDATE APPOINTMENT STATUS (Tracking Flow)`,
    `// ✅ 3b. REJECT BOOKING REQUEST
exports.rejectBookingRequest = async (req, res) => {
  const { id } = req.params;
  const { therapistId } = req.body || {};

  try {
    const [appt] = await sequelize.query(
      \`SELECT status, therapist_id FROM appointments WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!appt || appt.status !== 'Pending Approval' || appt.therapist_id != therapistId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }

    await sequelize.query(
      \`UPDATE appointments SET status = 'Cancelled', therapist_id = NULL WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    return res.json({ success: true, message: "Booking request declined" });
  } catch (error) {
    console.error("Error rejecting booking:", error);
    return res.status(500).json({ success: false, error: "Failed to reject booking" });
  }
};

// ✅ 4. UPDATE APPOINTMENT STATUS (Tracking Flow)`
  );
}

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('appointmentsController.js patched successfully');

// Update routes for rejectBookingRequest
const routesPath = 'C:\\curevan_node\\src\\routes\\appointments.routes.js';
let routesCode = fs.readFileSync(routesPath, 'utf8');
if (!routesCode.includes('rejectBookingRequest')) {
  routesCode = routesCode.replace(
    `router.post("/:id/accept", authMiddleware, appointmentsController.acceptBookingRequest);`,
    `router.post("/:id/accept", authMiddleware, appointmentsController.acceptBookingRequest);
router.post("/:id/reject", authMiddleware, appointmentsController.rejectBookingRequest);`
  );
  fs.writeFileSync(routesPath, routesCode, 'utf8');
  console.log('appointments.routes.js patched successfully');
}
