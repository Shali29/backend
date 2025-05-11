import nodemailer from 'nodemailer';

// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other email services like Outlook, etc.
  auth: {
    user: 'shalikaramanayaka21@gmail.com',  // Replace with your email
    pass: 'hzst dkfh irpc oxlr',  // Replace with your email password or app password
  },
});

// Generate OTP
export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  return otp;
};

// Send OTP to driver's email
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: 'shalikaramanayaka21@gmail.com',  // Replace with your email
      to: email,
      subject: 'Your OTP for Driver Login',
      text: `Your OTP for login is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log('OTP sent to email');
  } catch (error) {
    throw new Error('Error sending OTP');
  }
};
