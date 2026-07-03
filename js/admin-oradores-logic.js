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

    // ── Referencias al DOM ──────────────────────────────────────────────────
    const modalOverlay     = document.getElementById('modalCrearOrador');
    const modalTitulo      = document.getElementById('modalOradorTitulo');
    const btnCrearOrador   = document.getElementById('btnCrearOrador');
    const btnEliminarBulk  = document.getElementById('btnEliminarOrador');
    const btnCerrarModal   = document.getElementById('btnCerrarModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const btnGuardar       = document.getElementById('btnGuardarOrador');
    const tbody            = document.getElementById('adminOradoresTableBody');
    const searchInput      = document.getElementById('searchInput');
    const filterEstado     = document.getElementById('filterEstado');
    const filterEspecialidad = document.getElementById('filterEspecialidad');
    const filterEvento     = document.getElementById('filterEvento');
    const selectAll        = document.getElementById('selectAllOradores');

    // Inputs del modal
    const inputNombre       = document.getElementById('inputNombreOrador');
    const inputCorreo       = document.getElementById('inputCorreoOrador');
    const inputTelefono     = document.getElementById('inputTelefonoOrador');
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
        inputEspecialidad.value = '';
        inputEmpresa.value      = '';
        inputBiografia.value    = '';
        inputFoto.value         = '';
        inputEvento.value       = '';
        fotoPreview.src         = '../img/img-placeholder.png';
        fotoDataUrl             = null;
        limpiarErrores();
    }

    // ── Errores de validación ───────────────────────────────────────────────

    function mostrarError(input, mensaje) {
        input.style.borderColor = '#ef4444';
        let span = input.nextElementSibling;
        if (!span || !span.classList.contains('input-error')) {
            span = document.createElement('span');
            span.classList.add('input-error');
            span.style.cssText = 'color:#ef4444;font-size:0.8rem;margin-top:2px;display:block;';
            input.after(span);
        }
        span.textContent = mensaje;
    }

    function limpiarErrores() {
        [inputNombre, inputCorreo, inputTelefono, inputEspecialidad, inputEmpresa, inputBiografia].forEach(inp => {
            inp.style.borderColor = '';
            const span = inp.nextElementSibling;
            if (span && span.classList.contains('input-error')) span.remove();
        });
    }

    function validarFormulario() {
        limpiarErrores();
        let valido = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const telRegex   = /^\d{4}-?\d{4}$/;

        if (!inputNombre.value.trim()) {
            mostrarError(inputNombre, 'El nombre es requerido.');
            valido = false;
        }
        if (!emailRegex.test(inputCorreo.value.trim())) {
            mostrarError(inputCorreo, 'Ingrese un correo válido (ej. usuario@empresa.com).');
            valido = false;
        }
        if (!telRegex.test(inputTelefono.value.trim())) {
            mostrarError(inputTelefono, 'El teléfono debe tener el formato 0000-0000.');
            valido = false;
        }
        if (!inputEspecialidad.value.trim()) {
            mostrarError(inputEspecialidad, 'La profesión / especialidad es requerida.');
            valido = false;
        }
        if (!inputEmpresa.value.trim()) {
            mostrarError(inputEmpresa, 'La empresa es requerida.');
            valido = false;
        }
        if (!inputBiografia.value.trim()) {
            mostrarError(inputBiografia, 'La biografía es requerida.');
            valido = false;
        }
        return valido;
    }

    // ── Filtros dinámicos ───────────────────────────────────────────────────

    function actualizarFiltroEspecialidad() {
        const actual = filterEspecialidad.value;
        const valores = [...new Set(window.db.oradores.map(o => o.especialidad))].sort();
        filterEspecialidad.innerHTML = '<option value="">Profesión / Especialidad</option>';
        valores.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            if (v === actual) opt.selected = true;
            filterEspecialidad.appendChild(opt);
        });
    }

    function actualizarFiltroEventos() {
        const actual = filterEvento.value;
        filterEvento.innerHTML = '<option value="">Eventos / Actividades</option>';
        window.db.eventos.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.id;
            opt.textContent = ev.nombre;
            if (ev.id === actual) opt.selected = true;
            filterEvento.appendChild(opt);
        });
    }

    function actualizarSelectEventosModal() {
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

    // ── Renderizado ─────────────────────────────────────────────────────────

    function obtenerOradorFiltrados() {
        const busqueda  = searchInput.value.trim().toLowerCase();
        const estado    = filterEstado.value;
        const especialidad = filterEspecialidad.value;
        const eventoId  = filterEvento.value;

        return window.db.oradores.filter(o => {
            const coincideBusqueda = !busqueda ||
                o.nombre.toLowerCase().includes(busqueda) ||
                o.correo.toLowerCase().includes(busqueda) ||
                o.empresa.toLowerCase().includes(busqueda) ||
                o.especialidad.toLowerCase().includes(busqueda);

            const coincideEstado       = !estado       || o.estado === estado;
            const coincideEspecialidad = !especialidad || o.especialidad === especialidad;
            const coincideEvento       = !eventoId     || o.eventoId === eventoId;

            return coincideBusqueda && coincideEstado && coincideEspecialidad && coincideEvento;
        });
    }

    function nombreEvento(eventoId) {
        const ev = window.db.eventos.find(e => e.id === eventoId);
        return ev ? ev.nombre : '—';
    }

    function renderTabla() {
        actualizarFiltroEspecialidad();
        actualizarFiltroEventos();

        const oradores = obtenerOradorFiltrados();
        tbody.innerHTML = '';

        if (oradores.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:2rem;color:#6b7280;">No se encontraron presentadores.</td></tr>`;
            selectAll.checked = false;
            return;
        }

        oradores.forEach(o => {
            const badgeClass = o.estado === 'activo' ? 'badge-active' : 'badge-inactive';
            const badgeTexto = o.estado === 'activo' ? 'Activo' : 'Inactivo';
            const fotoSrc    = o.foto || '../img/img-placeholder.png';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="orador-check" data-id="${o.id}"></td>
                <td>${o.fechaRegistro}</td>
                <td>${o.nombre}</td>
                <td>${o.correo}</td>
                <td>${o.telefono}</td>
                <td>${o.especialidad}</td>
                <td>${o.empresa}</td>
                <td>${o.biografia}</td>
                <td><img src="${fotoSrc}" alt="Foto ${o.nombre}" class="orador-foto"></td>
                <td>${nombreEvento(o.eventoId)}</td>
                <td><span class="badge ${badgeClass}">${badgeTexto}</span></td>
                <td>
                    <button class="eventsAdminBtnSecondary btn-editar-orador" data-id="${o.id}">Editar</button>
                    <button class="eventsAdminBtnSecondary btnDelete btn-eliminar-orador" data-id="${o.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos por fila
        tbody.querySelectorAll('.btn-editar-orador').forEach(btn => {
            btn.addEventListener('click', () => abrirModalEditar(btn.dataset.id));
        });
        tbody.querySelectorAll('.btn-eliminar-orador').forEach(btn => {
            btn.addEventListener('click', () => eliminarOrador(btn.dataset.id));
        });

        // Sync checkbox "seleccionar todos"
        selectAll.checked = false;
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
        actualizarSelectEventosModal();

        modalTitulo.textContent = 'Editar Presentador';
        btnGuardar.textContent  = 'Guardar Cambios';

        inputNombre.value       = orador.nombre;
        inputCorreo.value       = orador.correo;
        inputTelefono.value     = orador.telefono;
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
        actualizarSelectEventosModal();
        modalTitulo.textContent = 'Registrar Presentador';
        btnGuardar.textContent  = 'Registrar';
        limpiarModal();
        abrirModal();
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

    // Eliminar seleccionados (botón del toolbar)
    btnEliminarBulk.addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.orador-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            alert('Seleccioná al menos un presentador para eliminar.');
            return;
        }
        const confirmar = confirm(`¿Eliminar ${seleccionados.length} presentador(es) seleccionado(s)? Esta acción no se puede deshacer.`);
        if (!confirmar) return;
        window.db.oradores = window.db.oradores.filter(o => !seleccionados.includes(o.id));
        selectAll.checked = false;
        renderTabla();
    });

    // Checkbox "seleccionar todos"
    selectAll.addEventListener('change', () => {
        tbody.querySelectorAll('.orador-check').forEach(cb => {
            cb.checked = selectAll.checked;
        });
    });

    // Filtros y búsqueda en tiempo real
    searchInput.addEventListener('input', renderTabla);
    filterEstado.addEventListener('change', renderTabla);
    filterEspecialidad.addEventListener('change', renderTabla);
    filterEvento.addEventListener('change', renderTabla);

    // ── Render inicial ──────────────────────────────────────────────────────
    renderTabla();
});
