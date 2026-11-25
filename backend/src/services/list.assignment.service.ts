import { pool } from '../db';
import type { UserSessionDTO } from '../types/auth.types';
import type { ClientRosterItemDTO, ProfessionalOptionDTO } from '../types/assignment.types';

export class ListAssignmentService {
  private ensureAdmin(currentUser: UserSessionDTO) {
    if (currentUser.role !== 'ADMINISTRADOR') {
      throw new Error('Acceso denegado: solo un ADMINISTRADOR puede gestionar asignaciones.');
    }
  }

  async listClientsRoster(currentUser: UserSessionDTO): Promise<ClientRosterItemDTO[]> {
    this.ensureAdmin(currentUser);

    const query = `
      SELECT
        c.id AS client_id,
        u.id AS user_id,
        u.name,
        u.lastname,
        u.dni,
        u.email,
        c.nutritionist_id,
        CASE
          WHEN nu.id IS NOT NULL THEN nu.name || ' ' || nu.lastname
          ELSE NULL
        END AS nutritionist_name,
        c.instructor_id,
        CASE
          WHEN iu.id IS NOT NULL THEN iu.name || ' ' || iu.lastname
          ELSE NULL
        END AS instructor_name
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      LEFT JOIN nutritionists n ON n.id = c.nutritionist_id
      LEFT JOIN users nu ON nu.id = n.user_id AND nu.is_active = TRUE
      LEFT JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN users iu ON iu.id = i.user_id AND iu.is_active = TRUE
      WHERE u.is_active = TRUE
      ORDER BY u.lastname ASC, u.name ASC;
    `;

    const { rows } = await pool.query(query);

    return rows.map((r) => {
      const hasNutritionist = r.nutritionist_id !== null && r.nutritionist_name !== null;
      const hasInstructor = r.instructor_id !== null && r.instructor_name !== null;

      return {
        clientId: r.client_id,
        userId: r.user_id,
        name: r.name,
        lastname: r.lastname,
        dni: r.dni,
        email: r.email,
        nutritionistId: hasNutritionist ? r.nutritionist_id : null,
        nutritionistName: r.nutritionist_name,
        instructorId: hasInstructor ? r.instructor_id : null,
        instructorName: r.instructor_name,
        status: hasNutritionist && hasInstructor ? 'COMPLETO' : 'PENDIENTE',
      };
    });
  }

  async listActiveNutritionists(currentUser: UserSessionDTO): Promise<ProfessionalOptionDTO[]> {
    this.ensureAdmin(currentUser);

    const query = `
      SELECT
        n.id AS professional_id,
        u.id AS user_id,
        u.name,
        u.lastname,
        n.professional_title AS specialty_or_title
      FROM nutritionists n
      INNER JOIN users u ON u.id = n.user_id
      WHERE u.is_active = TRUE
      ORDER BY u.lastname ASC, u.name ASC;
    `;

    const { rows } = await pool.query(query);
    return rows.map((r) => ({
      professionalId: r.professional_id,
      userId: r.user_id,
      name: r.name,
      lastname: r.lastname,
      specialtyOrTitle: r.specialty_or_title,
    }));
  }

  async listActiveInstructors(currentUser: UserSessionDTO): Promise<ProfessionalOptionDTO[]> {
    this.ensureAdmin(currentUser);

    const query = `
      SELECT
        i.id AS professional_id,
        u.id AS user_id,
        u.name,
        u.lastname,
        i.training_title AS specialty_or_title
      FROM instructors i
      INNER JOIN users u ON u.id = i.user_id
      WHERE u.is_active = TRUE
      ORDER BY u.lastname ASC, u.name ASC;
    `;

    const { rows } = await pool.query(query);
    return rows.map((r) => ({
      professionalId: r.professional_id,
      userId: r.user_id,
      name: r.name,
      lastname: r.lastname,
      specialtyOrTitle: r.specialty_or_title,
    }));
  }

  async listPortfolioByProfessionalUser(
    currentUser: UserSessionDTO
  ): Promise<ClientRosterItemDTO[]> {
    if (currentUser.role !== 'NUTRICIONISTA' && currentUser.role !== 'INSTRUCTOR') {
      throw new Error('Solo un profesional puede consultar su cartera.');
    }

    const filterColumn =
      currentUser.role === 'NUTRICIONISTA' ? 'n.user_id = $1' : 'i.user_id = $1';

    const query = `
      SELECT
        c.id AS client_id,
        u.id AS user_id,
        u.name,
        u.lastname,
        u.dni,
        u.email,
        c.nutritionist_id,
        nu.name || ' ' || nu.lastname AS nutritionist_name,
        c.instructor_id,
        iu.name || ' ' || iu.lastname AS instructor_name
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      LEFT JOIN nutritionists n ON n.id = c.nutritionist_id
      LEFT JOIN users nu ON nu.id = n.user_id
      LEFT JOIN instructors i ON i.id = c.instructor_id
      LEFT JOIN users iu ON iu.id = i.user_id
      WHERE u.is_active = TRUE AND ${filterColumn}
      ORDER BY u.lastname ASC, u.name ASC;
    `;

    const { rows } = await pool.query(query, [currentUser.userId]);
    return rows.map((r) => ({
      clientId: r.client_id,
      userId: r.user_id,
      name: r.name,
      lastname: r.lastname,
      dni: r.dni,
      email: r.email,
      nutritionistId: r.nutritionist_id,
      nutritionistName: r.nutritionist_name,
      instructorId: r.instructor_id,
      instructorName: r.instructor_name,
      status: r.nutritionist_id && r.instructor_id ? 'COMPLETO' : 'PENDIENTE',
    }));
  }
}