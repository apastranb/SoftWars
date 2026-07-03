// UTILIDADES DE ALMACENAMIENTO

const obtenerEventos = () => {
    const datos = sessionStorage.getItem('eventos');
    return datos ? JSON.parse(datos) : [];
};

const guardarEventos = (eventos) => {
    sessionStorage.setItem('eventos', JSON.stringify(eventos));
};


// RENDERIZAR TABLA
// Recibe la lista ya filtrada, cada elemento trae su _indiceOriginal del array real

const renderizarTabla = (lista) => {
    const tbody = document.getElementById('adminEventsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="14" style="text-align:center; padding: 2rem; color: var(--text-muted, #888);">
                    No hay eventos registrados.
                </td>
            </tr>`;
        return;
    }

    lista.forEach((evento) => {
        // Usamos el índice real del array completo, no el de la lista filtrada
        const indiceReal = evento._indiceOriginal;
        const disponible = evento.cupoMax - evento.cupoActual;

        // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY
        const formatearFecha = (f) => {
            if (!f) return '-';
            const [y, m, d] = f.split('-');
            return `${d}/${m}/${y}`;
        };

        // Formatear hora de HH:MM a HH:MM AM/PM
        const formatearHora = (h) => {
            if (!h) return '-';
            const [hh, mm] = h.split(':');
            const hora = parseInt(hh);
            const sufijo = hora >= 12 ? 'PM' : 'AM';
            const hora12 = hora % 12 === 0 ? 12 : hora % 12;
            return `${String(hora12).padStart(2, '0')}:${mm} ${sufijo}`;
        };

        // Capitalizar primera letra de categoría
        const capitalizarCategoria = (cat) => {
            if (!cat) return '-';
            return cat.charAt(0).toUpperCase() + cat.slice(1);
        };

        const fila = document.createElement('tr');
        // data-indice apunta siempre al índice real en sessionStorage
        fila.dataset.indice = indiceReal;

        fila.innerHTML = `
            <td>
                <input type="checkbox" class="checkboxEvento" data-indice="${indiceReal}" title="Seleccionar evento" />
            </td>
            <td>${evento.id || `EV-${String(indiceReal + 1).padStart(3, '0')}`}</td>
            <td>${evento.nombre}</td>
            <td>
                <select class="tableSelectStatus" data-indice="${indiceReal}">
                    <option value="disponible" ${evento.estado === 'disponible' ? 'selected' : ''}>Disponible</option>
                    <option value="cancelado"  ${evento.estado === 'cancelado'  ? 'selected' : ''}>Cancelado</option>
                    <option value="finalizado" ${evento.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                    <option value="lleno"      ${evento.estado === 'lleno'      ? 'selected' : ''}>Lleno</option>
                </select>
            </td>
            <td>${evento.lugar}</td>
            <td>${capitalizarCategoria(evento.categoria)}</td>
            <td>${formatearFecha(evento.fechaInicio)}</td>
            <td>${formatearFecha(evento.fechaFin)}</td>
            <td>${formatearHora(evento.horaInicio)}</td>
            <td>${formatearHora(evento.horaFin)}</td>
            <td>${evento.cupoMax}</td>
            <td>${evento.cupoActual}</td>
            <td>${disponible}</td>
            <td>${evento.responsable}</td>
        `;

        tbody.appendChild(fila);
    });

    // Escuchar cambios de estado: usa data-indice (índice real) para guardar en el lugar correcto
    tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const idxReal = parseInt(e.target.dataset.indice);
            const eventos = obtenerEventos();
            if (eventos[idxReal]) {
                eventos[idxReal].estado = e.target.value;
                guardarEventos(eventos);
            }
        });
    });
};


// OBTENER ÍNDICES REALES DE EVENTOS SELECCIONADOS

const obtenerIndicesSeleccionados = () => {
    const checkboxes = document.querySelectorAll('.checkboxEvento:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.dataset.indice));
};


// FILTROS

const aplicarFiltros = () => {
    const textoBusqueda = document.getElementById('searchInput').value.trim().toLowerCase();
    const categoriaFiltro = document.getElementById('eventsAdminFilterCategory').value;
    const estadoFiltro = document.getElementById('eventAdminFilterStatus').value;
    const fechaFiltro = document.getElementById('eventsFiltersDate').value;

    const eventos = obtenerEventos();

    // Anotar el índice real antes de filtrar
    const filtrados = eventos
        .map((evento, indice) => ({ ...evento, _indiceOriginal: indice }))
        .filter((evento) => {
            const coincideTexto = !textoBusqueda ||
                evento.nombre.toLowerCase().includes(textoBusqueda) ||
                evento.lugar.toLowerCase().includes(textoBusqueda) ||
                evento.responsable.toLowerCase().includes(textoBusqueda) ||
                (evento.id && evento.id.toLowerCase().includes(textoBusqueda));

            const coincideCategoria = !categoriaFiltro || evento.categoria === categoriaFiltro;
            const coincideEstado    = !estadoFiltro    || evento.estado     === estadoFiltro;
            const coincideFecha     = !fechaFiltro     ||
                evento.fechaInicio === fechaFiltro ||
                evento.fechaFin    === fechaFiltro;

            return coincideTexto && coincideCategoria && coincideEstado && coincideFecha;
        });

    renderizarTabla(filtrados);
};


// SELECCIONAR / DESELECCIONAR TODOS

const inicializarCheckboxGlobal = () => {
    const checkboxTodos = document.getElementById('selectAllEvents');
    if (!checkboxTodos) return;

    checkboxTodos.addEventListener('change', () => {
        document.querySelectorAll('.checkboxEvento').forEach(cb => {
            cb.checked = checkboxTodos.checked;
        });
    });

    // Si se desmarca uno individualmente, quitar el check del global
    document.getElementById('adminEventsTableBody').addEventListener('change', (e) => {
        if (e.target.classList.contains('checkboxEvento') && !e.target.checked) {
            checkboxTodos.checked = false;
        }
    });
};


// ELIMINAR EVENTOS SELECCIONADOS

const eliminarEventosSeleccionados = () => {
    const indices = obtenerIndicesSeleccionados();

    if (indices.length === 0) {
        alert('Seleccione al menos un evento para eliminar.');
        return;
    }

    const confirmacion = confirm(`¿Está seguro de que desea eliminar ${indices.length} evento(s)?`);
    if (!confirmacion) return;

    let eventos = obtenerEventos();
    // Eliminar en orden inverso para no desplazar índices restantes
    indices.sort((a, b) => b - a).forEach(idx => {
        eventos.splice(idx, 1);
    });

    // Reasignar IDs correlativosdespués de eliminar
    eventos = eventos.map((ev, i) => {
        ev.id = 'EV-' + String(i + 1).padStart(3, '0');
        return ev;
    });

    guardarEventos(eventos);
    document.getElementById('selectAllEvents').checked = false;
    aplicarFiltros();
};


// EDITAR EVENTO SELECCIONADO

const editarEventoSeleccionado = () => {
    const indices = obtenerIndicesSeleccionados();

    if (indices.length === 0) {
        alert('Seleccione un evento para editar.');
        return;
    }
    if (indices.length > 1) {
        alert('Seleccione solo un evento a la vez para editar.');
        return;
    }

    window.location.href = `admin-crear-evento.html?editar=${indices[0]}`;
};


// INICIALIZADOR PRINCIPAL

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

    aplicarFiltros();
    inicializarCheckboxGlobal();

    // Filtros en tiempo real
    document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
    document.getElementById('buscar-evento').addEventListener('click', aplicarFiltros);
    document.getElementById('eventsAdminFilterCategory').addEventListener('change', aplicarFiltros);
    document.getElementById('eventAdminFilterStatus').addEventListener('change', aplicarFiltros);
    document.getElementById('eventsFiltersDate').addEventListener('change', aplicarFiltros);

    // Botón eliminar
    document.getElementById('btnEliminarEvento').addEventListener('click', eliminarEventosSeleccionados);

    // Botón editar
    document.getElementById('btnEditarEvento').addEventListener('click', editarEventoSeleccionado);
});
