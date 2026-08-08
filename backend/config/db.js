// ==========================================================================
// CONEXIÓN A MONGODB — config/db.js
// Responsable: Adonis Pastrana (SW-5)
//
// Abre UNA sola conexión al clúster Atlas al arrancar el servidor y la
// reutiliza durante todo el ciclo de vida del proceso (patrón singleton).
//
// Contrato público:
//   conectarDB()  → abre la conexión; llama solo desde server.js
//   getDB()       → devuelve la instancia lista; llama desde controllers
//   cerrarDB()    → cierra la conexión; útil en pruebas y apagado limpio
// ==========================================================================

const { MongoClient } = require('mongodb');

let cliente  = null;
let baseDatos = null;

/**
 * Abre la conexión al clúster y deja la base de datos lista.
 * Se llama UNA sola vez desde server.js antes de levantar el listener.
 *
 * @returns {Promise<import('mongodb').Db>} Instancia de la base de datos.
 * @throws {Error} Si falta MONGODB_URI o si la conexión falla.
 */
async function conectarDB() {
    if (baseDatos) return baseDatos;

    const uri       = process.env.MONGODB_URI;
    const nombreBD  = process.env.DB_NAME || 'softwars_eventos';

    if (!uri) {
        throw new Error(
            'Falta la variable MONGODB_URI. ' +
            'Copie .env.example como .env y complete los valores.'
        );
    }

    cliente   = new MongoClient(uri);
    await cliente.connect();
    baseDatos = cliente.db(nombreBD);

    console.log(`[db] Conectado a MongoDB — base de datos "${nombreBD}"`);

    return baseDatos;
}

/**
 * Devuelve la instancia de la base de datos ya conectada.
 * Lanza un error 503 controlado si se llama antes de conectarDB(), para que
 * el middleware de errores responda JSON en lugar de reventar el proceso.
 *
 * @returns {import('mongodb').Db} Instancia de la base de datos.
 * @throws {Error} 503 si la base de datos no está disponible.
 */
function getDB() {
    if (!baseDatos) {
        const error   = new Error(
            'La base de datos no está disponible. Verifique la conexión a MongoDB.'
        );
        error.status  = 503;
        error.mensaje = error.message;
        throw error;
    }
    return baseDatos;
}

/**
 * Cierra la conexión. Útil en pruebas y en el apagado graceful del servidor.
 */
async function cerrarDB() {
    if (cliente) {
        await cliente.close();
        cliente   = null;
        baseDatos = null;
        console.log('[db] Conexión a MongoDB cerrada.');
    }
}

module.exports = { conectarDB, getDB, cerrarDB };
