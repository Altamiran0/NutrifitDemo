import { pool } from '../db';
import { AvailabilityDTO, ProfessionalDTO } from '../types/availability.types';
import { RoleName, UserSessionDTO } from '../types/auth.types';
import {
  AVAILABILITY_COLUMNS,
  AvailabilityRow,
  assertAdmin,
  assertIsProfessional,
  mapAvailability,
} from '../utils/availability.validation';

export class ListAvailabilityService {
  async listProfessionals(actor: UserSessionDTO | null): Promise<ProfessionalDTO[]> {
    assertAdmin(actor);

    const res = await pool.query<{
      id: number;
      name: string;
      lastname: string;
      role_name: RoleName;
    }>(
      `SELECT u.id, u.name, u.lastname, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.role_name IN ('NUTRICIONISTA', 'INSTRUCTOR')
         AND u.is_active = TRUE
       ORDER BY u.lastname, u.name`
    );

    return res.rows.map((row) => ({
      userId: row.id,
      name: row.name,
      lastname: row.lastname,
      role: row.role_name,
    }));
  }

  async listByProfessional(
    actor: UserSessionDTO | null,
    userId: number
  ): Promise<AvailabilityDTO[]> {
    assertAdmin(actor);
    await assertIsProfessional(pool, userId);

    const res = await pool.query<AvailabilityRow>(
      `SELECT ${AVAILABILITY_COLUMNS}
       FROM availability_schedules
       WHERE user_id = $1
       ORDER BY array_position(
         ARRAY['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO']::varchar[],
         day_of_week::varchar
       ), start_time`,
      [userId]
    );

    return res.rows.map(mapAvailability);
  }
}