// ==========================================================================
// CLIENTE HTTP CENTRALIZADO — public/js/api.js
// Responsable: Carlos Carballo (SW-18)
//
// Centraliza todas las peticiones fetch() a la API REST.
// Los archivos *-logic.js importan estas funciones en vez de acceder
// directamente a window.db.
//
// Uso:
//   const eventos = await apiGet('eventos', { categoria: 'Tecnológicas' });
//   const nuevo = await apiPost('eventos', datosEvento);
//   await apiPut('eventos', id, datosActualizados);
//   await apiDelete('eventos', id);
// ==========================================================================

const API_BASE = '/api';

/**
 * Ejecuta un GET y devuelve el JSON parseado.
 * @param {string} recurso - Nombre del recurso (ej: 'eventos', 'actividades')
 * @param {object} [params] - Query params opcionales (ej: { categoria: 'Deportivas', q: 'texto' })
 * @returns {Promise<object>} Respuesta parseada del servidor
 */
async function apiGet(recurso, params = {}) {
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
 * Ejecuta un POST con cuerpo JSON y devuelve el documento creado.
 * @param {string} recurso - Nombre del recurso
 * @param {object} datos - Cuerpo de la petición
 * @returns {Promise<object>} Respuesta parseada del servidor
 */
async function apiPost(recurso, datos) {
    const respuesta = await fetch(`${API_BASE}/${recurso}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await _procesarRespuesta(respuesta);
}

/**
 * Ejecuta un PUT para actualizar un documento existente.
 * @param {string} recurso - Nombre del recurso
 * @param {string} id - ID del documento a actualizar
 * @param {object} datos - Campos a actualizar
 * @returns {Promise<object>} Respuesta parseada del servidor
 */
async function apiPut(recurso, id, datos) {
    const respuesta = await fetch(`${API_BASE}/${recurso}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return await _procesarRespuesta(respuesta);
}

/**
 * Ejecuta un DELETE para eliminar un documento.
 * @param {string} recurso - Nombre del recurso
 * @param {string} id - ID del documento a eliminar
 * @returns {Promise<object>} Respuesta parseada del servidor
 */
async function apiDelete(recurso, id) {
    const respuesta = await fetch(`${API_BASE}/${recurso}/${id}`, {
        method: 'DELETE'
    });
    return await _procesarRespuesta(respuesta);
}

// ==========================================================================
// FUNCIONES INTERNAS
// ==========================================================================

/**
 * Procesa la respuesta del servidor.
 * Si el status es exitoso (2xx), retorna los datos.
 * Si hay error, muestra el mensaje con SweetAlert2 y lanza excepción.
 */
async function _procesarRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => null);

    if (respuesta.ok) {
        return datos;
    }

    // Traducir códigos HTTP a mensajes amigables
    const mensaje = (datos && datos.mensaje) || _mensajePorCodigo(respuesta.status);
    _mostrarError(mensaje, respuesta.status);

    // Lanzar error para que el caller pueda hacer catch si lo necesita
    const error = new Error(mensaje);
    error.status = respuesta.status;
    error.datos = datos;
    throw error;
}

/**
 * Mensaje por defecto según el código HTTP cuando el servidor no envía uno.
 */
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

/**
 * Muestra el error con SweetAlert2 usando el wrapper de validaciones.js
 * si está disponible, o directamente con Swal como fallback.
 */
function _mostrarError(mensaje, status) {
    const titulo = status === 401 ? 'Acceso denegado' :
                   status === 409 ? 'Conflicto' :
                   status === 404 ? 'No encontrado' :
                   'Error';

    if (typeof validaciones !== 'undefined' && validaciones.alerta) {
        validaciones.alerta(titulo, mensaje, 'error');
    } else if (typeof Swal !== 'undefined') {
        Swal.fire({ title: titulo, text: mensaje, icon: 'error', confirmButtonColor: '#164a98' });
    } else {
        console.error(`[${status}] ${mensaje}`);
    }
}
