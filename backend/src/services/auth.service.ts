import crypto from 'crypto';
import { pool } from '../db';
import { RegisterRequestDTO, RegisterResponseDTO } from '../types/auth.types';

function hashPassword(plainPassword: string): string {
  return crypto.createHash('sha256').update(plainPassword).digest('hex');
}

export class AuthService {
  async register(data: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    if (!data.email.includes('@')) {
      throw new Error('Formato de email inválido.');
    }
    if (data.password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener el role_id desde la tabla catálogo roles
      const roleRes = await client.query<{ id: number }>(
        'SELECT id FROM roles WHERE role_name = $1',
        [data.role]
      );

      if (roleRes.rows.length === 0) {
        throw new Error(`El rol '${data.role}' no existe en la base de datos.`);
      }
      const roleId = roleRes.rows[0].id;

      // 2. Insertar en tabla users (consultas parametrizadas $1, $2... contra SQL Injection)
      const passwordHash = hashPassword(data.password);
      const userRes = await client.query<{ id: number }>(
        `INSERT INTO users (role_id, name, lastname, dni, phone_number, birthdate, email, password)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          roleId,
          data.name,
          data.lastname,
          data.dni,
          data.phoneNumber,
          data.birthdate,
          data.email.toLowerCase().trim(),
          passwordHash,
        ]
      );
      const newUserId = userRes.rows[0].id;

      // 3. Insertar en la tabla de perfil correspondiente
      if (data.role === 'Cliente') {
        await client.query(
          `INSERT INTO clients (user_id, height_cm, main_goal, medical_conditions)
           VALUES ($1, $2, $3, $4)`,
          [
            newUserId,
            data.heightCm ?? null,
            data.mainGoal ?? null,
            data.medicalConditions ?? null,
          ]
        );
      } else if (data.role === 'Nutricionista') {
        await client.query(
          `INSERT INTO nutritionists (user_id, residential_area, profile_picture_url, professional_title, professional_license)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            newUserId,
            data.residentialArea,
            data.profilePictureUrl ?? null,
            data.professionalTitle,
            data.professionalLicense,
          ]
        );
      } else if (data.role === 'Instructor') {
        await client.query(
          `INSERT INTO instructors (user_id, residential_area, profile_picture_url, training_title, registration_number)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            newUserId,
            data.residentialArea,
            data.profilePictureUrl ?? null,
            data.trainingTitle,
            data.registrationNumber ?? null,
          ]
        );
      }

      await client.query('COMMIT');

      return {
        userId: newUserId,
        email: data.email,
        role: data.role,
        message: 'Usuario registrado correctamente.',
      };
    } catch (error: any) {
      await client.query('ROLLBACK');

      // Código 23505 en PostgreSQL = violación de restricción UNIQUE (email o dni duplicado)
      if (error.code === '23505') {
        throw new Error('El email o DNI ya se encuentra registrado.');
      }
      throw error;
    } finally {
      client.release();
    }
  }
}