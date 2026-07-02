// ==========================================================================
// MÓDULO: GESTIÓN DE LA TABLA Y CONTROL DE VISTA DE ACTIVIDADES
// ==========================================================================

let actividadesBaseDatos = [
    {
        id: "ACT-01",
        nombre: "Conferencia de Inteligencia Artificial",
        categoria: "Tecnología",
        fecha: "2026-07-10",
        hora: "09:00 AM",
        lugar: "Auditorio Bloque A",
        cupoActual: 80,
        cupoMaximo: 100,
        responsable: "Dr. Carlos Mendoza"
    }
];

/**
 * Renderiza todas las filas dentro del tbody  tabla HTML
 */
const renderizarTablaActividades = (datosAFiltrar = actividadesBaseDatos) => {
    const tablaBody = document.getElementById('tabla-actividades-body');
    if (!tablaBody) return;

    // Limpiamos las filas anteriores
    tablaBody.innerHTML = '';

    // Si no hay datos, mostrar un mensaje de vacío
    if (datosAFiltrar.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--gray-600);">No se encontraron actividades registradas.</td></tr>`;
        return;
    }


    datosAFiltrar.forEach(actividad => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td class="txt-bold">${actividad.id}</td>
            <td class="txt-highlight">${actividad.nombre}</td>
            <td><span class="badge-tag">${actividad.categoria}</span></td>
            <td>${actividad.fecha}<br><small class="txt-muted">${actividad.hora}</small></td>
            <td>${actividad.lugar}</td>
            <td>${actividad.cupoActual} / ${actividad.cupoMaximo}</td>
            <td class="txt-highlight">${actividad.responsable}</td>
            <td>
                <button class="action-link-btn edit-link" data-id="${actividad.id}">Editar</button>
                <button class="action-link-btn delete-link" data-id="${actividad.id}">Eliminar</button>
            </td>
        `;
        
        // Agregar eventos directamente a los botones creados
        fila.querySelector('.delete-link').addEventListener('click', () => {
            controladorEliminarActividad(actividad.id);
        });

        fila.querySelector('.edit-link').addEventListener('click', () => {
            controladorEditarActividad(actividad.id);
        });
        
        tablaBody.appendChild(fila);
    });
};

/**
 * Inicializa el buscador interactivo del Header por el nombre de la actividad
 */
const inicializarBuscadorActividades = () => {
    const inputBuscar = document.getElementById('buscar-actividad');
    if (!inputBuscar) return;

    inputBuscar.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        
        const actividadesFiltradas = actividadesBaseDatos.filter(actividad => 
            actividad.nombre.toLowerCase().includes(termino) || 
            actividad.responsable.toLowerCase().includes(termino)
        );

        renderizarTablaActividades(actividadesFiltradas);
    });
};

/**
 * Controlador para eliminar una actividad de la lista
 */
const controladorEliminarActividad = (id) => {
    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la actividad ${id}?`);
    if (confirmacion) {
        // CORREGIDO: Flecha junta sin espacios (act =>)
        actividadesBaseDatos = actividadesBaseDatos.filter(act => act.id !== id);
        renderizarTablaActividades();
    }
};

/**
 * Controlador placeholder para editar
 */
const controladorEditarActividad = (id) => {
    alert(`Ejecutando edición para el elemento: ${id}. Aquí abrirías tu formulario o modal rellenando los campos.`);
};

/**
 * Inicializa los botones de la barra de herramientas superior (PDF, etc.)
 */
const inicializarToolbarActividades = () => {
    const btnExportar = document.getElementById('btn-exportar-pdf');
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            alert('Generando archivo Agenda-Academica.pdf... Tu descarga iniciará pronto.');
        });
    }

    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {

            window.location.href = "admin-crear-evento.html";
        });
    }
};


// ==========================================================================
// INICIALIZADOR PRINCIPAL (DOM Content Loaded)
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Pintamos la tabla con los datos iniciales apenas cargue la página
    renderizarTablaActividades();

    // Encendemos los escuchadores interactivos de la pantalla
    inicializarBuscadorActividades();
    inicializarToolbarActividades();
});