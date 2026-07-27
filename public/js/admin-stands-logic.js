document.addEventListener('DOMContentLoaded', () => {

    // Verificar sesión activa
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

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

    // Nombre y rol en el header
    document.getElementById('headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.getElementById('headerUserRol').textContent  = localStorage.getItem('sesionRol')    || '';

    // ── Referencias al DOM ──────────────────────────────────────────────────
    const modalOverlay     = document.getElementById('modalCrearStand');
    const modalTitulo      = document.getElementById('modalStandTitulo');
    const btnCrearStand    = document.getElementById('btnCrearStand');
    const btnCerrarModal   = document.getElementById('btnCerrarModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const btnGuardar       = document.getElementById('btnGuardarStand');
    const tbody            = document.getElementById('standsTableBody');
    const searchInput      = document.getElementById('searchStandInput');
    const filterEstado     = document.getElementById('filterEstadoStand');
    const filterCategoria  = document.getElementById('filterCategoriaStand');

    // Inputs del modal
    const inputEvento    = document.getElementById('inputEventoStand');
    const inputNombre    = document.getElementById('inputNombreStand');
    const inputCategoria = document.getElementById('inputCategoriaStand');
    const inputDesc      = document.getElementById('inputDescStand');
    const inputEncargado = document.getElementById('inputEncargadoStand');
    const inputEmpresa   = document.getElementById('inputEmpresaStand');
    const inputCorreo    = document.getElementById('inputCorreoStand');
    const inputTelefono  = document.getElementById('inputTelefonoStand');

    // ID del stand que se está editando (null = modo crear)
    let editandoId = null;

    // ── Utilidades ──────────────────────────────────────────────────────────

    /** Genera un ID único para un nuevo stand */
    function generarId() {
        const ids = window.db.stands.map(s => parseInt(s.id.replace('S-', ''), 10));
        const max = ids.length > 0 ? Math.max(...ids) : 0;
        return `S-${String(max + 1).padStart(3, '0')}`;
    }

    /** Muestra u oculta el modal */
    function abrirModal() { modalOverlay.classList.add('active'); }
    function cerrarModal() {
        modalOverlay.classList.remove('active');
        limpiarModal();
        editandoId = null;
    }

    /** Limpia los campos del modal */
    function limpiarModal() {
        inputEvento.value    = '';
        inputNombre.value    = '';
        inputCategoria.value = '';
        inputDesc.value      = '';
        inputEncargado.value = '';
        inputEmpresa.value   = '';
        inputCorreo.value    = '';
        inputTelefono.value  = '';
        limpiarErrores();
    }

    /** Puebla el dropdown de eventos */
    function poblarSelectEventos() {
        const actual = inputEvento.value;
        inputEvento.innerHTML = '<option value="">Seleccionar evento...</option>';
        window.db.eventos.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.id;
            opt.textContent = ev.nombre;
            if (ev.id === actual) opt.selected = true;
            inputEvento.appendChild(opt);
        });
    }

    /** Muestra mensaje de error bajo un input */
    function mostrarError(idCampo, mensaje) {
        validaciones.mostrarError(idCampo, mensaje);
    }

    /** Limpia todos los errores del modal */
    function limpiarErrores() {
        validaciones.limpiarErrores();
    }

    /** Valida los campos del modal. Retorna true si todo es valido */
    function validarFormulario() {
        limpiarErrores();
        let valido = true;

        if (!validaciones.validarRequerido(inputNombre.value)) {
            mostrarError('inputNombreStand', 'El nombre del stand es requerido.');
            valido = false;
        } else if (!validaciones.validarNombre(inputNombre.value)) {
            mostrarError('inputNombreStand', 'El nombre debe tener al menos 3 caracteres.');
            valido = false;
        }
        if (!validaciones.validarRequerido(inputCategoria.value)) {
            mostrarError('inputCategoriaStand', 'La categoría es requerida.');
            valido = false;
        }
        if (!validaciones.validarRequerido(inputDesc.value)) {
            mostrarError('inputDescStand', 'La descripción es requerida.');
            valido = false;
        } else if (!validaciones.validarDescripcion(inputDesc.value, true)) {
            mostrarError('inputDescStand', 'La descripción no puede superar los 200 caracteres.');
            valido = false;
        }
        if (!validaciones.validarRequerido(inputEncargado.value)) {
            mostrarError('inputEncargadoStand', 'El nombre del encargado es requerido.');
            valido = false;
        }
        if (!validaciones.validarRequerido(inputEmpresa.value)) {
            mostrarError('inputEmpresaStand', 'El nombre de empresa/personal es requerido.');
            valido = false;
        }
        if (!validaciones.validarRequerido(inputCorreo.value)) {
            mostrarError('inputCorreoStand', 'El correo es requerido.');
            valido = false;
        } else if (!validaciones.validarCorreo(inputCorreo.value)) {
            mostrarError('inputCorreoStand', 'Ingrese un correo válido (ej. usuario@empresa.com).');
            valido = false;
        }
        if (!validaciones.validarRequerido(inputTelefono.value)) {
            mostrarError('inputTelefonoStand', 'El teléfono es requerido.');
            valido = false;
        } else if (!validaciones.validarTelefono(inputTelefono.value)) {
            mostrarError('inputTelefonoStand', 'El teléfono debe tener 8 dígitos (ej. 8888-8888).');
            valido = false;
        }

        return valido;
    }

    // ── Renderizado de la tabla ─────────────────────────────────────────────

    /** Filtra los stands según búsqueda y dropdowns */
    function obtenerStandsFiltrados() {
        const busqueda = searchInput.value.trim().toLowerCase();
        const estado   = filterEstado.value;
        const categoria = filterCategoria.value;

        return window.db.stands.filter(s => {
            const coincideBusqueda = !busqueda ||
                s.id.toLowerCase().includes(busqueda) ||
                s.nombre.toLowerCase().includes(busqueda) ||
                s.encargado.toLowerCase().includes(busqueda) ||
                s.empresa.toLowerCase().includes(busqueda) ||
                s.correo.toLowerCase().includes(busqueda);

            const coincideEstado    = !estado    || s.estado === estado;
            const coincideCategoria = !categoria || s.categoria === categoria;

            return coincideBusqueda && coincideEstado && coincideCategoria;
        });
    }

    /** Renderiza las filas en la tabla */
    function renderTabla() {
        const stands = obtenerStandsFiltrados();
        tbody.innerHTML = '';

        if (stands.length === 0) {
            tbody.innerHTML = '';
            document.getElementById('tabla-vacia').classList.remove('oculto');
            return;
        }
        document.getElementById('tabla-vacia').classList.add('oculto');

        stands.forEach(stand => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-id="${stand.id}"></td>
                <td>${stand.id}</td>
                <td>${stand.nombre}</td>
                <td>${stand.categoria || '—'}</td>
                <td>${stand.encargado}</td>
                <td>${stand.empresa}</td>
                <td>${stand.correo}</td>
                <td>${stand.telefono}</td>
                <td>
                    <select class="tableSelectStatus" data-id="${stand.id}">
                        <option value="aprobado" ${(stand.estado || 'aprobado') === 'aprobado' ? 'selected' : ''}>Aprobado</option>
                        <option value="cerrado" ${stand.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Reset select all
        document.getElementById('selectAll').checked = false;

        // Estado change listener
        tbody.querySelectorAll('.tableSelectStatus').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const stand = window.db.stands.find(s => s.id === id);
                if (stand) {
                    stand.estado = e.target.value;
                    validaciones.exito('Estado actualizado', `El stand se marcó como "${e.target.value}".`);
                }
            });
        });
    }

    // ── Crear stand ─────────────────────────────────────────────────────────

    function guardarStand() {
        if (!validarFormulario()) return;

        if (editandoId) {
            const stand = window.db.stands.find(s => s.id === editandoId);
            if (stand) {
                stand.eventoId    = inputEvento.value;
                stand.nombre      = inputNombre.value.trim();
                stand.categoria   = inputCategoria.value;
                stand.descripcion = inputDesc.value.trim();
                stand.encargado   = inputEncargado.value.trim();
                stand.empresa     = inputEmpresa.value.trim();
                stand.correo      = inputCorreo.value.trim();
                stand.telefono    = inputTelefono.value.trim();
            }
        } else {
            const nuevoStand = {
                id:          generarId(),
                eventoId:    inputEvento.value,
                nombre:      inputNombre.value.trim(),
                categoria:   inputCategoria.value,
                descripcion: inputDesc.value.trim(),
                encargado:   inputEncargado.value.trim(),
                empresa:     inputEmpresa.value.trim(),
                correo:      inputCorreo.value.trim(),
                telefono:    inputTelefono.value.trim(),
                estado:      'aprobado'
            };
            window.db.stands.push(nuevoStand);
        }

        const esEdicion = !!editandoId;
        cerrarModal();
        renderTabla();
        if (esEdicion) {
            validaciones.exito('Stand actualizado', 'Los datos se guardaron correctamente.');
        } else {
            validaciones.exito('Stand registrado', 'El stand se registró con éxito.');
        }
    }

    function abrirModalEditar(id) {
        const stand = window.db.stands.find(s => s.id === id);
        if (!stand) return;

        editandoId = id;
        poblarSelectEventos();
        modalTitulo.textContent  = 'Editar Stand';
        btnGuardar.textContent   = 'Guardar Cambios';

        inputEvento.value    = stand.eventoId || '';
        inputNombre.value    = stand.nombre;
        inputCategoria.value = stand.categoria || '';
        inputDesc.value      = stand.descripcion;
        inputEncargado.value = stand.encargado;
        inputEmpresa.value   = stand.empresa;
        inputCorreo.value    = stand.correo;
        inputTelefono.value  = stand.telefono;

        abrirModal();
    }

    // ── Eliminar stand ──────────────────────────────────────────────────────

    async function eliminarStand(id) {
        const stand = window.db.stands.find(s => s.id === id);
        if (!stand) return;

        const confirmar = await validaciones.confirmar('¿Eliminar stand?', `Se eliminará "${stand.nombre}". Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        window.db.stands = window.db.stands.filter(s => s.id !== id);
        renderTabla();
    }

    // ── Event listeners ─────────────────────────────────────────────────────

    btnCrearStand.addEventListener('click', () => {
        editandoId = null;
        poblarSelectEventos();
        modalTitulo.textContent = 'Registrar Stand';
        btnGuardar.textContent  = 'Registrar';
        limpiarModal();
        abrirModal();
    });

    // Editar desde toolbar (solo 1 seleccionado)
    document.getElementById('btnEditarStand').addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione un stand', 'Debe seleccionar un stand para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un stand a la vez.', 'warning');
            return;
        }
        abrirModalEditar(seleccionados[0]);
    });

    // Eliminar desde toolbar (1 o mas seleccionados)
    document.getElementById('btnEliminarStand').addEventListener('click', async () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione stands', 'Seleccione al menos un stand para eliminar.', 'warning');
            return;
        }
        const confirmar = await validaciones.confirmar('¿Eliminar stand(s)?', `Se eliminarán ${seleccionados.length} stand(s). Esta acción no se puede deshacer.`);
        if (!confirmar) return;
        window.db.stands = window.db.stands.filter(s => !seleccionados.includes(s.id));
        renderTabla();
    });

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        tbody.querySelectorAll('.row-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelarModal.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });

    // Evitar que clicks dentro del modal propaguen al overlay
    document.querySelector('#modalCrearStand .modal').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    btnGuardar.addEventListener('click', (e) => {
        e.stopPropagation();
        guardarStand();
    });

    // Filtros y busqueda en tiempo real
    searchInput.addEventListener('input', renderTabla);
    filterEstado.addEventListener('change', renderTabla);
    filterCategoria.addEventListener('change', renderTabla);

    // ── Render inicial ──────────────────────────────────────────────────────
    renderTabla();
});
