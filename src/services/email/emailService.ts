import nodemailer from "nodemailer";
import { environmentVariablesConfig } from "../../config/appConfig";
import { getListOfIPV4Address } from "../../helpers/getListOfIPV4Address";

var transport = nodemailer.createTransport({
    host: environmentVariablesConfig.emailHost,
    port: 587,
    auth: {
      user: environmentVariablesConfig.emailUser,
      pass: environmentVariablesConfig.emailPassword
    }
  });

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = getListOfIPV4Address().forEach(ip => {
    `http://${ip}:${environmentVariablesConfig.port}/verify-email/${token}`
  })
  
  await transport.sendMail({
    from: environmentVariablesConfig.emailFrom,
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
    `
  });
};

export const sendOTPEmail = async (email: string, otp: string) => {
  await transport.sendMail({
      from: environmentVariablesConfig.emailFrom,
      to: email,
      subject: 'One-Time Verification Code',
      html: `
          <h1>Action Required: One-Time Verification Code</h1>
          <p>You are receiving this email because a request was made for a one-time code that can be used for authentication.</p> </br>
          <p>Please enter the following code for verification:</p> </br>
          <p><strong>${otp}</strong></p>
          <p>If you did not request this change, please change your password or use the chat to contact us.</p>
      `
  });
};