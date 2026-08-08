// ==========================================================================
// SERVICE: AUTH — js/services/auth.service.js
// Operaciones de API para autenticación.
// ==========================================================================

import { apiPost, apiSesion } from './api.service.js';

export async function login(email, password) {
    return await apiPost('auth/login', { email, password });
}

export async function logout() {
    return await apiPost('auth/logout', {});
}

export async function obtenerSesion() {
    return await apiSesion();
}

export async function cambiarContrasena(email, passwordActual, passwordNueva) {
    const respuesta = await fetch('/api/auth/contrasena', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, passwordActual, passwordNueva })
    });
    const datos = await respuesta.json();
    if (!respuesta.ok) {
        const error = new Error(datos.mensaje || 'Error al cambiar contraseña.');
        error.status = respuesta.status;
        error.datos = datos;
        throw error;
    }
    return datos;
}
