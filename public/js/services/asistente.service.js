// ==========================================================================
// SERVICE: ASISTENTE IA — js/services/asistente.service.js
// Operaciones de API para el asistente de IA (Gemini).
// ==========================================================================

import { apiPost } from './api.service.js';

export async function mejorarDescripcion(texto, nombre = '', categoria = '') {
    return await apiPost('asistente/descripcion', { texto, nombre, categoria });
}
