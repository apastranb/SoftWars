// ==========================================================================
// ⚠️  ARCHIVO PROVISIONAL — NO COMMITEAR ⚠️
//
// config/db.js pertenece a Adonis Pastrana (SW-5). Esta versión existe solo
// para poder desarrollar y probar las APIs de oradores, stands y
// postulaciones (SW-12, SW-14, SW-17) sin quedar bloqueado esperando SW-5.
//
// Respeta exactamente el contrato que ya declara el archivo del repositorio:
//     module.exports = { conectarDB, getDB }
//
// Cuando Adonis suba su implementación, se sobrescribe este archivo y ningún
// controller cambia, porque todos consumen únicamente getDB().
//
// Uso local:
//   1. Guardar como config/db.js
//   2. Correr `git update-index --skip-worktree config/db.js` para que Git
//      no lo marque como modificado mientras se trabaja.
//   3. Al recibir la versión de Adonis:
//      `git update-index --no-skip-worktree config/db.js` y `git checkout`.
// ==========================================================================

const { MongoClient } = require('mongodb');

let cliente = null;
let baseDatos = null;

/**
 * Abre la conexión al clúster y la deja lista para toda la vida del proceso.
 * Se llama una sola vez desde server.js antes de levantar el listener.
 * @returns {Promise<object>} Instancia de la base de datos.
 */
async function conectarDB() {
    if (baseDatos) return baseDatos;

    const uri = process.env.MONGODB_URI;
    const nombreBD = process.env.DB_NAME || 'softwars_eventos';

    if (!uri) {
        throw new Error('Falta la variable MONGODB_URI. Copie .env.example como .env y complete los valores.');
    }

    cliente = new MongoClient(uri);
    await cliente.connect();
    baseDatos = cliente.db(nombreBD);

    console.log(`[db] Conectado a MongoDB — base de datos "${nombreBD}"`);
    return baseDatos;
}

/**
 * Devuelve la instancia de la base de datos ya conectada.
 * Lanza un error 503 controlado si se llama antes de conectarDB(), para que
 * el middleware de errores responda un JSON en vez de reventar el proceso.
 * @returns {object} Instancia de la base de datos.
 */
function getDB() {
    if (!baseDatos) {
        const error = new Error('La base de datos no está disponible. Verifique la conexión a MongoDB.');
        error.status = 503;
        error.mensaje = error.message;
        throw error;
    }
    return baseDatos;
}

/** Cierra la conexión. Útil en pruebas y en el apagado del servidor. */
async function cerrarDB() {
    if (cliente) {
        await cliente.close();
        cliente = null;
        baseDatos = null;
    }
}

module.exports = { conectarDB, getDB, cerrarDB };
