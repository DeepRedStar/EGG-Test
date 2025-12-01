import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
});

export async function login(req: Request, res: Response) {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const { email, password } = parseResult.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) return res.status(401).json({ message: 'Invalid credentials' });

  req.session.userId = user.id;
  req.session.role = user.role;
  return res.json({ user: { id: user.id, email: user.email, role: user.role } });
}

export async function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.json({ message: 'logged out' });
  });
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  token: z.string(),
});

export async function registerWithInvite(req: Request, res: Response) {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: 'Invalid registration request' });
  }
  const { email, password, token } = parseResult.data;
  const invite = await prisma.inviteToken.findUnique({ where: { token } });
  if (!invite) return res.status(404).json({ message: 'Invite not found' });
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return res.status(410).json({ message: 'Invite expired' });
  }
  if (invite.usedCount >= invite.maxUses) {
    return res.status(410).json({ message: 'Invite used up' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'PLAYER',
    },
  });
  await prisma.inviteToken.update({
    where: { id: invite.id },
    data: { usedCount: invite.usedCount + 1 },
  });

  req.session.userId = user.id;
  req.session.role = user.role;
  return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
}
