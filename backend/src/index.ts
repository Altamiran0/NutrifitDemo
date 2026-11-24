import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { AuthService } from './services/auth.service';
import { pool } from './db';
import { RegisterRequestDTO } from './types/auth.types';

async function main() {
  const rl = readline.createInterface({ input, output });
  const authService = new AuthService();

  try {
    console.log('\n=== REGISTRO NUTRIFIT ===');
    console.log('1. Cliente');
    console.log('2. Nutricionista');
    console.log('3. Instructor');
    console.log('4. Admin');
    const roleOption = (await rl.question('Elegí una opción (1-4): ')).trim();

    const name = (await rl.question('Nombre: ')).trim();
    const lastname = (await rl.question('Apellido: ')).trim();
    const dni = (await rl.question('DNI: ')).trim();
    const phoneNumber = (await rl.question('Teléfono: ')).trim();
    const birthdate = (await rl.question('Fecha de nacimiento (YYYY-MM-DD): ')).trim();
    const email = (await rl.question('Email: ')).trim();
    const password = (await rl.question('Contraseña (mín. 6 caracteres): ')).trim();

    let dto: RegisterRequestDTO;

    if (roleOption === '1') {
      const heightStr = (await rl.question('Altura en cm (opcional, Enter para omitir): ')).trim();
      const mainGoal = (await rl.question('Objetivo principal (opcional): ')).trim();
      const medicalConditions = (await rl.question('Condiciones médicas (opcional): ')).trim();

      dto = {
        role: 'CLIENTE',
        name,
        lastname,
        dni,
        phoneNumber,
        birthdate,
        email,
        password,
        heightCm: heightStr ? Number(heightStr) : undefined,
        mainGoal: mainGoal || undefined,
        medicalConditions: medicalConditions || undefined,
      };
    } else if (roleOption === '2') {
      const residentialArea = (await rl.question('Zona de atención: ')).trim();
      const professionalTitle = (await rl.question('Título profesional: ')).trim();
      const professionalLicense = (await rl.question('Matrícula profesional: ')).trim();

      dto = {
        role: 'NUTRICIONISTA',
        name,
        lastname,
        dni,
        phoneNumber,
        birthdate,
        email,
        password,
        residentialArea,
        professionalTitle,
        professionalLicense,
      };
    } else if (roleOption === '3') {
      const residentialArea = (await rl.question('Zona de atención: ')).trim();
      const trainingTitle = (await rl.question('Título / Certificación: ')).trim();
      const registrationNumber = (await rl.question('Número de registro (opcional): ')).trim();

      dto = {
        role: 'INSTRUCTOR',
        name,
        lastname,
        dni,
        phoneNumber,
        birthdate,
        email,
        password,
        residentialArea,
        trainingTitle,
        registrationNumber: registrationNumber || undefined,
      };
    } else if (roleOption === '4') {
      dto = {
        role: 'ADMINISTRADOR',
        name,
        lastname,
        dni,
        phoneNumber,
        birthdate,
        email,
        password,
      };
    } else {
      throw new Error('Opción de rol inválida.');
    }

    const res = await authService.register(dto);
    console.log('\n✅', res.message, `(ID asignado: ${res.userId} | Rol: ${res.role})`);
  } catch (err: any) {
    console.error('\n❌ Error:', err.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();