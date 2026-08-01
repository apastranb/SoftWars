// ==========================================================================
// CONEXIÓN A MONGODB — config/db.js
// Responsable: Adonis Pastrana (SW-5)
//
// Este módulo debe:
// 1. Abrir una conexión con MongoClient usando MONGODB_URI de .env
// 2. Exponer una función getDB() que retorne la instancia de la BD
// 3. Crear los índices definidos en el apartado 4.4 del doc de diseño
// 4. Si la conexión falla, registrar el error y terminar el proceso
// ==========================================================================

const { MongoClient } = require('mongodb');

let db = null;

/**
 * Conecta al clúster de MongoDB Atlas y guarda la referencia a la BD.
 * Debe invocarse una sola vez al arrancar el servidor.
 */
async function conectarDB() {
    // TODO (Adonis - SW-5): implementar conexión
    // const client = new MongoClient(process.env.MONGODB_URI);
    // await client.connect();
    // db = client.db(process.env.DB_NAME);
    // await crearIndices();
    // console.log('Conectado a MongoDB:', process.env.DB_NAME);
    throw new Error('conectarDB() no implementada. Pendiente SW-5.');
}

/**
 * Retorna la instancia de la base de datos.
 * Lanza error si no se ha conectado previamente.
 */
function getDB() {
    if (!db) {
        throw new Error('Base de datos no conectada. Ejecutar conectarDB() primero.');
    }
    return db;
}

/**
 * Crea los índices de las siete colecciones (apartado 4.4 del doc de diseño).
 */
async function crearIndices() {
    // TODO (Adonis - SW-7): implementar creación de índices
}

module.exports = { conectarDB, getDB };
