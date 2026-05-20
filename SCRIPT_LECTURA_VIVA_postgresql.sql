CREATE TABLE administrador (
    id_admin INTEGER NOT NULL
);

ALTER TABLE administrador ADD CONSTRAINT administrador_pk PRIMARY KEY ( id_admin );

CREATE TABLE books (
    id_book                 INTEGER NOT NULL,
    titulo                  VARCHAR(100) NOT NULL,
    autor                   VARCHAR(70) NOT NULL,
    descripcion             VARCHAR(350),
    fecha_publicacion       DATE,
    idioma                  VARCHAR(50),
    nivel_educacional       VARCHAR(150),
    socio_id_socio          INTEGER,
    genero_id_genero        INTEGER NOT NULL,
    editorial_id_editorial  INTEGER NOT NULL
);

CREATE UNIQUE INDEX books__idx ON
    books (
        editorial_id_editorial
    ASC );

CREATE UNIQUE INDEX books__idxv1 ON
    books (
        genero_id_genero
    ASC );

ALTER TABLE books ADD CONSTRAINT books_pk PRIMARY KEY ( id_book );

CREATE TABLE editorial (
    id_editorial  INTEGER NOT NULL,
    editorial     VARCHAR(150) NOT NULL
);

ALTER TABLE editorial ADD CONSTRAINT editorial_pk PRIMARY KEY ( id_editorial );

CREATE TABLE genero (
    id_genero      INTEGER NOT NULL,
    genero         VARCHAR(150) NOT NULL,
    books_id_book  INTEGER NOT NULL
);

CREATE UNIQUE INDEX genero__idx ON
    genero (
        books_id_book
    ASC );

ALTER TABLE genero ADD CONSTRAINT genero_pk PRIMARY KEY ( id_genero );

CREATE TABLE socio (
    id_socio INTEGER NOT NULL
);

ALTER TABLE socio ADD CONSTRAINT socio_pk PRIMARY KEY ( id_socio );

CREATE TABLE trabajador (
    id_trabajador  INTEGER NOT NULL,
    cargo          VARCHAR(150) NOT NULL,
    sueldo         INTEGER NOT NULL
);

ALTER TABLE trabajador ADD CONSTRAINT trabajador_pk PRIMARY KEY ( id_trabajador );

CREATE TABLE users (
    id                        INTEGER NOT NULL,
    username                  VARCHAR(50) NOT NULL,
    email                     VARCHAR(320) NOT NULL,
    hashed_password           VARCHAR(320) NOT NULL,
    role                      VARCHAR(150) NOT NULL,
    first_name                VARCHAR(100),
    last_name                 VARCHAR(100),
    phone_number              VARCHAR(30),
    address                   VARCHAR(255),
    is_active                 BOOLEAN NOT NULL,
    created_at                TIMESTAMP NOT NULL,
    updated_at                TIMESTAMP NOT NULL,
    socio_id_socio            INTEGER NOT NULL,
    trabajador_id_trabajador  INTEGER NOT NULL,
    administrador_id_admin    INTEGER NOT NULL
);

CREATE UNIQUE INDEX users__idx ON
    users (
        administrador_id_admin
    ASC );

CREATE UNIQUE INDEX users__idxv1 ON
    users (
        socio_id_socio
    ASC );

CREATE UNIQUE INDEX users__idxv2 ON
    users (
        trabajador_id_trabajador
    ASC );

ALTER TABLE users ADD CONSTRAINT users_pk PRIMARY KEY ( id );

ALTER TABLE books
    ADD CONSTRAINT books_editorial_fk FOREIGN KEY ( editorial_id_editorial )
        REFERENCES editorial ( id_editorial );

ALTER TABLE books
    ADD CONSTRAINT books_genero_fk FOREIGN KEY ( genero_id_genero )
        REFERENCES genero ( id_genero );

ALTER TABLE books
    ADD CONSTRAINT books_socio_fk FOREIGN KEY ( socio_id_socio )
        REFERENCES socio ( id_socio );

ALTER TABLE genero
    ADD CONSTRAINT genero_books_fk FOREIGN KEY ( books_id_book )
        REFERENCES books ( id_book );

ALTER TABLE users
    ADD CONSTRAINT users_administrador_fk FOREIGN KEY ( administrador_id_admin )
        REFERENCES administrador ( id_admin );

ALTER TABLE users
    ADD CONSTRAINT users_socio_fk FOREIGN KEY ( socio_id_socio )
        REFERENCES socio ( id_socio );

ALTER TABLE users
    ADD CONSTRAINT users_trabajador_fk FOREIGN KEY ( trabajador_id_trabajador )
        REFERENCES trabajador ( id_trabajador );

