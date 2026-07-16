// Cierre de sesión (disponible desde el layout de admin)
window.cerrarSesion = function () {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('sesionEmail');
    localStorage.removeItem('sesionNombre');
    localStorage.removeItem('sesionRol');
    window.location.href = 'login.html';
};


// RENDERIZAR TABLA

const renderizarTablaParticipantes = () => {
    const tbody       = document.getElementById('tbody-participantes');
    const tablaVacia  = document.getElementById('tabla-vacia');
    const textoBusqueda     = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtroEstado      = document.getElementById('filtro-estado').value;
    const filtroFecha       = document.getElementById('filtro-fecha').value;

    const participantes = window.db.participantes.filter(p => {
        const coincideTexto = !textoBusqueda ||
            p.nombreCompleto.toLowerCase().includes(textoBusqueda) ||
            p.correo.toLowerCase().includes(textoBusqueda) ||
            p.idDocumento.includes(textoBusqueda) ||
            p.carrera.toLowerCase().includes(textoBusqueda);

        const coincideEstado = !filtroEstado || p.estado === filtroEstado;
        const coincideFecha = !filtroFecha || p.fechaInscripcion === filtroFecha;

        return coincideTexto && coincideEstado && coincideFecha;
    });

    tbody.innerHTML = '';

    if (participantes.length === 0) {
        tablaVacia.style.display = 'block';
        return;
    }
    tablaVacia.style.display = 'none';

    participantes.forEach(p => {
        // Convertir los IDs de actividades a nombres legibles
        const nombresActividades = p.actividades
            .map(id => {
                const act = window.db.actividades.find(a => a.id === id);
                return act ? act.nombre : id;
            })
            .join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${p.id}"></td>
            <td>${p.id}</td>
            <td>${p.nombreCompleto}</td>
            <td>${p.idDocumento}</td>
            <td>${p.correo}</td>
            <td>${p.telefono}</td>
            <td>${p.edad}</td>
            <td>${p.carrera}</td>
            <td>${nombresActividades || '-'}</td>
            <td>
                <select class="tableSelectStatus" data-id="${p.id}">
                    <option value="Activo" ${p.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                    <option value="Cancelado" ${p.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td>${p.fechaInscripcion || '-'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Select all reset
    const selectAllCb = document.getElementById('selectAll');
    if (selectAllCb) selectAllCb.checked = false;

    // Estado change listener
    tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            const participante = window.db.participantes.find(p => p.id === id);
            if (participante) participante.estado = e.target.value;
        });
    });
};



// INICIALIZADOR PRINCIPAL

document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión activa
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.getElementById('headerUserRol').textContent  = localStorage.getItem('sesionRol')    || '';

    // Cerrar sesión
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

    renderizarTablaParticipantes();

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        document.querySelectorAll('.row-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Toolbar: Editar participante
    document.getElementById('btnEditarParticipante')?.addEventListener('click', () => {
        const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione un participante', 'Debe seleccionar un participante para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un participante a la vez.', 'warning');
            return;
        }
        abrirModalEditarParticipante(seleccionados[0]);
    });

    // Toolbar: Eliminar
    document.getElementById('btnEliminarParticipante')?.addEventListener('click', async () => {
        const seleccionados = [...document.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione participantes', 'Seleccione al menos un participante para eliminar.', 'warning');
            return;
        }
        const confirmar = await validaciones.confirmar('¿Eliminar participante(s)?', `Se eliminarán ${seleccionados.length} participante(s). Esta acción no se puede deshacer.`);
        if (!confirmar) return;
        window.db.participantes = window.db.participantes.filter(p => !seleccionados.includes(p.id));
        renderizarTablaParticipantes();
    });

    // Filtros en tiempo real
    document.getElementById('searchInput').addEventListener('input', renderizarTablaParticipantes);
    document.getElementById('buscar-participante')?.addEventListener('click', renderizarTablaParticipantes);
    document.getElementById('filtro-estado').addEventListener('change', renderizarTablaParticipantes);
    document.getElementById('filtro-fecha').addEventListener('change', renderizarTablaParticipantes);

    // ── Modal Editar Participante ───────────────────────────────────────────
    const modalEditar = document.getElementById('modalEditarParticipante');
    let editandoPartId = null;

    const cerrarModalEditar = () => {
        modalEditar.classList.remove('active');
        editandoPartId = null;
        validaciones.limpiarErrores();
    };

    document.getElementById('btnCerrarEditarPart')?.addEventListener('click', cerrarModalEditar);
    document.getElementById('btnCancelarEditarPart')?.addEventListener('click', cerrarModalEditar);
    modalEditar?.addEventListener('click', (e) => {
        if (e.target === modalEditar) cerrarModalEditar();
    });

    function abrirModalEditarParticipante(id) {
        const participante = window.db.participantes.find(p => p.id === id);
        if (!participante) return;

        editandoPartId = id;
        validaciones.limpiarErrores();

        document.getElementById('edit-part-nombre').value = participante.nombreCompleto;
        document.getElementById('edit-part-id').value = participante.idDocumento;
        document.getElementById('edit-part-correo').value = participante.correo;
        document.getElementById('edit-part-telefono').value = participante.telefono;
        document.getElementById('edit-part-edad').value = participante.edad;
        document.getElementById('edit-part-carrera').value = participante.carrera;

        modalEditar.classList.add('active');
    }

    document.getElementById('btnGuardarEditarPart')?.addEventListener('click', () => {
        validaciones.limpiarErrores();
        let esValido = true;

        const nombre = document.getElementById('edit-part-nombre').value.trim();
        const telefono = document.getElementById('edit-part-telefono').value.trim();
        const edad = document.getElementById('edit-part-edad').value.trim();
        const carrera = document.getElementById('edit-part-carrera').value.trim();

        if (!validaciones.validarRequerido(nombre)) {
            validaciones.mostrarError('edit-part-nombre', 'El nombre es obligatorio.');
            esValido = false;
        } else if (!validaciones.validarNombre(nombre)) {
            validaciones.mostrarError('edit-part-nombre', 'El nombre debe tener al menos 3 caracteres.');
            esValido = false;
        }

        if (!validaciones.validarRequerido(telefono)) {
            validaciones.mostrarError('edit-part-telefono', 'El telefono es obligatorio.');
            esValido = false;
        } else if (!validaciones.validarTelefono(telefono)) {
            validaciones.mostrarError('edit-part-telefono', 'Ingrese un telefono valido (8 digitos).');
            esValido = false;
        }

        if (!validaciones.validarRequerido(edad)) {
            validaciones.mostrarError('edit-part-edad', 'La edad es obligatoria.');
            esValido = false;
        } else if (!validaciones.validarEdad(edad)) {
            validaciones.mostrarError('edit-part-edad', 'Ingrese una edad valida (15-120).');
            esValido = false;
        }

        if (!validaciones.validarRequerido(carrera)) {
            validaciones.mostrarError('edit-part-carrera', 'La carrera es obligatoria.');
            esValido = false;
        }

        if (!esValido) return;

        const participante = window.db.participantes.find(p => p.id === editandoPartId);
        if (participante) {
            participante.nombreCompleto = nombre;
            participante.telefono = telefono;
            participante.edad = parseInt(edad, 10);
            participante.carrera = carrera;
        }

        cerrarModalEditar();
        renderizarTablaParticipantes();
        validaciones.exito('Participante actualizado', 'Los datos se guardaron correctamente.');
    });
});
