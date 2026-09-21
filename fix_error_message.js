const fs = require('fs');
const controllerPath = 'C:\\\\curevan_node\\\\src\\\\controllers\\\\appointments\\\\appointmentsController.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Update catch block in acceptBookingRequest
const target = `  } catch (error) {
    await t.rollback();
    console.error("Error accepting booking:", error);
    return res.status(500).json({ success: false, error: "Failed to accept booking" });
  }`;
const replacement = `  } catch (error) {
    await t.rollback();
    console.error("Error accepting booking:", error);
    return res.status(500).json({ success: false, error: "Failed to accept booking: " + error.message });
  }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log("Updated error response");
} else {
    console.log("Target not found");
}
