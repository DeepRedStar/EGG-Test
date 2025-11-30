import { prisma } from './prisma.js';

export async function getSetupState() {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const setupFlag = await prisma.setting.findUnique({ where: { key: 'SETUP_COMPLETED' } });
  const setupComplete = adminCount > 0 || setupFlag?.value === 'true';
  return { adminCount, setupComplete, setupRequired: !setupComplete };
}

export async function markSetupComplete() {
  await prisma.setting.upsert({
    where: { key: 'SETUP_COMPLETED' },
    create: { key: 'SETUP_COMPLETED', value: 'true' },
    update: { value: 'true' },
  });
}
