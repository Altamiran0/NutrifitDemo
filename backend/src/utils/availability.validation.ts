import { Pool, PoolClient } from 'pg';
import {
  AvailabilityDTO,
  DAYS_OF_WEEK,
  DayOfWeek,
} from '../types/availability.types';
import { RoleName, UserSessionDTO } from '../types/auth.types';

type Queryable = Pool | PoolClient;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Columnas a devolver, con la hora ya formateada como 'HH:MM'
export const AVAILABILITY_COLUMNS = `id, user_id, day_of_week,
  to_char(start_time, 'HH24:MI') AS start_time,
  to_char(end_time, 'HH24:MI') AS end_time`;

export interface AvailabilityRow {
  id: number;
  user_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export function mapAvailability(row: AvailabilityRow): AvailabilityDTO {
  return {
    id: row.id,
    userId: row.user_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
  };
}

export function assertAdmin(actor: UserSessionDTO | null): void {
  if (!actor) {
    throw new Error('Debés iniciar sesión para realizar esta acción.');
  }
  if (actor.role !== 'ADMINISTRADOR') {
    throw new Error(
      'Acceso denegado: solo un Administrador puede gestionar la disponibilidad horaria.'
    );
  }
}

export function normalizeDay(day: string): DayOfWeek {
  const normalized = day
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes: MIÉRCOLES -> MIERCOLES
    .toUpperCase()
    .trim();

  if (!DAYS_OF_WEEK.includes(normalized as DayOfWeek)) {
    throw new Error(
      `Día inválido. Valores permitidos: ${DAYS_OF_WEEK.join(', ')}.`
    );
  }
  return normalized as DayOfWeek;
}

export function normalizeTime(value: string, label: string): string {
  const time = value.trim();
  if (!TIME_REGEX.test(time)) {
    throw new Error(`La ${label} debe tener formato HH:MM (24 hs). Ej: 09:30.`);
  }
  return time;
}

// Criterio de aceptación 1 y 2: hora de inicio debe ser menor a la de fin
export function validateTimeRange(startTime: string, endTime: string): void {
  // Con formato HH:MM, la comparación de strings equivale a la comparación horaria
  if (startTime >= endTime) {
    throw new Error(
      `Rango horario incoherente: la hora de inicio (${startTime}) debe ser menor a la hora de fin (${endTime}).`
    );
  }
}

export async function assertIsProfessional(
  db: Queryable,
  userId: number
): Promise<void> {
  const res = await db.query<{ role_name: RoleName }>(
    `SELECT r.role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [userId]
  );

  if (res.rows.length === 0) {
    throw new Error('El profesional seleccionado no existe.');
  }

  const role = res.rows[0].role_name;
  if (role !== 'NUTRICIONISTA' && role !== 'INSTRUCTOR') {
    throw new Error(
      'Solo se puede configurar disponibilidad para nutricionistas e instructores.'
    );
  }
}

export function overlapMessage(
  conflict: AvailabilityDTO,
  startTime?: string,
  endTime?: string
): string {
  const attempted = startTime && endTime ? ` con el rango ${startTime}-${endTime}` : '';
  return `Conflicto de horario: el profesional ya tiene una franja el ${conflict.dayOfWeek} de ${conflict.startTime} a ${conflict.endTime} que se superpone${attempted}.`;
}

// excludeId se usa al editar, para no compararse contra el propio bloque
export async function assertNoOverlap(
  db: Queryable,
  userId: number,
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  excludeId: number | null = null
): Promise<void> {
  const res = await db.query<AvailabilityRow>(
    `SELECT ${AVAILABILITY_COLUMNS}
     FROM availability_schedules
     WHERE user_id = $1
       AND day_of_week = $2
       AND start_time < $4::time
       AND end_time > $3::time
       AND ($5::int IS NULL OR id <> $5::int)
     LIMIT 1`,
    [userId, dayOfWeek, startTime, endTime, excludeId]
  );

  if (res.rows.length > 0) {
    throw new Error(overlapMessage(mapAvailability(res.rows[0]), startTime, endTime));
  }
}