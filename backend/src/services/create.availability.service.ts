import { pool } from '../db';
import {
  AvailabilityResponseDTO,
  CreateAvailabilityDTO,
} from '../types/availability.types';
import { UserSessionDTO } from '../types/auth.types';
import {
  AVAILABILITY_COLUMNS,
  AvailabilityRow,
  assertAdmin,
  assertIsProfessional,
  assertNoOverlap,
  mapAvailability,
  normalizeDay,
  normalizeTime,
  validateTimeRange,
} from '../utils/availability.validation';

export class CreateAvailabilityService {
  async create(
    actor: UserSessionDTO | null,
    data: CreateAvailabilityDTO
  ): Promise<AvailabilityResponseDTO> {
    assertAdmin(actor);

    const dayOfWeek = normalizeDay(data.dayOfWeek);
    const startTime = normalizeTime(data.startTime, 'hora de inicio');
    const endTime = normalizeTime(data.endTime, 'hora de fin');
    validateTimeRange(startTime, endTime);

    await assertIsProfessional(pool, data.userId);
    await assertNoOverlap(pool, data.userId, dayOfWeek, startTime, endTime);

    try {
      const res = await pool.query<AvailabilityRow>(
        `INSERT INTO availability_schedules (user_id, day_of_week, start_time, end_time)
         VALUES ($1, $2, $3, $4)
         RETURNING ${AVAILABILITY_COLUMNS}`,
        [data.userId, dayOfWeek, startTime, endTime]
      );

      return {
        availability: mapAvailability(res.rows[0]),
        message: 'Franja horaria registrada correctamente.',
      };
    } catch (error: any) {
      // Red de seguridad: dos altas simultáneas que pasen la validación previa
      if (error.code === '23P01') {
        throw new Error(
          'Conflicto de horario: la franja se superpone con otra ya registrada para este profesional.'
        );
      }
      if (error.code === '23514') {
        throw new Error('Rango horario incoherente: la hora de inicio debe ser menor a la de fin.');
      }
      throw error;
    }
  }
}