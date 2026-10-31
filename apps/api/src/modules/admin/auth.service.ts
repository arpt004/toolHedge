import { prisma } from '../../lib/prisma';
import { config } from '../../config/env';
import { verifyPassword } from '../../lib/password';
import { generateSessionToken, hashSessionToken } from '../../lib/session-token';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class AccountDisabledError extends Error {
  constructor() {
    super('This admin account has been disabled');
    this.name = 'AccountDisabledError';
  }
}

interface SessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

function sessionTtlMs() {
  return config.admin.sessionTtlHours * 60 * 60 * 1000;
}

export const adminAuthService = {
  async login(email: string, password: string, meta: SessionMeta) {
    // Always run bcrypt.compare even when the account is missing, against a
    // fixed dummy hash, so a timing difference can't be used to enumerate
    // which emails have admin accounts.
    const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEfO/kw11/VDO1gSOkKyeHX2sWnNchbbpEu';
    const ok = await verifyPassword(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !ok) throw new InvalidCredentialsError();
    if (!admin.isActive) throw new AccountDisabledError();

    const token = generateSessionToken();
    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.adminSession.create({
        data: {
          adminId: admin.id,
          tokenHash: hashSessionToken(token),
          expiresAt: new Date(Date.now() + sessionTtlMs()),
          userAgent: meta.userAgent ?? null,
          ipAddress: meta.ipAddress ?? null,
        },
      });
      await tx.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
      return created;
    });

    return {
      token,
      expiresAt: session.expiresAt,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
  },

  async logout(token: string) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  },

  async logoutAllSessions(adminId: number) {
    await prisma.adminSession.deleteMany({ where: { adminId } });
  },

  async getAdminBySessionToken(token: string) {
    const tokenHash = hashSessionToken(token);
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { admin: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.adminSession.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    if (!session.admin.isActive) return null;
    // Best-effort activity timestamp; never block the request on it.
    prisma.adminSession
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
    return session.admin;
  },
};
