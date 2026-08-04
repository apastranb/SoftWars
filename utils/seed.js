// Carga inicial de datos — Responsable: Adonis Pastrana (SW-8)
// Uso: node utils/seed.js


require('dotenv').config();
const bcrypt = require('bcryptjs');
const { conectarDB, getDB } = require('../config/db');

const importarDatos = async () => {
  try {
    // 1. Conectar a MongoDB usando la función centralizada del equipo
    await conectarDB();
    const db = getDB();
    console.log('🔌 Conectado a MongoDB Atlas (Driver Nativo)...');

    // 2. Limpiar las colecciones existentes
    const colecciones = ['usuarios', 'eventos', 'actividades', 'oradores', 'participantes', 'stands', 'postulaciones'];
    for (const col of colecciones) {
      await db.collection(col).deleteMany({});
    }
    console.log('🧹 Colecciones limpiadas exitosamente.');

    // 3. Hashear la contraseña por seguridad
    const passwordHasheada = await bcrypt.hash('password123', 10);

    // 4. Insertar Usuarios
    await db.collection('usuarios').insertMany([
      {
        cedula: '101110111',
        nombre: 'Adonis',
        apellido: 'Pastrana',
        email: 'admin@softwars.com',
        password: passwordHasheada,
        rol: 'admin',
        estado: 'activo',
        fechaCreacion: new Date()
      },
      {
        cedula: '202220222',
        nombre: 'Carlos',
        apellido: 'Gómez',
        email: 'carlos@softwars.com',
        password: passwordHasheada,
        rol: 'organizador',
        estado: 'activo',
        fechaCreacion: new Date()
      }
    ]);

    // 5. Insertar Eventos (con todos los campos del diseño)
    await db.collection('eventos').insertMany([
      {
        codigo: 'EVT-2026-01',
        nombre: 'Tech Conference 2026',
        categoria: 'Tecnología',
        descripcion: 'Congreso Anual de Desarrollo de Software y Cloud',
        fechaInicio: new Date('2026-09-15'),
        fechaFin: new Date('2026-09-17'),
        horaInicio: '08:00',
        horaFin: '17:00',
        enUniversidad: true,
        lugar: 'Auditorio Principal',
        cupoMax: 200,
        cupoActual: 0,
        responsable: 'Adonis Pastrana',
        tipoEntrada: 'Gratuita',
        visibilidad: 'publico',
        estado: 'activo',
        imagen: 'default.png',
        fechaCreacion: new Date()
      }
    ]);

    console.log(' ¡Seed nativo ejecutado correctamente!');
    process.exit(0);
  } catch (error) {
    console.error(' Error ejecutando el seed:', error);
    process.exit(1);
  }
};

importarDatos();