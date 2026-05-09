import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";
import { UserRole, UserStatus } from "../utils/enums.js";
// If your Prisma file is located elsewhere, you can change the path
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite", // or "mysql", "postgresql", ...etc
    }),
    // Additional Information
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: UserRole.USER,
                required: false,
            },
            status: {
                type: "string",
                defaultValue: UserStatus.ACTIVE,
                required: false,
            },
            phone: {
                type: "string",
                required: false,
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
    },
    socialProviders: {
        google: {
            prompt: "select_account consent",
            accessType: "offline",
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    trustedOrigins: ["http://localhost:3000", "http://localhost:3001"],
});
//# sourceMappingURL=auth.js.map