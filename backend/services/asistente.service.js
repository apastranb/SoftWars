// ==========================================================================
// SERVICE: ASISTENTE DE IA — backend/services/asistente.service.js
// Conecta con la API de Gemini para mejorar descripciones.
// Responsable original: Josué Arroyo (SW-25)
// ==========================================================================

const { CATEGORIAS_ACTIVIDAD } = require('../utils/catalogos');
const v = require('../utils/validaciones.server');

const MODELO = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_CARACTERES = 200;
const TIEMPO_MAXIMO_MS = 15000;

// ==========================================================================
// HELPERS
// ==========================================================================

function construirPrompt({ texto, nombre, categoria }) {
    const contexto = [
        nombre ? `Nombre del evento: ${nombre}` : null,
        categoria ? `Categoría: ${categoria}` : null
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

// ==========================================================================
// OPERACIÓN PRINCIPAL
// ==========================================================================

/**
 * Mejora una descripción usando Gemini.
 * Retorna { exito, descripcion, original, modelo } o { exito: false, status, mensaje }
 */
async function mejorarDescripcion(texto, nombre, categoriaRaw) {
    const clave = process.env.GEMINI_API_KEY;
    if (!clave) {
        return {
            exito: false,
            status: 503,
            mensaje: 'El asistente de IA no está configurado en este servidor. ' +
                'Agregue GEMINI_API_KEY en el archivo .env para habilitarlo.'
        };
    }

    const categoria = v.validarEnCatalogo(categoriaRaw, CATEGORIAS_ACTIVIDAD)
        ? v.normalizarCatalogo(categoriaRaw, CATEGORIAS_ACTIVIDAD)
        : '';

    const prompt = construirPrompt({
        texto,
        nombre: v.limpiar(nombre),
        categoria
    });

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
                    maxOutputTokens: 2048
                }
            }),
            signal: control.signal
        });
    } catch (error) {
        const esTiempoAgotado = error.name === 'AbortError';
        return {
            exito: false,
            status: 504,
            mensaje: esTiempoAgotado
                ? 'El asistente tardó demasiado en responder. Intente de nuevo.'
                : 'No se pudo contactar el servicio de IA. Revise la conexión a internet.'
        };
    } finally {
        clearTimeout(temporizador);
    }

    const datos = await respuestaGoogle.json().catch(() => null);

    if (!respuestaGoogle.ok) {
        console.error('[asistente] Gemini respondió',
            respuestaGoogle.status, datos && datos.error && datos.error.message);

        const mensaje = respuestaGoogle.status === 429
            ? 'Se agotó la cuota del asistente de IA por ahora. Intente más tarde.'
            : 'El asistente de IA no pudo procesar la solicitud.';

        return { exito: false, status: 502, mensaje };
    }

    let descripcion = extraerTexto(datos);
    if (!descripcion) {
        return {
            exito: false,
            status: 502,
            mensaje: 'El asistente no devolvió una descripción utilizable. Intente reformular el texto.'
        };
    }

    // Respuesta truncada por MAX_TOKENS
    const razonFin = datos.candidates && datos.candidates[0] && datos.candidates[0].finishReason;
    if (razonFin === 'MAX_TOKENS') {
        console.error('[asistente] Respuesta truncada por MAX_TOKENS. Subir maxOutputTokens.');
        return {
            exito: false,
            status: 502,
            mensaje: 'El asistente devolvió una respuesta incompleta. Intente de nuevo con un texto más corto.'
        };
    }

    // Truncar si excede el límite del ERS
    if (descripcion.length > MAX_CARACTERES) {
        const corte = descripcion.lastIndexOf(' ', MAX_CARACTERES - 1);
        descripcion = descripcion.slice(0, corte > 0 ? corte : MAX_CARACTERES).trim();
    }

    return {
        exito: true,
        descripcion,
        original: texto,
        modelo: MODELO
    };
}

module.exports = {
    mejorarDescripcion,
    construirPrompt,
    extraerTexto,
    MAX_CARACTERES,
    MODELO
};
