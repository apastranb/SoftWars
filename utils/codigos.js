// ==========================================================================
// GENERACIÓN DE CÓDIGOS Y SECUENCIAS — utils/codigos.js
// Responsable: Josué Arroyo (SW-12 / SW-14)
//
// En la iteración 1 los códigos se generaban en el navegador con
// Math.max(...ids) + 1. Eso funciona con un solo usuario y datos en memoria,
// pero en MongoDB dos administradores que crean un registro al mismo tiempo
// obtendrían el mismo número. Aquí la secuencia se resuelve en la base de
// datos con findOneAndUpdate($inc), que es una operación atómica: dos
// peticiones simultáneas nunca reciben el mismo valor.
//
// Implementa RF-15: los stands llevan un ID numérico que se reinicia cada
// año, por lo que su contador vive bajo la clave "stands-<año>".
// ==========================================================================

const { getDB } = require('../config/db');

const COLECCION_CONTADORES = 'contadores';

/**
 * Devuelve el siguiente valor de una secuencia de forma atómica.
 *
 * Si el contador todavía no existe (por ejemplo la primera vez que se corre
 * después del seed de Adonis, SW-8), se inicializa con el mayor valor que ya
 * exista en la colección para no repetir códigos de los datos migrados.
 *
 * @param {string} clave - Nombre de la secuencia (ej. 'oradores', 'stands-2026').
 * @param {object} [inicializacion] - Cómo calcular el valor inicial.
 * @param {string} inicializacion.coleccion - Colección a inspeccionar.
 * @param {string} inicializacion.campo - Campo numérico a maximizar (ej. 'numero').
 * @param {object} [inicializacion.filtro] - Filtro adicional (ej. { anio: 2026 }).
 * @param {RegExp} [inicializacion.extraerDe] - Regex con un grupo para extraer
 *        el número desde un campo de texto (ej. /^OR-(\d+)$/ sobre `codigo`).
 * @param {string} [inicializacion.campoTexto] - Campo de texto para `extraerDe`.
 * @returns {Promise<number>} Siguiente número de la secuencia.
 */
async function siguienteSecuencia(clave, inicializacion = null) {
    const db = getDB();
    const contadores = db.collection(COLECCION_CONTADORES);

    const existente = await contadores.findOne({ _id: clave });

    if (!existente && inicializacion) {
        const maximo = await calcularMaximoActual(inicializacion);
        // upsert con $setOnInsert: si otra petición lo creó primero, no lo pisa.
        await contadores.updateOne(
            { _id: clave },
            { $setOnInsert: { valor: maximo } },
            { upsert: true }
        );
    }

    const resultado = await contadores.findOneAndUpdate(
        { _id: clave },
        { $inc: { valor: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    // El driver de MongoDB 6+ devuelve el documento directamente;
    // versiones anteriores lo envuelven en { value: ... }.
    const documento = resultado && resultado.value ? resultado.value : resultado;
    return documento.valor;
}

/**
 * Calcula el mayor número ya usado en una colección, para sembrar el contador.
 * @private
 */
async function calcularMaximoActual({ coleccion, campo, filtro = {}, extraerDe, campoTexto }) {
    const db = getDB();
    const cursor = db.collection(coleccion).find(filtro);
    let maximo = 0;

    for await (const documento of cursor) {
        let valor = 0;

        if (extraerDe && campoTexto && typeof documento[campoTexto] === 'string') {
            const coincidencia = documento[campoTexto].match(extraerDe);
            if (coincidencia) valor = parseInt(coincidencia[1], 10);
        } else if (typeof documento[campo] === 'number') {
            valor = documento[campo];
        }

        if (!isNaN(valor) && valor > maximo) maximo = valor;
    }

    return maximo;
}

/**
 * Genera el siguiente código con prefijo y relleno de ceros: OR-001, PT-014.
 * @param {string} prefijo - Prefijo del código (ej. 'OR', 'PT').
 * @param {string} coleccion - Colección donde vive el recurso.
 * @param {number} [digitos=3] - Cantidad de dígitos del consecutivo.
 * @returns {Promise<string>} Código formateado.
 */
async function siguienteCodigo(prefijo, coleccion, digitos = 3) {
    const numero = await siguienteSecuencia(coleccion, {
        coleccion,
        campoTexto: 'codigo',
        extraerDe: new RegExp(`^${prefijo}-(\\d+)$`)
    });
    return `${prefijo}-${String(numero).padStart(digitos, '0')}`;
}

/**
 * RF-15 — Identificación numérica anual de stands.
 *
 * Devuelve el número consecutivo del año indicado y su código legible.
 * El consecutivo arranca de nuevo en 1 cada año calendario, porque el
 * contador se guarda por año ("stands-2026", "stands-2027", ...).
 *
 * @param {number} [anio] - Año a numerar. Por defecto, el año actual.
 * @returns {Promise<{anio: number, numero: number, codigo: string}>}
 */
async function siguienteNumeroStand(anio = new Date().getFullYear()) {
    const numero = await siguienteSecuencia(`stands-${anio}`, {
        coleccion: 'stands',
        campo: 'numero',
        filtro: { anio: anio }
    });

    return {
        anio: anio,
        numero: numero,
        codigo: `S-${anio}-${String(numero).padStart(3, '0')}`
    };
}

module.exports = {
    COLECCION_CONTADORES,
    siguienteSecuencia,
    siguienteCodigo,
    siguienteNumeroStand
};
