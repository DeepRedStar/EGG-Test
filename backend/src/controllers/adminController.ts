import crypto from 'crypto';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const cacheSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  hint: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  isActive: z.boolean().optional().default(true),
});

export async function listCaches(_req: Request, res: Response) {
  const caches = await prisma.cache.findMany({ include: { foundBy: true } });
  res.json({ caches });
}

export async function createCache(req: Request, res: Response) {
  const parseResult = cacheSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid cache data' });
  const cache = await prisma.cache.create({
    data: { ...parseResult.data, createdByUserId: req.session.userId! },
  });
  res.status(201).json({ cache });
}

export async function updateCache(req: Request, res: Response) {
  const parseResult = cacheSchema.partial().safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid cache data' });
  const cache = await prisma.cache.update({ where: { id: req.params.id }, data: parseResult.data });
  res.json({ cache });
}

export async function deleteCache(req: Request, res: Response) {
  await prisma.cache.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

const inviteSchema = z.object({
  maxUses: z.number().int().positive().optional().default(1),
  expiresAt: z.string().datetime().optional(),
});

export async function createInvite(req: Request, res: Response) {
  const parseResult = inviteSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid invite data' });
  const token = crypto.randomUUID();
  const invite = await prisma.inviteToken.create({
    data: {
      token,
      createdByUserId: req.session.userId!,
      maxUses: parseResult.data.maxUses ?? 1,
      expiresAt: parseResult.data.expiresAt ? new Date(parseResult.data.expiresAt) : undefined,
    },
  });
  res.status(201).json({ invite });
}

export async function listInvites(_req: Request, res: Response) {
  const invites = await prisma.inviteToken.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ invites });
}

export async function deleteInvite(req: Request, res: Response) {
  await prisma.inviteToken.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

const settingSchema = z.object({ key: z.string(), value: z.string() });

export async function upsertSetting(req: Request, res: Response) {
  const parseResult = settingSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid setting' });
  const setting = await prisma.setting.upsert({
    where: { key: parseResult.data.key },
    create: parseResult.data,
    update: { value: parseResult.data.value },
  });
  res.json({ setting });
}

export async function listSettings(_req: Request, res: Response) {
  const settings = await prisma.setting.findMany();
  res.json({ settings });
}
