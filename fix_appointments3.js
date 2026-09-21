const fs = require('fs');

// 1. Add cancel route to appointments.routes.js
const routesPath = 'C:\\\\curevan_node\\\\src\\\\routes\\\\appointments.routes.js';
let routesContent = fs.readFileSync(routesPath, 'utf8');

if (!routesContent.includes('/cancel')) {
  const targetRoute = `router.put("/status/:id", authMiddleware, responseHandler, appointmentsController.updateAppointmentStatus);`;
  const replaceRoute = `router.put("/status/:id", authMiddleware, responseHandler, appointmentsController.updateAppointmentStatus);\n\n// ✅ PATCH cancel appointment\nrouter.patch("/:id/cancel", authMiddleware, responseHandler, appointmentsController.cancelAppointment);`;
  
  routesContent = routesContent.replace(targetRoute, replaceRoute);
  fs.writeFileSync(routesPath, routesContent, 'utf8');
  console.log('Added cancel route to appointments.routes.js');
}

// 2. Add cancelAppointment method to appointmentsController.js
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

if (!controllerContent.includes('exports.cancelAppointment =')) {
  const targetMethod = `// ✅ 4. UPDATE APPOINTMENT STATUS (Tracking Flow)`;
  const replaceMethod = `// ✅ Cancel Appointment
exports.cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const [appt] = await sequelize.query(
      \`SELECT status, therapist_id, patient_id FROM appointments WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!appt) {
      return res.status(404).json({ success: false, error: "Appointment not found" });
    }

    if (appt.status === 'Completed' || appt.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: "Appointment cannot be cancelled at this stage" });
    }

    // Allow therapist or patient to cancel
    if (appt.therapist_id != userId && appt.patient_id != userId) {
      return res.status(403).json({ success: false, error: "Unauthorized to cancel this appointment" });
    }

    await sequelize.query(
      \`UPDATE appointments SET status = 'Cancelled' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    return res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return res.status(500).json({ success: false, error: "Failed to cancel appointment" });
  }
};

// ✅ 4. UPDATE APPOINTMENT STATUS (Tracking Flow)`;
  
  controllerContent = controllerContent.replace(targetMethod, replaceMethod);
  fs.writeFileSync(controllerPath, controllerContent, 'utf8');
  console.log('Added cancelAppointment to appointmentsController.js');
}
