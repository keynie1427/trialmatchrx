const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Use Firebase environment config for Gmail credentials
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.pass;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: jelany1817@gmail.com,
    pass: yaht vijh huiv fwha,
  },
});

// Firestore trigger for new contact submissions
exports.sendContactNotification = functions.firestore
  .document("contacts/{contactId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    const mailOptions = {
      from: `"TrialMatchRX" <${gmailEmail}>`,
      to: "youremail@domain.com", // 👈 Replace this with your admin email
      subject: `New Trial Inquiry: ${data.nctId}`,
      text: `
        You have a new contact form submission:

        Name: ${data.name}
        Email: ${data.email}
        NCT ID: ${data.nctId}
        Message:
        ${data.message}
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("✅ Email notification sent successfully.");
    } catch (err) {
      console.error("❌ Error sending email:", err);
    }
  });