// ==========================================================================
// CONTROLLER DE STANDS — controllers/stands.controller.js
// Responsable: Josué Arroyo (SW-14)
//
// Requerimientos que implementa:
//   RF-14  Creación con categoría (Empresa / Personal) y datos de contacto.
//   RF-15  ID numérico automático con REINICIO ANUAL y estado gestionable
//          entre Aprobado y Cerrado.
//   RF-16  Edición limitada: se puede cambiar todo MENOS el correo
//          electrónico y el ID numérico.
//   RF-22  Búsqueda y filtros por nombre, estado, empresa o responsable.
//
// Sobre el ID anual (RF-15): cada stand guarda tres campos relacionados.
//     anio    → 2026            año al que pertenece la numeración
//     numero  → 1, 2, 3...      consecutivo que vuelve a 1 cada año
//     codigo  → "S-2026-001"    identificador legible que se muestra en el panel
// El consecutivo lo entrega utils/codigos.js con un contador atómico por año,
// de modo que dos administradores que registren un stand al mismo tiempo
// nunca reciban el mismo número.
// ==========================================================================

const { getDB } = require('../config/db');
const { siguienteNumeroStand } = require('../utils/codigos');
const { filtroPorId, conAlias, conAliasLista, busquedaTexto, aObjectId } = require('../utils/mongo');
const { errorNoEncontrado, errorConflicto, errorValidacion } = require('../utils/respuestas');
const { ESTADOS_STAND, CATEGORIAS_STAND } = require('../utils/catalogos');
const v = require('../utils/validaciones.server');

const COLECCION = 'stands';

/** RF-16 — campos que no se pueden modificar una vez creado el stand. */
const CAMPOS_INMUTABLES = ['correo', 'numero', 'anio', 'codigo'];

// ==========================================================================
// VALIDACIÓN (OB-04 — segunda barrera en el servidor)
// ==========================================================================

/**
 * Valida el cuerpo de un stand con las mismas reglas que el cliente.
 * @param {object} cuerpo - req.body
 * @param {boolean} [esEdicion=false]
 * @returns {object} Mapa { campo: mensaje }. Vacío si todo es válido.
 */
function validarStand(cuerpo, esEdicion = false) {
    const errores = {};
    const presente = campo => !esEdicion || cuerpo[campo] !== undefined;

    if (presente('nombre')) {
        if (!v.validarRequerido(cuerpo.nombre)) {
            errores.nombre = 'El nombre del stand es requerido.';
        } else if (!v.validarNombre(cuerpo.nombre)) {
            errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
        }
    }

    if (presente('encargado') && !v.validarRequerido(cuerpo.encargado)) {
        errores.encargado = 'El encargado del stand es requerido.';
    }

    if (presente('empresa') && !v.validarRequerido(cuerpo.empresa)) {
        errores.empresa = 'La empresa u organización es requerida.';
    }

    // El correo solo se valida al crear: RF-16 lo vuelve inmutable en edición.
    if (!esEdicion) {
        if (!v.validarRequerido(cuerpo.correo)) {
            errores.correo = 'El correo de contacto es requerido.';
        } else if (!v.validarCorreo(cuerpo.correo)) {
            errores.correo = 'Ingrese un correo válido (ej. contacto@empresa.com).';
        }
    }

    if (presente('telefono')) {
        if (!v.validarRequerido(cuerpo.telefono)) {
            errores.telefono = 'El teléfono de contacto es requerido.';
        } else if (!v.validarTelefono(cuerpo.telefono)) {
            errores.telefono = 'El teléfono debe tener 8 dígitos (ej. 8888-8888).';
        }
    }

    const descripcion = cuerpo.descripcion !== undefined ? cuerpo.descripcion : cuerpo.desc;
    if (!esEdicion || descripcion !== undefined) {
        if (!v.validarRequerido(descripcion)) {
            errores.descripcion = 'La descripción es requerida.';
        } else if (!v.validarDescripcion(descripcion, true)) {
            errores.descripcion = 'La descripción no puede superar los 200 caracteres.';
        }
    }

    // RF-14 — categoría obligatoria: Empresa o Personal.
    if (presente('categoria')) {
        if (!v.validarRequerido(cuerpo.categoria)) {
            errores.categoria = 'Debe seleccionar una categoría.';
        } else if (!v.validarEnCatalogo(cuerpo.categoria, CATEGORIAS_STAND)) {
            errores.categoria = `La categoría debe ser ${CATEGORIAS_STAND.join(' o ')}.`;
        }
    }

    // RF-15 — estado gestionable entre Aprobado y Cerrado.
    if (cuerpo.estado !== undefined && !v.validarEnCatalogo(cuerpo.estado, ESTADOS_STAND)) {
        errores.estado = `El estado debe ser ${ESTADOS_STAND.join(' o ')}.`;
    }

    if (!esEdicion && !v.validarRequerido(String(cuerpo.eventoId || ''))) {
        errores.eventoId = 'Debe seleccionar el evento al que pertenece el stand.';
    }

    return errores;
}

/**
 * Arma los campos editables del stand. Nunca incluye los campos inmutables
 * de RF-16, así que sirve tanto para crear como para actualizar.
 * @param {object} cuerpo - req.body ya validado.
 * @returns {object}
 */
function construirDocumento(cuerpo) {
    const descripcion = cuerpo.descripcion !== undefined ? cuerpo.descripcion : cuerpo.desc;

    return {
        nombre: v.limpiar(cuerpo.nombre),
        categoria: v.normalizarCatalogo(cuerpo.categoria, CATEGORIAS_STAND, 'empresa'),
        descripcion: v.limpiar(descripcion),
        encargado: v.limpiar(cuerpo.encargado),
        empresa: v.limpiar(cuerpo.empresa),
        telefono: v.normalizarTelefono(cuerpo.telefono),
        estado: v.normalizarCatalogo(cuerpo.estado, ESTADOS_STAND, 'Aprobado')
    };
}

// ==========================================================================
// ENDPOINTS
// ==========================================================================

/**
 * GET /api/stands
 * RF-22 — Filtros: ?q= &estado= &empresa= &encargado= &categoria= &eventoId= &anio=
 */
async function listar(req, res) {
    const { q, estado, empresa, encargado, categoria, eventoId, anio } = req.query;
    const filtro = {};

    if (q && q.trim()) {
        const texto = busquedaTexto(q);
        filtro.$or = [
            { nombre: texto }, { empresa: texto }, { encargado: texto },
            { codigo: texto }, { correo: texto }
        ];
    }
    if (estado) filtro.estado = v.normalizarCatalogo(estado, ESTADOS_STAND, estado);
    if (categoria) filtro.categoria = v.normalizarCatalogo(categoria, CATEGORIAS_STAND, categoria);
    if (empresa) filtro.empresa = busquedaTexto(empresa);
    if (encargado) filtro.encargado = busquedaTexto(encargado);
    if (eventoId) filtro.eventoId = aObjectId(eventoId) || eventoId;
    if (anio) filtro.anio = parseInt(anio, 10);

    const stands = await getDB().collection(COLECCION)
        .find(filtro)
        .sort({ anio: -1, numero: 1 })
        .toArray();

    res.json(conAliasLista(stands));
}

/** GET /api/stands/:id — acepta ObjectId o código legible (S-2026-001). */
async function obtener(req, res) {
    const stand = await getDB().collection(COLECCION).findOne(filtroPorId(req.params.id));
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');
    res.json(conAlias(stand));
}

/**
 * POST /api/stands — RF-14 y RF-15.
 * Genera el número consecutivo del año en curso y lo deja fijo de por vida.
 */
async function crear(req, res) {
    const errores = validarStand(req.body, false);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const db = getDB();
    const coleccion = db.collection(COLECCION);

    // El evento debe existir: MongoDB no valida claves foráneas.
    const eventoId = aObjectId(req.body.eventoId) || req.body.eventoId;
    const evento = await db.collection('eventos').findOne(
        aObjectId(req.body.eventoId) ? { _id: eventoId } : { codigo: String(eventoId) }
    );
    if (!evento) {
        throw errorValidacion({ eventoId: 'El evento seleccionado no existe.' });
    }

    // Un mismo correo no puede tener dos stands en el mismo evento.
    const correo = v.normalizarCorreo(req.body.correo);
    const duplicado = await coleccion.findOne({ correo: correo, eventoId: evento._id });
    if (duplicado) {
        throw errorConflicto(
            `El correo ${correo} ya tiene un stand registrado en este evento (${duplicado.codigo}).`
        );
    }

    // RF-15 — numeración anual.
    const { anio, numero, codigo } = await siguienteNumeroStand();

    const documento = {
        codigo: codigo,
        numero: numero,
        anio: anio,
        eventoId: evento._id,
        correo: correo,
        ...construirDocumento(req.body),
        fechaRegistro: new Date()
    };

    const resultado = await coleccion.insertOne(documento);
    res.status(201).json(conAlias({ _id: resultado.insertedId, ...documento }));
}

/**
 * PUT /api/stands/:id — RF-16.
 * Se puede modificar todo excepto el correo y el ID numérico. Si la petición
 * intenta cambiar alguno de esos campos, se responde 400 en lugar de
 * ignorarlo en silencio: así el error es visible durante las pruebas.
 */
async function actualizar(req, res) {
    const coleccion = getDB().collection(COLECCION);
    const stand = await coleccion.findOne(filtroPorId(req.params.id));
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');

    // RF-16 — rechazo explícito de cambios sobre campos inmutables.
    const intentos = CAMPOS_INMUTABLES.filter(campo => {
        if (req.body[campo] === undefined) return false;
        if (campo === 'correo') return v.normalizarCorreo(req.body.correo) !== stand.correo;
        return String(req.body[campo]) !== String(stand[campo]);
    });

    if (intentos.length > 0) {
        const etiquetas = { correo: 'el correo electrónico', numero: 'el ID numérico', anio: 'el año', codigo: 'el código' };
        throw errorValidacion({
            [intentos[0]]: `No se puede modificar ${intentos.map(c => etiquetas[c]).join(' ni ')} de un stand ya registrado (RF-16).`
        });
    }

    const errores = validarStand(req.body, true);
    if (Object.keys(errores).length > 0) throw errorValidacion(errores);

    const cambios = construirDocumento({ ...stand, ...req.body });

    if (req.body.eventoId !== undefined) {
        const eventoId = aObjectId(req.body.eventoId);
        if (eventoId) cambios.eventoId = eventoId;
    }

    cambios.fechaActualizacion = new Date();
    await coleccion.updateOne({ _id: stand._id }, { $set: cambios });

    const actualizado = await coleccion.findOne({ _id: stand._id });
    res.json(conAlias(actualizado));
}

/**
 * PATCH /api/stands/:id/estado — RF-15.
 * Cambia el estado entre Aprobado y Cerrado desde el <select> de la tabla.
 */
async function cambiarEstado(req, res) {
    const estado = v.normalizarCatalogo(req.body.estado, ESTADOS_STAND);
    if (!estado) {
        throw errorValidacion({ estado: `El estado debe ser ${ESTADOS_STAND.join(' o ')}.` });
    }

    const coleccion = getDB().collection(COLECCION);
    const stand = await coleccion.findOne(filtroPorId(req.params.id));
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');

    await coleccion.updateOne(
        { _id: stand._id },
        { $set: { estado: estado, fechaActualizacion: new Date() } }
    );

    res.json(conAlias({ ...stand, estado: estado }));
}

/**
 * DELETE /api/stands/:id — RF-37.
 * El stand no tiene registros dependientes, así que se elimina físicamente.
 */
async function eliminar(req, res) {
    const coleccion = getDB().collection(COLECCION);
    const stand = await coleccion.findOne(filtroPorId(req.params.id));
    if (!stand) throw errorNoEncontrado('El stand solicitado no existe.');

    await coleccion.deleteOne({ _id: stand._id });

    res.json({ mensaje: `El stand "${stand.nombre}" fue eliminado.`, codigo: stand.codigo });
}

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    CAMPOS_INMUTABLES,
    validarStand,
    construirDocumento
};
