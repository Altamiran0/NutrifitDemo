# NutrifitDemo
Url: https://altamiran0.github.io/NutrifitDemo/

# Nutri Fit - Entorno Local

## Requisitos previos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* [PostgreSQL 19](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)

## Instalación y puesta en marcha

* Configurar variables de entorno:
Copiá el archivo de ejemplo y completá las contraseñas locales en .env:
```Bash
cp .env.example .env
```

* Levantar la base de datos (PostgreSQL):
```Bash
docker compose -f docker/docker-compose.yml --env-file .env up -d
```

* Conexión desde pgAdmin

Una vez levantado el contenedor de Docker, podés conectarte visualmente siguiendo estos pasos:

1. Abrir **pgAdmin**.
2. En el panel izquierdo (*Object Explorer*), hacer clic derecho sobre **Servers** -> **Register** -> **Server...**
3. En la pestaña **General**:
   * **Name:** `NutriFit_Local` (o cualquier nombre identificatorio).
4. En la pestaña **Connection**:
   * **Host name/address:** `localhost`
   * **Port:** `5432` *(o el puerto externo configurado en `DB_PORT` dentro de tu `.env`)*.
   * **Maintenance database:** `<VALOR_DE_POSTGRES_DB>` (ej. `nutrifit_db`).
   * **Username:** `<VALOR_DE_POSTGRES_USER>` (ej. `postgres`).
   * **Password:** `<VALOR_DE_POSTGRES_PASSWORD>` *(tildar **Save password** para no ingresarla en cada sesión)*.
5. Hacer clic en **Save**.

### Ver tablas y ejecutar consultas
* En el árbol de la izquierda, desplegar: `NutriFit Local` -> `Databases` -> `<POSTGRES_DB>` -> `Schemas` -> `public` -> `Tables`.
* Para abrir una consola SQL, seleccionar la base de datos y hacer clic en el ícono **Query Tool** (arriba a la izquierda en el panel de navegación).

* Usuarios de prueba

Al iniciar la aplicación por consola (`npm run start`), el sistema carga automáticamente cuatro usuarios precargados para facilitar las pruebas de todos los roles.

**Contraseña para todos los usuarios:** `123123`

| Rol | Email | Nombre | Datos adicionales |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@test.com` | Admin Sistema | DNI: `10000001` |
| **Nutricionista** | `nutricionista@test.com` | Laura Gómez | Matrícula: `MN-12345` |
| **Instructor** | `instructor@test.com` | Carlos Pérez | Registro: `MAT-98765` |
| **Cliente** | `cliente@test.com` | Martín López | Asignado a Laura Gómez y Carlos Pérez |