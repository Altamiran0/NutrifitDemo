import { Pool } from 'pg';
// Si usas bcrypt o similar para hashear contraseñas en tu servicio de registro, impórtalo aquí:
// import bcrypt from 'bcrypt';

export async function seedTestUsers(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Si en tu login validas con bcrypt, descomenta la siguiente línea y usa `hashedPassword` en los inserts:
    // const hashedPassword = await bcrypt.hash('123456', 10);
    const defaultPassword = 'password123';

    // 1. ADMINISTRADOR
    await client.query(
      `
      INSERT INTO users (role_id, name, lastname, dni, phone_number, birthdate, email, password, is_active)
      VALUES (
        (SELECT id FROM roles WHERE role_name = 'ADMINISTRADOR'),
        'Admin', 'Sistema', '10000001', '1140000001', '1985-01-15', 'admin@test.com', $1, TRUE
      )
      ON CONFLICT (dni) DO NOTHING;
      `,
      [defaultPassword]
    );

    // 2. NUTRICIONISTA
    const nutriUserRes = await client.query<{ id: number }>(
      `
      INSERT INTO users (role_id, name, lastname, dni, phone_number, birthdate, email, password, is_active)
      VALUES (
        (SELECT id FROM roles WHERE role_name = 'NUTRICIONISTA'),
        'Laura', 'Gómez', '20000002', '1140000002', '1990-05-20', 'nutricionista@test.com', $1, TRUE
      )
      ON CONFLICT (dni) DO NOTHING
      RETURNING id;
      `,
      [defaultPassword]
    );

    if (nutriUserRes.rows.length > 0) {
      await client.query(
        `
        INSERT INTO nutritionists (user_id, residential_area, professional_title, professional_license)
        VALUES ($1, 'Palermo, CABA', 'Licenciada en Nutrición', 'MN-12345')
        ON CONFLICT (user_id) DO NOTHING;
        `,
        [nutriUserRes.rows[0].id]
      );
    }

    // 3. INSTRUCTOR
    const instUserRes = await client.query<{ id: number }>(
      `
      INSERT INTO users (role_id, name, lastname, dni, phone_number, birthdate, email, password, is_active)
      VALUES (
        (SELECT id FROM roles WHERE role_name = 'INSTRUCTOR'),
        'Carlos', 'Pérez', '30000003', '1140000003', '1992-08-10', 'instructor@test.com', $1, TRUE
      )
      ON CONFLICT (dni) DO NOTHING
      RETURNING id;
      `,
      [defaultPassword]
    );

    if (instUserRes.rows.length > 0) {
      await client.query(
        `
        INSERT INTO instructors (user_id, residential_area, training_title, registration_number)
        VALUES ($1, 'Belgrano, CABA', 'Profesor Nacional de Educación Física', 'MAT-98765')
        ON CONFLICT (user_id) DO NOTHING;
        `,
        [instUserRes.rows[0].id]
      );
    }

    // 4. CLIENTE
    const clientUserRes = await client.query<{ id: number }>(
      `
      INSERT INTO users (role_id, name, lastname, dni, phone_number, birthdate, email, password, is_active)
      VALUES (
        (SELECT id FROM roles WHERE role_name = 'CLIENTE'),
        'Martín', 'López', '40000004', '1140000004', '1998-11-30', 'cliente@test.com', $1, TRUE
      )
      ON CONFLICT (dni) DO NOTHING
      RETURNING id;
      `,
      [defaultPassword]
    );

    if (clientUserRes.rows.length > 0) {
      await client.query(
        `
        INSERT INTO clients (user_id, height_cm, main_goal, medical_conditions, nutritionist_id, instructor_id)
        VALUES (
          $1,
          178,
          'Hipertrofia y mejora de resistencia',
          'Ninguna',
          (SELECT id FROM nutritionists WHERE professional_license = 'MN-12345' LIMIT 1),
          (SELECT id FROM instructors WHERE registration_number = 'MAT-98765' LIMIT 1)
        )
        ON CONFLICT (user_id) DO NOTHING;
        `,
        [clientUserRes.rows[0].id]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al inicializar los usuarios de prueba:', error);
    throw error;
  } finally {
    client.release();
  }
}