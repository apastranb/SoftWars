require('dotenv').config();
const { conectarDB, getDB } = require('../config/db');

const crearIndices = async () => {
  try {
    await conectarDB();
    const db = getDB();

    // 1. Índices Únicos
    await db.collection('usuarios').createIndex({ email: 1 }, { unique: true });
    await db.collection('eventos').createIndex({ codigo: 1 }, { unique: true });

    // 2. Índice Compuesto (visibilidad + estado + fechaInicio)
    await db.collection('eventos').createIndex({ visibilidad: 1, estado: 1, fechaInicio: 1 });

    // 3. Índice de Texto para búsquedas rápidas (nombre + lugar)
    await db.collection('eventos').createIndex({ nombre: 'text', lugar: 'text' });

    console.log(' ¡Índices nativos creados en MongoDB Atlas!');
    process.exit(0);
  } catch (error) {
    console.error(' Error creando los índices:', error);
    process.exit(1);
  }
};

crearIndices();