import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const pool = new Pool({
  host: 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.APP_DB_USER || process.env.POSTGRES_USER,
  password: process.env.APP_DB_PASSWORD || process.env.POSTGRES_PASSWORD,
});