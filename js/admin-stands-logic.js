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
    document.getElementById('headerUserRol').textContent  = localStorage.getItem('sesionRol')    || '';

    // ── Referencias al DOM ──────────────────────────────────────────────────
    const modalOverlay     = document.getElementById('modalCrearStand');
    const modalTitulo      = document.getElementById('modalStandTitulo');
    const btnCrearStand    = document.getElementById('btnCrearStand');
    const btnEliminarBulk  = document.getElementById('btnEliminarStands');
    const btnCerrarModal   = document.getElementById('btnCerrarModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const btnGuardar       = document.getElementById('btnGuardarStand');
    const tbody            = document.getElementById('standsTableBody');
    const searchInput      = document.getElementById('searchStandInput');
    const filterEstado     = document.getElementById('filterEstadoStand');
    const filterCategoria  = document.getElementById('filterCategoriaStand');
    const filterEmpresa    = document.getElementById('filterEmpresaStand');
    const selectAll        = document.getElementById('selectAllStands');

    // Inputs del modal
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
        inputNombre.value    = '';
        inputCategoria.value = '';
        inputDesc.value      = '';
        inputEncargado.value = '';
        inputEmpresa.value   = '';
        inputCorreo.value    = '';
        inputTelefono.value  = '';
        limpiarErrores();
    }

    /** Muestra mensaje de error bajo un input */
    function mostrarError(idCampo, mensaje) {
        validaciones.mostrarError(idCampo, mensaje);
    }

    /** Limpia todos los errores del modal */
    function limpiarErrores() {
        validaciones.limpiarErrores();
    }

    /** Valida los campos del modal. Retorna true si todo es válido */
    function validarFormulario() {
        limpiarErrores();
        let valido = true;

        if (!inputNombre.value.trim()) {
            mostrarError('inputNombreStand', 'El nombre del stand es requerido.');
            valido = false;
        } else if (!validaciones.validarNombre(inputNombre.value)) {
            mostrarError('inputNombreStand', 'El nombre debe tener al menos 3 caracteres.');
            valido = false;
        }
        if (!inputCategoria.value) {
            mostrarError('inputCategoriaStand', 'La categoría es requerida.');
            valido = false;
        }
        if (!inputDesc.value.trim()) {
            mostrarError('inputDescStand', 'La descripción es requerida.');
            valido = false;
        } else if (!validaciones.validarDescripcion(inputDesc.value, true)) {
            mostrarError('inputDescStand', 'La descripción no puede superar los 200 caracteres.');
            valido = false;
        }
        if (!inputEncargado.value.trim()) {
            mostrarError('inputEncargadoStand', 'El nombre del encargado es requerido.');
            valido = false;
        }
        if (!inputEmpresa.value.trim()) {
            mostrarError('inputEmpresaStand', 'El nombre de empresa/personal es requerido.');
            valido = false;
        }
        if (!inputCorreo.value.trim()) {
            mostrarError('inputCorreoStand', 'El correo es requerido.');
            valido = false;
        } else if (!validaciones.validarCorreo(inputCorreo.value)) {
            mostrarError('inputCorreoStand', 'Ingrese un correo válido (ej. usuario@empresa.com).');
            valido = false;
        }
        if (!inputTelefono.value.trim()) {
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
        const empresa  = filterEmpresa.value;

        return window.db.stands.filter(s => {
            const coincideBusqueda = !busqueda ||
                s.id.toLowerCase().includes(busqueda) ||
                s.nombre.toLowerCase().includes(busqueda) ||
                s.encargado.toLowerCase().includes(busqueda) ||
                s.empresa.toLowerCase().includes(busqueda) ||
                s.correo.toLowerCase().includes(busqueda) ||
                (s.categoria || '').toLowerCase().includes(busqueda);

            const coincideEstado    = !estado    || s.estado === estado;
            const coincideCategoria = !categoria || s.categoria === categoria;
            const coincideEmpresa   = !empresa   || s.empresa === empresa;

            return coincideBusqueda && coincideEstado && coincideCategoria && coincideEmpresa;
        });
    }

    /** Actualiza el filtro de categoría dinámicamente */
    function actualizarFiltroCategorias() {
        const actual = filterCategoria.value;
        const cats = [...new Set(window.db.stands.map(s => s.categoria).filter(Boolean))].sort();
        filterCategoria.innerHTML = '<option value="">Categoría</option>';
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            if (c === actual) opt.selected = true;
            filterCategoria.appendChild(opt);
        });
    }

    /** Actualiza las opciones del filtro de empresa según los stands actuales */
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
        actualizarFiltroCategorias();
        const stands = obtenerStandsFiltrados();
        tbody.innerHTML = '';

        if (stands.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:2rem;color:#6b7280;">No se encontraron stands.</td></tr>`;
            selectAll.checked = false;
            return;
        }

        stands.forEach(stand => {
            const badgeClass = stand.estado === 'activo' ? 'badge-active' : 'badge-inactive';
            const badgeTexto = stand.estado === 'activo' ? 'Activo' : 'Inactivo';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="stand-check" data-id="${stand.id}"></td>
                <td>${stand.id}</td>
                <td>${stand.nombre}</td>
                <td>${stand.categoria || '—'}</td>
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

        // Sync checkbox "seleccionar todos"
        selectAll.checked = false;
    }

    // ── Crear stand ─────────────────────────────────────────────────────────

    function guardarStand() {
        if (!validarFormulario()) return;

        if (editandoId) {
            const stand = window.db.stands.find(s => s.id === editandoId);
            if (stand) {
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
                nombre:      inputNombre.value.trim(),
                categoria:   inputCategoria.value,
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
        inputCategoria.value = stand.categoria || '';
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

    // Evitar que clicks dentro del modal propaguen al overlay
    document.querySelector('#modalCrearStand .modal').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    btnGuardar.addEventListener('click', (e) => {
        e.stopPropagation();
        guardarStand();
    });

    // Filtros y búsqueda en tiempo real
    searchInput.addEventListener('input', renderTabla);
    filterEstado.addEventListener('change', renderTabla);
    filterCategoria.addEventListener('change', renderTabla);
    filterEmpresa.addEventListener('change', renderTabla);

    // Eliminar seleccionados (botón del toolbar)
    btnEliminarBulk.addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.stand-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            alert('Debes seleccionar al menos un stand para eliminar.');
            return;
        }
        const confirmar = confirm(`¿Eliminar ${seleccionados.length} stand(s) seleccionado(s)? Esta acción no se puede deshacer.`);
        if (!confirmar) return;
        window.db.stands = window.db.stands.filter(s => !seleccionados.includes(s.id));
        selectAll.checked = false;
        renderTabla();
    });

    // Checkbox "seleccionar todos"
    selectAll.addEventListener('change', () => {
        tbody.querySelectorAll('.stand-check').forEach(cb => {
            cb.checked = selectAll.checked;
        });
    });

    // ── Render inicial ──────────────────────────────────────────────────────
    renderTabla();
});
