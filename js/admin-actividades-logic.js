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
        tablaBody.innerHTML = `<tr><td colspan="8" class="tabla-vacia-msg">No se encontraron actividades registradas.</td></tr>`;
        return;
    }

    datos.forEach(actividad => {
        const cupoTexto = actividad.entradaLibre
            ? 'Entrada libre'
            : `${actividad.cupoOcupado || 0} / ${actividad.cupoMaximo}`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td class="txt-bold">${actividad.id}</td>
            <td class="txt-highlight">${actividad.nombre}</td>
            <td><span class="badge-tag">${actividad.categoria}</span></td>
            <td>${actividad.fecha}<br><small class="txt-muted">${actividad.horaInicio} - ${actividad.horaFin}</small></td>
            <td>${actividad.lugar}</td>
            <td>${cupoTexto}</td>
            <td class="txt-highlight">${obtenerNombreResponsable(actividad.responsableId)}</td>
            <td>
                <button class="action-link-btn edit-link">Editar</button>
                <button class="action-link-btn delete-link">Eliminar</button>
            </td>
        `;

        fila.querySelector('.delete-link').addEventListener('click', () => controladorEliminarActividad(actividad.id));
        fila.querySelector('.edit-link').addEventListener('click', () => controladorEditarActividad(actividad.id));

        tablaBody.appendChild(fila);
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
        modal.classList.add('modal-active');
    }
};

const cerrarModal = () => {
    const modal = document.getElementById('modal-actividad');
    if (modal) {
        modal.classList.remove('modal-active');
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
        { id: 'modal-nombre', mensaje: 'El nombre de la actividad es obligatorio (mínimo 3 caracteres).' },
        { id: 'modal-categoria', mensaje: 'Debe seleccionar una categoría.' },
        { id: 'modal-fecha', mensaje: 'La fecha es obligatoria.' },
        { id: 'modal-hora-inicio', mensaje: 'La hora de inicio es obligatoria.' },
        { id: 'modal-hora-fin', mensaje: 'La hora de finalización es obligatoria.' },
        { id: 'modal-lugar', mensaje: 'El lugar es obligatorio.' },
        { id: 'modal-responsable', mensaje: 'Debe seleccionar un responsable.' },
        { id: 'modal-visibilidad', mensaje: 'Debe seleccionar la visibilidad.' }
    ];

    camposRequeridos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento && elemento.value.trim() === '') {
            validaciones.mostrarError(campo.id, campo.mensaje);
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
    const entradaLibre = document.getElementById('modal-entrada-libre').value === 'true';
    const cupoInput = document.getElementById('modal-cupo');
    if (!entradaLibre) {
        if (cupoInput.value.trim() === '') {
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
    document.getElementById('modal-entrada-libre').value = actividad.entradaLibre ? 'true' : 'false';
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

// ── BUSCADOR ────────────────────────────────────────────────────────────

const inicializarBuscadorActividades = () => {
    const inputBuscar = document.getElementById('buscar-actividad');
    if (!inputBuscar) return;

    inputBuscar.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase().trim();
        if (termino.length === 0) {
            renderizarTablaActividades();
            return;
        }
        const filtrados = window.db.actividades.filter(act =>
            act.nombre.toLowerCase().includes(termino) ||
            act.id.toLowerCase().includes(termino) ||
            act.lugar.toLowerCase().includes(termino) ||
            act.categoria.toLowerCase().includes(termino)
        );
        renderizarTablaActividades(filtrados);
    });
};

// ── TOOLBAR ─────────────────────────────────────────────────────────────

const inicializarToolbarActividades = () => {
    const btnExportar = document.getElementById('btn-exportar-pdf');
    const btnAbrirCrear = document.getElementById('btn-abrir-crear');
    const btnCerrarX = document.getElementById('btn-cerrar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-modal');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => alert('Descargando PDF de la agenda...'));
    }

    if (btnAbrirCrear) {
        btnAbrirCrear.addEventListener('click', () => {
            document.getElementById('modal-titulo-accion').textContent = 'Registrar Actividad';
            document.getElementById('btn-guardar-modal').textContent = 'Registrar';
            poblarSelectEventos();
            poblarSelectResponsables();
            abrirModal();
        });
    }

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

        const entradaLibre = document.getElementById('modal-entrada-libre').value === 'true';

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
