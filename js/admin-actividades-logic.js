// ==========================================================================
// MÓDULO: GESTIÓN DE ACTIVIDADES
// Usa window.db.actividades de data-store.js como fuente de datos.
// Validaciones centralizadas en validaciones.js
// ==========================================================================

let actividadEditandoId = null;

// ── RENDERIZADO DE TABLA ────────────────────────────────────────────────

const renderizarTablaActividades = (datosAFiltrar) => {
    const datos = datosAFiltrar || window.db.actividades;
    const tablaBody = document.getElementById('tabla-actividades-body');
    if (!tablaBody) return;

    tablaBody.innerHTML = '';

    if (datos.length === 0) {
        tablaBody.innerHTML = '';
        const tablaVacia = document.getElementById('tabla-vacia');
        if (tablaVacia) tablaVacia.classList.remove('oculto');
        return;
    }

    const tablaVaciaEl = document.getElementById('tabla-vacia');
    if (tablaVaciaEl) tablaVaciaEl.classList.add('oculto');

    datos.forEach(actividad => {
        const cupoTexto = actividad.entradaLibre
            ? 'Entrada libre'
            : `${actividad.cupoOcupado || 0} / ${actividad.cupoMaximo}`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${actividad.id}"></td>
            <td>${actividad.id}</td>
            <td>${actividad.nombre}</td>
            <td>${actividad.categoria}</td>
            <td>${actividad.fecha}</td>
            <td>${actividad.horaInicio}</td>
            <td>${actividad.horaFin}</td>
            <td>${actividad.lugar}</td>
            <td>${cupoTexto}</td>
            <td>${obtenerNombreResponsable(actividad.responsableId)}</td>
            <td>
                <select class="tableSelectStatus" data-id="${actividad.id}">
                    <option value="Disponible" ${(actividad.estado || 'Disponible') === 'Disponible' ? 'selected' : ''}>Disponible</option>
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

    // Reset select all
    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) selectAllCb.checked = false;

    // Estado change listener
    tablaBody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const actividad = window.db.actividades.find(a => a.id === id);
            if (actividad) actividad.estado = e.target.value;
        });
    });
};

const obtenerNombreResponsable = (responsableId) => {
    if (!responsableId) return '—';
    const orador = window.db.oradores.find(o => o.id === responsableId);
    return orador ? orador.nombre : '—';
};

// ── MODAL ───────────────────────────────────────────────────────────────

const abrirModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) {
        modal.classList.remove('modal-hidden');
        modal.classList.add('active');
    }
};

const cerrarModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.add('modal-hidden');
    }
    document.getElementById('form-actividad-modal').reset();
    actividadEditandoId = null;
    validaciones.limpiarErrores();
};

// ── VALIDACIÓN DEL FORMULARIO ───────────────────────────────────────────

const validarFormularioActividad = () => {
    validaciones.limpiarErrores();
    let esValido = true;

    // Campos requeridos simples
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

    // Nombre mínimo 3 caracteres
    const nombre = document.getElementById('modal-nombre').value;
    if (nombre.trim() !== '' && !validaciones.validarNombre(nombre)) {
        validaciones.mostrarError('modal-nombre', 'El nombre debe tener al menos 3 caracteres.');
        esValido = false;
    }

    // Descripción (opcional, max 200)
    const descripcion = document.getElementById('modal-descripcion').value;
    if (!validaciones.validarDescripcion(descripcion, false)) {
        validaciones.mostrarError('modal-descripcion', 'La descripción no puede superar los 200 caracteres.');
        esValido = false;
    }

    // Cupo (requerido solo si no es entrada libre)
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

    // Fecha futura
    const fecha = document.getElementById('modal-fecha').value;
    if (fecha && !validaciones.validarFechaFutura(fecha)) {
        validaciones.mostrarError('modal-fecha', 'Seleccione una fecha posterior a hoy.');
        esValido = false;
    }

    // Hora fin > hora inicio
    const horaInicio = document.getElementById('modal-hora-inicio').value;
    const horaFin = document.getElementById('modal-hora-fin').value;
    if (horaInicio && horaFin && !validaciones.validarHorasOrden(horaInicio, horaFin)) {
        validaciones.mostrarError('modal-hora-fin', 'La hora de finalización debe ser posterior a la de inicio.');
        esValido = false;
    }

    return esValido;
};

// ── CONTROLADORES ───────────────────────────────────────────────────────

const controladorEditarActividad = (id) => {
    const actividad = window.db.actividades.find(act => act.id === id);
    if (!actividad) return;

    actividadEditandoId = id;

    document.getElementById('modal-titulo-accion').textContent = `Editar Actividad: ${id}`;
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

    abrirModal();
};

const controladorEliminarActividad = (id) => {
    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la actividad ${id}?`);
    if (confirmacion) {
        window.db.actividades = window.db.actividades.filter(act => act.id !== id);
        renderizarTablaActividades();
    }
};

// ── POBLAR SELECTS DINÁMICOS ────────────────────────────────────────────

const poblarSelectEventos = () => {
    const select = document.getElementById('modal-evento');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un evento</option>';
    window.db.eventos.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = ev.nombre;
        select.appendChild(opt);
    });
};

const poblarSelectResponsables = () => {
    const select = document.getElementById('modal-responsable');
    if (!select) return;
    select.innerHTML = '<option value="">Seleccione un responsable</option>';
    window.db.oradores.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = `${o.nombre} — ${o.especialidad}`;
        select.appendChild(opt);
    });
};

// ── PANEL DE DETALLE (encargado de la actividad seleccionada) ────────────

const actualizarPanelEncargado = () => {
    const panel = document.getElementById('actividad-detalle-panels');
    const contenido = document.getElementById('encargado-contenido');
    const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);

    // 0 seleccionados: ocultar panel
    if (seleccionados.length === 0) {
        panel.classList.add('oculto');
        return;
    }

    panel.classList.remove('oculto');

    // 2+ seleccionados: mostrar mensaje
    if (seleccionados.length > 1) {
        contenido.innerHTML = '<p class="detalle-placeholder">Seleccione una sola actividad para ver detalles.</p>';
        return;
    }

    // Exactamente 1 seleccionado: mostrar encargado
    const actividad = window.db.actividades.find(a => a.id === seleccionados[0]);

    if (!actividad || !actividad.responsableId) {
        contenido.innerHTML = '<p class="detalle-placeholder">Esta actividad no tiene un encargado asignado.</p>';
        return;
    }

    const orador = window.db.oradores.find(o => o.id === actividad.responsableId);
    if (!orador) {
        contenido.innerHTML = '<p class="detalle-placeholder">Encargado no encontrado.</p>';
        return;
    }

    contenido.innerHTML = `
        <div class="participant-row-item">
            <div class="user-avatar-circle"></div>
            <div class="user-metadata">
                <strong>${orador.nombre}</strong>
                <p>${orador.especialidad} · ${orador.empresa}</p>
                <p>${orador.correo} · ${orador.telefono}</p>
            </div>
        </div>
    `;
};

// ── BUSCADOR ────────────────────────────────────────────────────────────

const aplicarFiltrosActividades = () => {
    const termino = document.getElementById('buscar-actividad').value.toLowerCase().trim();
    const categoria = document.getElementById('filterCategoriaActividad').value;
    const estado = document.getElementById('filterEstadoActividad').value;
    const fecha = document.getElementById('filterFechaActividad').value;

    const filtrados = window.db.actividades.filter(act => {
        const coincideTexto = !termino ||
            act.nombre.toLowerCase().includes(termino) ||
            act.id.toLowerCase().includes(termino) ||
            act.lugar.toLowerCase().includes(termino) ||
            act.categoria.toLowerCase().includes(termino);

        const coincideCategoria = !categoria || act.categoria === categoria;
        const coincideEstado = !estado || act.estado === estado;
        const coincideFecha = !fecha || act.fecha === fecha;

        return coincideTexto && coincideCategoria && coincideEstado && coincideFecha;
    });

    renderizarTablaActividades(filtrados);
};

const inicializarBuscadorActividades = () => {
    document.getElementById('buscar-actividad')?.addEventListener('input', aplicarFiltrosActividades);
    document.getElementById('filterCategoriaActividad')?.addEventListener('change', aplicarFiltrosActividades);
    document.getElementById('filterEstadoActividad')?.addEventListener('change', aplicarFiltrosActividades);
    document.getElementById('filterFechaActividad')?.addEventListener('change', aplicarFiltrosActividades);
};

// ── TOOLBAR ─────────────────────────────────────────────────────────────

const inicializarToolbarActividades = () => {
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

    // Editar desde toolbar (solo 1 seleccionado)
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
            if (seleccionados.length === 0) {
                alert('Seleccione una actividad para editar.');
                return;
            }
            if (seleccionados.length > 1) {
                alert('Solo puede editar una actividad a la vez.');
                return;
            }
            controladorEditarActividad(seleccionados[0]);
        });
    }

    // Eliminar desde toolbar (1 o mas seleccionados)
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => {
            const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
            if (seleccionados.length === 0) {
                alert('Seleccione al menos una actividad para eliminar.');
                return;
            }
            const confirmar = confirm(`¿Eliminar ${seleccionados.length} actividad(es)? Esta acción no se puede deshacer.`);
            if (!confirmar) return;
            window.db.actividades = window.db.actividades.filter(a => !seleccionados.includes(a.id));
            renderizarTablaActividades();
        });
    }

    // Select all checkbox
    if (selectAllCb) {
        selectAllCb.addEventListener('change', (e) => {
            document.querySelectorAll('.row-check').forEach(cb => {
                cb.checked = e.target.checked;
            });
            actualizarPanelEncargado();
        });
    }

    // Detectar cambios en checkboxes individuales
    document.getElementById('tabla-actividades-body')?.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-check')) {
            actualizarPanelEncargado();
        }
    });

    btnCerrarX?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);
};

// ==========================================================================
// INICIALIZADOR PRINCIPAL
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión activa
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Cerrar sesión
    document.getElementById('btnLogOut').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('sesionEmail');
        localStorage.removeItem('sesionNombre');
        localStorage.removeItem('sesionRol');
        window.location.href = 'login.html';
    });

    // Nombre y rol en el header
    document.getElementById('headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.getElementById('headerUserRol').textContent = localStorage.getItem('sesionRol') || '';

    // Poblar selects al inicio
    poblarSelectEventos();
    poblarSelectResponsables();

    renderizarTablaActividades();
    inicializarBuscadorActividades();
    inicializarToolbarActividades();

    // Submit del formulario del modal
    document.getElementById('form-actividad-modal')?.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validarFormularioActividad()) return;

        const entradaLibre = document.getElementById('modal-entrada-libre').value === 'libre';

        if (actividadEditandoId) {
            const index = window.db.actividades.findIndex(act => act.id === actividadEditandoId);
            if (index !== -1) {
                window.db.actividades[index].eventoId = document.getElementById('modal-evento').value;
                window.db.actividades[index].nombre = document.getElementById('modal-nombre').value.trim();
                window.db.actividades[index].categoria = document.getElementById('modal-categoria').value;
                window.db.actividades[index].descripcion = document.getElementById('modal-descripcion').value.trim();
                window.db.actividades[index].fecha = document.getElementById('modal-fecha').value;
                window.db.actividades[index].horaInicio = document.getElementById('modal-hora-inicio').value;
                window.db.actividades[index].horaFin = document.getElementById('modal-hora-fin').value;
                window.db.actividades[index].lugar = document.getElementById('modal-lugar').value.trim();
                window.db.actividades[index].cupoMaximo = entradaLibre ? 0 : parseInt(document.getElementById('modal-cupo').value, 10);
                window.db.actividades[index].responsableId = document.getElementById('modal-responsable').value;
                window.db.actividades[index].visibilidad = document.getElementById('modal-visibilidad').value;
                window.db.actividades[index].entradaLibre = entradaLibre;
                window.db.actividades[index].incluyeRefrigerio = document.getElementById('modal-refrigerio').checked;
            }
            alert('¡Actividad actualizada con éxito!');
        } else {
            const nuevoId = `ACT-${String(window.db.actividades.length + 1).padStart(3, '0')}`;
            window.db.actividades.push({
                id: nuevoId,
                eventoId: document.getElementById('modal-evento').value,
                nombre: document.getElementById('modal-nombre').value.trim(),
                categoria: document.getElementById('modal-categoria').value,
                descripcion: document.getElementById('modal-descripcion').value.trim(),
                fecha: document.getElementById('modal-fecha').value,
                horaInicio: document.getElementById('modal-hora-inicio').value,
                horaFin: document.getElementById('modal-hora-fin').value,
                lugar: document.getElementById('modal-lugar').value.trim(),
                cupoMaximo: entradaLibre ? 0 : parseInt(document.getElementById('modal-cupo').value, 10),
                cupoOcupado: 0,
                responsableId: document.getElementById('modal-responsable').value,
                estado: 'Disponible',
                visibilidad: document.getElementById('modal-visibilidad').value,
                entradaLibre: entradaLibre,
                incluyeRefrigerio: document.getElementById('modal-refrigerio').checked
            });
            alert('¡Actividad registrada con éxito!');
        }

        renderizarTablaActividades();
        cerrarModal();
    });
});
