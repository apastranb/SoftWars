document.addEventListener('DOMContentLoaded', () => {

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
    const filterEmpresa    = document.getElementById('filterEmpresaStand');

    // Inputs del modal
    const inputNombre    = document.getElementById('inputNombreStand');
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
        inputNombre.value    = '';
        inputDesc.value      = '';
        inputEncargado.value = '';
        inputEmpresa.value   = '';
        inputCorreo.value    = '';
        inputTelefono.value  = '';
        limpiarErrores();
    }

    /** Muestra mensaje de error bajo un input */
    function mostrarError(idCampo, mensaje) {
        const span = document.getElementById(`error-${idCampo}`);
        if (span) {
            span.textContent = mensaje;
            span.classList.add('form__error-message--active');
        }
    }

    /** Limpia todos los errores del modal */
    function limpiarErrores() {
        document.querySelectorAll('#modalCrearStand .form__error-message').forEach(span => {
            span.classList.remove('form__error-message--active');
            span.textContent = '';
        });
        [inputNombre, inputDesc, inputEncargado, inputEmpresa, inputCorreo, inputTelefono].forEach(inp => {
            inp.style.borderColor = '';
        });
    }

    /** Valida los campos del modal. Retorna true si todo es válido */
    function validarFormulario() {
        limpiarErrores();
        let valido = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!inputNombre.value.trim()) {
            mostrarError('inputNombreStand', 'El nombre del stand es requerido.');
            valido = false;
        }
        if (!inputDesc.value.trim()) {
            mostrarError('inputDescStand', 'La descripción es requerida.');
            valido = false;
        }
        if (!inputEncargado.value.trim()) {
            mostrarError('inputEncargadoStand', 'El nombre del encargado es requerido.');
            valido = false;
        }
        if (!inputEmpresa.value.trim()) {
            mostrarError('inputEmpresaStand', 'La empresa es requerida.');
            valido = false;
        }
        if (inputCorreo.value.trim() === '') {
            mostrarError('inputCorreoStand', 'El correo es requerido.');
            valido = false;
        } else if (!emailRegex.test(inputCorreo.value.trim())) {
            mostrarError('inputCorreoStand', 'Ingrese un correo válido (ej. usuario@empresa.com).');
            valido = false;
        }
        if (!validaciones.validarTelefono(inputTelefono.value.trim())) {
            mostrarError('inputTelefonoStand', 'El teléfono debe tener 8 dígitos (ej. 8888-0001).');
            valido = false;
        }

        return valido;
    }

    // ── Renderizado de la tabla ─────────────────────────────────────────────

    /** Filtra los stands según búsqueda y dropdowns */
    function obtenerStandsFiltrados() {
        const busqueda = searchInput.value.trim().toLowerCase();
        const estado   = filterEstado.value;
        const empresa  = filterEmpresa.value;

        return window.db.stands.filter(s => {
            const coincideBusqueda = !busqueda ||
                s.nombre.toLowerCase().includes(busqueda) ||
                s.encargado.toLowerCase().includes(busqueda) ||
                s.empresa.toLowerCase().includes(busqueda) ||
                s.correo.toLowerCase().includes(busqueda);

            const coincideEstado  = !estado  || s.estado === estado;
            const coincideEmpresa = !empresa || s.empresa === empresa;

            return coincideBusqueda && coincideEstado && coincideEmpresa;
        });
    }

    /** Actualiza las opciones del filtro de Empresa con los valores únicos del db */
    function actualizarFiltroEmpresas() {
        const empresaActual = filterEmpresa.value;
        const empresas = [...new Set(window.db.stands.map(s => s.empresa))].sort();

        filterEmpresa.innerHTML = '<option value="">Empresa</option>';
        empresas.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp;
            opt.textContent = emp;
            if (emp === empresaActual) opt.selected = true;
            filterEmpresa.appendChild(opt);
        });
    }

    /** Renderiza las filas en la tabla */
    function renderTabla() {
        actualizarFiltroEmpresas();
        const stands = obtenerStandsFiltrados();
        tbody.innerHTML = '';

        if (stands.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:#6b7280;">No se encontraron stands.</td></tr>`;
            return;
        }

        stands.forEach(stand => {
            const badgeClass = stand.estado === 'activo' ? 'badge-active' : 'badge-inactive';
            const badgeTexto = stand.estado === 'activo' ? 'Activo' : 'Inactivo';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${stand.id}</td>
                <td>${stand.nombre}</td>
                <td>${stand.descripcion}</td>
                <td>${stand.encargado}</td>
                <td>${stand.empresa}</td>
                <td>${stand.correo}</td>
                <td>${stand.telefono}</td>
                <td><span class="badge ${badgeClass}">${badgeTexto}</span></td>
                <td>
                    <button class="eventsAdminBtnSecondary btn-editar-stand" data-id="${stand.id}">Editar</button>
                    <button class="eventsAdminBtnSecondary btnDelete btn-eliminar-stand" data-id="${stand.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos por fila
        tbody.querySelectorAll('.btn-editar-stand').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-eliminar-stand').forEach(btn => {
            btn.addEventListener('click', () => eliminarStand(btn.dataset.id));
        });
    }

    // ── Crear stand ─────────────────────────────────────────────────────────

    function guardarStand() {
        if (!validarFormulario()) return;

        if (editandoId) {
            // Modo editar
            const stand = window.db.stands.find(s => s.id === editandoId);
            if (stand) {
                stand.nombre     = inputNombre.value.trim();
                stand.descripcion = inputDesc.value.trim();
                stand.encargado  = inputEncargado.value.trim();
                stand.empresa    = inputEmpresa.value.trim();
                stand.correo     = inputCorreo.value.trim();
                stand.telefono   = inputTelefono.value.trim();
            }
        } else {
            // Modo crear
            const nuevoStand = {
                id:          generarId(),
                nombre:      inputNombre.value.trim(),
                descripcion: inputDesc.value.trim(),
                encargado:   inputEncargado.value.trim(),
                empresa:     inputEmpresa.value.trim(),
                correo:      inputCorreo.value.trim(),
                telefono:    inputTelefono.value.trim(),
                estado:      'activo'
            };
            window.db.stands.push(nuevoStand);
        }

        cerrarModal();
        renderTabla();
    }

    // ── Editar stand ────────────────────────────────────────────────────────

    function abrirModalEditar(id) {
        const stand = window.db.stands.find(s => s.id === id);
        if (!stand) return;

        editandoId = id;
        modalTitulo.textContent  = 'Editar Stand';
        btnGuardar.textContent   = 'Guardar Cambios';

        inputNombre.value    = stand.nombre;
        inputDesc.value      = stand.descripcion;
        inputEncargado.value = stand.encargado;
        inputEmpresa.value   = stand.empresa;
        inputCorreo.value    = stand.correo;
        inputTelefono.value  = stand.telefono;

        abrirModal();
    }

    // ── Eliminar stand ──────────────────────────────────────────────────────

    function eliminarStand(id) {
        const stand = window.db.stands.find(s => s.id === id);
        if (!stand) return;

        const confirmar = confirm(`¿Estás seguro de que deseas eliminar "${stand.nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        window.db.stands = window.db.stands.filter(s => s.id !== id);
        renderTabla();
    }

    // ── Event listeners ─────────────────────────────────────────────────────

    btnCrearStand.addEventListener('click', () => {
        editandoId = null;
        modalTitulo.textContent = 'Registrar Stand';
        btnGuardar.textContent  = 'Registrar';
        limpiarModal();
        abrirModal();
    });

    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelarModal.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });

    btnGuardar.addEventListener('click', guardarStand);

    // Filtros y búsqueda en tiempo real
    searchInput.addEventListener('input', renderTabla);
    filterEstado.addEventListener('change', renderTabla);
    filterEmpresa.addEventListener('change', renderTabla);

    // ── Render inicial ──────────────────────────────────────────────────────
    renderTabla();
});
