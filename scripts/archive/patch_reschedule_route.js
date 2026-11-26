const fs = require('fs');
const routesPath = 'C:\\\\curevan_node\\\\src\\\\routes\\\\appointments.routes.js';

try {
    let content = fs.readFileSync(routesPath, 'utf8');
    
    const target = 'router.put("/reschedule/:id", authenticateUser, rescheduleAppointment);';
    const replacement = 'router.put("/reschedule/:id", authMiddleware, responseHandler, appointmentsController.rescheduleAppointment);';
    
    if (content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(routesPath, content, 'utf8');
        console.log("Fixed ReferenceError in /reschedule/:id route successfully!");
    } else if (content.includes(replacement)) {
        console.log("The /reschedule/:id route is already fixed.");
    } else {
        console.log("Could not find the target line to replace. Please check the file contents.");
    }
} catch (err) {
    console.error("Error updating routes:", err);
}
