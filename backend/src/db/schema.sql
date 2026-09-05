-- Esquema de la base de datos de Walk Boundless
-- Basado en la estructura del archivo .db corregido

DROP TABLE IF EXISTS parada_linea;
DROP TABLE IF EXISTS paradas;
DROP TABLE IF EXISTS lineas;
DROP TABLE IF EXISTS calles;

CREATE TABLE calles (
    id_calle SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE lineas (
    id_linea SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE paradas (
    id_parada SERIAL PRIMARY KEY,
    id_calle_principal INTEGER NOT NULL REFERENCES calles(id_calle),
    id_calle_interseccion INTEGER REFERENCES calles(id_calle),
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    descripcion_ubicacion TEXT,
    referencia_accesibilidad TEXT
);

CREATE TABLE parada_linea (
    id_parada INTEGER REFERENCES paradas(id_parada),
    id_linea INTEGER REFERENCES lineas(id_linea),
    PRIMARY KEY (id_parada, id_linea)
);