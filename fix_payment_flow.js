const fs = require('fs');

const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Step 2: Update createBookingAndInvoice to accept 'Pending Approval' and 'Pending' payment
const regexCreate = /paymentStatus: "Paid",/g;
if (content.match(regexCreate)) {
    content = content.replace(regexCreate, 'paymentStatus: bookingData.paymentStatus || "Pending",');
    console.log("Updated paymentStatus in createBookingAndInvoice");
}

const regexCreateStatus = /status: "Pending",/g;
if (content.match(regexCreateStatus)) {
    content = content.replace(regexCreateStatus, 'status: bookingData.status || "Pending",');
    console.log("Updated status in createBookingAndInvoice");
}

// Step 3: Update getAvailableRequests to include 'Pending Approval' for specific therapist
const regexAvailable = /WHERE a\.status IN \(\'Searching\', \'Searching Therapist\'\)/g;
if (content.match(regexAvailable)) {
    content = content.replace(regexAvailable, `WHERE (a.status IN ('Searching', 'Searching Therapist') OR (a.status = 'Pending Approval' AND a.therapist_id = :therapistId))`);
    console.log("Updated getAvailableRequests query");
}

// Step 4: Update acceptBookingRequest to handle Pending Approval and set to Payment Pending
const regexAcceptCheck = /appt\.status === \'Searching\' \|\|\s*appt\.status === \'Searching Therapist\' \|\|\s*\(appt\.status === \'Pending\' && !appt\.therapist_id\)/;
if (content.match(regexAcceptCheck)) {
    content = content.replace(regexAcceptCheck, `appt.status === 'Searching' || 
      appt.status === 'Searching Therapist' || 
      (appt.status === 'Pending' && !appt.therapist_id) ||
      appt.status === 'Pending Approval'`);
    console.log("Updated acceptBookingRequest check condition");
}

// Add condition to set Payment Pending instead of Accepted if paymentStatus is Pending
const regexSetStatus = /status: \'Accepted\'/g;
if (content.match(regexSetStatus)) {
    // We will find the INSERT INTO appointments query inside acceptBookingRequest... wait, it updates appointments, not insert!
    // Ah, wait. acceptBookingRequest has: UPDATE appointments SET status = 'Accepted', therapist_id = :therapistId, therapist_name = :therapistName WHERE id = :id
    // Let's replace the whole UPDATE query part if possible, or just the status text.
}
fs.writeFileSync(controllerPath, content, 'utf8');

// We'll write the /pay endpoint manually since it's easier to append
const newEndpoint = `
// ✅ CONFIRM PAYMENT
exports.confirmPayment = async (req, res) => {
  const { id } = req.params;
  const { paymentId, gateway } = req.body;
  try {
    const [appt] = await sequelize.query(
      \`SELECT status FROM appointments WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!appt || appt.status !== 'Payment Pending') {
      return res.status(400).json({ success: false, error: "Invalid appointment state for payment" });
    }
    
    await sequelize.query(
      \`UPDATE appointments SET status = 'Confirmed', payment_status = 'Paid' WHERE id = :id\`,
      { replacements: { id }, type: QueryTypes.UPDATE }
    );
    
    return res.json({ success: true, message: "Payment confirmed, appointment booked" });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ success: false, error: "Payment confirmation failed" });
  }
};
`;

if (!content.includes('exports.confirmPayment')) {
    fs.appendFileSync(controllerPath, newEndpoint, 'utf8');
    console.log("Added confirmPayment endpoint");
}

// Route update
const routesPath = 'C:\\\\curevan_node\\\\src\\\\routes\\\\appointments.routes.js';
let routesContent = fs.readFileSync(routesPath, 'utf8');
if (!routesContent.includes('/pay')) {
    const targetRoute = `router.put("/status/:id", authMiddleware, responseHandler, appointmentsController.updateAppointmentStatus);`;
    const replaceRoute = `router.put("/status/:id", authMiddleware, responseHandler, appointmentsController.updateAppointmentStatus);\n\n// ✅ POST confirm payment\nrouter.post("/:id/pay", authMiddleware, responseHandler, appointmentsController.confirmPayment);`;
    routesContent = routesContent.replace(targetRoute, replaceRoute);
    fs.writeFileSync(routesPath, routesContent, 'utf8');
    console.log('Added pay route to appointments.routes.js');
}

