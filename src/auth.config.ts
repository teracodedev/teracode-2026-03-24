import type { NextAuthConfig } from "next-auth";

// Edge Runtime で動作する軽量な設定（Prisma・bcrypt 不使用）
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.email = user.email ?? undefined;
        token.name = user.name ?? undefined;
      }
      return token;
    },
    session({ session, token }) {
      if (!session.user) {
        session.user = {
          id: "",
          email: "",
          name: "",
          isAdmin: false,
          emailVerified: null,
        };
      }
      session.user.id = (token.id as string | undefined) ?? "";
      session.user.isAdmin = Boolean(token.isAdmin);
      if (typeof token.email === "string") session.user.email = token.email;
      if (typeof token.name === "string") session.user.name = token.name;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
};
