import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Generate a random 6-digit OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999); // Random 6-digit number
};

// Send OTP email to the driver
const sendOtpEmail = async (email, otp) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service (e.g., Gmail, SendGrid)
    auth: {
      user: 'shalikaramanayaka21@gmail.com',  // Replace with your email
      pass: 'hzst dkfh irpc oxlr',  // Replace with your email password
    },
  });

  const mailOptions = {
    from: 'shalikaramanayaka21@gmail.com',
    to: email,
    subject: 'Your OTP for Driver Login',
    text: `Your OTP is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP sent successfully');
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export { generateOtp, sendOtpEmail };
