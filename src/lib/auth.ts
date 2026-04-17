import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getAuthLimiter, checkRateLimit } from "./rate-limit";
import { verifyTotp, hashBackupCode } from "./totp";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "Authentication code", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const ip =
            req?.headers?.["x-forwarded-for"]?.toString().split(",")[0].trim() ??
            req?.headers?.["x-real-ip"]?.toString() ??
            "unknown";
          const { success } = await checkRateLimit(
            getAuthLimiter(),
            `login:${credentials.email.toLowerCase()}:${ip}`
          );
          if (!success) return null;
        } catch {
          // Redis unavailable — skip rate limit gracefully
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) return null;

        if (user.twoFactorEnabled) {
          const code = credentials.totp?.trim() ?? "";
          if (!code) return null;
          const digits = code.replace(/\D/g, "");
          if (/^\d{6}$/.test(digits) && user.totpSecret) {
            if (!verifyTotp(user.totpSecret, digits)) return null;
          } else if (user.backupCodes?.length) {
            const hashed = hashBackupCode(code);
            if (!user.backupCodes.includes(hashed)) return null;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                backupCodes: user.backupCodes.filter((c) => c !== hashed),
              },
            });
          } else {
            return null;
          }
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; role: string }).id = token.id as string;
        (session.user as { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
};
