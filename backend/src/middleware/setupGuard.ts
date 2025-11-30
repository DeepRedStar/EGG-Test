import { NextFunction, Request, Response } from 'express';
import { getSetupState } from '../utils/setup.js';

const allowedPrefixes = ['/healthz', '/api/setup'];

export async function enforceSetupComplete(req: Request, res: Response, next: NextFunction) {
  const allowed = allowedPrefixes.some((prefix) => req.path.startsWith(prefix));
  if (allowed) return next();

  const { setupRequired } = await getSetupState();
  if (setupRequired) {
    return res.status(403).json({ message: 'Setup required', setupRequired: true });
  }
  return next();
}
