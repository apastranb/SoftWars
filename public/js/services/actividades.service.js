// ==========================================================================
// SERVICE: ACTIVIDADES — js/services/actividades.service.js
// Operaciones de API para actividades.
// ==========================================================================

import { apiGet, apiPost, apiPut, apiDelete, listaDe } from './api.service.js';

export async function listarActividades(params = {}) {
    const respuesta = await apiGet('actividades', params);
    return listaDe(respuesta);
}

export async function obtenerActividad(id) {
    const respuesta = await apiGet(`actividades/${id}`);
    return respuesta.data || respuesta;
}

export async function crearActividad(datos) {
    return await apiPost('actividades', datos);
}

export async function actualizarActividad(id, datos) {
    return await apiPut('actividades', id, datos);
}

export async function eliminarActividad(id) {
    return await apiDelete('actividades', id);
}
