import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
    type AuthTokens {
        accessToken: String!
        refreshToken: String!
    }

    type Token {
        token: String
    }

    type TOTPSetup {
        secret: String!
        qrCodeUrl: String!
    }

    type Mutation {
        registerUser(email: String!, password: String!): AuthTokens
        authUser(email: String!, password: String!): AuthTokens
        refreshToken(refreshToken: String!): AuthTokens
        logout(refreshToken: String!): Boolean
        deleteMyUserAccount: DeleteResult
        verifyOTP(email: String!, token: String!): Token!
        sendOTPToEmail(email: String!): String
        sendOTPToSMS(phone: String!): String
    }
`;