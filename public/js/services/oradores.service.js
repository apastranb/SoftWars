// ==========================================================================
// SERVICE: ORADORES — js/services/oradores.service.js
// Operaciones de API para oradores/responsables.
// ==========================================================================

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, listaDe } from './api.service.js';

export async function listarOradores(params = {}) {
    const respuesta = await apiGet('oradores', params);
    return listaDe(respuesta);
}

export async function obtenerOrador(id) {
    return await apiGet(`oradores/${id}`);
}

export async function crearOrador(datos) {
    return await apiPost('oradores', datos);
}

export async function actualizarOrador(id, datos) {
    return await apiPut('oradores', id, datos);
}

export async function cambiarEstadoOrador(id, estado) {
    return await apiPatch(`oradores/${id}/estado`, { estado });
}

export async function eliminarOrador(id) {
    return await apiDelete('oradores', id);
}
