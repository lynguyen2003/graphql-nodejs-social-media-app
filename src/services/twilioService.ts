import twilio from 'twilio';
import { environmentVariablesConfig } from '../config/appConfig.js';
import { UserInputError } from 'apollo-server-express';

const client = twilio(
    environmentVariablesConfig.twilioAccountSid,
    environmentVariablesConfig.twilioAuthToken
)

export const sendOTPViaSMS = async (phone: string, otp: string): Promise<boolean> => {
    const message = await client.messages.create({
        body: `Your verification code is: ${otp}`,
        from: environmentVariablesConfig.twilioPhoneNumber,
        to: phone
    })
    if (!message) {
        throw new UserInputError('Fail to send SMS!')
    }
    console.log(`SMS sent with SID: ${message.sid}`)
    return true
}