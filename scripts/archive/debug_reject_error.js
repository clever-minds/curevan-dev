const fs = require('fs');
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Update catch block in rejectBookingRequest
const target = `  } catch (error) {
    console.error("Error rejecting booking:", error);
    return res.status(500).json({ success: false, error: "Failed to reject booking" });
  }`;
const replacement = `  } catch (error) {
    console.error("Error rejecting booking:", error);
    return res.status(500).json({ success: false, error: "Failed to reject booking: " + error.message });
  }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log("Updated reject error response");
} else {
    console.log("Target not found");
}

// Ensure the condition is printing why it fails if it returns 400
const target400 = `    if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: "Invalid appointment or unauthorized" });
    }`;
const replacement400 = `    if (!appt || (appt.status !== 'Pending Approval' && appt.status !== 'Pending') || appt.therapist_id != userId) {
      return res.status(400).json({ success: false, error: \`Invalid appointment or unauthorized. appt: \${!!appt}, status: \${appt?.status}, therapist_id: \${appt?.therapist_id}, userId: \${userId}\` });
    }`;

if (content.includes(target400)) {
    content = content.replace(target400, replacement400);
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log("Updated reject 400 response");
} else {
    console.log("Target 400 not found");
}
