// Carga inicial de datos — Responsable: Adonis Pastrana (SW-8)
// Uso: node utils/seed.js


require('dotenv').config();
const bcrypt = require('bcrypt');
const { conectarDB, getDB } = require('../config/db');

const importarDatos = async () => {
  try {
    await conectarDB();
    const db = getDB();
    console.log('🔌 Conectado a MongoDB Atlas (Driver Nativo)...');

    // Limpiar las 7 colecciones
    const colecciones = ['usuarios', 'eventos', 'actividades', 'oradores', 'stands', 'participantes', 'postulaciones'];
    for (const col of colecciones) {
      await db.collection(col).deleteMany({});
    }
    console.log('Colecciones limpiadas.');

    const passwordHash = await bcrypt.hash('password123', 10);
    const fechaActual = new Date();

    // 1. USUARIOS
    const resUsuarios = await db.collection('usuarios').insertMany([
      { codigo: 'USR-001', nombre: 'Adonis Pastran', email: 'admin@softwars.com', passwordHash, rol: 'Administrador', estado: 'Activo', fechaCreacion: fechaActual },
      { codigo: 'USR-002', nombre: 'Carlos Carvallo', email: 'carlos@softwars.com', passwordHash, rol: 'Organizador', estado: 'Activo', fechaCreacion: fechaActual },
      { codigo: 'USR-003', nombre: 'Josué Arroyo', email: 'josue@softwars.com', passwordHash, rol: 'Asistente', estado: 'Activo', fechaCreacion: fechaActual },
      { codigo: 'USR-004', nombre: 'kener Gamboa', email: 'kener@softwars.com', passwordHash, rol: 'Organizador', estado: 'Activo', fechaCreacion: fechaActual },
      { codigo: 'USR-005', nombre: 'Ana Martínez', email: 'ana@softwars.com', passwordHash, rol: 'Asistente', estado: 'Inactivo', fechaCreacion: fechaActual }
    ]);

    // 2. EVENTOS
    const resEventos = await db.collection('eventos').insertMany([
      {
        codigo: 'EV-001',
        nombre: 'Tech Conference 2026',
        categoria: 'Tecnológicas',
        descripcion: 'Congreso Anual de Desarrollo de Software',
        fechaInicio: new Date('2026-09-15'),
        fechaFin: new Date('2026-09-17'),
        horaInicio: '08:00',
        horaFin: '17:00',
        enUniversidad: true,
        lugar: 'Auditorio Principal',
        cupoMax: 200,
        cupoActual: 0,
        responsable: 'Adonis Pastran',
        tipoEntrada: 'libre',
        visibilidad: 'publico',
        estado: 'Disponible',
        imagen: 'default.png',
        fechaCreacion: fechaActual
      },
      {
        codigo: 'EV-002',
        nombre: 'Hackathon Software 2026',
        categoria: 'Tecnológicas',
        descripcion: 'Competencia intensiva de desarrollo',
        fechaInicio: new Date('2026-10-10'),
        fechaFin: new Date('2026-10-12'),
        horaInicio: '09:00',
        horaFin: '18:00',
        enUniversidad: true,
        lugar: 'Laboratorio Central',
        cupoMax: 100,
        cupoActual: 0,
        responsable: 'Carlos Gómez',
        tipoEntrada: 'libre',
        visibilidad: 'publico',
        estado: 'Disponible',
        imagen: 'hack.png',
        fechaCreacion: fechaActual
      }
    ]);

    const eventoId = resEventos.insertedIds[0];
    const usuarioId = resUsuarios.insertedIds[0];

    // 3. ORADORES
    const resOradores = await db.collection('oradores').insertMany([
      { codigo: 'ORD-001', nombre: 'Josué Pérez', correo: 'josue.orador@softwars.com', biografia: 'Especialista Cloud', especialidad: 'Backend', estado: 'Activo' },
      { codigo: 'ORD-002', nombre: 'Laura Sánchez', correo: 'laura@softwars.com', biografia: 'UX Designer', especialidad: 'Frontend', estado: 'Activo' }
    ]);

    // 4. ACTIVIDADES
    await db.collection('actividades').insertMany([
      { eventoId, oradorId: resOradores.insertedIds[0], titulo: 'Arquitectura Backend', descripcion: 'Node.js y bases de datos', horaInicio: '10:00', horaFin: '12:00', estado: 'Activo' },
      { eventoId, oradorId: resOradores.insertedIds[1], titulo: 'Diseño UI/UX', descripcion: 'Interfaces modernas', horaInicio: '14:00', horaFin: '16:00', estado: 'Activo' }
    ]);

    // 5. STANDS
    await db.collection('stands').insertMany([
      { numero: 1, anio: 2026, empresa: 'SoftWars Tech', eventoId, estado: 'Ocupado' },
      { numero: 2, anio: 2026, empresa: 'CloudCorp', eventoId, estado: 'Disponible' }
    ]);

    // 6. PARTICIPANTES
    await db.collection('participantes').insertMany([
      { idDocumento: '101110111', nombre: 'Carlos Ruiz', correo: 'carlos.participante@ejemplo.com', eventoId, confirmado: true },
      { idDocumento: '202220222', nombre: 'Elena Torres', correo: 'elena@ejemplo.com', eventoId, confirmado: false }
    ]);

    // 7. POSTULACIONES
    await db.collection('postulaciones').insertMany([
      { usuarioId, eventoId, propuesta: 'Taller práctico de índices en MongoDB', estado: 'Aprobada', fechaCreacion: fechaActual },
      { usuarioId, eventoId, propuesta: 'Charla sobre Ciberseguridad', estado: 'Pendiente', fechaCreacion: fechaActual }
    ]);

    console.log(' ¡Seed nativo ejecutado con los 7 modelos completos!');
    process.exit(0);
  } catch (error) {
    console.error(' Error en el seed:', error);
    process.exit(1);
  }
};

importarDatos();