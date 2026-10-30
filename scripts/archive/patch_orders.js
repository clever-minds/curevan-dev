const fs = require('fs');

const controllerPath = 'c:/curevan_node/src/controllers/orders/orderController.js';
let code = fs.readFileSync(controllerPath, 'utf8');

const importSearch = `const transporter = require("../../config/mailer");`;
const importReplace = `const transporter = require("../../config/mailer");\nconst firebaseNotifier = require("../../utils/firebaseNotifier");`;

if (!code.includes('firebaseNotifier')) {
  code = code.replace(importSearch, importReplace);
}

const createOrderSearch = `    try {
      if (req.user?.email) {
        await transporter.sendMail({
          from: \`"Curevan Orders" <\${process.env.MAIL_USER}>\`,
          to: req.user.email,
          subject: \`Order Confirmation - \${orderNumber}\`,
          html: \`
            <h3>Order Received!</h3>
            <p>Hi \${req.user.name || 'Customer'},\</p>
            <p>Your order <strong>\${orderNumber}</strong> has been placed successfully.</p>
            <p><strong>Total Amount:</strong> ₹\${total}</p>
            <p>We will notify you once your order is shipped.</p>
          \`
        });
      }
    } catch (mailErr) {
      console.error("Failed to send order creation email:", mailErr);
    }`;

const createOrderReplace = `    try {
      if (req.user?.email) {
        await transporter.sendMail({
          from: \`"Curevan Orders" <\${process.env.MAIL_USER}>\`,
          to: req.user.email,
          subject: \`Order Confirmation - \${orderNumber}\`,
          html: \`
            <h3>Order Received!</h3>
            <p>Hi \${req.user.name || 'Customer'},\</p>
            <p>Your order <strong>\${orderNumber}</strong> has been placed successfully.</p>
            <p><strong>Total Amount:</strong> ₹\${total}</p>
            <p>We will notify you once your order is shipped.</p>
          \`
        });
      }
      
      // Push Notification
      const [userRows] = await sequelize.query(
        \`SELECT fcm_token FROM users WHERE id = :userId\`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      );
      if (userRows && userRows.fcm_token) {
        await firebaseNotifier.sendToTherapist(
          userRows.fcm_token,
          "Order Placed",
          \`Your order \${orderNumber} has been placed successfully. Total: ₹\${total}\`,
          { type: "order_placed", orderId: String(orderId) }
        );
      }
    } catch (err) {
      console.error("Failed to send order creation notification:", err);
    }`;

if (!code.includes('Order Placed')) {
  code = code.replace(createOrderSearch, createOrderReplace);
}

const cancelSearch = `    try {
      if (req.user?.email) {
        await transporter.sendMail({
          from: \`"Curevan Orders" <\${process.env.MAIL_USER}>\`,
          to: req.user.email,
          subject: \`Order Cancelled - #\${orderId}\`,
          html: \`
            <h3>Order Cancelled</h3>
            <p>Hi \${req.user.name || 'Customer'},\</p>
            <p>Your order #\${orderId} has been cancelled successfully.</p>
            <p>If you have any questions, please contact our support team.</p>
          \`
        });
      }
    } catch (mailErr) {
      console.error("Failed to send order cancel email:", mailErr);
    }`;

const cancelReplace = `    try {
      if (req.user?.email) {
        await transporter.sendMail({
          from: \`"Curevan Orders" <\${process.env.MAIL_USER}>\`,
          to: req.user.email,
          subject: \`Order Cancelled - #\${orderId}\`,
          html: \`
            <h3>Order Cancelled</h3>
            <p>Hi \${req.user.name || 'Customer'},\</p>
            <p>Your order #\${orderId} has been cancelled successfully.</p>
            <p>If you have any questions, please contact our support team.</p>
          \`
        });
      }

      // Push Notification
      const [userRows] = await sequelize.query(
        \`SELECT fcm_token FROM users WHERE id = :userId\`,
        { replacements: { userId: req.user.id }, type: QueryTypes.SELECT }
      );
      if (userRows && userRows.fcm_token) {
        await firebaseNotifier.sendToTherapist(
          userRows.fcm_token,
          "Order Cancelled",
          \`Your order #\${orderId} has been cancelled successfully.\`,
          { type: "order_cancelled", orderId: String(orderId) }
        );
      }
    } catch (err) {
      console.error("Failed to send order cancel notification:", err);
    }`;

if (!code.includes('Order Cancelled"')) {
  code = code.replace(cancelSearch, cancelReplace);
}

fs.writeFileSync(controllerPath, code, 'utf8');
console.log('orderController.js patched successfully!');
