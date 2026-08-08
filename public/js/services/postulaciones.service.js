// ==========================================================================
// SERVICE: POSTULACIONES — js/services/postulaciones.service.js
// Operaciones de API para postulaciones de oradores.
// ==========================================================================

import { apiGet, apiPost, apiPatch, apiDelete, listaDe } from './api.service.js';

export async function listarPostulaciones(params = {}) {
    const respuesta = await apiGet('postulaciones', params);
    return listaDe(respuesta);
}

export async function obtenerPostulacion(id) {
    return await apiGet(`postulaciones/${id}`);
}

export async function crearPostulacion(datos) {
    return await apiPost('postulaciones', datos);
}

export async function aprobarPostulacion(id) {
    return await apiPatch(`postulaciones/${id}/aprobar`);
}

export async function rechazarPostulacion(id, motivo = '') {
    return await apiPatch(`postulaciones/${id}/rechazar`, { motivo });
}

export async function eliminarPostulacion(id) {
    return await apiDelete('postulaciones', id);
}
