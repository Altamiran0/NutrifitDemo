-- Necesaria para combinar "=" (user_id, day_of_week) con "&&" (rangos) en un mismo índice GiST
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tipo rango para horas del día (PostgreSQL no trae uno por defecto)
CREATE TYPE timerange AS RANGE ( subtype = time );

-- Solo días válidos (sin tildes para evitar problemas de codificación)
ALTER TABLE availability_schedules
    ADD CONSTRAINT chk_availability_day_of_week
    CHECK ( day_of_week IN ( 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO' ) );

-- Impide bloques solapados del mismo profesional en el mismo día.
-- El rango es [inicio, fin): 08:00-10:00 y 10:00-12:00 NO se consideran solapados.
ALTER TABLE availability_schedules
    ADD CONSTRAINT excl_availability_no_overlap
    EXCLUDE USING gist (
        user_id WITH =,
        day_of_week WITH =,
        timerange( start_time, end_time ) WITH &&
    );