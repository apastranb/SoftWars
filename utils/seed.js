// Carga inicial de datos — Responsable: Adonis Pastrana (SW-8)
// Uso: node utils/seed.js


require('dotenv').config();
const mongoose = require('mongoose');

// Importar los 7 modelos desde la carpeta models
const Usuario = require('../models/usuario-models');
const Evento = require('../models/evento-models');
const Actividad = require('../models/actividad-models');
const Orador = require('../models/orador-models');
const Participante = require('../models/participante-models');
const Stand = require('../models/stand-models');
const Postulacion = require('../models/postulacion-models');

const importarDatos = async () => {
  try {
    // 1. Conectar a MongoDB Atlas usando la URI del .env
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔌 Conectado a MongoDB para la carga inicial de datos...');

    // 2. Limpiar la base de datos previa
    await Usuario.deleteMany();
    await Evento.deleteMany();
    await Actividad.deleteMany();
    await Orador.deleteMany();
    await Participante.deleteMany();
    await Stand.deleteMany();
    await Postulacion.deleteMany();
    console.log('🧹 Base de datos limpiada');

    // 3. Crear Usuario Administrador de prueba
    const usuarioAdmin = await Usuario.create({
      nombre: 'Adonis Pastran',
      correo: 'admin@softwars.com',
      password: 'password123',
      rol: 'admin'
    });

    // 4. Crear Evento de prueba
    const eventoPrueba = await Evento.create({
      nombre: 'Tech Conference 2026',
      descripcion: 'Congreso de Tecnología y Desarrollo de Software',
      fechaInicio: new Date('2026-09-15'),
      fechaFin: new Date('2026-09-17'),
      lugar: 'Centro de Convenciones'
    });

    // 5. Crear Orador de prueba
    const oradorPrueba = await Orador.create({
      nombre: 'Josué Pérez',
      correo: 'josue@softwars.com',
      especialidad: 'Backend & Cloud'
    });

    // 6. Crear Actividad de prueba
    await Actividad.create({
      titulo: 'Arquitectura de Microservicios',
      descripcion: 'Charla introductoria sobre Node.js y MongoDB Atlas',
      horario: new Date('2026-09-15T10:00:00'),
      eventoId: eventoPrueba._id,
      oradorId: oradorPrueba._id
    });

    // 7. Crear Participante de prueba
    await Participante.create({
      nombre: 'Carlos Ruiz',
      correo: 'carlos@ejemplo.com',
      eventoId: eventoPrueba._id,
      confirmado: true
    });

    // 8. Crear Stand de prueba
    await Stand.create({
      numeroStand: 'A-01',
      empresa: 'SoftWars Tech',
      eventoId: eventoPrueba._id,
      estado: 'ocupado'
    });

    // 9. Crear Postulación de prueba
    await Postulacion.create({
      usuarioId: usuarioAdmin._id,
      eventoId: eventoPrueba._id,
      propuesta: 'Taller práctico de índices en MongoDB',
      estado: 'aprobada'
    });

    console.log(' ¡seed.js ejecutado exitosamente! Datos de prueba listos.');
    process.exit(0);
  } catch (error) {
    console.error(' Error al poblar la base de datos:', error);
    process.exit(1);
  }
};

importarDatos();
