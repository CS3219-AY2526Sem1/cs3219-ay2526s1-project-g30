const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (options) => {
  const msg = {
    to: options.email,
    from: 'peerprepg30@gmail.com', 
    subject: options.subject,
    text: options.message,
    // You can also add an HTML version
    // html: `<strong>${options.message}</strong>`, 
  };

  try {
    console.log('Sending email with SendGrid...');
    await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid.');
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);

    if (error.response) {
      console.error(error.response.body)
    }

    throw error;
  }
};

module.exports = sendEmail;