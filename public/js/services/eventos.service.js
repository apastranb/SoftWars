// ==========================================================================
// SERVICE: EVENTOS — js/services/eventos.service.js
// Operaciones de API para eventos.
// ==========================================================================

import { apiGet, apiPost, apiPut, apiDelete, listaDe } from './api.service.js';

export async function listarEventos(params = {}) {
    const respuesta = await apiGet('eventos', params);
    return listaDe(respuesta);
}

export async function obtenerEvento(id) {
    const respuesta = await apiGet(`eventos/${id}`);
    return respuesta.data || respuesta;
}

export async function crearEvento(datos) {
    return await apiPost('eventos', datos);
}

export async function actualizarEvento(id, datos) {
    return await apiPut('eventos', id, datos);
}

export async function eliminarEvento(id) {
    return await apiDelete('eventos', id);
}

export async function obtenerAgenda(eventoId) {
    return await apiGet(`eventos/agenda/${eventoId}`);
}
