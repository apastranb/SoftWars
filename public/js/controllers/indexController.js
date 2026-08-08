// ==========================================================================
// CONTROLLER: INDEX — js/controllers/indexController.js
// Catálogo público de eventos.
// ==========================================================================

import { listarEventos } from '../services/eventos.service.js';

const validaciones = window.validaciones;

const EVENTOS_POR_PAGINA = 8;
let eventosCache = [];
let eventosMostrados = 0;

const capitalizarTexto = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// Cargar eventos desde la API con filtros
const cargarEventos = async () => {
    const busqueda = document.getElementById('searchInputHero').value.trim();
    const categoria = document.getElementById('categoryFilter').value;
    const fecha = document.getElementById('dateFilter').value;

    const params = { visibilidad: 'publico' };
    if (busqueda && busqueda.length >= 2) params.q = busqueda;
    if (categoria) params.categoria = categoria;

    try {
        const eventos = await listarEventos(params);

        // Filtro de fecha en cliente
        if (fecha) {
            eventosCache = eventos.filter(ev => ev.fechaInicio === fecha || ev.fechaFin === fecha);
        } else {
            eventosCache = eventos;
        }
    } catch (error) {
        console.error('Error cargando eventos:', error);
        eventosCache = [];
    }
};

// Renderizar cards de eventos
const renderizarEventos = async (resetear) => {
    const container = document.getElementById('eventsContainer');
    const btnCargarMas = document.getElementById('loadMoreButton');

    if (resetear) {
        container.innerHTML = '';
        eventosMostrados = 0;
        await cargarEventos();
    }

    if (eventosCache.length === 0) {
        container.innerHTML = '<p class="detalle-placeholder">No se encontraron eventos disponibles.</p>';
        btnCargarMas.classList.add('oculto');
        return;
    }

    const eventosAMostrar = eventosCache.slice(eventosMostrados, eventosMostrados + EVENTOS_POR_PAGINA);

    eventosAMostrar.forEach(evento => {
        const cupoTexto = evento.tipoEntrada === 'libre' || evento.entradaLibre
            ? 'Entrada Libre'
            : `${evento.cupoActual || 0} / ${evento.cupoMax} cupos`;

        const eventoId = evento._id || evento.id || evento.codigo;

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
                        <a href="pages/detalle-evento.html?id=${eventoId}" class="btn btn-primary w-100">Ver detalles <i class="bi bi-arrow-right"></i></a>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    eventosMostrados += eventosAMostrar.length;

    if (eventosMostrados >= eventosCache.length) {
        btnCargarMas.classList.add('oculto');
    } else {
        btnCargarMas.classList.remove('oculto');
    }
};

// Debounce
let debounceTimer = null;
const renderConDebounce = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderizarEventos(true), 300);
};

// INICIALIZADOR
document.addEventListener('DOMContentLoaded', () => {
    renderizarEventos(true);

    if (validaciones && validaciones.inicializarNavbarSearch) {
        validaciones.inicializarNavbarSearch('pages/');
    }

    document.getElementById('filterButton').addEventListener('click', () => renderizarEventos(true));
    document.getElementById('clearFiltersButton').addEventListener('click', () => {
        document.getElementById('searchInputHero').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('dateFilter').value = '';
        renderizarEventos(true);
    });
    document.getElementById('categoryFilter').addEventListener('change', () => renderizarEventos(true));
    document.getElementById('dateFilter').addEventListener('change', () => renderizarEventos(true));

    document.getElementById('searchInputHero').addEventListener('input', renderConDebounce);
    document.getElementById('searchButtonHero')?.addEventListener('click', () => renderizarEventos(true));

    document.getElementById('loadMoreButton').addEventListener('click', () => renderizarEventos(false));
});
