// ==========================================================================
// SERVICE: PARTICIPANTES — js/services/participantes.service.js
// Operaciones de API para participantes e inscripciones.
// ==========================================================================

import { apiGet, apiPost, apiPut, apiDelete, listaDe } from './api.service.js';

export async function listarParticipantes(params = {}) {
    const respuesta = await apiGet('participantes', params);
    return listaDe(respuesta, 'participantes');
}

export async function editarParticipante(id, datos) {
    return await apiPut('participantes', id, datos);
}

export async function eliminarParticipante(id) {
    return await apiDelete('participantes', id);
}

export async function crearInscripcion(datos) {
    return await apiPost('inscripciones', datos);
}

export async function cancelarInscripcion(id) {
    return await apiDelete('inscripciones', id);
}

export async function listarInscripciones(params = {}) {
    const respuesta = await apiGet('inscripciones', params);
    return listaDe(respuesta, 'inscripciones');
}
