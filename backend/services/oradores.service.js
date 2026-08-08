// ==========================================================================
// SERVICE: ORADORES — backend/services/oradores.service.js
// Operaciones de MongoDB para la colección oradores.
// Responsable original: Josué Arroyo (SW-12)
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteCodigo } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const { sellarAuditoria, sellarActualizacion } = require('../utils/auditoria');
const { errorConflicto } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { COLECCION, ESTADOS, ESTADO_DEFAULT, ESTADOS_ACTIVIDAD_VIGENTE } = require('../models/orador.model');

// ==========================================================================
// HELPERS INTERNOS
// ==========================================================================

/**
 * Arma el documento que se guarda en MongoDB a partir del cuerpo recibido.
 * @param {object} cuerpo - req.body ya validado.
 * @returns {object} Campos listos para insertar o actualizar.
 */
function construirDocumento(cuerpo) {
    const telefonos = v.extraerTelefonos(cuerpo);
    const organizacion = cuerpo.empresa !== undefined ? cuerpo.empresa : cuerpo.organizacion;

    const documento = {
        nombre: v.limpiar(cuerpo.nombre),
        correo: v.normalizarCorreo(cuerpo.correo),
        telefonos: telefonos,
        telefono: telefonos[0] || '',
        especialidad: v.limpiar(cuerpo.especialidad),
        empresa: v.limpiar(organizacion),
        biografia: v.limpiar(cuerpo.biografia),
        foto: cuerpo.foto || null
    };

    if (cuerpo.eventoId !== undefined) {
        documento.eventoId = aObjectId(cuerpo.eventoId) || v.limpiar(cuerpo.eventoId) || null;
    }
    if (cuerpo.estado !== undefined) {
        documento.estado = v.normalizarCatalogo(cuerpo.estado, ESTADOS, ESTADO_DEFAULT);
    }

    return documento;
}

// ==========================================================================
// REGLA DE NEGOCIO RF-13 — ACTIVIDADES ACTIVAS
// ==========================================================================

/**
 * Cuenta las actividades vigentes que tienen a este orador como responsable.
 */
async function contarActividadesActivas(oradorId) {
    return getDB().collection('actividades').countDocuments({
        responsableId: oradorId,
        estado: { $in: ESTADOS_ACTIVIDAD_VIGENTE }
    });
}

/**
 * Devuelve el conjunto de ids de oradores que tienen actividades vigentes.
 */
async function idsConActividadesActivas() {
    const ids = await getDB().collection('actividades').distinct('responsableId', {
        estado: { $in: ESTADOS_ACTIVIDAD_VIGENTE },
        responsableId: { $ne: null }
    });
    return new Set(ids.map(String));
}

// ==========================================================================
// OPERACIONES CRUD
// ==========================================================================

/**
 * GET — Listar oradores con filtros y búsqueda.
 */
async function listarOradores(filtros = {}) {
    const { q, estado, eventoId, especialidad, fechaRegistro } = filtros;
    const filtro = {};

    if (q && q.trim()) {
        const texto = busquedaTexto(q);
        filtro.$or = [
            { nombre: texto }, { correo: texto }, { empresa: texto },
            { especialidad: texto }, { codigo: texto }
        ];
    }
    if (estado) filtro.estado = v.normalizarCatalogo(estado, ESTADOS, estado);
    if (especialidad) filtro.especialidad = busquedaTexto(especialidad);

    if (fechaRegistro) {
        const inicio = new Date(`${fechaRegistro}T00:00:00`);
        if (!isNaN(inicio.getTime())) {
            const fin = new Date(inicio);
            fin.setDate(fin.getDate() + 1);
            filtro.fechaRegistro = { $gte: inicio, $lt: fin };
        }
    }

    if (eventoId) filtro.eventoId = aObjectId(eventoId) || eventoId;

    const oradores = await getDB().collection(COLECCION)
        .find(filtro)
        .sort({ codigo: 1 })
        .toArray();

    const bloqueados = await idsConActividadesActivas();
    return conAliasLista(oradores).map(orador => ({
        ...orador,
        tieneActividadesActivas: bloqueados.has(String(orador._id)),
        puedeEliminarse: !bloqueados.has(String(orador._id))
    }));
}

/**
 * GET — Obtener un orador por _id o código legible.
 */
async function obtenerOrador(id) {
    const orador = await getDB().collection(COLECCION).findOne(filtroPorId(id));
    if (!orador) return null;

    const actividadesActivas = await contarActividadesActivas(orador._id);
    return {
        ...conAlias(orador),
        actividadesActivas,
        tieneActividadesActivas: actividadesActivas > 0,
        puedeEliminarse: actividadesActivas === 0
    };
}

/**
 * POST — Crear un nuevo orador (RF-12).
 */
async function crearOrador(datos, req) {
    const coleccion = getDB().collection(COLECCION);
    const correo = v.normalizarCorreo(datos.correo);

    const duplicado = await coleccion.findOne({ correo });
    if (duplicado) {
        throw errorConflicto(`Ya existe un orador registrado con el correo ${correo}.`);
    }

    const documento = {
        codigo: await siguienteCodigo('OR', COLECCION),
        ...construirDocumento(datos),
        estado: v.normalizarCatalogo(datos.estado, ESTADOS, ESTADO_DEFAULT),
        eventoId: aObjectId(datos.eventoId) || v.limpiar(datos.eventoId) || null,
        fechaRegistro: new Date(),
        ...sellarAuditoria(req)
    };

    const resultado = await coleccion.insertOne(documento);
    return conAlias({ _id: resultado.insertedId, ...documento });
}

/**
 * PUT — Actualizar datos del orador.
 */
async function actualizarOrador(id, datos, req) {
    const coleccion = getDB().collection(COLECCION);
    const orador = await coleccion.findOne(filtroPorId(id));
    if (!orador) return null;

    // Fusionar datos existentes con los nuevos para edición parcial
    const fusionado = { ...orador, ...datos };
    if (datos.telefono !== undefined || datos.telefono2 !== undefined) {
        delete fusionado.telefonos;
    }

    const cambios = construirDocumento(fusionado);

    // Validar unicidad del correo si cambia
    if (cambios.correo !== orador.correo) {
        const duplicado = await coleccion.findOne({
            correo: cambios.correo,
            _id: { $ne: orador._id }
        });
        if (duplicado) {
            throw errorConflicto(`Ya existe otro orador registrado con el correo ${cambios.correo}.`);
        }
    }

    Object.assign(cambios, sellarActualizacion(req));
    await coleccion.updateOne({ _id: orador._id }, { $set: cambios });

    const actualizado = await coleccion.findOne({ _id: orador._id });
    return conAlias(actualizado);
}

/**
 * PATCH — Cambiar estado (Activo/Inactivo). Siempre permitido (RF-13).
 */
async function cambiarEstado(id, nuevoEstado, req) {
    const coleccion = getDB().collection(COLECCION);
    const orador = await coleccion.findOne(filtroPorId(id));
    if (!orador) return null;

    await coleccion.updateOne(
        { _id: orador._id },
        { $set: { estado: nuevoEstado, ...sellarActualizacion(req) } }
    );

    return conAlias({ ...orador, estado: nuevoEstado });
}

/**
 * DELETE — Eliminar orador (RF-13: bloqueado si tiene actividades activas).
 */
async function eliminarOrador(id) {
    const coleccion = getDB().collection(COLECCION);
    const orador = await coleccion.findOne(filtroPorId(id));
    if (!orador) return { encontrado: false };

    const activas = await contarActividadesActivas(orador._id);
    if (activas > 0) {
        return {
            encontrado: true,
            bloqueado: true,
            actividadesActivas: activas,
            nombre: orador.nombre
        };
    }

    await coleccion.deleteOne({ _id: orador._id });

    // Limpiar referencia en actividades finalizadas/canceladas
    await getDB().collection('actividades').updateMany(
        { responsableId: orador._id },
        { $set: { responsableId: null } }
    );

    return { encontrado: true, bloqueado: false, nombre: orador.nombre, codigo: orador.codigo };
}

module.exports = {
    listarOradores,
    obtenerOrador,
    crearOrador,
    actualizarOrador,
    cambiarEstado,
    eliminarOrador,
    // Exportados para reutilización en postulaciones y pruebas
    construirDocumento,
    contarActividadesActivas,
    ESTADOS_ACTIVIDAD_VIGENTE
};
