import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase().trim();
      const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

      try {
        let employee = await prisma.employee.findUnique({
          where: { email },
        });

        // 1. Tự khởi tạo Admin nếu email khớp ADMIN_EMAIL và chưa tồn tại
        if (!employee && adminEmail && email === adminEmail) {
          employee = await prisma.employee.create({
            data: {
              code: "ADMIN-01",
              fullName: user.name || "Tổng Chỉ Huy (Admin)",
              email: email,
              phone: `admin-${Date.now()}`,
              role: "ADMIN",
              isActive: true,
              avatarUrl: user.image || null,
            },
          });
          return true;
        }

        // 2. Kiểm tra danh sách trắng Whitelist trực tiếp trên bảng Employee
        if (!employee || !employee.isActive) {
          console.warn(`[Auth Whitelist] Chặn đăng nhập email không hợp lệ hoặc đã bị khóa: ${email}`);
          return false;
        }

        return true;
      } catch (error) {
        console.error("[Auth Whitelist] Lỗi khi xác thực đăng nhập:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (token.email) {
        const employee = await prisma.employee.findUnique({
          where: { email: token.email.toLowerCase().trim() },
        });

        // Vô hiệu hóa token cũ ngay khi nhân viên bị khóa hoặc bị xóa
        if (!employee || !employee.isActive) {
          return { ...token, role: undefined, isActive: false, employeeId: undefined } as any;
        }

        token.employeeId = employee.id;
        token.code = employee.code;
        token.role = employee.role;
        token.fullName = employee.fullName;
        token.isActive = employee.isActive;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.employeeId;
        (session.user as any).code = token.code;
        (session.user as any).role = token.role;
        (session.user as any).fullName = token.fullName;
        (session.user as any).isActive = token.isActive;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};
