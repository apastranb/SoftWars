// ==========================================================================
// SERVIDOR DE DEMOSTRACIÓN — pruebas/servidor-demo.js
// Responsable: Josué Arroyo (SW-27 / SW-22)
//
// Levanta la aplicación completa (Express + páginas de public/) usando el
// doble de MongoDB en memoria, sin necesidad de credenciales de Atlas.
// Sirve para revisar las pantallas en el navegador y para ensayar la defensa
// si la red del laboratorio bloquea la salida hacia Atlas.
//
//   npm run demo     →  http://localhost:3001
//   Usuario:  admin@ucenfotec.ac.cr
//   Clave:    Admin123!
//
// NO sustituye a la ejecución real contra Atlas (npm start): los datos viven
// en memoria y se pierden al detener el proceso.
// ==========================================================================

'use strict';

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { BaseDatos } = require('./mongo-en-memoria');

const PUERTO = process.env.PUERTO_DEMO || 3001;

(async () => {
    // El doble se inyecta ANTES de requerir server.js para que los controllers
    // capturen esta versión de getDB() al cargarse.
    const db = new BaseDatos();
    const moduloDB = require('../config/db');
    moduloDB.getDB = () => db;
    moduloDB.conectarDB = async () => db;

    await sembrarDatos(db);

    const app = require('../server');
    app.listen(PUERTO, () => {
        console.log(`[demo] Aplicación en http://localhost:${PUERTO}`);
        console.log('[demo] Usuario: admin@ucenfotec.ac.cr  ·  Clave: Admin123!');
        console.log('[demo] Datos en memoria: se pierden al detener el proceso.');
    });
})();

/** Carga un juego de datos mínimo pero representativo de las siete colecciones. */
async function sembrarDatos(db) {
    await db.collection('usuarios').insertOne({
        nombre: 'Josué Arroyo',
        email: 'admin@ucenfotec.ac.cr',
        passwordHash: await bcrypt.hash('Admin123!', 4),
        rol: 'Administrador',
        estado: 'Activo'
    });

    const evento = await db.collection('eventos').insertOne({
        codigo: 'EV-001',
        nombre: 'Semana de la Innovación 2026',
        descripcion: 'Encuentro anual de tecnología e innovación de UCenfotec.',
        categoria: 'Tecnológicas',
        visibilidad: 'publico',
        estado: 'Disponible',
        fechaInicio: '2026-09-14',
        fechaFin: '2026-09-18'
    });
    const eventoId = evento.insertedId;

    await db.collection('eventos').insertOne({
        codigo: 'EV-002',
        nombre: 'Feria de Emprendimiento',
        descripcion: 'Exposición de proyectos estudiantiles.',
        categoria: 'Culturales',
        visibilidad: 'publico',
        estado: 'Disponible',
        fechaInicio: '2026-10-02',
        fechaFin: '2026-10-03'
    });

    // Orador CON actividad vigente: sirve para ver el bloqueo del RF-13.
    const ocupado = await db.collection('oradores').insertOne({
        codigo: 'OR-001',
        nombre: 'Laura Vindas',
        correo: 'laura.vindas@cloudcr.cr',
        telefonos: ['8888-0001'], telefono: '8888-0001',
        especialidad: 'Arquitectura Cloud',
        empresa: 'CloudSystems',
        biografia: 'Arquitecta cloud con 10 años de experiencia.',
        foto: null, eventoId, estado: 'Activo',
        fechaRegistro: new Date()
    });

    // Orador SIN actividades: se puede editar y eliminar sin restricción.
    await db.collection('oradores').insertOne({
        codigo: 'OR-002',
        nombre: 'Diego Ramírez',
        correo: 'diego.ramirez@datalab.cr',
        telefonos: ['8888-0002', '7777-0002'], telefono: '8888-0002',
        especialidad: 'Ciencia de Datos',
        empresa: 'DataLab',
        biografia: 'Científico de datos y docente universitario.',
        foto: null, eventoId, estado: 'Activo',
        fechaRegistro: new Date()
    });

    const actividad = await db.collection('actividades').insertOne({
        codigo: 'ACT-001',
        nombre: 'Taller de Prompt Engineering',
        descripcion: 'Introducción práctica al diseño de prompts.',
        categoria: 'Tecnológicas',
        eventoId,
        responsableId: ocupado.insertedId,
        estado: 'Disponible',
        cupoMaximo: 30, cupoOcupado: 4,
        fecha: '2026-09-15', horaInicio: '09:00', horaFin: '11:00',
        espacio: 'Laboratorio 3'
    });

    await db.collection('actividades').insertOne({
        codigo: 'ACT-002',
        nombre: 'Charla: El futuro del trabajo',
        descripcion: 'Panel sobre automatización y empleo.',
        categoria: 'Tecnológicas',
        eventoId,
        responsableId: null,
        estado: 'Disponible',
        cupoMaximo: 120, cupoOcupado: 30,
        fecha: '2026-09-16', horaInicio: '14:00', horaFin: '15:30',
        espacio: 'Auditorio'
    });

    const anio = new Date().getFullYear();
    await db.collection('stands').insertOne({
        codigo: `S-${anio}-001`, numero: 1, anio,
        eventoId, nombre: 'Tech Corp',
        categoria: 'empresa',
        descripcion: 'Soluciones empresariales de software.',
        encargado: 'Juan Pérez', empresa: 'Tech Corp',
        correo: 'juan@techcorp.cr', telefono: '8888-1001',
        estado: 'Aprobado', fechaRegistro: new Date()
    });
    await db.collection('stands').insertOne({
        codigo: `S-${anio}-002`, numero: 2, anio,
        eventoId, nombre: 'SecureNet',
        categoria: 'empresa',
        descripcion: 'Ciberseguridad para instituciones educativas.',
        encargado: 'María López', empresa: 'SecureNet',
        correo: 'maria@securenet.cr', telefono: '8888-1002',
        estado: 'Aprobado', fechaRegistro: new Date()
    });
    // Stand del año anterior: demuestra el reinicio anual del RF-15.
    await db.collection('stands').insertOne({
        codigo: `S-${anio - 1}-047`, numero: 47, anio: anio - 1,
        eventoId, nombre: 'Stand histórico',
        categoria: 'personal',
        descripcion: 'Registro del año anterior.',
        encargado: 'Ana Mora', empresa: 'Independiente',
        correo: 'ana.mora@correo.cr', telefono: '8888-1003',
        estado: 'Cerrado', fechaRegistro: new Date()
    });

    await db.collection('postulaciones').insertOne({
        codigo: 'PT-001',
        nombre: 'Mario Solís',
        correo: 'mario.solis@gmail.com',
        telefonos: ['8899-3344'], telefono: '8899-3344',
        especialidad: 'Desarrollo Móvil',
        organizacion: 'Independiente', empresa: 'Independiente',
        biografia: 'Desarrollador Android con 6 años de experiencia.',
        foto: null,
        actividadId: actividad.insertedId,
        eventoId,
        estado: 'Pendiente',
        fechaPostulacion: new Date()
    });
    await db.collection('postulaciones').insertOne({
        codigo: 'PT-002',
        nombre: 'Carolina Jiménez',
        correo: 'carolina.jimenez@gmail.com',
        telefonos: ['8899-5566'], telefono: '8899-5566',
        especialidad: 'Diseño UX',
        organizacion: 'Estudio Kiwi', empresa: 'Estudio Kiwi',
        biografia: 'Diseñadora de experiencia de usuario.',
        foto: null,
        actividadId: actividad.insertedId,
        eventoId,
        estado: 'Rechazada',
        motivoRechazo: 'Tema fuera del alcance del evento.',
        fechaPostulacion: new Date()
    });

    console.log('[demo] Datos de ejemplo cargados en memoria.');
}
