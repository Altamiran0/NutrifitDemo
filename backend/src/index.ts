import { AuthService } from './services/auth.service';
import { pool } from './db';

async function main() {
  const authService = new AuthService();

  try {
    const res = await authService.register({
      role: 'Cliente',
      name: 'Agustín',
      lastname: 'Altamirano',
      dni: '44123456',
      phoneNumber: '1155554444',
      birthdate: '2002-04-23',
      email: 'agustin.cliente@nutrifit.com',
      password: 'password123',
      heightCm: 175,
      mainGoal: 'Hipertrofia',
    });

    console.log('Resultado:', res);
  } catch (err: any) {
    console.error('Error en registro:', err.message);
  } finally {
    await pool.end();
  }
}

main();