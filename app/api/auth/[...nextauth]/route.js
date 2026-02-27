import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username / Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (credentials?.password === process.env.ADMIN_PASSWORD) {
                    return { id: "1", name: "Admin", email: "admin@hquant.app" };
                }
                return null;
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only_123",
    // Vercel deployment requires a base URL to match the callback
    ...(process.env.VERCEL_URL && { url: `https://${process.env.VERCEL_URL}` })
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
