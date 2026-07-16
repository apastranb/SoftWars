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
    const modalOverlay     = document.getElementById('modalCrearOrador');
    const modalTitulo      = document.getElementById('modalOradorTitulo');
    const btnCrearOrador   = document.getElementById('btnCrearOrador');
    const btnCerrarModal   = document.getElementById('btnCerrarModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const btnGuardar       = document.getElementById('btnGuardarOrador');
    const tbody            = document.getElementById('adminOradoresTableBody');
    const searchInput      = document.getElementById('searchInput');
    const filterEstado     = document.getElementById('filterEstado');
    const filterFecha      = document.getElementById('filterFechaOrador');

    // Inputs del modal
    const inputNombre       = document.getElementById('inputNombreOrador');
    const inputCorreo       = document.getElementById('inputCorreoOrador');
    const inputTelefono     = document.getElementById('inputTelefonoOrador');
    const inputTelefono2    = document.getElementById('inputTelefono2Orador');
    const inputEspecialidad = document.getElementById('inputEspecialidadOrador');
    const inputEmpresa      = document.getElementById('inputEmpresaOrador');
    const inputBiografia    = document.getElementById('inputBiografiaOrador');
    const inputFoto         = document.getElementById('inputFotoOrador');
    const fotoPreview       = document.getElementById('fotoPreview');
    const inputEvento       = document.getElementById('inputEventoOrador');

    // ID del orador que se está editando (null = modo crear)
    let editandoId  = null;
    // Base64 de la foto seleccionada
    let fotoDataUrl = null;

    // ── Utilidades ──────────────────────────────────────────────────────────

    function generarId() {
        const ids = window.db.oradores.map(o => parseInt(o.id.replace('OR-', ''), 10));
        const max = ids.length > 0 ? Math.max(...ids) : 0;
        return `OR-${String(max + 1).padStart(3, '0')}`;
    }

    function fechaHoy() {
        const hoy = new Date();
        const d = String(hoy.getDate()).padStart(2, '0');
        const m = String(hoy.getMonth() + 1).padStart(2, '0');
        const y = hoy.getFullYear();
        return `${y}/${m}/${d}`;
    }

    function abrirModal()  { modalOverlay.classList.add('active'); }
    function cerrarModal() {
        modalOverlay.classList.remove('active');
        limpiarModal();
        editandoId  = null;
        fotoDataUrl = null;
    }

    function limpiarModal() {
        inputNombre.value       = '';
        inputCorreo.value       = '';
        inputTelefono.value     = '';
        if (inputTelefono2) inputTelefono2.value = '';
        inputEspecialidad.value = '';
        inputEmpresa.value      = '';
        inputBiografia.value    = '';
        inputFoto.value         = '';
        inputEvento.value       = '';
        fotoPreview.src         = '../img/img-placeholder.png';
        fotoDataUrl             = null;
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

    // ── Errores de validación ───────────────────────────────────────────────

    function mostrarError(idCampo, mensaje) {
        validaciones.mostrarError(idCampo, mensaje);
    }

    function limpiarErrores() {
        validaciones.limpiarErrores();
    }

    function validarFormulario() {
        limpiarErrores();
        let valido = true;

        // Nombre: obligatorio, minimo 3 caracteres
        if (!validaciones.validarRequerido(inputNombre.value)) {
            mostrarError('inputNombreOrador', 'El nombre es requerido.');
            valido = false;
        } else if (!validaciones.validarNombre(inputNombre.value)) {
            mostrarError('inputNombreOrador', 'El nombre debe tener al menos 3 caracteres.');
            valido = false;
        }

        // Correo: obligatorio, formato valido
        if (!validaciones.validarRequerido(inputCorreo.value)) {
            mostrarError('inputCorreoOrador', 'El correo es requerido.');
            valido = false;
        } else if (!validaciones.validarCorreo(inputCorreo.value)) {
            mostrarError('inputCorreoOrador', 'Ingrese un correo válido (ej. usuario@empresa.com).');
            valido = false;
        }

        // Telefono principal: obligatorio, formato 8 digitos
        if (!validaciones.validarRequerido(inputTelefono.value)) {
            mostrarError('inputTelefonoOrador', 'El teléfono principal es requerido.');
            valido = false;
        } else if (!validaciones.validarTelefono(inputTelefono.value)) {
            mostrarError('inputTelefonoOrador', 'El teléfono debe tener 8 dígitos (ej. 8888-8888).');
            valido = false;
        }

        // Telefono secundario: opcional, pero si tiene algo validar formato
        const inputTel2 = document.getElementById('inputTelefono2Orador');
        if (inputTel2 && validaciones.validarRequerido(inputTel2.value)) {
            if (!validaciones.validarTelefono(inputTel2.value)) {
                mostrarError('inputTelefono2Orador', 'El teléfono secundario debe tener 8 dígitos.');
                valido = false;
            }
        }

        // Especialidad: obligatoria
        if (!validaciones.validarRequerido(inputEspecialidad.value)) {
            mostrarError('inputEspecialidadOrador', 'La especialidad es requerida.');
            valido = false;
        }

        // Institucion/Organizacion: obligatoria
        if (!validaciones.validarRequerido(inputEmpresa.value)) {
            mostrarError('inputEmpresaOrador', 'La institución u organización es requerida.');
            valido = false;
        }

        // Biografia: obligatoria, max 200 caracteres
        if (!validaciones.validarRequerido(inputBiografia.value)) {
            mostrarError('inputBiografiaOrador', 'La biografía es requerida.');
            valido = false;
        } else if (!validaciones.validarDescripcion(inputBiografia.value, true)) {
            mostrarError('inputBiografiaOrador', 'La biografía no puede superar los 200 caracteres.');
            valido = false;
        }

        return valido;
    }

    // ── Renderizado ─────────────────────────────────────────────────────────

    function obtenerOradorFiltrados() {
        const busqueda = searchInput.value.trim().toLowerCase();
        const estado = filterEstado.value;
        const fecha = filterFecha.value;

        return window.db.oradores.filter(o => {
            const coincideBusqueda = !busqueda ||
                o.nombre.toLowerCase().includes(busqueda) ||
                o.correo.toLowerCase().includes(busqueda) ||
                o.empresa.toLowerCase().includes(busqueda) ||
                o.especialidad.toLowerCase().includes(busqueda);

            const coincideEstado = !estado || o.estado === estado;
            const coincideFecha = !fecha || o.fechaRegistro === fecha;

            return coincideBusqueda && coincideEstado && coincideFecha;
        });
    }

    function renderTabla() {
        const oradores = obtenerOradorFiltrados();
        tbody.innerHTML = '';

        if (oradores.length === 0) {
            tbody.innerHTML = '';
            document.getElementById('tabla-vacia').classList.remove('oculto');
            return;
        }
        document.getElementById('tabla-vacia').classList.add('oculto');

        oradores.forEach(o => {
            const badgeClass = o.estado === 'activo' ? 'badge-active' : 'badge-inactive';
            const badgeTexto = o.estado === 'activo' ? 'Activo' : 'Inactivo';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-id="${o.id}"></td>
                <td>${o.fechaRegistro}</td>
                <td>${o.nombre}</td>
                <td>${o.correo}</td>
                <td>${o.telefono}</td>
                <td>${o.especialidad}</td>
                <td>${o.empresa}</td>
                <td>
                    <select class="tableSelectStatus" data-id="${o.id}">
                        <option value="activo" ${o.estado === 'activo' ? 'selected' : ''}>Activo</option>
                        <option value="inactivo" ${o.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
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
                const orador = window.db.oradores.find(o => o.id === id);
                if (orador) orador.estado = e.target.value;
            });
        });
    }

    // ── Crear / Guardar orador ──────────────────────────────────────────────

    function guardarOrador() {
        if (!validarFormulario()) return;

        if (editandoId) {
            const orador = window.db.oradores.find(o => o.id === editandoId);
            if (orador) {
                orador.nombre       = inputNombre.value.trim();
                orador.correo       = inputCorreo.value.trim();
                orador.telefono     = inputTelefono.value.trim();
                orador.especialidad = inputEspecialidad.value.trim();
                orador.empresa      = inputEmpresa.value.trim();
                orador.biografia    = inputBiografia.value.trim();
                orador.eventoId     = inputEvento.value;
                if (fotoDataUrl) orador.foto = fotoDataUrl;
            }
        } else {
            window.db.oradores.push({
                id:           generarId(),
                nombre:       inputNombre.value.trim(),
                correo:       inputCorreo.value.trim(),
                telefono:     inputTelefono.value.trim(),
                especialidad: inputEspecialidad.value.trim(),
                empresa:      inputEmpresa.value.trim(),
                biografia:    inputBiografia.value.trim(),
                foto:         fotoDataUrl,
                eventoId:     inputEvento.value,
                estado:       'activo',
                fechaRegistro: fechaHoy()
            });
        }

        cerrarModal();
        renderTabla();
    }

    // ── Editar orador ───────────────────────────────────────────────────────

    function abrirModalEditar(id) {
        const orador = window.db.oradores.find(o => o.id === id);
        if (!orador) return;

        editandoId = id;
        poblarSelectEventos();

        modalTitulo.textContent = 'Editar Presentador';
        btnGuardar.textContent  = 'Guardar Cambios';

        inputNombre.value       = orador.nombre;
        inputCorreo.value       = orador.correo;
        inputTelefono.value     = orador.telefono;
        if (inputTelefono2) inputTelefono2.value = '';
        inputEspecialidad.value = orador.especialidad;
        inputEmpresa.value      = orador.empresa;
        inputBiografia.value    = orador.biografia;
        inputEvento.value       = orador.eventoId || '';
        fotoPreview.src         = orador.foto || '../img/img-placeholder.png';
        fotoDataUrl             = orador.foto || null;

        abrirModal();
    }

    // ── Eliminar orador ─────────────────────────────────────────────────────

    function eliminarOrador(id) {
        const orador = window.db.oradores.find(o => o.id === id);
        if (!orador) return;

        const confirmar = confirm(`¿Estás seguro de que deseas eliminar a "${orador.nombre}"? Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        window.db.oradores = window.db.oradores.filter(o => o.id !== id);
        renderTabla();
    }

    // ── Event listeners ─────────────────────────────────────────────────────

    // Abrir modal para crear
    btnCrearOrador.addEventListener('click', () => {
        editandoId = null;
        poblarSelectEventos();
        modalTitulo.textContent = 'Registrar Presentador';
        btnGuardar.textContent  = 'Registrar';
        limpiarModal();
        abrirModal();
    });

    // Editar desde toolbar (solo 1 seleccionado)
    document.getElementById('btnEditarOrador').addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            alert('Seleccione un presentador para editar.');
            return;
        }
        if (seleccionados.length > 1) {
            alert('Solo puede editar un presentador a la vez.');
            return;
        }
        abrirModalEditar(seleccionados[0]);
    });

    // Eliminar desde toolbar (1 o mas seleccionados)
    document.getElementById('btnEliminarOrador').addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            alert('Seleccione al menos un presentador para eliminar.');
            return;
        }
        const confirmar = confirm(`¿Eliminar ${seleccionados.length} presentador(es)? Esta acción no se puede deshacer.`);
        if (!confirmar) return;
        window.db.oradores = window.db.oradores.filter(o => !seleccionados.includes(o.id));
        renderTabla();
    });

    // Select all checkbox
    document.getElementById('selectAll').addEventListener('change', (e) => {
        tbody.querySelectorAll('.row-check').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Cerrar modal
    btnCerrarModal.addEventListener('click', cerrarModal);
    btnCancelarModal.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic fuera del modal
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });

    // Evitar que clicks dentro del modal cierren el overlay
    document.querySelector('#modalCrearOrador .modal').addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Guardar
    btnGuardar.addEventListener('click', (e) => {
        e.stopPropagation();
        guardarOrador();
    });

    // Vista previa de foto al seleccionar archivo
    inputFoto.addEventListener('change', () => {
        const archivo = inputFoto.files[0];
        if (!archivo) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            fotoDataUrl     = e.target.result;
            fotoPreview.src = fotoDataUrl;
        };
        reader.readAsDataURL(archivo);
    });

    // Filtros y busqueda en tiempo real
    searchInput.addEventListener('input', renderTabla);
    filterEstado.addEventListener('change', renderTabla);
    filterFecha.addEventListener('change', renderTabla);

    // ── Render inicial ──────────────────────────────────────────────────────
    renderTabla();
});
