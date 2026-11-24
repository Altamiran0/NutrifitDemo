import { pool } from '../db';
import { LoginRequestDTO, RoleName, UserSessionDTO } from '../types/auth.types';
import { hashPassword } from '../utils/hash';

export class LoginAuthService {
  async login(data: LoginRequestDTO): Promise<UserSessionDTO> {
    const emailNormalized = data.email.toLowerCase().trim();
    const passwordHash = hashPassword(data.password);

    const res = await pool.query<{
      id: number;
      name: string;
      lastname: string;
      email: string;
      password: string;
      is_active: boolean;
      role_name: RoleName;
    }>(
      `SELECT u.id, u.name, u.lastname, u.email, u.password, u.is_active, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [emailNormalized]
    );

    if (res.rows.length === 0) {
      throw new Error('Credenciales inválidas.');
    }

    const user = res.rows[0];

    if (!user.is_active) {
      throw new Error('La cuenta se encuentra inactiva. Contacte al administrador.');
    }

    if (user.password !== passwordHash) {
      throw new Error('Credenciales inválidas.');
    }

    return {
      userId: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role_name,
    };
  }
}