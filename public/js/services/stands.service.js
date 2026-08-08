// ==========================================================================
// SERVICE: STANDS — js/services/stands.service.js
// Operaciones de API para stands.
// ==========================================================================

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, listaDe } from './api.service.js';

export async function listarStands(params = {}) {
    const respuesta = await apiGet('stands', params);
    return listaDe(respuesta);
}

export async function obtenerStand(id) {
    return await apiGet(`stands/${id}`);
}

export async function crearStand(datos) {
    return await apiPost('stands', datos);
}

export async function actualizarStand(id, datos) {
    return await apiPut('stands', id, datos);
}

export async function cambiarEstadoStand(id, estado) {
    return await apiPatch(`stands/${id}/estado`, { estado });
}

export async function eliminarStand(id) {
    return await apiDelete('stands', id);
}
