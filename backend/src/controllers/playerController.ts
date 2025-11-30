import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { haversineDistanceMeters } from '../utils/distance.js';

const locationSchema = z.object({ latitude: z.number(), longitude: z.number() });

async function getSetting(key: string, fallback: string) {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? fallback;
}

export async function cachesInRadius(req: Request, res: Response) {
  const parseResult = locationSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid location' });
  const { latitude, longitude } = parseResult.data;
  const visibilityMeters = Number(await getSetting('CACHE_VISIBILITY_RADIUS_METERS', '2000'));
  const caches = await prisma.cache.findMany({ where: { isActive: true }, include: { foundBy: true } });
  const filtered = caches.filter((cache) => {
    const distance = haversineDistanceMeters(latitude, longitude, cache.latitude, cache.longitude);
    return distance <= visibilityMeters;
  });
  res.json({ caches: filtered });
}

const foundSchema = z.object({ cacheId: z.string(), latitude: z.number(), longitude: z.number() });

export async function markFound(req: Request, res: Response) {
  const parseResult = foundSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ message: 'Invalid request' });
  const { cacheId, latitude, longitude } = parseResult.data;
  const cache = await prisma.cache.findUnique({ where: { id: cacheId } });
  if (!cache) return res.status(404).json({ message: 'Cache not found' });
  const foundRadius = Number(await getSetting('CACHE_FOUND_RADIUS_METERS', '1'));
  const distance = haversineDistanceMeters(latitude, longitude, cache.latitude, cache.longitude);
  if (distance > foundRadius) return res.status(422).json({ message: 'Too far away to claim' });
  const existing = await prisma.foundCache.findUnique({ where: { userId_cacheId: { userId: req.session.userId!, cacheId } } });
  if (existing) return res.status(200).json({ found: existing });
  const globalFound = await prisma.foundCache.findFirst({ where: { cacheId } });
  const found = await prisma.foundCache.create({
    data: {
      cacheId,
      userId: req.session.userId!,
      firstFound: !globalFound,
    },
  });
  res.status(201).json({ found });
}
