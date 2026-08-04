// ==========================================================================
// SCRIPT DE SEED — utils/seed.js
// Responsable: Adonis Pastrana (SW-8)
//
// Migra los datos de public/js/data-store.js a las siete colecciones de
// MongoDB. Los datos de prueba son los mismos de la Fase 1 para garantizar
// que el frontend migrado vea exactamente lo que ya tenía.
//
// Uso (una sola vez, con .env configurado):
//   node utils/seed.js
//
// El script limpia cada colección antes de insertar, de modo que se puede
// correr varias veces sin duplicar datos. Las contraseñas se cifran con
// bcrypt antes de persistirse (RF-31).
//
// Dependencias: dotenv, mongodb, bcryptjs
// ==========================================================================

'use strict';

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const URI      = process.env.MONGODB_URI;
const DB_NAME  = process.env.DB_NAME  || 'softwars_eventos';
const ROUNDS   = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

if (!URI) {
    console.error('[seed] ERROR: MONGODB_URI no está definida en .env');
    process.exit(1);
}

// --------------------------------------------------------------------------
// Datos base — extraídos de public/js/data-store.js (Fase 1)
// Las contraseñas en texto plano se cifrarán con bcrypt antes de insertar.
// --------------------------------------------------------------------------

const CONTRASENAS = {
    'ccarballov@ucenfotec.ac.cr': 'Crbl#2026x',
    'kgamboas@ucenfotec.ac.cr':   'Knnr$2026z',
    'apastranb@ucenfotec.ac.cr':  'Dnsp%2026w',
    'jarroyor@ucenfotec.ac.cr':   'Jsrr&2026v'
};

const USUARIOS_BASE = [
    { codigo: 'U-001', nombre: 'Carlos Carballo', email: 'ccarballov@ucenfotec.ac.cr', rol: 'Administrador',       estado: 'Activo', fechaCreacion: new Date('2026-07-02') },
    { codigo: 'U-002', nombre: 'Kenner Gamboa',   email: 'kgamboas@ucenfotec.ac.cr',   rol: 'Administrador',       estado: 'Activo', fechaCreacion: new Date('2026-07-02') },
    { codigo: 'U-003', nombre: 'Adonis Pastrana', email: 'apastranb@ucenfotec.ac.cr',  rol: 'Super Administrador', estado: 'Activo', fechaCreacion: new Date('2026-07-02') },
    { codigo: 'U-004', nombre: 'Josué Arroyo',    email: 'jarroyor@ucenfotec.ac.cr',   rol: 'Administrador',       estado: 'Activo', fechaCreacion: new Date('2026-07-02') }
];

// Mapa de codigo legible → ObjectId generado localmente para construir referencias
const IDS = {
    'EV-001': new ObjectId(), 'EV-002': new ObjectId(), 'EV-003': new ObjectId(),
    'EV-004': new ObjectId(), 'EV-005': new ObjectId(),
    'ACT-001': new ObjectId(), 'ACT-002': new ObjectId(), 'ACT-003': new ObjectId(),
    'ACT-004': new ObjectId(), 'ACT-005': new ObjectId(),
    'OR-001': new ObjectId(), 'OR-002': new ObjectId(), 'OR-003': new ObjectId(),
    'OR-004': new ObjectId(), 'OR-005': new ObjectId()
};

const AHORA = new Date();

// --------------------------------------------------------------------------
// Eventos
// --------------------------------------------------------------------------
const EVENTOS = [
    {
        _id: IDS['EV-001'], codigo: 'EV-001',
        nombre: 'Seminario de Inteligencia Artificial', categoria: 'Tecnológicas',
        descripcion: 'Evento académico sobre las últimas tendencias en IA, modelos fundacionales y ética tecnológica.',
        fechaInicio: '2026-11-15', fechaFin: '2026-11-16',
        horaInicio: '08:00', horaFin: '17:00',
        enUniversidad: true, lugar: 'Auditorio',
        cupoMax: 150, cupoActual: 62, responsable: 'María Gómez',
        tipoEntrada: 'libre', entradaLibre: true, visibilidad: 'publico',
        estado: 'Disponible', imagen: '',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['EV-002'], codigo: 'EV-002',
        nombre: 'Torneo Deportivo Interuniversitario', categoria: 'Deportivas',
        descripcion: 'Competencia deportiva entre universidades con disciplinas de fútbol, básquetbol y atletismo.',
        fechaInicio: '2026-11-20', fechaFin: '2026-11-22',
        horaInicio: '09:00', horaFin: '18:00',
        enUniversidad: false, lugar: 'Cancha Principal',
        cupoMax: 300, cupoActual: 120, responsable: 'Juan Pérez',
        tipoEntrada: 'libre', entradaLibre: true, visibilidad: 'publico',
        estado: 'Disponible', imagen: '',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['EV-003'], codigo: 'EV-003',
        nombre: 'Expo CENFOTEC 2026', categoria: 'Tecnológicas',
        descripcion: 'Feria de proyectos estudiantiles con demostraciones de software, hardware y diseño.',
        fechaInicio: '2026-12-05', fechaFin: '2026-12-06',
        horaInicio: '10:00', horaFin: '16:00',
        enUniversidad: true, lugar: 'Auditorio',
        cupoMax: 500, cupoActual: 0, responsable: 'Ana Rodríguez',
        tipoEntrada: 'libre', entradaLibre: true, visibilidad: 'publico',
        estado: 'Disponible', imagen: '',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['EV-004'], codigo: 'EV-004',
        nombre: 'Taller de Ciberseguridad Avanzada', categoria: 'Tecnológicas',
        descripcion: 'Taller interno para estudiantes sobre pentesting, defensa y respuesta a incidentes.',
        fechaInicio: '2026-10-10', fechaFin: '2026-10-10',
        horaInicio: '14:00', horaFin: '18:00',
        enUniversidad: true, lugar: 'Laboratorio 5',
        cupoMax: 30, cupoActual: 30, responsable: 'Carlos Mora',
        tipoEntrada: 'pago', entradaLibre: false, visibilidad: 'privado',
        estado: 'Llena', imagen: '',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['EV-005'], codigo: 'EV-005',
        nombre: 'Festival Cultural CENFOTEC', categoria: 'Culturales',
        descripcion: 'Actividades culturales incluyendo música, arte y gastronomía para la comunidad universitaria.',
        fechaInicio: '2026-09-15', fechaFin: '2026-09-15',
        horaInicio: '11:00', horaFin: '20:00',
        enUniversidad: true, lugar: 'Auditorio',
        cupoMax: 200, cupoActual: 180, responsable: 'Luis Vargas',
        tipoEntrada: 'libre', entradaLibre: true, visibilidad: 'publico',
        estado: 'Finalizada', imagen: '',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    }
];

// --------------------------------------------------------------------------
// Actividades
// --------------------------------------------------------------------------
const ACTIVIDADES = [
    {
        _id: IDS['ACT-001'], codigo: 'ACT-001',
        eventoId: IDS['EV-001'],
        nombre: 'Taller: Prompt Engineering Avanzado', categoria: 'Tecnológicas',
        descripcion: 'Técnicas de diseño de prompts para modelos generativos.',
        fecha: '2026-11-15', horaInicio: '14:00', horaFin: '16:00',
        lugar: 'Auditorio', cupoMaximo: 40, cupoOcupado: 12,
        responsableId: IDS['OR-001'], estado: 'Disponible', visibilidad: 'publica',
        entradaLibre: false, incluyeRefrigerio: true,
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['ACT-002'], codigo: 'ACT-002',
        eventoId: IDS['EV-001'],
        nombre: 'Panel: Ética en IA', categoria: 'Tecnológicas',
        descripcion: 'Discusión sobre sesgos algorítmicos y regulación de la IA.',
        fecha: '2026-11-16', horaInicio: '10:00', horaFin: '12:00',
        lugar: 'Laboratorio 1', cupoMaximo: 60, cupoOcupado: 60,
        responsableId: IDS['OR-002'], estado: 'Llena', visibilidad: 'publica',
        entradaLibre: false, incluyeRefrigerio: false,
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['ACT-003'], codigo: 'ACT-003',
        eventoId: IDS['EV-001'],
        nombre: 'Feria de Stands Tecnológicos', categoria: 'Tecnológicas',
        descripcion: 'Espacio abierto para recorrer los stands de empresas y proyectos.',
        fecha: '2026-11-16', horaInicio: '09:00', horaFin: '17:00',
        lugar: 'Auditorio', cupoMaximo: 0, cupoOcupado: 0,
        responsableId: IDS['OR-003'], estado: 'Disponible', visibilidad: 'publica',
        entradaLibre: true, incluyeRefrigerio: true,
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['ACT-004'], codigo: 'ACT-004',
        eventoId: IDS['EV-002'],
        nombre: 'Partido de Fútbol Inaugural', categoria: 'Deportivas',
        descripcion: 'Partido inaugural entre CENFOTEC y Universidad Latina.',
        fecha: '2026-11-20', horaInicio: '15:00', horaFin: '17:00',
        lugar: 'Cancha Principal', cupoMaximo: 200, cupoOcupado: 50,
        responsableId: IDS['OR-004'], estado: 'Disponible', visibilidad: 'publica',
        entradaLibre: false, incluyeRefrigerio: false,
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['ACT-005'], codigo: 'ACT-005',
        eventoId: IDS['EV-003'],
        nombre: 'Charla: Cloud Computing en Costa Rica', categoria: 'Tecnológicas',
        descripcion: 'Panorama actual y oportunidades laborales en la nube.',
        fecha: '2026-12-05', horaInicio: '11:00', horaFin: '12:30',
        lugar: 'Laboratorio 3', cupoMaximo: 35, cupoOcupado: 10,
        responsableId: IDS['OR-005'], estado: 'Disponible', visibilidad: 'publica',
        entradaLibre: false, incluyeRefrigerio: true,
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    }
];

// --------------------------------------------------------------------------
// Oradores
// --------------------------------------------------------------------------
const ORADORES = [
    {
        _id: IDS['OR-001'], codigo: 'OR-001',
        nombre: 'Ana Rodríguez', correo: 'ana.rodriguez@techcorp.cr',
        telefonos: ['8888-0001'], especialidad: 'Ingeniería de Software',
        empresa: 'Tech Corp',
        biografia: 'Especialista en arquitectura de software con 10 años de experiencia.',
        foto: null, eventoId: IDS['EV-001'], estado: 'Activo',
        fechaRegistro: new Date('2026-06-01'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['OR-002'], codigo: 'OR-002',
        nombre: 'Carlos Mora', correo: 'carlos.mora@aisolutions.cr',
        telefonos: ['8888-0002'], especialidad: 'Inteligencia Artificial',
        empresa: 'AI Solutions',
        biografia: 'Investigador en modelos de aprendizaje profundo y NLP.',
        foto: null, eventoId: IDS['EV-001'], estado: 'Activo',
        fechaRegistro: new Date('2026-06-05'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['OR-003'], codigo: 'OR-003',
        nombre: 'María López', correo: 'maria.lopez@securenet.cr',
        telefonos: ['8888-0003'], especialidad: 'Ciberseguridad',
        empresa: 'SecureNet',
        biografia: 'Experta en seguridad ofensiva y defensa de infraestructuras.',
        foto: null, eventoId: IDS['EV-001'], estado: 'Activo',
        fechaRegistro: new Date('2026-06-10'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['OR-004'], codigo: 'OR-004',
        nombre: 'Roberto Jiménez', correo: 'roberto.jimenez@deportecr.cr',
        telefonos: ['8888-0004'], especialidad: 'Educación Física',
        empresa: 'CENFOTEC',
        biografia: 'Coordinador de actividades deportivas interuniversitarias.',
        foto: null, eventoId: IDS['EV-002'], estado: 'Activo',
        fechaRegistro: new Date('2026-06-15'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        _id: IDS['OR-005'], codigo: 'OR-005',
        nombre: 'Laura Vindas', correo: 'laura.vindas@cloudcr.cr',
        telefonos: ['8888-0005'], especialidad: 'Cloud Computing',
        empresa: 'CloudSystems CR',
        biografia: 'Arquitecta de soluciones cloud con certificación AWS y Azure.',
        foto: null, eventoId: IDS['EV-003'], estado: 'Inactivo',
        fechaRegistro: new Date('2026-06-20'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    }
];

// --------------------------------------------------------------------------
// Stands — RF-15: número anual (reinicia cada año)
// --------------------------------------------------------------------------
const ANIO = 2026;
const STANDS = [
    {
        codigo: 'S-2026-001', numero: 1, anio: ANIO,
        eventoId: IDS['EV-001'], nombre: 'Tech Corp', categoria: 'empresa',
        descripcion: 'Soluciones empresariales de software.',
        encargado: 'Juan Pérez', empresa: 'Tech Corp',
        correo: 'juan@techcorp.cr', telefono: '8888-1001',
        estado: 'Aprobado',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'S-2026-002', numero: 2, anio: ANIO,
        eventoId: IDS['EV-001'], nombre: 'AI Solutions', categoria: 'empresa',
        descripcion: 'Inteligencia artificial aplicada a negocios.',
        encargado: 'Carlos Mora', empresa: 'AI Solutions',
        correo: 'carlos@aisol.cr', telefono: '8888-1002',
        estado: 'Aprobado',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'S-2026-003', numero: 3, anio: ANIO,
        eventoId: IDS['EV-001'], nombre: 'SecureNet', categoria: 'empresa',
        descripcion: 'Consultoría en ciberseguridad empresarial.',
        encargado: 'María López', empresa: 'SecureNet',
        correo: 'maria@securenet.cr', telefono: '8888-1003',
        estado: 'Aprobado',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'S-2026-004', numero: 4, anio: ANIO,
        eventoId: IDS['EV-003'], nombre: 'Proyecto Estudiantil IoT', categoria: 'personal',
        descripcion: 'Demostración de dispositivos IoT conectados.',
        encargado: 'Pedro Ramírez', empresa: 'CENFOTEC',
        correo: 'pedro@estudiante.cr', telefono: '8888-1004',
        estado: 'Aprobado',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'S-2026-005', numero: 5, anio: ANIO,
        eventoId: IDS['EV-003'], nombre: 'CloudSystems CR', categoria: 'empresa',
        descripcion: 'Infraestructura en la nube para startups.',
        encargado: 'Laura Vindas', empresa: 'CloudSystems CR',
        correo: 'laura@cloudcr.cr', telefono: '8888-1005',
        estado: 'Cerrado',
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    }
];

// --------------------------------------------------------------------------
// Participantes — las actividades se referencian como ObjectId
// --------------------------------------------------------------------------
const PARTICIPANTES = [
    {
        codigo: 'P-001', idDocumento: '111110001',
        nombreCompleto: 'Ana Solano', correo: 'ana.solano@estudiante.cr',
        telefono: '8811-2233', edad: 21, carrera: 'Ingeniería en Sistemas',
        actividades: [IDS['ACT-001']], estado: 'Activo', metodoPago: 'exento',
        fechaInscripcion: new Date('2026-06-20'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'P-002', idDocumento: '222220002',
        nombreCompleto: 'Luis Fernández', correo: 'luis.fernandez@estudiante.cr',
        telefono: '8722-4455', edad: 24, carrera: 'Administración de Empresas',
        actividades: [IDS['ACT-004']], estado: 'Activo', metodoPago: 'exento',
        fechaInscripcion: new Date('2026-06-22'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'P-003', idDocumento: '333330003',
        nombreCompleto: 'Sofía Castillo', correo: 'sofia.castillo@estudiante.cr',
        telefono: '8633-7788', edad: 22, carrera: 'Ingeniería de Software',
        actividades: [IDS['ACT-001'], IDS['ACT-002']], estado: 'Activo', metodoPago: 'exento',
        fechaInscripcion: new Date('2026-07-01'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'P-004', idDocumento: '444440004',
        nombreCompleto: 'Diego Vargas', correo: 'diego.vargas@profesional.cr',
        telefono: '8544-9900', edad: 30, carrera: 'Ciencias de la Computación',
        actividades: [IDS['ACT-005']], estado: 'Activo', metodoPago: 'exento',
        fechaInscripcion: new Date('2026-07-03'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    },
    {
        codigo: 'P-005', idDocumento: '555550005',
        nombreCompleto: 'Valeria Rojas', correo: 'valeria.rojas@estudiante.cr',
        telefono: '8455-1122', edad: 19, carrera: 'Diseño Digital',
        actividades: [IDS['ACT-003']], estado: 'Cancelado', metodoPago: 'exento',
        fechaInscripcion: new Date('2026-06-25'),
        createdAt: AHORA, updatedAt: AHORA, createdBy: null
    }
];

// --------------------------------------------------------------------------
// Función principal
// --------------------------------------------------------------------------
async function seedDB() {
    const cliente = new MongoClient(URI);

    try {
        await cliente.connect();
        console.log(`[seed] Conectado a MongoDB — base de datos "${DB_NAME}"`);
        const db = cliente.db(DB_NAME);

        // ── Usuarios: cifrar contraseñas antes de insertar ─────────────
        console.log('[seed] Cifrando contraseñas...');
        const usuariosConHash = await Promise.all(
            USUARIOS_BASE.map(async (u) => {
                const plain = CONTRASENAS[u.email];
                const passwordHash = await bcrypt.hash(plain, ROUNDS);
                return {
                    ...u,
                    passwordHash,
                    ultimoAcceso: null,
                    createdAt: AHORA,
                    updatedAt: AHORA,
                    createdBy: null
                };
            })
        );

        // ── Limpiar colecciones (orden inverso a dependencias) ─────────
        console.log('[seed] Limpiando colecciones existentes...');
        const colecciones = [
            'postulaciones', 'participantes', 'stands',
            'oradores', 'actividades', 'eventos', 'usuarios', 'contadores'
        ];
        for (const nombre of colecciones) {
            await db.collection(nombre).deleteMany({});
        }

        // ── Insertar datos ─────────────────────────────────────────────
        console.log('[seed] Insertando usuarios...');
        await db.collection('usuarios').insertMany(usuariosConHash);

        console.log('[seed] Insertando eventos...');
        await db.collection('eventos').insertMany(EVENTOS);

        console.log('[seed] Insertando oradores...');
        await db.collection('oradores').insertMany(ORADORES);

        console.log('[seed] Insertando actividades...');
        await db.collection('actividades').insertMany(ACTIVIDADES);

        console.log('[seed] Insertando stands...');
        await db.collection('stands').insertMany(STANDS);

        console.log('[seed] Insertando participantes...');
        await db.collection('participantes').insertMany(PARTICIPANTES);

        // postulaciones vacías — no hay datos en data-store.js
        console.log('[seed] Colección postulaciones lista (vacía).');

        // ── Sembrar contadores para que siguienteCodigo() arranque bien ─
        console.log('[seed] Inicializando contadores de secuencia...');
        await db.collection('contadores').insertMany([
            { _id: 'usuarios',     valor: USUARIOS_BASE.length },
            { _id: 'eventos',      valor: EVENTOS.length },
            { _id: 'oradores',     valor: ORADORES.length },
            { _id: 'actividades',  valor: ACTIVIDADES.length },
            { _id: 'stands',       valor: STANDS.length },
            { _id: 'participantes', valor: PARTICIPANTES.length },
            { _id: 'postulaciones', valor: 0 },
            { _id: `stands-${ANIO}`, valor: STANDS.length }
        ]);

        console.log('[seed] ✓ Seed completado. Documentos insertados:');
        console.log(`       usuarios=${usuariosConHash.length}  eventos=${EVENTOS.length}  oradores=${ORADORES.length}`);
        console.log(`       actividades=${ACTIVIDADES.length}  stands=${STANDS.length}  participantes=${PARTICIPANTES.length}`);

    } catch (err) {
        console.error('[seed] ERROR:', err.message);
        process.exit(1);
    } finally {
        await cliente.close();
    }
}

seedDB();
