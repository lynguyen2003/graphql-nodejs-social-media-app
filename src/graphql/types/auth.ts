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
        registerUser(email: String!, password: String!): Token
        authUser(email: String!, password: String!): AuthTokens
        refreshToken(refreshToken: String!): AuthTokens
        logout(refreshToken: String!): Boolean
        deleteMyUserAccount: DeleteResult
        verifyOTP(email: String!, token: String!): Token!
        sendOTPToEmail(email: String!): String
        resetPassword(email: String!, token: String!, newPassword: String!): Boolean
    }
`;