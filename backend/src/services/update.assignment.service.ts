import { pool } from '../db';
import type { UserSessionDTO } from '../types/auth.types';
import type {
  AssignProfessionalsRequestDTO,
  AssignProfessionalsResponseDTO,
} from '../types/assignment.types';
import { ListAssignmentService } from './list.assignment.service';

export class UpdateAssignmentService {
  private listService = new ListAssignmentService();

  async assignOrUpdate(
    currentUser: UserSessionDTO,
    dto: AssignProfessionalsRequestDTO
  ): Promise<AssignProfessionalsResponseDTO> {
    if (currentUser.role !== 'ADMINISTRADOR') {
      throw new Error('Acceso denegado: solo un ADMINISTRADOR puede modificar asignaciones.');
    }

    const clientCheck = await pool.query(
      `SELECT c.id, c.nutritionist_id, c.instructor_id
       FROM clients c
       INNER JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 AND u.is_active = TRUE`,
      [dto.clientId]
    );

    if (clientCheck.rowCount === 0) {
      throw new Error('El cliente seleccionado no existe o está inactivo.');
    }

    const current = clientCheck.rows[0];

    const nextNutritionistId =
      dto.nutritionistId === undefined ? current.nutritionist_id : dto.nutritionistId;
    const nextInstructorId =
      dto.instructorId === undefined ? current.instructor_id : dto.instructorId;

    if (nextNutritionistId !== null) {
      const nutCheck = await pool.query(
        `SELECT n.id
         FROM nutritionists n
         INNER JOIN users u ON u.id = n.user_id
         WHERE n.id = $1 AND u.is_active = TRUE`,
        [nextNutritionistId]
      );
      if (nutCheck.rowCount === 0) {
        throw new Error('El nutricionista seleccionado no existe o está inactivo.');
      }
    }

    if (nextInstructorId !== null) {
      const instCheck = await pool.query(
        `SELECT i.id
         FROM instructors i
         INNER JOIN users u ON u.id = i.user_id
         WHERE i.id = $1 AND u.is_active = TRUE`,
        [nextInstructorId]
      );
      if (instCheck.rowCount === 0) {
        throw new Error('El instructor seleccionado no existe o está inactivo.');
      }
    }

    await pool.query(
      `UPDATE clients
       SET nutritionist_id = $1,
           instructor_id = $2
       WHERE id = $3`,
      [nextNutritionistId, nextInstructorId, dto.clientId]
    );

    const roster = await this.listService.listClientsRoster(currentUser);
    const updatedClient = roster.find((c) => c.clientId === dto.clientId)!;

    return {
      message: 'Asignación profesional actualizada correctamente.',
      client: updatedClient,
    };
  }
}