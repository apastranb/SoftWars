// ==========================================================================
// MÓDULO: GESTIÓN DE ACTIVIDADES — admin-actividades-logic.js
// Consume GET/POST/PUT/DELETE /api/actividades, GET /api/eventos, GET /api/oradores
// ==========================================================================

let actividadEditandoId = null;
let actividadesCache = [];
let eventosCache = [];
let oradoresCache = [];

// ── CARGA DE DATOS ──────────────────────────────────────────────────────

const cargarActividades = async () => {
    try {
        const resp = await apiGet('actividades');
        actividadesCache = Array.isArray(resp) ? resp : (resp.data || []);
    } catch (e) { actividadesCache = []; }
};

const cargarEventos = async () => {
    try {
        const resp = await apiGet('eventos');
        eventosCache = Array.isArray(resp) ? resp : (resp.data || []);
    } catch (e) { eventosCache = []; }
};

const cargarOradores = async () => {
    try {
        const resp = await apiGet('oradores');
        oradoresCache = Array.isArray(resp) ? resp : (resp.data || []);
    } catch (e) { oradoresCache = []; }
};

// ── RENDERIZADO DE TABLA ────────────────────────────────────────────────

const renderizarTablaActividades = (datos) => {
    const lista = datos || actividadesCache;
    const tablaBody = document.getElementById('tabla-actividades-body');
    if (!tablaBody) return;

    tablaBody.innerHTML = '';
    const tablaVacia = document.getElementById('tabla-vacia');

    if (lista.length === 0) {
        if (tablaVacia) tablaVacia.classList.remove('oculto');
        return;
    }
    if (tablaVacia) tablaVacia.classList.add('oculto');

    lista.forEach(actividad => {
        const actId = actividad._id || actividad.id || actividad.codigo;
        const cupoTexto = actividad.entradaLibre
            ? 'Entrada libre'
            : `${actividad.cupoOcupado || 0} / ${actividad.cupoMaximo}`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${actId}"></td>
            <td>${actividad.codigo || actId}</td>
            <td>${actividad.nombre}</td>
            <td>${actividad.categoria}</td>
            <td>${actividad.fecha}</td>
            <td>${actividad.horaInicio}</td>
            <td>${actividad.horaFin}</td>
            <td>${actividad.lugar}</td>
            <td>${cupoTexto}</td>
            <td>${obtenerNombreResponsable(actividad.responsableId)}</td>
            <td>
                <select class="tableSelectStatus" data-id="${actId}">
                    <option value="Disponible" ${actividad.estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
                    <option value="Llena" ${actividad.estado === 'Llena' ? 'selected' : ''}>Llena</option>
                    <option value="Cancelada" ${actividad.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    <option value="Finalizada" ${actividad.estado === 'Finalizada' ? 'selected' : ''}>Finalizada</option>
                </select>
            </td>
            <td>${actividad.visibilidad || '-'}</td>
            <td>${actividad.entradaLibre ? 'Libre' : 'De Pago'}</td>
        `;
        tablaBody.appendChild(fila);
    });

    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) selectAllCb.checked = false;

    // Cambio de estado via API
    tablaBody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            try {
                await apiPut('actividades', id, { estado: e.target.value });
                const act = actividadesCache.find(a => (a._id || a.id || a.codigo) === id);
                if (act) act.estado = e.target.value;
                validaciones.exito('Estado actualizado', `La actividad se marcó como "${e.target.value}".`);
            } catch (error) { /* apiPut ya muestra el error */ }
        });
    });
};

const obtenerNombreResponsable = (responsableId) => {
    if (!responsableId) return '—';
    const orador = oradoresCache.find(o =>
        (o._id || o.id || o.codigo) === String(responsableId) ||
        String(o._id) === String(responsableId)
    );
    return orador ? orador.nombre : '—';
};

// ── MODAL ───────────────────────────────────────────────────────────────

const abrirModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) {
        modal.classList.remove('modal-hidden');
        modal.classList.add('modal-visible');
    }
};

const cerrarModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) {
        modal.classList.remove('modal-visible');
        modal.classList.add('modal-hidden');
    }
    document.getElementById('form-actividad-modal').reset();
    actividadEditandoId = null;
    validaciones.limpiarErrores();
};

// ── VALIDACIÓN ──────────────────────────────────────────────────────────

const validarFormularioActividad = () => {
    validaciones.limpiarErrores();
    let esValido = true;

    const camposRequeridos = [
        { id: 'modal-evento', mensaje: 'Debe seleccionar un evento padre.' },
        { id: 'modal-nombre', mensaje: 'El nombre de la actividad es obligatorio.' },
        { id: 'modal-categoria', mensaje: 'Debe seleccionar una categoría.' },
        { id: 'modal-fecha', mensaje: 'La fecha es obligatoria.' },
        { id: 'modal-hora-inicio', mensaje: 'La hora de inicio es obligatoria.' },
        { id: 'modal-hora-fin', mensaje: 'La hora de finalización es obligatoria.' },
        { id: 'modal-lugar', mensaje: 'El lugar es obligatorio.' },
        { id: 'modal-responsable', mensaje: 'Debe seleccionar un responsable.' },
        { id: 'modal-visibilidad', mensaje: 'Debe seleccionar la visibilidad.' }
    ];

    camposRequeridos.forEach(campo => {
        if (!validaciones.validarCampo(campo.id, validaciones.validarRequerido, campo.mensaje)) {
            esValido = false;
        }
    });

    const nombre = document.getElementById('modal-nombre').value;
    if (nombre.trim() !== '' && !validaciones.validarNombre(nombre)) {
        validaciones.mostrarError('modal-nombre', 'El nombre debe tener al menos 3 caracteres.');
        esValido = false;
    }

    const descripcion = document.getElementById('modal-descripcion').value;
    if (!validaciones.validarDescripcion(descripcion, false)) {
        validaciones.mostrarError('modal-descripcion', 'La descripción no puede superar los 200 caracteres.');
        esValido = false;
    }

    const esEntradaLibre = document.getElementById('modal-entrada-libre').value === 'libre';
    const cupoInput = document.getElementById('modal-cupo');
    if (!esEntradaLibre) {
        if (!validaciones.validarRequerido(cupoInput.value)) {
            validaciones.mostrarError('modal-cupo', 'El cupo máximo es obligatorio.');
            esValido = false;
        } else if (!validaciones.validarCupo(cupoInput.value)) {
            validaciones.mostrarError('modal-cupo', 'Ingrese un cupo válido (número entero positivo).');
            esValido = false;
        }
    }

    const fecha = document.getElementById('modal-fecha').value;
    if (fecha && !validaciones.validarFechaFutura(fecha)) {
        validaciones.mostrarError('modal-fecha', 'Seleccione una fecha posterior a hoy.');
        esValido = false;
    }

    const horaInicio = document.getElementById('modal-hora-inicio').value;
    const horaFin = document.getElementById('modal-hora-fin').value;
    if (horaInicio && horaFin && !validaciones.validarHorasOrden(horaInicio, horaFin)) {
        validaciones.mostrarError('modal-hora-fin', 'La hora de finalización debe ser posterior a la de inicio.');
        esValido = false;
    }

    return esValido;
};

// ── EDITAR ACTIVIDAD ────────────────────────────────────────────────────

const controladorEditarActividad = (id) => {
    const actividad = actividadesCache.find(a => (a._id || a.id || a.codigo) === id);
    if (!actividad) return;

    actividadEditandoId = id;

    document.getElementById('modal-titulo-accion').textContent = `Editar Actividad: ${actividad.codigo || id}`;
    document.getElementById('btn-guardar-modal').textContent = 'Guardar Cambios';

    document.getElementById('modal-evento').value = actividad.eventoId || '';
    document.getElementById('modal-nombre').value = actividad.nombre;
    document.getElementById('modal-categoria').value = actividad.categoria;
    document.getElementById('modal-descripcion').value = actividad.descripcion || '';
    document.getElementById('modal-fecha').value = actividad.fecha;
    document.getElementById('modal-hora-inicio').value = actividad.horaInicio;
    document.getElementById('modal-hora-fin').value = actividad.horaFin;
    document.getElementById('modal-lugar').value = actividad.lugar;
    document.getElementById('modal-cupo').value = actividad.cupoMaximo || '';
    document.getElementById('modal-responsable').value = actividad.responsableId || '';
    document.getElementById('modal-visibilidad').value = actividad.visibilidad || '';
    document.getElementById('modal-entrada-libre').value = actividad.entradaLibre ? 'libre' : 'pago';
    document.getElementById('modal-refrigerio').checked = actividad.incluyeRefrigerio || false;

    poblarSelectEventos();
    poblarSelectResponsables();
    abrirModal();
};

// ── POBLAR SELECTS ──────────────────────────────────────────────────────

const poblarSelectEventos = () => {
    const select = document.getElementById('modal-evento');
    if (!select) return;
    const valorActual = select.value;
    select.innerHTML = '<option value="">Seleccione un evento</option>';
    eventosCache.forEach(ev => {
        const evId = ev._id || ev.id || ev.codigo;
        const opt = document.createElement('option');
        opt.value = evId;
        opt.textContent = ev.nombre;
        if (evId === valorActual) opt.selected = true;
        select.appendChild(opt);
    });
};

const poblarSelectResponsables = () => {
    const select = document.getElementById('modal-responsable');
    if (!select) return;
    const valorActual = select.value;
    select.innerHTML = '<option value="">Seleccione un responsable</option>';
    oradoresCache.forEach(o => {
        const oId = o._id || o.id || o.codigo;
        const opt = document.createElement('option');
        opt.value = oId;
        opt.textContent = `${o.nombre} — ${o.especialidad || ''}`;
        if (oId === valorActual || String(o._id) === valorActual) opt.selected = true;
        select.appendChild(opt);
    });
};

// ── PANEL DE DETALLE (encargado) ────────────────────────────────────────

const actualizarPanelEncargado = () => {
    const panel = document.getElementById('actividad-detalle-panels');
    const contenido = document.getElementById('encargado-contenido');
    const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);

    if (seleccionados.length === 0) {
        panel.classList.add('oculto');
        return;
    }

    panel.classList.remove('oculto');

    if (seleccionados.length > 1) {
        contenido.innerHTML = '<p class="detalle-placeholder">Seleccione una sola actividad para ver detalles.</p>';
        return;
    }

    const actividad = actividadesCache.find(a => (a._id || a.id || a.codigo) === seleccionados[0]);
    if (!actividad || !actividad.responsableId) {
        contenido.innerHTML = '<p class="detalle-placeholder">Esta actividad no tiene un encargado asignado.</p>';
        return;
    }

    const orador = oradoresCache.find(o =>
        String(o._id) === String(actividad.responsableId) ||
        (o.id || o.codigo) === String(actividad.responsableId)
    );

    if (!orador) {
        contenido.innerHTML = '<p class="detalle-placeholder">Encargado no encontrado.</p>';
        return;
    }

    contenido.innerHTML = `
        <div class="participant-row-item">
            <div class="user-avatar-circle"></div>
            <div class="user-metadata">
                <strong>${orador.nombre}</strong>
                <p>${orador.especialidad || ''} · ${orador.empresa || ''}</p>
                <p>${orador.correo || ''} · ${orador.telefonos ? orador.telefonos[0] : ''}</p>
            </div>
        </div>
    `;
};

// ── FILTROS ─────────────────────────────────────────────────────────────

const aplicarFiltrosActividades = () => {
    const termino = document.getElementById('buscar-actividad').value.toLowerCase().trim();
    const categoria = document.getElementById('filterCategoriaActividad').value;
    const estado = document.getElementById('filterEstadoActividad').value;
    const fecha = document.getElementById('filterFechaActividad').value;

    const filtrados = actividadesCache.filter(act => {
        const coincideTexto = !termino ||
            act.nombre.toLowerCase().includes(termino) ||
            (act.codigo && act.codigo.toLowerCase().includes(termino)) ||
            act.lugar.toLowerCase().includes(termino) ||
            act.categoria.toLowerCase().includes(termino);

        const coincideCategoria = !categoria || act.categoria === categoria;
        const coincideEstado = !estado || act.estado === estado;
        const coincideFecha = !fecha || act.fecha === fecha;

        return coincideTexto && coincideCategoria && coincideEstado && coincideFecha;
    });

    renderizarTablaActividades(filtrados);
};

// ── INICIALIZADOR ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión
    const usuario = await apiSesion();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    // Cerrar sesión
    document.getElementById('btnLogOut').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await validaciones.confirmar('¿Cerrar sesión?', 'Se cerrará tu sesión actual.');
        if (!confirmar) return;
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (err) {}
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Header
    document.getElementById('headerUserName').textContent = usuario.nombre || 'Administrador';
    document.getElementById('headerUserRol').textContent = usuario.rol || '';

    // Cargar datos
    await Promise.all([cargarActividades(), cargarEventos(), cargarOradores()]);
    poblarSelectEventos();
    poblarSelectResponsables();

    renderizarTablaActividades();

    // Filtros
    document.getElementById('buscar-actividad')?.addEventListener('input', aplicarFiltrosActividades);
    document.getElementById('filterCategoriaActividad')?.addEventListener('change', aplicarFiltrosActividades);
    document.getElementById('filterEstadoActividad')?.addEventListener('change', aplicarFiltrosActividades);
    document.getElementById('filterFechaActividad')?.addEventListener('change', aplicarFiltrosActividades);

    // Toolbar
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const btnCerrarX = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');
    const btnEditar = document.getElementById('btn-editar-actividad');
    const btnEliminar = document.getElementById('btn-eliminar-actividad');
    const selectAllCb = document.getElementById('selectAll');

    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {
            document.getElementById('modal-titulo-accion').textContent = 'Registrar Actividad';
            document.getElementById('btn-guardar-modal').textContent = 'Registrar';
            poblarSelectEventos();
            poblarSelectResponsables();
            abrirModal();
        });
    }

    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
            if (seleccionados.length === 0) {
                validaciones.alerta('Seleccione una actividad', 'Debe seleccionar una actividad para editar.', 'warning');
                return;
            }
            if (seleccionados.length > 1) {
                validaciones.alerta('Solo una a la vez', 'Solo puede editar una actividad a la vez.', 'warning');
                return;
            }
            controladorEditarActividad(seleccionados[0]);
        });
    }

    if (btnEliminar) {
        btnEliminar.addEventListener('click', async () => {
            const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
            if (seleccionados.length === 0) {
                validaciones.alerta('Seleccione actividades', 'Seleccione al menos una actividad para eliminar.', 'warning');
                return;
            }
            const confirmar = await validaciones.confirmar('¿Eliminar actividad(es)?', `Se eliminarán ${seleccionados.length} actividad(es).`);
            if (!confirmar) return;

            let eliminados = 0;
            for (const id of seleccionados) {
                try {
                    await apiDelete('actividades', id);
                    eliminados++;
                } catch (error) { /* apiDelete ya muestra el error */ }
            }
            if (eliminados > 0) {
                await cargarActividades();
                renderizarTablaActividades();
                validaciones.exito('Eliminadas', `${eliminados} actividad(es) eliminada(s).`);
            }
        });
    }

    if (selectAllCb) {
        selectAllCb.addEventListener('change', (e) => {
            document.querySelectorAll('.row-check').forEach(cb => { cb.checked = e.target.checked; });
            actualizarPanelEncargado();
        });
    }

    document.getElementById('tabla-actividades-body')?.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-check')) actualizarPanelEncargado();
    });

    btnCerrarX?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);

    // Submit del formulario modal (crear o editar)
    document.getElementById('form-actividad-modal')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validarFormularioActividad()) return;

        const entradaLibre = document.getElementById('modal-entrada-libre').value === 'libre';

        const datos = {
            eventoId: document.getElementById('modal-evento').value,
            nombre: document.getElementById('modal-nombre').value.trim(),
            categoria: document.getElementById('modal-categoria').value,
            descripcion: document.getElementById('modal-descripcion').value.trim(),
            fecha: document.getElementById('modal-fecha').value,
            horaInicio: document.getElementById('modal-hora-inicio').value,
            horaFin: document.getElementById('modal-hora-fin').value,
            lugar: document.getElementById('modal-lugar').value.trim(),
            cupoMaximo: entradaLibre ? 0 : parseInt(document.getElementById('modal-cupo').value, 10),
            responsableId: document.getElementById('modal-responsable').value,
            visibilidad: document.getElementById('modal-visibilidad').value,
            entradaLibre: entradaLibre,
            incluyeRefrigerio: document.getElementById('modal-refrigerio').checked
        };

        try {
            if (actividadEditandoId) {
                await apiPut('actividades', actividadEditandoId, datos);
                validaciones.exito('Actividad actualizada', 'La actividad se actualizó con éxito.');
            } else {
                await apiPost('actividades', datos);
                validaciones.exito('Actividad registrada', 'La actividad se registró con éxito.');
            }
            await cargarActividades();
            renderizarTablaActividades();
            cerrarModal();
        } catch (error) {
            // apiPost/apiPut ya muestra el error (409 conflicto horario, 400 validación, etc.)
        }
    });
});
