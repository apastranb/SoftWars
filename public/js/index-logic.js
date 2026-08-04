// ==========================================================================
// INDEX: Catalogo publico de eventos
// Renderiza cards desde window.db.eventos (solo publicos)
// ==========================================================================

const EVENTOS_POR_PAGINA = 8;
let eventosMostrados = 0;

// Capitalizar texto
const capitalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// Obtener eventos publicos filtrados
const obtenerEventosFiltrados = () => {
    const busqueda = document.getElementById('searchInput').value.trim().toLowerCase()
        || document.getElementById('searchInputHero').value.trim().toLowerCase();
    const categoria = document.getElementById('categoryFilter').value;
    const fecha = document.getElementById('dateFilter').value;

    return window.db.eventos.filter(ev => {
        // Solo eventos publicos
        if (ev.visibilidad !== 'publico') return false;

        const coincideTexto = !busqueda ||
            ev.nombre.toLowerCase().includes(busqueda) ||
            ev.lugar.toLowerCase().includes(busqueda) ||
            ev.descripcion.toLowerCase().includes(busqueda) ||
            (ev.responsable && ev.responsable.toLowerCase().includes(busqueda));

        const coincideCategoria = !categoria || ev.categoria === categoria;
        const coincideFecha = !fecha || ev.fechaInicio === fecha || ev.fechaFin === fecha;

        return coincideTexto && coincideCategoria && coincideFecha;
    });
};

// Renderizar cards de eventos
const renderizarEventos = (resetear) => {
    const container = document.getElementById('eventsContainer');
    const btnCargarMas = document.getElementById('loadMoreButton');
    const eventosFiltrados = obtenerEventosFiltrados();

    if (resetear) {
        container.innerHTML = '';
        eventosMostrados = 0;
    }

    if (eventosFiltrados.length === 0) {
        container.innerHTML = '<p class="detalle-placeholder">No se encontraron eventos disponibles.</p>';
        btnCargarMas.classList.add('oculto');
        return;
    }

    const eventosAMostrar = eventosFiltrados.slice(eventosMostrados, eventosMostrados + EVENTOS_POR_PAGINA);

    eventosAMostrar.forEach(evento => {
        const cupoTexto = evento.tipoEntrada === 'libre'
            ? 'Entrada Libre'
            : `${evento.cupoActual || 0} / ${evento.cupoMax} cupos`;

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';

        col.innerHTML = `
            <div class="card eventsCard h-100">
                <img src="${evento.imagen || 'img/img-placeholder.png'}" class="card-img-top" alt="${evento.nombre}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${evento.nombre}</h5>
                    <div class="eventsCardInfo">
                        <span><i class="bi bi-calendar"></i> ${evento.fechaInicio} | ${evento.horaInicio} - ${evento.horaFin}</span>
                        <span><i class="bi bi-geo-alt-fill"></i> ${evento.lugar}</span>
                        <span><i class="bi bi-tag"></i> ${capitalizarTexto(evento.categoria)}</span>
                        <span><i class="bi bi-people-fill"></i> ${cupoTexto}</span>
                    </div>
                    <div class="mt-auto pt-3">
                        <a href="pages/detalle-evento.html?id=${evento.id}" class="btn btn-primary w-100">Ver detalles <i class="bi bi-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    eventosMostrados += eventosAMostrar.length;

    // Mostrar/ocultar boton cargar mas
    if (eventosMostrados >= eventosFiltrados.length) {
        btnCargarMas.classList.add('oculto');
    } else {
        btnCargarMas.classList.remove('oculto');
    }
};

// INICIALIZADOR
document.addEventListener('DOMContentLoaded', () => {
    renderizarEventos(true);

    // Inicializar navbar search dropdown
    validaciones.inicializarNavbarSearch('pages/');

    // Filtros
    document.getElementById('filterButton').addEventListener('click', () => renderizarEventos(true));
    document.getElementById('clearFiltersButton').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('searchInputHero').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('dateFilter').value = '';
        renderizarEventos(true);
    });
    document.getElementById('categoryFilter').addEventListener('change', () => renderizarEventos(true));
    document.getElementById('dateFilter').addEventListener('change', () => renderizarEventos(true));

    // Busqueda (navbar y hero)
    document.getElementById('searchInput').addEventListener('input', () => renderizarEventos(true));
    document.getElementById('searchInputHero').addEventListener('input', () => renderizarEventos(true));
    document.getElementById('searchButtonIndex')?.addEventListener('click', () => renderizarEventos(true));
    document.getElementById('searchButtonHero')?.addEventListener('click', () => renderizarEventos(true));

    // Cargar mas
    document.getElementById('loadMoreButton').addEventListener('click', () => renderizarEventos(false));
});
