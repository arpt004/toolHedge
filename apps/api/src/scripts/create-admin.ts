// Provisions (or resets the password of) an admin account. There is no
// public admin signup endpoint by design — this CLI is the supported,
// environment-appropriate way to create the first admin account, and every
// admin after it.
//
// Usage:
//   npm run create-admin -w @toolhedge/api -- --email you@example.com --password "Str0ng!Passw0rd" --name "Your Name"
//
// Re-running with an existing email updates that admin's name/password
// instead of failing, which also makes this the password-reset path.
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/password';

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const email = readArg('--email')?.trim().toLowerCase();
  const password = readArg('--password');
  const name = readArg('--name') ?? 'Admin';

  if (!email || !password) {
    console.error('Usage: create-admin --email <email> --password <password> [--name "Full Name"]');
    process.exitCode = 1;
    return;
  }
  if (password.length < 10) {
    console.error('Password must be at least 10 characters.');
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.adminUser.upsert({
    where: { email },
    create: { email, passwordHash, name, role: 'ADMIN' },
    update: { passwordHash, name, isActive: true },
  });
  console.log(`Admin ready: ${admin.email} (id ${admin.id}). You can now log in at /admin/login.`);
}

main()
  .catch((error) => {
    console.error('Failed to provision admin:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
