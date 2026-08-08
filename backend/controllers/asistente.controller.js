// ==========================================================================
// CONTROLLER: ASISTENTE DE IA — backend/controllers/asistente.controller.js
// Recibe peticiones HTTP, valida entrada, llama al service y responde.
// Responsable original: Josué Arroyo (SW-25)
//
// POST /api/asistente/descripcion — Mejora descripción con Gemini.
// ==========================================================================

const { errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const asistenteService = require('../services/asistente.service');

/**
 * POST /api/asistente/descripcion
 * Cuerpo: { texto, nombre?, categoria? }
 * Respuesta: { descripcion, modelo, original }
 */
async function mejorarDescripcion(req, res) {
    const texto = v.limpiar(req.body.texto);

    if (!v.validarRequerido(texto)) {
        throw errorValidacion({ texto: 'Escriba una descripción para que el asistente la mejore.' });
    }
    if (texto.length > 1000) {
        throw errorValidacion({ texto: 'El texto de entrada no puede superar los 1000 caracteres.' });
    }

    const resultado = await asistenteService.mejorarDescripcion(
        texto,
        req.body.nombre,
        req.body.categoria
    );

    if (!resultado.exito) {
        return res.status(resultado.status).json({
            error: true,
            mensaje: resultado.mensaje,
            codigo: resultado.status
        });
    }

    res.json({
        error: false,
        descripcion: resultado.descripcion,
        original: resultado.original,
        modelo: resultado.modelo
    });
}

module.exports = {
    mejorarDescripcion,
    construirPrompt: asistenteService.construirPrompt,
    extraerTexto: asistenteService.extraerTexto,
    MAX_CARACTERES: asistenteService.MAX_CARACTERES
};
