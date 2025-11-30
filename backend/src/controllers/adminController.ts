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
  eventId: z.string().min(1),
});

export async function listCaches(_req: Request, res: Response) {
  const caches = await prisma.cache.findMany({ include: { foundBy: true, event: true } });
  res.json({ caches });
}

export async function createCache(req: Request, res: Response) {
  const parseResult = cacheSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid cache data' });
  const event = await prisma.event.findUnique({ where: { id: parseResult.data.eventId } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const cache = await prisma.cache.create({
    data: { ...parseResult.data, createdByUserId: req.session.userId! },
  });
  res.status(201).json({ cache });
}

export async function updateCache(req: Request, res: Response) {
  const parseResult = cacheSchema.partial().safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid cache data' });
  if (parseResult.data.eventId) {
    const event = await prisma.event.findUnique({ where: { id: parseResult.data.eventId } });
    if (!event) return res.status(404).json({ message: 'Event not found' });
  }
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
  eventId: z.string().min(1),
});

export async function createInvite(req: Request, res: Response) {
  const parseResult = inviteSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid invite data' });
  const event = await prisma.event.findUnique({ where: { id: parseResult.data.eventId } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const token = crypto.randomUUID();
  const invite = await prisma.inviteToken.create({
    data: {
      token,
      createdByUserId: req.session.userId!,
      maxUses: parseResult.data.maxUses ?? 1,
      expiresAt: parseResult.data.expiresAt ? new Date(parseResult.data.expiresAt) : undefined,
      eventId: parseResult.data.eventId,
    },
  });
  res.status(201).json({ invite });
}

export async function listInvites(_req: Request, res: Response) {
  const invites = await prisma.inviteToken.findMany({ orderBy: { createdAt: 'desc' }, include: { event: true } });
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

const eventSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().optional().default(true),
});

export async function listEvents(_req: Request, res: Response) {
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ events });
}

export async function createEvent(req: Request, res: Response) {
  const parseResult = eventSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid event data' });
  const event = await prisma.event.create({
    data: {
      name: parseResult.data.name,
      slug: parseResult.data.slug,
      description: parseResult.data.description,
      startsAt: parseResult.data.startsAt ? new Date(parseResult.data.startsAt) : undefined,
      endsAt: parseResult.data.endsAt ? new Date(parseResult.data.endsAt) : undefined,
      isActive: parseResult.data.isActive ?? true,
    },
  });
  res.status(201).json({ event });
}

export async function updateEvent(req: Request, res: Response) {
  const parseResult = eventSchema.partial().safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid event data' });
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      ...('startsAt' in parseResult.data && parseResult.data.startsAt
        ? { startsAt: new Date(parseResult.data.startsAt) }
        : {}),
      ...('endsAt' in parseResult.data && parseResult.data.endsAt ? { endsAt: new Date(parseResult.data.endsAt) } : {}),
      ...Object.fromEntries(
        Object.entries(parseResult.data).filter(([key]) => !['startsAt', 'endsAt'].includes(key))
      ),
    },
  });
  res.json({ event });
}
