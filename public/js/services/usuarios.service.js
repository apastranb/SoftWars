// ==========================================================================
// SERVICE: USUARIOS — js/services/usuarios.service.js
// Operaciones de API para usuarios (administradores).
// ==========================================================================

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, listaDe } from './api.service.js';

export async function listarUsuarios(params = {}) {
    const respuesta = await apiGet('usuarios', params);
    return listaDe(respuesta);
}

export async function obtenerUsuario(id) {
    return await apiGet(`usuarios/${id}`);
}

export async function crearUsuario(datos) {
    return await apiPost('usuarios', datos);
}

export async function actualizarUsuario(id, datos) {
    return await apiPut('usuarios', id, datos);
}

export async function cambiarEstadoUsuario(id, estado) {
    return await apiPatch(`usuarios/${id}/estado`, { estado });
}

export async function eliminarUsuario(id) {
    return await apiDelete('usuarios', id);
}
