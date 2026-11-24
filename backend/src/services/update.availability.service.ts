import { pool } from '../db';
import {
  AvailabilityResponseDTO,
  UpdateAvailabilityDTO,
} from '../types/availability.types';
import { UserSessionDTO } from '../types/auth.types';
import {
  AVAILABILITY_COLUMNS,
  AvailabilityRow,
  assertAdmin,
  assertNoOverlap,
  mapAvailability,
  normalizeDay,
  normalizeTime,
  validateTimeRange,
} from '../utils/availability.validation';

export class UpdateAvailabilityService {
  async update(
    actor: UserSessionDTO | null,
    data: UpdateAvailabilityDTO
  ): Promise<AvailabilityResponseDTO> {
    assertAdmin(actor);

    const currentRes = await pool.query<AvailabilityRow>(
      `SELECT ${AVAILABILITY_COLUMNS}
       FROM availability_schedules
       WHERE id = $1`,
      [data.availabilityId]
    );

    if (currentRes.rows.length === 0) {
      throw new Error('La franja horaria indicada no existe.');
    }
    const current = mapAvailability(currentRes.rows[0]);

    // Los campos no enviados conservan su valor actual
    const dayOfWeek =
      data.dayOfWeek !== undefined ? normalizeDay(data.dayOfWeek) : current.dayOfWeek;
    const startTime =
      data.startTime !== undefined
        ? normalizeTime(data.startTime, 'hora de inicio')
        : current.startTime;
    const endTime =
      data.endTime !== undefined
        ? normalizeTime(data.endTime, 'hora de fin')
        : current.endTime;

    validateTimeRange(startTime, endTime);
    await assertNoOverlap(
      pool,
      current.userId,
      dayOfWeek,
      startTime,
      endTime,
      current.id // excluye el propio bloque
    );

    try {
      const res = await pool.query<AvailabilityRow>(
        `UPDATE availability_schedules
         SET day_of_week = $1, start_time = $2, end_time = $3
         WHERE id = $4
         RETURNING ${AVAILABILITY_COLUMNS}`,
        [dayOfWeek, startTime, endTime, current.id]
      );

      return {
        availability: mapAvailability(res.rows[0]),
        message: 'Franja horaria actualizada correctamente.',
      };
    } catch (error: any) {
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