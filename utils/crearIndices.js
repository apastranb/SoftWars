require('dotenv').config();
const { conectarDB, getDB } = require('../config/db');

const crearIndices = async () => {
  try {
    await conectarDB();
    const db = getDB();

    console.log('Creando los 11 índices en MongoDB Atlas...');

    // --- USUARIOS ---
    await db.collection('usuarios').createIndex({ email: 1 }, { unique: true }); // 1. Único

    // --- EVENTOS ---
    await db.collection('eventos').createIndex({ codigo: 1 }, { unique: true }); // 2. Único
    await db.collection('eventos').createIndex({ visibilidad: 1, estado: 1, fechaInicio: 1 }); // 3. Compuesto
    await db.collection('eventos').createIndex({ nombre: 'text', lugar: 'text' }); // 4. Texto

    // --- ACTIVIDADES ---
    await db.collection('actividades').createIndex({ eventoId: 1 }); // 5. Referencia
    await db.collection('actividades').createIndex({ titulo: 'text', descripcion: 'text' }); // 6. Texto

    // --- ORADORES ---
    await db.collection('oradores').createIndex({ correo: 1 }, { unique: true }); // 7. Único

    // --- STANDS ---
    await db.collection('stands').createIndex({ eventoId: 1 }); // 8. Referencia
    await db.collection('stands').createIndex({ numero: 1, anio: 1 }, { unique: true }); // 9. Compuesto Único

    // --- PARTICIPANTES ---
    await db.collection('participantes').createIndex({ idDocumento: 1 }); // 10. Documento
    await db.collection('participantes').createIndex({ correo: 1, eventoId: 1 }, { unique: true }); // 11. Compuesto Único

    console.log(' ¡Los 11 índices nativos han sido creados exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error(' Error creando los índices:', error);
    process.exit(1);
  }
};

crearIndices();