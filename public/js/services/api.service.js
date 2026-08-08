// ==========================================================================
// SERVICIO HTTP CENTRALIZADO (ES Module) — js/services/api.service.js
// Responsable: Carlos Carballo (SW-18)
//
// Centraliza todas las peticiones fetch() a la API REST.
// Los controllers de página importan funciones de aquí.
//
// validaciones.js y SweetAlert2 se cargan como scripts globales,
// por lo que se acceden vía window.
// ==========================================================================

const API_BASE = '/api';

/**
 * Ejecuta un GET y devuelve el JSON parseado.
 */
export async function apiGet(recurso, params = {}) {
    const url = new URL(`${API_BASE}/${recurso}`, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
        }
    });

    const respuesta = await fetch(url.toString());
    return await _procesarRespuesta(respuesta);
}

/**
 * Ejecuta un POST con cuerpo JSON.
 */
export async function apiPost(recurso, datos) {
    const respuesta = await fetch(`${API_BASE}/${recurso}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await _procesarRespuesta(respuesta);
}

/**
 * Ejecuta un PUT para actualizar un documento.
 */
export async function apiPut(recurso, id, datos) {
    const respuesta = await fetch(`${API_BASE}/${recurso}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await _procesarRespuesta(respuesta);
}

/**
 * Ejecuta un PATCH sobre una sub-ruta.
 */
export async function apiPatch(ruta, datos = {}) {
    const respuesta = await fetch(`${API_BASE}/${ruta}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await _procesarRespuesta(respuesta);
}

/**
 * Ejecuta un DELETE.
 */
export async function apiDelete(recurso, id) {
    const respuesta = await fetch(`${API_BASE}/${recurso}/${id}`, {
        method: 'DELETE'
    });
    return await _procesarRespuesta(respuesta);
}

/**
 * Comprueba si hay una sesión activa sin mostrar errores.
 */
export async function apiSesion() {
    try {
        const respuesta = await fetch(`${API_BASE}/auth/sesion`);
        if (!respuesta.ok) return null;
        const datos = await respuesta.json();
        return datos.usuario || null;
    } catch (error) {
        return null;
    }
}

/**
 * Devuelve siempre un arreglo a partir de la respuesta de un listado.
 */
export function listaDe(respuesta, nombre) {
    if (Array.isArray(respuesta)) return respuesta;
    if (!respuesta || typeof respuesta !== 'object') return [];
    if (Array.isArray(respuesta.data)) return respuesta.data;
    if (nombre && Array.isArray(respuesta[nombre])) return respuesta[nombre];
    return Object.values(respuesta).find(Array.isArray) || [];
}

// ==========================================================================
// FUNCIONES INTERNAS
// ==========================================================================

async function _procesarRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => null);

    if (respuesta.ok) {
        return datos;
    }

    const mensaje = (datos && datos.mensaje) || _mensajePorCodigo(respuesta.status);
    _mostrarError(mensaje, respuesta.status);

    const error = new Error(mensaje);
    error.status = respuesta.status;
    error.datos = datos;
    throw error;
}

function _mensajePorCodigo(status) {
    const mensajes = {
        400: 'Los datos enviados no son válidos.',
        401: 'No tiene autorización. Inicie sesión.',
        404: 'El recurso solicitado no existe.',
        409: 'Conflicto: el registro ya existe o el cupo está lleno.',
        500: 'Error interno del servidor. Intente más tarde.'
    };
    return mensajes[status] || `Error inesperado (${status}).`;
}

function _mostrarError(mensaje, status) {
    const titulo = status === 401 ? 'Acceso denegado' :
        status === 409 ? 'Conflicto' :
        status === 404 ? 'No encontrado' :
        'Error';

    if (typeof window.validaciones !== 'undefined' && window.validaciones.alerta) {
        window.validaciones.alerta(titulo, mensaje, 'error');
    } else if (typeof window.Swal !== 'undefined') {
        window.Swal.fire({ title: titulo, text: mensaje, icon: 'error', confirmButtonColor: '#164a98' });
    } else {
        console.error(`[${status}] ${mensaje}`);
    }
}
