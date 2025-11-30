import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import setupRoutes from './routes/setupRoutes.js';
import { prisma } from './utils/prisma.js';
import { enforceSetupComplete } from './middleware/setupGuard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('tiny'));
app.use(express.json());
app.use(
  cors({
    origin: process.env.BASE_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  })
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(securityHeaders);

app.get('/healthz', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok' });
});

app.use(enforceSetupComplete);
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/player', playerRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
