// ==========================================================================
// ASISTENTE DE IA — controllers/asistente.controller.js
// Responsable: Josué Arroyo (SW-25)
//
// Conecta el botón "Mejorar con IA" del formulario de eventos con la API de
// Gemini (Google Generative Language API).
//
// Por qué vive en el servidor y no en el navegador:
//   La clave de Gemini es un secreto. Si el fetch se hiciera desde
//   admin-crear-evento-logic.js, la clave viajaría en el JavaScript que se
//   descarga cualquier visitante y quedaría visible en las herramientas de
//   desarrollo. El navegador llama a /api/asistente/descripcion y es Express
//   quien habla con Google usando GEMINI_API_KEY del archivo .env.
//
// Degradación controlada: si no hay clave configurada se responde 503 con un
// mensaje entendible, en vez de un error genérico. Así el proyecto se puede
// clonar y ejecutar sin cuenta de Gemini y el resto del sistema sigue igual.
// ==========================================================================

const { errorValidacion } = require('../utils/respuestas');
const { CATEGORIAS_ACTIVIDAD } = require('../utils/catalogos');
const v = require('../utils/validaciones.server');

const MODELO = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Límite del ERS para descripciones: la IA no puede devolver algo más largo. */
const MAX_CARACTERES = 200;

/** Si Google no responde en este tiempo, se corta y se avisa al usuario. */
const TIEMPO_MAXIMO_MS = 15000;

/**
 * Arma la instrucción que se le envía al modelo.
 * Se le pasan el nombre y la categoría del evento para que el texto no sea
 * genérico, y se le fija el límite de caracteres del ERS.
 * @param {object} datos
 * @returns {string}
 */
function construirPrompt({ texto, nombre, categoria }) {
    const contexto = [
        nombre    ? `Nombre del evento: ${nombre}` : null,
        categoria ? `Categoría: ${categoria}`      : null
    ].filter(Boolean).join('\n');

    return [
        'Eres el asistente de redacción del sistema de gestión de eventos de la',
        'Universidad Cenfotec (Costa Rica). Reescribe la descripción de un evento',
        'universitario para que sea clara, atractiva y profesional.',
        '',
        'Reglas obligatorias:',
        `- Responde ÚNICAMENTE con la descripción reescrita, sin comillas, sin`,
        '  encabezados y sin explicar lo que hiciste.',
        `- Máximo ${MAX_CARACTERES} caracteres, contando espacios.`,
        '- Español de Costa Rica, tono institucional y cercano.',
        '- No inventes fechas, horarios, precios, lugares ni nombres de personas',
        '  que no aparezcan en el texto original.',
        '',
        contexto ? `Contexto del evento:\n${contexto}\n` : '',
        'Descripción original:',
        texto
    ].join('\n');
}

/**
 * Extrae el texto de la respuesta de Gemini.
 * La respuesta anida el contenido en candidates[0].content.parts[].text;
 * si el modelo bloquea la petición, `candidates` puede venir vacío.
 * @param {object} respuesta - JSON devuelto por la API.
 * @returns {string} Texto generado, o cadena vacía.
 */
function extraerTexto(respuesta) {
    const candidato = respuesta && respuesta.candidates && respuesta.candidates[0];
    if (!candidato || !candidato.content || !Array.isArray(candidato.content.parts)) {
        return '';
    }
    return candidato.content.parts
        .map(parte => parte.text || '')
        .join('')
        .trim();
}

/**
 * POST /api/asistente/descripcion
 * Cuerpo: { texto, nombre?, categoria? }
 * Respuesta: { descripcion, modelo, original }
 *
 * Requiere sesión de administrador: el formulario de eventos es del panel y
 * cada llamada consume cuota de la cuenta de Gemini del equipo.
 */
async function mejorarDescripcion(req, res) {
    const texto = v.limpiar(req.body.texto);

    if (!v.validarRequerido(texto)) {
        throw errorValidacion({ texto: 'Escriba una descripción para que el asistente la mejore.' });
    }
    if (texto.length > 1000) {
        throw errorValidacion({ texto: 'El texto de entrada no puede superar los 1000 caracteres.' });
    }

    const clave = process.env.GEMINI_API_KEY;
    if (!clave) {
        return res.status(503).json({
            error: true,
            mensaje: 'El asistente de IA no está configurado en este servidor. ' +
                     'Agregue GEMINI_API_KEY en el archivo .env para habilitarlo.',
            codigo: 503
        });
    }

    const categoria = v.validarEnCatalogo(req.body.categoria, CATEGORIAS_ACTIVIDAD)
        ? v.normalizarCatalogo(req.body.categoria, CATEGORIAS_ACTIVIDAD)
        : '';

    const prompt = construirPrompt({
        texto,
        nombre: v.limpiar(req.body.nombre),
        categoria
    });

    // AbortController evita que una petición colgada de Google deje al
    // administrador esperando indefinidamente con el botón en "Mejorando...".
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), TIEMPO_MAXIMO_MS);

    let respuestaGoogle;
    try {
        respuestaGoogle = await fetch(`${URL_BASE}/${MODELO}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': clave
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256
                }
            }),
            signal: control.signal
        });
    } catch (error) {
        const esTiempoAgotado = error.name === 'AbortError';
        return res.status(504).json({
            error: true,
            mensaje: esTiempoAgotado
                ? 'El asistente tardó demasiado en responder. Intente de nuevo.'
                : 'No se pudo contactar el servicio de IA. Revise la conexión a internet.',
            codigo: 504
        });
    } finally {
        clearTimeout(temporizador);
    }

    const datos = await respuestaGoogle.json().catch(() => null);

    if (!respuestaGoogle.ok) {
        // El detalle de Google se registra en el servidor, pero no se devuelve
        // al navegador: puede incluir fragmentos de la configuración de la cuenta.
        console.error('[asistente] Gemini respondió',
            respuestaGoogle.status, datos && datos.error && datos.error.message);

        const mensaje = respuestaGoogle.status === 429
            ? 'Se agotó la cuota del asistente de IA por ahora. Intente más tarde.'
            : 'El asistente de IA no pudo procesar la solicitud.';

        return res.status(502).json({ error: true, mensaje, codigo: 502 });
    }

    let descripcion = extraerTexto(datos);
    if (!descripcion) {
        return res.status(502).json({
            error: true,
            mensaje: 'El asistente no devolvió una descripción utilizable. Intente reformular el texto.',
            codigo: 502
        });
    }

    // Red de seguridad: el modelo a veces ignora el límite pedido en el prompt,
    // y la descripción tiene que caber en la validación del ERS.
    if (descripcion.length > MAX_CARACTERES) {
        const corte = descripcion.lastIndexOf(' ', MAX_CARACTERES - 1);
        descripcion = descripcion.slice(0, corte > 0 ? corte : MAX_CARACTERES).trim();
    }

    res.json({
        error: false,
        descripcion: descripcion,
        original: texto,
        modelo: MODELO
    });
}

module.exports = {
    mejorarDescripcion,
    construirPrompt,
    extraerTexto,
    MAX_CARACTERES
};
