import { environmentVariablesConfig } from "../../config/appConfig";
import jwt from 'jsonwebtoken';

interface StringeeResponse {
  status: number;
  message: string;
  data?: any;
}

const generateStringeeToken = (apiKeySid: string, apiKeySecret: string): string => {
  const header = {
    typ: "JWT",
    alg: "HS256",
    cty: "stringee-api;v=1"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    jti: `${apiKeySid}-${now}`,
    iss: apiKeySid,
    exp: now + 3600, 
    rest_api: true
  };

  return jwt.sign(payload, apiKeySecret, { 
    algorithm: 'HS256',
    header: header
  });
};

export const sendOTPViaSMS = async (phone: string, otp: string): Promise<boolean> => {
  try {
    const accessToken = generateStringeeToken(environmentVariablesConfig.stringeeApiKeySid, environmentVariablesConfig.stringeeApiKeySecret);
    const response = await fetch('https://api.stringee.com/v1/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-STRINGEE-AUTH': accessToken
      },
      body: JSON.stringify({
        senderId: 842471013432,
        to: phone,
        content: `Your verification code is: ${otp}. This code will expire in 2 minutes.`
      })
    });

    await response.json();

    return true;

  } catch (error) {
    console.error('SMS Service Error:', error);
    throw error;
  }
};