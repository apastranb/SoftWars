// ==========================================================================
// MÓDULO: GESTIÓN DE LA TABLA Y CONTROL DE VISTA DE ACTIVIDADES
// ==========================================================================

// 1. Base de datos simulada (Mock Data)
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

// Variable global para saber si el modal está editando un ID existente
let actividadEditandoId = null;

/**
 * Renderiza todas las filas dentro del tbody de la tabla
 */
const renderizarTablaActividades = (datosAFiltrar = actividadesBaseDatos) => {
    const tablaBody = document.getElementById('tabla-actividades-body');
    if (!tablaBody) return;

    tablaBody.innerHTML = '';

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
                <button class="action-link-btn edit-link">Editar</button>
                <button class="action-link-btn delete-link">Eliminar</button>
            </td>
        `;
        
        // Asignar eventos de clic a los botones dinámicos
        fila.querySelector('.delete-link').addEventListener('click', () => controladorEliminarActividad(actividad.id));
        fila.querySelector('.edit-link').addEventListener('click', () => controladorEditarActividad(actividad.id));
        
        tablaBody.appendChild(fila);
    });
};

/**
 * Abre e inyecta la clase flex al Pop-up
 */
const abrirModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) modal.style.display = 'flex';
};

/**
 * Cierra el Pop-up y limpia los campos
 */
const cerrarModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) modal.style.display = 'none';
    document.getElementById('form-actividad-modal')?.reset();
    actividadEditandoId = null; 
};

/**
 * CONTROLADOR: EDITAR ACTIVIDAD 
 */
const controladorEditarActividad = (id) => {
    const actividad = actividadesBaseDatos.find(act => act.id === id);
    if (!actividad) return;

    actividadEditandoId = id; 

    // Cambiamos textos estéticos del modal
    document.getElementById('modal-titulo-accion').textContent = `Editar Actividad: ${id}`;
    document.getElementById('btn-guardar-modal').textContent = "Guardar Cambios";

    // Rellenamos los inputs con los valores del objeto seleccionado
    document.getElementById('modal-nombre').value = actividad.nombre;
    document.getElementById('modal-categoria').value = actividad.categoria;
    document.getElementById('modal-fecha').value = actividad.fecha;
    document.getElementById('modal-lugar').value = actividad.lugar;
    document.getElementById('modal-cupo').value = actividad.cupoMaximo;
    document.getElementById('modal-responsable').value = actividad.responsable;

    abrirModal();
};

/**
 * CONTROLADOR: ELIMINAR ACTIVIDAD
 */
const controladorEliminarActividad = (id) => {
    const confirmacion = confirm(`¿Estás seguro de que deseas eliminar la actividad ${id}?`);
    if (confirmacion) {
        actividadesBaseDatos = actividadesBaseDatos.filter(act => act.id !== id);
        renderizarTablaActividades();
    }
};

/**
 * Inicializa el buscador superior en tiempo real
 */
const inicializarBuscadorActividades = () => {
    const inputBuscar = document.getElementById('buscar-actividad');
    if (!inputBuscar) return;

    inputBuscar.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        const filtrados = actividadesBaseDatos.filter(act => 
            act.nombre.toLowerCase().includes(termino) || 
            act.responsable.toLowerCase().includes(termino)
        );
        renderizarTablaActividades(filtrados);
    });
};

/**
 * Conecta los botones de la barra de herramientas del módulo
 */
const inicializarToolbarActividades = () => {
    const btnExportar = document.getElementById('btn-exportar-pdf');
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const btnCerrarX = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => alert('Descargando PDF...'));
    }

    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {
            // Ponemos los títulos en modo Registrar por si veníamos de una edición
            document.getElementById('modal-titulo-accion').textContent = "Registrar Actividad";
            document.getElementById('btn-guardar-modal').textContent = "Registrar";
            abrirModal();
        });
    }

    btnCerrarX?.addEventListener('click', cerrarModal);
    btnCancelar?.addEventListener('click', cerrarModal);
};

// ==========================================================================
// INICIALIZADOR PRINCIPAL Y ENVÍO DEL FORMULARIO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    renderizarTablaActividades();
    inicializarBuscadorActividades();
    inicializarToolbarActividades();

    // Manejo del submit del formulario interno del modal
    document.getElementById('form-actividad-modal')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const nombre = document.getElementById('modal-nombre').value;
        const categoria = document.getElementById('modal-categoria').value;
        const fecha = document.getElementById('modal-fecha').value;
        const lugar = document.getElementById('modal-lugar').value;
        const cupo = document.getElementById('modal-cupo').value;
        const responsable = document.getElementById('modal-responsable').value;

        if (actividadEditandoId) {
            // Procesamos Edición
            const index = actividadesBaseDatos.findIndex(act => act.id === actividadEditandoId);
            if (index !== -1) {
                actividadesBaseDatos[index].nombre = nombre;
                actividadesBaseDatos[index].categoria = categoria;
                actividadesBaseDatos[index].fecha = fecha;
                actividadesBaseDatos[index].lugar = lugar;
                actividadesBaseDatos[index].cupoMaximo = parseInt(cupo, 10);
                actividadesBaseDatos[index].responsable = responsable;
            }
            alert('¡Actividad actualizada con éxito!');
        } else {
            // Procesamos Nuevo Registro
            const nuevoId = `ACT-0${actividadesBaseDatos.length + 1}`;
            actividadesBaseDatos.push({
                id: nuevoId,
                nombre: nombre,
                categoria: categoria,
                fecha: fecha,
                hora: "08:00 AM", // Hora fija 
                lugar: lugar,
                cupoActual: 0,
                cupoMaximo: parseInt(cupo, 10),
                responsable: responsable
            });
            alert('¡Actividad registrada con éxito!');
        }

        renderizarTablaActividades();
        cerrarModal();
    });
});