import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { getSetupState, markSetupComplete } from '../utils/setup.js';

export async function setupStatus(_req: Request, res: Response) {
  const state = await getSetupState();
  return res.json({ setupComplete: !state.setupRequired, adminExists: state.adminCount > 0 });
}

const setupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(10),
    passwordConfirm: z.string().min(10),
    instanceName: z.string().min(1),
    defaultLocale: z.string().min(2),
    enabledLocales: z.string().min(2),
    impressumUrl: z.string().optional(),
    privacyUrl: z.string().optional(),
    supportEmail: z.string().email(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Passwords must match',
  });

export async function initializeSetup(req: Request, res: Response) {
  const state = await getSetupState();
  if (!state.setupRequired) {
    return res.status(403).json({ message: 'Setup already completed' });
  }

  const parseResult = setupSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid setup payload' });
  }

  const { email, password, instanceName, defaultLocale, enabledLocales, impressumUrl, privacyUrl, supportEmail } =
    parseResult.data;

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({ data: { email, passwordHash, role: 'ADMIN' } });

  const settingsToPersist = [
    { key: 'INSTANCE_NAME', value: instanceName },
    { key: 'DEFAULT_LOCALE', value: defaultLocale },
    { key: 'ENABLED_LOCALES', value: enabledLocales },
    { key: 'IMPRESSUM_URL', value: impressumUrl ?? '' },
    { key: 'PRIVACY_URL', value: privacyUrl ?? '' },
    { key: 'SUPPORT_EMAIL', value: supportEmail },
  ];

  await Promise.all(
    settingsToPersist.map((setting) =>
      prisma.setting.upsert({
        where: { key: setting.key },
        create: setting,
        update: { value: setting.value },
      })
    )
  );
  await markSetupComplete();

  req.session.userId = admin.id;
  req.session.role = admin.role;

  return res.status(201).json({ message: 'Setup complete', admin: { id: admin.id, email: admin.email } });
}
