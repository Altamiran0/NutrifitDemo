import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { RegisterAuthService } from './services/register.auth.service';
import { LoginAuthService } from './services/login.auth.service';
import { pool } from './db';
import { RegisterRequestDTO, UserSessionDTO } from './types/auth.types';

async function promptAdminRegister(
  rl: readline.Interface,
  registerService: RegisterAuthService,
  currentUser: UserSessionDTO
) {
  console.log('\n=== ALTA DE USUARIO (PANEL ADMINISTRADOR) ===');
  console.log('¿Qué rol tendrá el nuevo usuario?');
  console.log('1. CLIENTE');
  console.log('2. NUTRICIONISTA');
  console.log('3. INSTRUCTOR');
  console.log('4. ADMINISTRADOR');
  const roleOption = (await rl.question('Elegí el rol a registrar (1-4): ')).trim();

  if (!['1', '2', '3', '4'].includes(roleOption)) {
    throw new Error('Opción de rol inválida.');
  }

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
  } else {
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
  }

  const res = await registerService.register(currentUser, dto);
  console.log('\n✅', res.message, `(ID: ${res.userId} | Rol: ${res.role})`);
}

async function main() {
  const rl = readline.createInterface({ input, output });
  const registerService = new RegisterAuthService();
  const loginService = new LoginAuthService();
  let currentUser: UserSessionDTO | null = null;
  let running = true;

  try {
    while (running) {
      if (!currentUser) {
        console.log('\n==============================');
        console.log('   BIENVENIDO A NUTRIFIT');
        console.log('==============================');
        console.log('1. Iniciar sesión');
        console.log('0. Salir');
        const opt = (await rl.question('Opción: ')).trim();

        try {
          if (opt === '1') {
            const email = (await rl.question('Email: ')).trim();
            const password = (await rl.question('Contraseña: ')).trim();
            currentUser = await loginService.login({ email, password });
            console.log(
              `\n🔓 Sesión iniciada: ${currentUser.name} ${currentUser.lastname} [${currentUser.role}]`
            );
          } else if (opt === '0') {
            running = false;
          } else {
            console.log('Opción inválida.');
          }
        } catch (err: any) {
          console.error('\n❌', err.message);
        }
      } else {
        console.log(`\n--- MENÚ ${currentUser.role} (${currentUser.email}) ---`);
        if (currentUser.role === 'CLIENTE') {
          console.log('1. Ver mi plan nutricional y rutina (Pendiente)');
        } else if (currentUser.role === 'NUTRICIONISTA') {
          console.log('1. Ver mis clientes asignados (Pendiente)');
        } else if (currentUser.role === 'INSTRUCTOR') {
          console.log('1. Ver mis alumnos asignados (Pendiente)');
        } else if (currentUser.role === 'ADMINISTRADOR') {
          console.log('1. Registrar nuevo usuario (CLIENTE / NUTRICIONISTA / INSTRUCTOR / ADMINISTRADOR)');
        }
        console.log('9. Cerrar sesión');

        const opt = (await rl.question('Opción: ')).trim();

        try {
          if (opt === '9') {
            console.log(`\n🔒 Sesión cerrada (${currentUser.email}).`);
            currentUser = null;
          } else if (opt === '1' && currentUser.role === 'ADMINISTRADOR') {
            await promptAdminRegister(rl, registerService, currentUser);
          } else if (opt === '1') {
            console.log('ℹ️  Funcionalidad en desarrollo para el próximo sprint.');
          } else {
            console.log('Opción inválida.');
          }
        } catch (err: any) {
          console.error('\n❌', err.message);
        }
      }
    }
  } finally {
    rl.close();
    await pool.end();
    console.log('Aplicación finalizada.');
  }
}

main();