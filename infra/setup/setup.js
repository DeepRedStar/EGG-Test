#!/usr/bin/env node
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import crypto from 'crypto';
import inquirer from 'inquirer';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../backend/.env');
const frontendEnvPath = path.resolve(__dirname, '../../frontend/.env');

async function readEnvFile(envPath) {
  try {
    const content = await fs.readFile(envPath, 'utf8');
    return content
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...rest] = line.split('=');
        acc[key.trim()] = rest.join('=').trim();
        return acc;
      }, {});
  } catch (err) {
    return {};
  }
}

function toEnvLines(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

async function writeEnv(envPath, values) {
  await fs.writeFile(envPath, toEnvLines(values) + '\n', 'utf8');
  console.log(chalk.green(`Updated ${envPath}`));
}

async function runMigrations() {
  console.log(chalk.blue('Running database migrations...'));
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['prisma', 'migrate', 'deploy'], {
      cwd: path.resolve(__dirname, '../../backend'),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Migrations exited with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log(chalk.cyan('Welcome to the Egg Hunt setup wizard!'));
  const existingBackend = await readEnvFile(backendEnvPath);
  const existingFrontend = await readEnvFile(frontendEnvPath);
  const defaults = {
    DATABASE_URL: existingBackend.DATABASE_URL,
    BASE_URL: existingBackend.BASE_URL || 'http://localhost:5173',
    PUBLIC_URL: existingBackend.PUBLIC_URL || existingFrontend.VITE_PUBLIC_URL || 'http://localhost:5173',
    INSTANCE_NAME: existingBackend.INSTANCE_NAME || 'Egg Hunt',
    DEFAULT_LOCALE: existingBackend.DEFAULT_LOCALE || 'de',
    ENABLED_LOCALES: existingBackend.ENABLED_LOCALES || 'de,en',
    PORT: existingBackend.PORT || '4000',
    VITE_API_URL: existingFrontend.VITE_API_URL || 'http://localhost:4000',
  };

  if (!defaults.DATABASE_URL) {
    console.log(
      chalk.yellow(
        'No DATABASE_URL found in backend/.env. Please edit backend/.env (see backend/.env.example) before running migrations.'
      )
    );
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'publicUrl',
      message: 'Public/Base URL of this instance',
      default: defaults.PUBLIC_URL,
    },
    {
      type: 'input',
      name: 'instanceName',
      message: 'Instance name',
      default: defaults.INSTANCE_NAME,
    },
    {
      type: 'input',
      name: 'defaultLocale',
      message: 'Default locale (e.g. de or en)',
      default: defaults.DEFAULT_LOCALE,
    },
    {
      type: 'input',
      name: 'enabledLocales',
      message: 'Enabled locales (comma separated)',
      default: defaults.ENABLED_LOCALES,
    },
    {
      type: 'confirm',
      name: 'runMigration',
      message: 'Run database migrations now?',
      default: Boolean(defaults.DATABASE_URL),
    },
  ]);

  const sessionSecret = existingBackend.SESSION_SECRET || crypto.randomBytes(24).toString('hex');

  const backendEnv = {
    DATABASE_URL: defaults.DATABASE_URL,
    SESSION_SECRET: sessionSecret,
    NODE_ENV: 'development',
    BASE_URL: answers.publicUrl,
    PUBLIC_URL: answers.publicUrl,
    PORT: defaults.PORT,
  };

  const frontendEnv = {
    VITE_API_URL: defaults.VITE_API_URL,
    VITE_PUBLIC_URL: answers.publicUrl,
    VITE_INSTANCE_NAME: answers.instanceName,
  };

  await writeEnv(backendEnvPath, backendEnv);
  await writeEnv(frontendEnvPath, frontendEnv);

  if (answers.runMigration) {
    if (!defaults.DATABASE_URL) {
      console.log(chalk.red('Skipping migrations because DATABASE_URL is missing.')); 
    } else {
      try {
        await runMigrations();
        console.log(chalk.green('Migrations completed.'));
      } catch (err) {
        console.error(chalk.red('Migrations failed. Please check your database connection.'));
        console.error(err instanceof Error ? err.message : err);
      }
    }
  }

  console.log('\nSetup summary:');
  console.log(`Backend: http://localhost:${defaults.PORT}`);
  console.log('Frontend: http://localhost:5173');
  console.log('Start development servers with:');
  console.log('  cd backend && npm run dev');
  console.log('  cd frontend && npm run dev');
  console.log('Or use Docker:');
  console.log('  cd infra && docker compose up --build');
  console.log('Then open the frontend URL and follow /setup to create the first admin.');
}

main().catch((err) => {
  console.error(chalk.red('Setup failed'));
  console.error(err);
  process.exit(1);
});
