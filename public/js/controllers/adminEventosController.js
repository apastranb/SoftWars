// ==========================================================================
// CONTROLLER: GESTIÓN DE EVENTOS — js/controllers/adminEventosController.js
// Consume GET /api/eventos, PUT /api/eventos/:id, DELETE /api/eventos/:id
// ==========================================================================

import { listarEventos, obtenerEvento, actualizarEvento, eliminarEvento } from '../services/eventos.service.js';
import { apiSesion, apiGet, apiPut, apiDelete, listaDe } from '../services/api.service.js';

const validaciones = window.validaciones;

let eventosCache = [];

const capitalizarTexto = (texto) => {
    if (!texto) return '-';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// ── CARGAR EVENTOS DESDE LA API ─────────────────────────────────────────

const cargarEventos = async () => {
    try {
        const respuesta = await apiGet('eventos');
        eventosCache = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
    } catch (error) {
        console.error('Error cargando eventos:', error);
        eventosCache = [];
    }
};

// ── RENDERIZAR TABLA ────────────────────────────────────────────────────

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
        const eventoId = evento._id || evento.id || evento.codigo;
        const cupoTexto = `${evento.cupoActual || 0} / ${evento.cupoMax || 0}`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${eventoId}"></td>
            <td><a href="detalle-evento.html?id=${eventoId}" class="link-evento-id" target="_blank">${evento.codigo || eventoId}</a></td>
            <td>${evento.nombre}</td>
            <td>${capitalizarTexto(evento.categoria)}</td>
            <td>
                <select class="tableSelectStatus" data-id="${eventoId}">
                    <option value="Disponible" ${evento.estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
                    <option value="Llena" ${evento.estado === 'Llena' ? 'selected' : ''}>Llena</option>
                    <option value="Cancelada" ${evento.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    <option value="Finalizada" ${evento.estado === 'Finalizada' ? 'selected' : ''}>Finalizada</option>
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

    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) selectAllCb.checked = false;

    // Cambio de estado via dropdown
    tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const nuevoEstado = e.target.value;
            try {
                await apiPut('eventos', id, { estado: nuevoEstado });
                // Actualizar cache local
                const ev = eventosCache.find(ev => (ev._id || ev.id || ev.codigo) === id);
                if (ev) ev.estado = nuevoEstado;
                validaciones.exito('Estado actualizado', `El evento se marcó como "${nuevoEstado}".`);
            } catch (error) {
                // apiPut ya muestra el error
            }
        });
    });
};

// ── FILTROS ─────────────────────────────────────────────────────────────

const aplicarFiltros = () => {
    const textoBusqueda = document.getElementById('searchInput').value.trim().toLowerCase();
    const categoriaFiltro = document.getElementById('eventsAdminFilterCategory').value;
    const estadoFiltro = document.getElementById('eventAdminFilterStatus').value;
    const fechaFiltro = document.getElementById('eventsFiltersDate').value;

    const filtrados = eventosCache.filter((evento) => {
        const coincideTexto = !textoBusqueda ||
            evento.nombre.toLowerCase().includes(textoBusqueda) ||
            evento.lugar.toLowerCase().includes(textoBusqueda) ||
            (evento.responsable && evento.responsable.toLowerCase().includes(textoBusqueda)) ||
            (evento.codigo && evento.codigo.toLowerCase().includes(textoBusqueda));

        const coincideCategoria = !categoriaFiltro || 
            evento.categoria.toLowerCase() === categoriaFiltro.toLowerCase();
        const coincideEstado = !estadoFiltro || 
            evento.estado.toLowerCase() === estadoFiltro.toLowerCase();
        const coincideFecha = !fechaFiltro ||
            evento.fechaInicio === fechaFiltro ||
            evento.fechaFin === fechaFiltro;

        return coincideTexto && coincideCategoria && coincideEstado && coincideFecha;
    });

    renderizarTabla(filtrados);
};

// ── OBTENER IDs SELECCIONADOS ───────────────────────────────────────────

const obtenerIdsSeleccionados = () => {
    const checkboxes = document.querySelectorAll('.row-check:checked');
    return Array.from(checkboxes).map(cb => cb.dataset.id);
};

// ── EDITAR EVENTO ───────────────────────────────────────────────────────

const editarEventoSeleccionado = () => {
    const ids = obtenerIdsSeleccionados();
    if (ids.length === 0) {
        validaciones.alerta('Seleccione un evento', 'Debe seleccionar un evento para editar.', 'warning');
        return;
    }
    if (ids.length > 1) {
        validaciones.alerta('Solo uno a la vez', 'Solo puede editar un evento a la vez.', 'warning');
        return;
    }
    window.location.href = `admin-crear-evento.html?editar=${ids[0]}`;
};

// ── ELIMINAR EVENTOS ────────────────────────────────────────────────────

const eliminarEventosSeleccionados = async () => {
    const ids = obtenerIdsSeleccionados();
    if (ids.length === 0) {
        validaciones.alerta('Seleccione eventos', 'Seleccione al menos un evento para eliminar.', 'warning');
        return;
    }

    const confirmado = await validaciones.confirmar('¿Eliminar evento(s)?', `Se eliminarán ${ids.length} evento(s). Esta acción no se puede deshacer.`);
    if (!confirmado) return;

    let eliminados = 0;
    for (const id of ids) {
        try {
            await apiDelete('eventos', id);
            eliminados++;
        } catch (error) {
            // apiDelete ya muestra el error (409 si tiene dependencias)
        }
    }

    if (eliminados > 0) {
        await cargarEventos();
        aplicarFiltros();
        validaciones.exito('Eventos eliminados', `${eliminados} evento(s) eliminado(s) o cancelado(s).`);
    }
};

// ── PANEL DE DETALLE ────────────────────────────────────────────────────

const actualizarPanelDetalle = async () => {
    const panel = document.getElementById('evento-detalle-panels');
    const agendaDiv = document.getElementById('agenda-contenido');
    const presentadoresDiv = document.getElementById('presentadores-contenido');
    const standsDiv = document.getElementById('stands-evento-contenido');
    const ids = obtenerIdsSeleccionados();

    if (ids.length === 0) {
        panel.classList.add('oculto');
        return;
    }

    panel.classList.remove('oculto');

    if (ids.length > 1) {
        const msg = '<p class="detalle-placeholder">Seleccione un solo evento para ver detalles.</p>';
        agendaDiv.innerHTML = msg;
        presentadoresDiv.innerHTML = msg;
        standsDiv.innerHTML = msg;
        return;
    }

    // Cargar detalle del evento con actividades, oradores y stands
    try {
        const respuesta = await apiGet(`eventos/${ids[0]}`);
        const evento = respuesta.data || respuesta;
        const actividades = evento.actividades || [];
        const oradores = evento.oradores || [];
        const stands = evento.stands || [];

        // Agenda
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

        // Presentadores
        if (oradores.length === 0) {
            presentadoresDiv.innerHTML = '<p class="detalle-placeholder">No hay presentadores asignados.</p>';
        } else {
            presentadoresDiv.innerHTML = oradores.map(o =>
                `<div class="participant-row-item">
                    <div class="user-avatar-circle"></div>
                    <div class="user-metadata">
                        <strong>${o.nombre}</strong>
                        <p>${o.especialidad || ''} · ${o.empresa || ''}</p>
                    </div>
                </div>`
            ).join('');
        }

        // Stands
        if (stands.length === 0) {
            standsDiv.innerHTML = '<p class="detalle-placeholder">No hay stands asignados a este evento.</p>';
        } else {
            standsDiv.innerHTML = stands.map(s =>
                `<div class="participant-row-item">
                    <div class="user-avatar-circle"></div>
                    <div class="user-metadata">
                        <strong>${s.nombre}</strong>
                        <p>${s.encargado || ''} · ${s.empresa || ''}</p>
                    </div>
                </div>`
            ).join('');
        }
    } catch (error) {
        const msg = '<p class="detalle-placeholder">Error al cargar detalles.</p>';
        agendaDiv.innerHTML = msg;
        presentadoresDiv.innerHTML = msg;
        standsDiv.innerHTML = msg;
    }
};

// ── INICIALIZADOR ───────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión contra el servidor
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

    // Nombre y rol en el header
    document.getElementById('headerUserName').textContent = usuario.nombre || 'Administrador';
    document.getElementById('headerUserRol').textContent = usuario.rol || '';

    // Cargar datos y render inicial
    await cargarEventos();
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
