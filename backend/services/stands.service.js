// ==========================================================================
// SERVICE: STANDS — backend/services/stands.service.js
// Operaciones de MongoDB para la colección stands.
// Responsable original: Josué Arroyo (SW-14)
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteNumeroStand } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const { sellarAuditoria, sellarActualizacion } = require('../utils/auditoria');
const { errorConflicto, errorValidacion } = require('../utils/respuestas');
const v = require('../utils/validaciones.server');
const { COLECCION, CAMPOS_INMUTABLES, ESTADOS, CATEGORIAS, ESTADO_DEFAULT, CATEGORIA_DEFAULT } = require('../models/stand.model');

// ==========================================================================
// HELPERS INTERNOS
// ==========================================================================

/**
 * Arma los campos editables del stand.
 */
function construirDocumento(cuerpo) {
    const descripcion = cuerpo.descripcion !== undefined ? cuerpo.descripcion : cuerpo.desc;

    return {
        nombre: v.limpiar(cuerpo.nombre),
        categoria: v.normalizarCatalogo(cuerpo.categoria, CATEGORIAS, CATEGORIA_DEFAULT),
        descripcion: v.limpiar(descripcion),
        encargado: v.limpiar(cuerpo.encargado),
        empresa: v.limpiar(cuerpo.empresa),
        telefono: v.normalizarTelefono(cuerpo.telefono),
        estado: v.normalizarCatalogo(cuerpo.estado, ESTADOS, ESTADO_DEFAULT)
    };
}

// ==========================================================================
// OPERACIONES CRUD
// ==========================================================================

/**
 * GET — Listar stands con filtros y búsqueda (RF-22).
 */
async function listarStands(filtros = {}) {
    const { q, estado, empresa, encargado, categoria, eventoId, anio } = filtros;
    const filtro = {};

    if (q && q.trim()) {
        const texto = busquedaTexto(q);
        filtro.$or = [
            { nombre: texto }, { empresa: texto }, { encargado: texto },
            { codigo: texto }, { correo: texto }
        ];
    }
    if (estado) filtro.estado = v.normalizarCatalogo(estado, ESTADOS, estado);
    if (categoria) filtro.categoria = v.normalizarCatalogo(categoria, CATEGORIAS, categoria);
    if (empresa) filtro.empresa = busquedaTexto(empresa);
    if (encargado) filtro.encargado = busquedaTexto(encargado);
    if (eventoId) filtro.eventoId = aObjectId(eventoId) || eventoId;
    if (anio) filtro.anio = parseInt(anio, 10);

    const stands = await getDB().collection(COLECCION)
        .find(filtro)
        .sort({ anio: -1, numero: 1 })
        .toArray();

    return conAliasLista(stands);
}

/**
 * GET — Obtener un stand por _id o código legible.
 */
async function obtenerStand(id) {
    const stand = await getDB().collection(COLECCION).findOne(filtroPorId(id));
    if (!stand) return null;
    return conAlias(stand);
}

/**
 * POST — Crear un stand (RF-14, RF-15).
 */
async function crearStand(datos, req) {
    const db = getDB();
    const coleccion = db.collection(COLECCION);

    // Verificar que el evento padre existe
    const eventoId = aObjectId(datos.eventoId) || datos.eventoId;
    const evento = await db.collection('eventos').findOne(
        aObjectId(datos.eventoId) ? { _id: eventoId } : { codigo: String(eventoId) }
    );
    if (!evento) {
        throw errorValidacion({ eventoId: 'El evento seleccionado no existe.' });
    }

    // Validar duplicado de correo en el mismo evento
    const correo = v.normalizarCorreo(datos.correo);
    const duplicado = await coleccion.findOne({ correo, eventoId: evento._id });
    if (duplicado) {
        throw errorConflicto(
            `El correo ${correo} ya tiene un stand registrado en este evento (${duplicado.codigo}).`
        );
    }

    // RF-15 — numeración anual
    const { anio, numero, codigo } = await siguienteNumeroStand();

    const documento = {
        codigo,
        numero,
        anio,
        eventoId: evento._id,
        correo,
        ...construirDocumento(datos),
        fechaRegistro: new Date(),
        ...sellarAuditoria(req)
    };

    const resultado = await coleccion.insertOne(documento);
    return conAlias({ _id: resultado.insertedId, ...documento });
}

/**
 * PUT — Actualizar stand (RF-16: todo excepto correo e ID numérico).
 */
async function actualizarStand(id, datos, req) {
    const coleccion = getDB().collection(COLECCION);
    const stand = await coleccion.findOne(filtroPorId(id));
    if (!stand) return null;

    // RF-16 — rechazo explícito de cambios sobre campos inmutables
    const intentos = CAMPOS_INMUTABLES.filter(campo => {
        if (datos[campo] === undefined) return false;
        if (campo === 'correo') return v.normalizarCorreo(datos.correo) !== stand.correo;
        return String(datos[campo]) !== String(stand[campo]);
    });

    if (intentos.length > 0) {
        const etiquetas = { correo: 'el correo electrónico', numero: 'el ID numérico', anio: 'el año', codigo: 'el código' };
        throw errorValidacion({
            [intentos[0]]: `No se puede modificar ${intentos.map(c => etiquetas[c]).join(' ni ')} de un stand ya registrado (RF-16).`
        });
    }

    const cambios = construirDocumento({ ...stand, ...datos });

    if (datos.eventoId !== undefined) {
        const eventoId = aObjectId(datos.eventoId);
        if (eventoId) cambios.eventoId = eventoId;
    }

    Object.assign(cambios, sellarActualizacion(req));
    await coleccion.updateOne({ _id: stand._id }, { $set: cambios });

    const actualizado = await coleccion.findOne({ _id: stand._id });
    return conAlias(actualizado);
}

/**
 * PATCH — Cambiar estado (Aprobado/Cerrado).
 */
async function cambiarEstado(id, nuevoEstado, req) {
    const coleccion = getDB().collection(COLECCION);
    const stand = await coleccion.findOne(filtroPorId(id));
    if (!stand) return null;

    await coleccion.updateOne(
        { _id: stand._id },
        { $set: { estado: nuevoEstado, ...sellarActualizacion(req) } }
    );

    return conAlias({ ...stand, estado: nuevoEstado });
}

/**
 * DELETE — Eliminar stand.
 */
async function eliminarStand(id) {
    const coleccion = getDB().collection(COLECCION);
    const stand = await coleccion.findOne(filtroPorId(id));
    if (!stand) return { encontrado: false };

    await coleccion.deleteOne({ _id: stand._id });
    return { encontrado: true, nombre: stand.nombre, codigo: stand.codigo };
}

module.exports = {
    listarStands,
    obtenerStand,
    crearStand,
    actualizarStand,
    cambiarEstado,
    eliminarStand,
    construirDocumento
};
