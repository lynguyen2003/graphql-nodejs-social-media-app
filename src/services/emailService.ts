import nodemailer from "nodemailer";
import { environmentVariablesConfig } from "../config/appConfig.js";
import { getListOfIPV4Address } from "../helpers/getListOfIPV4Address.js";

var transport = nodemailer.createTransport({
    host: environmentVariablesConfig.emailHost,
    port: environmentVariablesConfig.emailPort,
    secure: true, // Use SSL/TLS
    auth: {
      user: environmentVariablesConfig.emailUser,
      pass: environmentVariablesConfig.emailPassword
    }
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const ip = getListOfIPV4Address()[0]; // Lấy địa chỉ IP đầu tiên
  const verificationUrl = `http://${ip}:${environmentVariablesConfig.port}/verify-email/${token}`;
  
  await transport.sendMail({
    from: environmentVariablesConfig.emailFrom,
    to: email,
    subject: 'Xác thực địa chỉ email của bạn',
    html: `
      <h1>Xác thực Email</h1>
      <p>Vui lòng nhấp vào liên kết bên dưới để xác thực địa chỉ email của bạn:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
    `
  });
};

export const sendOTPEmail = async (email: string, otp: string) => {
  await transport.sendMail({
      from: environmentVariablesConfig.emailFrom,
      to: email,
      subject: 'Mã xác thực một lần',
      html: `
          <h1>Yêu cầu xác thực: Mã xác thực một lần</h1>
          <p>Bạn nhận được email này vì có yêu cầu mã xác thực một lần để xác thực tài khoản.</p> </br>
          <p>Vui lòng nhập mã sau để xác thực:</p> </br>
          <p><strong>${otp}</strong></p>
          <p>Nếu bạn không yêu cầu mã này, vui lòng đổi mật khẩu hoặc liên hệ với chúng tôi qua chat.</p>
      `
  });
};

export const sendNewDeviceLoginEmail = async (email: string, deviceInfo: string, location: string) => {
  await transport.sendMail({
      from: environmentVariablesConfig.emailFrom,
      to: email,
      subject: 'Đăng nhập từ thiết bị mới',
      html: `
          <h1>Đăng nhập từ thiết bị mới</h1>
          <p>Chúng tôi phát hiện đăng nhập mới vào tài khoản của bạn từ thiết bị lạ.</p>
          <p><strong>Thông tin thiết bị:</strong> ${deviceInfo}</p>
          <p><strong>Vị trí:</strong> ${location}</p>
          <p>Nếu đây là bạn, vui lòng bỏ qua email này.</p>
          <p>Nếu bạn không nhận ra hoạt động này, vui lòng đổi mật khẩu ngay lập tức và liên hệ với chúng tôi.</p>
      `
  });
};