// ==========================================================================
// MODULO: GESTION DE EVENTOS
// Usa window.db.eventos como fuente unica de datos.
// ==========================================================================

// UTILIDADES DE ALMACENAMIENTO (usa window.db.eventos como fuente unica)
const obtenerEventos = () => {
    return window.db.eventos;
};

const guardarEventos = (eventos) => {
    window.db.eventos = eventos;
};

// RENDERIZAR TABLA
const renderizarTabla = (lista) => {
    const tbody = document.getElementById('adminEventsTableBody');
    const tablaVacia = document.getElementById('tabla-vacia');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (lista.length === 0) {
        if (tablaVacia) tablaVacia.classList.remove('oculto');
        return;
    }

    if (tablaVacia) tablaVacia.classList.add('oculto');

    lista.forEach((evento) => {
        const indiceReal = evento._indiceOriginal;
        const cupoTexto = `${evento.cupoActual || 0} / ${evento.cupoMax || 0}`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><input type="checkbox" class="row-check" data-indice="${indiceReal}"></td>
            <td><a href="detalle-evento.html?id=${evento.id}" class="link-evento-id" target="_blank">${evento.id || `EV-${String(indiceReal + 1).padStart(3, '0')}`}</a></td>
            <td>${evento.nombre}</td>
            <td>${capitalizarTexto(evento.categoria)}</td>
            <td>
                <select class="tableSelectStatus" data-indice="${indiceReal}">
                    <option value="disponible" ${(evento.estado || 'disponible') === 'disponible' ? 'selected' : ''}>Disponible</option>
                    <option value="lleno" ${evento.estado === 'lleno' ? 'selected' : ''}>Lleno</option>
                    <option value="cancelado" ${evento.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                    <option value="finalizado" ${evento.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                </select>
            </td>
            <td>${evento.lugar}</td>
            <td>${evento.fechaInicio || '-'}</td>
            <td>${evento.fechaFin || '-'}</td>
            <td>${evento.horaInicio || '-'}</td>
            <td>${evento.horaFin || '-'}</td>
            <td>${cupoTexto}</td>
            <td>${capitalizarTexto(evento.tipoEntrada || '-')}</td>
            <td>${capitalizarTexto(evento.visibilidad || '-')}</td>
            <td>${evento.responsable || '-'}</td>
        `;
        tbody.appendChild(fila);
    });

    // Reset select all
    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) selectAllCb.checked = false;

    // Estado change listener
    tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const idx = parseInt(e.target.dataset.indice);
            const eventos = obtenerEventos();
            if (eventos[idx]) {
                eventos[idx].estado = e.target.value;
                guardarEventos(eventos);
                validaciones.exito('Estado actualizado', `El evento se marcó como "${e.target.value}".`);
            }
        });
    });
};

// UTILIDADES
const capitalizarTexto = (texto) => {
    if (!texto) return '-';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// FILTROS
const aplicarFiltros = () => {
    const textoBusqueda = document.getElementById('searchInput').value.trim().toLowerCase();
    const categoriaFiltro = document.getElementById('eventsAdminFilterCategory').value;
    const estadoFiltro = document.getElementById('eventAdminFilterStatus').value;
    const fechaFiltro = document.getElementById('eventsFiltersDate').value;

    const eventos = obtenerEventos();

    const filtrados = eventos
        .map((evento, indice) => ({ ...evento, _indiceOriginal: indice }))
        .filter((evento) => {
            const coincideTexto = !textoBusqueda ||
                evento.nombre.toLowerCase().includes(textoBusqueda) ||
                evento.lugar.toLowerCase().includes(textoBusqueda) ||
                (evento.responsable && evento.responsable.toLowerCase().includes(textoBusqueda)) ||
                (evento.id && evento.id.toLowerCase().includes(textoBusqueda));

            const coincideCategoria = !categoriaFiltro || evento.categoria === categoriaFiltro;
            const coincideEstado = !estadoFiltro || evento.estado === estadoFiltro;
            const coincideFecha = !fechaFiltro ||
                evento.fechaInicio === fechaFiltro ||
                evento.fechaFin === fechaFiltro;

            return coincideTexto && coincideCategoria && coincideEstado && coincideFecha;
        });

    renderizarTabla(filtrados);
};

// OBTENER INDICES SELECCIONADOS
const obtenerIndicesSeleccionados = () => {
    const checkboxes = document.querySelectorAll('.row-check:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.dataset.indice));
};

// EDITAR EVENTO SELECCIONADO (redirige a admin-crear-evento con parametro)
const editarEventoSeleccionado = () => {
    const indices = obtenerIndicesSeleccionados();
    if (indices.length === 0) {
        validaciones.alerta('Seleccione un evento', 'Debe seleccionar un evento para editar.', 'warning');
        return;
    }
    if (indices.length > 1) {
        validaciones.alerta('Solo uno a la vez', 'Solo puede editar un evento a la vez.', 'warning');
        return;
    }
    window.location.href = `admin-crear-evento.html?editar=${indices[0]}`;
};

// ELIMINAR EVENTOS SELECCIONADOS
const eliminarEventosSeleccionados = async () => {
    const indices = obtenerIndicesSeleccionados();
    if (indices.length === 0) {
        validaciones.alerta('Seleccione eventos', 'Seleccione al menos un evento para eliminar.', 'warning');
        return;
    }

    const confirmado = await validaciones.confirmar('¿Eliminar evento(s)?', `Se eliminarán ${indices.length} evento(s). Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    let eventos = obtenerEventos();
    indices.sort((a, b) => b - a).forEach(idx => {
        eventos.splice(idx, 1);
    });

    // Reasignar IDs correlativos
    eventos = eventos.map((ev, i) => {
        ev.id = 'EV-' + String(i + 1).padStart(3, '0');
        return ev;
    });

    guardarEventos(eventos);
    aplicarFiltros();
};

// PANEL DE DETALLE (agenda, presentadores, stands del evento seleccionado)
const actualizarPanelDetalle = () => {
    const panel = document.getElementById('evento-detalle-panels');
    const agendaDiv = document.getElementById('agenda-contenido');
    const presentadoresDiv = document.getElementById('presentadores-contenido');
    const standsDiv = document.getElementById('stands-evento-contenido');
    const seleccionados = obtenerIndicesSeleccionados();

    // 0 seleccionados: ocultar panel
    if (seleccionados.length === 0) {
        panel.classList.add('oculto');
        return;
    }

    panel.classList.remove('oculto');

    // 2+ seleccionados: mostrar mensaje
    if (seleccionados.length > 1) {
        const msg = '<p class="detalle-placeholder">Seleccione un solo evento para ver detalles.</p>';
        agendaDiv.innerHTML = msg;
        presentadoresDiv.innerHTML = msg;
        standsDiv.innerHTML = msg;
        return;
    }

    // Exactamente 1 seleccionado: mostrar detalle
    const eventos = obtenerEventos();
    const evento = eventos[seleccionados[0]];
    if (!evento) return;

    // Agenda: actividades del evento ordenadas por fecha/hora
    const actividades = window.db.actividades.filter(a => a.eventoId === evento.id);
    if (actividades.length === 0) {
        agendaDiv.innerHTML = '<p class="detalle-placeholder">No hay actividades registradas para este evento.</p>';
    } else {
        agendaDiv.innerHTML = actividades.map(a =>
            `<div class="timeline-block">
                <strong>${a.horaInicio} - ${a.horaFin} | ${a.nombre}</strong>
                <p>${a.lugar} ${a.incluyeRefrigerio ? '· <i class="bi bi-cup-hot"></i> Refrigerio' : ''}</p>
            </div>`
        ).join('');
    }

    // Presentadores: oradores vinculados al evento o a sus actividades
    const responsableIds = actividades.map(a => a.responsableId).filter(Boolean);
    const oradores = window.db.oradores.filter(o => responsableIds.includes(o.id));
    if (oradores.length === 0) {
        presentadoresDiv.innerHTML = '<p class="detalle-placeholder">No hay presentadores asignados.</p>';
    } else {
        presentadoresDiv.innerHTML = oradores.map(o =>
            `<div class="participant-row-item">
                <div class="user-avatar-circle"></div>
                <div class="user-metadata">
                    <strong>${o.nombre}</strong>
                    <p>${o.especialidad} · ${o.empresa}</p>
                </div>
            </div>`
        ).join('');
    }

    // Stands del evento
    const stands = window.db.stands.filter(s => s.eventoId === evento.id);
    if (stands.length === 0) {
        standsDiv.innerHTML = '<p class="detalle-placeholder">No hay stands asignados a este evento.</p>';
    } else {
        standsDiv.innerHTML = stands.map(s =>
            `<div class="participant-row-item">
                <div class="user-avatar-circle"></div>
                <div class="user-metadata">
                    <strong>${s.nombre}</strong>
                    <p>${s.encargado} · ${s.empresa}</p>
                </div>
            </div>`
        ).join('');
    }
};

// INICIALIZADOR PRINCIPAL
document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesion activa
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Cerrar sesion
    document.getElementById('btnLogOut').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await validaciones.confirmar('¿Cerrar sesión?', 'Se cerrará tu sesión actual.');
        if (!confirmar) return;
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('sesionEmail');
        localStorage.removeItem('sesionNombre');
        localStorage.removeItem('sesionRol');
        window.location.href = 'login.html';
    });

    // Nombre y rol en el header
    document.getElementById('headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.getElementById('headerUserRol').textContent = localStorage.getItem('sesionRol') || '';

    // Render inicial
    aplicarFiltros();

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        document.querySelectorAll('.row-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
        actualizarPanelDetalle();
    });

    // Detectar cambios en checkboxes individuales
    document.getElementById('adminEventsTableBody').addEventListener('change', (e) => {
        if (e.target.classList.contains('row-check') || e.target.type === 'checkbox') {
            actualizarPanelDetalle();
        }
    });

    // Toolbar buttons
    document.getElementById('btnEditarEvento').addEventListener('click', editarEventoSeleccionado);
    document.getElementById('btnEliminarEvento').addEventListener('click', eliminarEventosSeleccionados);

    // Filtros en tiempo real
    document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
    document.getElementById('eventsAdminFilterCategory').addEventListener('change', aplicarFiltros);
    document.getElementById('eventAdminFilterStatus').addEventListener('change', aplicarFiltros);
    document.getElementById('eventsFiltersDate').addEventListener('change', aplicarFiltros);
});
