DROP TABLE IF EXISTS instructor_activities CASCADE;
DROP TABLE IF EXISTS activities CASCADE;

CREATE TABLE activities (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    days TEXT[] NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    instructor_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

    CHECK (end_time > start_time),
    CHECK (status IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
);