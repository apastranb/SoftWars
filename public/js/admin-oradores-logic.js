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

    function abrirModal()  { modalOverlay.classList.add('modal-visible'); }
    function cerrarModal() {
        modalOverlay.classList.remove('modal-visible');
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
                if (orador) {
                    orador.estado = e.target.value;
                    validaciones.exito('Estado actualizado', `El presentador se marcó como "${e.target.value}".`);
                }
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

        const esEdicion = !!editandoId;
        cerrarModal();
        renderTabla();
        if (esEdicion) {
            validaciones.exito('Presentador actualizado', 'Los datos se guardaron correctamente.');
        } else {
            validaciones.exito('Presentador registrado', 'El presentador se registró con éxito.');
        }
    }

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

    async function eliminarOrador(id) {
        const orador = window.db.oradores.find(o => o.id === id);
        if (!orador) return;

        const confirmar = await validaciones.confirmar('¿Eliminar presentador?', `Se eliminará a "${orador.nombre}". Esta acción no se puede deshacer.`);
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
            validaciones.alerta('Seleccione un presentador', 'Debe seleccionar un presentador para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un presentador a la vez.', 'warning');
            return;
        }
        abrirModalEditar(seleccionados[0]);
    });

    // Eliminar desde toolbar (1 o mas seleccionados)
    document.getElementById('btnEliminarOrador').addEventListener('click', async () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione presentadores', 'Seleccione al menos un presentador para eliminar.', 'warning');
            return;
        }
        const confirmar = await validaciones.confirmar('¿Eliminar presentador(es)?', `Se eliminarán ${seleccionados.length} presentador(es). Esta acción no se puede deshacer.`);
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
    document.querySelector('#modalCrearOrador .custom-modal').addEventListener('click', (e) => {
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

    // ══════════════════════════════════════════════════════════════════════════
    // POSTULACIONES DE PRESENTADORES
    // ══════════════════════════════════════════════════════════════════════════

    const tbodyPostulaciones = document.getElementById('adminPostulacionesTableBody');
    const btnAprobar = document.getElementById('btnAprobarPostulacion');
    const btnEliminarPost = document.getElementById('btnEliminarPostulacion');

    function obtenerNombreActividad(actividadId) {
        const act = window.db.actividades.find(a => a.id === actividadId);
        return act ? act.nombre : 'Sin asignar';
    }

    function renderPostulaciones() {
        const postulaciones = window.db.postulaciones || [];
        const filtroEstado = document.getElementById('filterEstadoPostulacion').value;
        const filtroFecha = document.getElementById('filterFechaPostulacion').value;

        const filtradas = postulaciones.filter(p => {
            const coincideEstado = !filtroEstado || p.estado === filtroEstado;
            const coincideFecha = !filtroFecha || p.fechaPostulacion === filtroFecha;
            return coincideEstado && coincideFecha;
        });

        tbodyPostulaciones.innerHTML = '';

        if (filtradas.length === 0) {
            document.getElementById('tabla-vacia-postulaciones').classList.remove('oculto');
            return;
        }
        document.getElementById('tabla-vacia-postulaciones').classList.add('oculto');

        filtradas.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check-post" data-id="${p.id}"></td>
                <td>${p.fechaPostulacion || ''}</td>
                <td>${p.nombre}</td>
                <td>${p.correo}</td>
                <td>${p.especialidad}</td>
                <td>${obtenerNombreActividad(p.actividadId)}</td>
                <td>
                    <select class="tableSelectStatus" data-id="${p.id}">
                        <option value="pendiente" ${p.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="aprobada" ${p.estado === 'aprobada' ? 'selected' : ''}>Aprobada</option>
                        <option value="rechazada" ${p.estado === 'rechazada' ? 'selected' : ''}>Rechazada</option>
                    </select>
                </td>
            `;
            tbodyPostulaciones.appendChild(tr);
        });

        // Select all
        document.getElementById('selectAllPostulaciones').checked = false;

        // Estado change — aprobar crea orador
        tbodyPostulaciones.querySelectorAll('.tableSelectStatus').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const nuevoEstado = e.target.value;
                const postulacion = window.db.postulaciones.find(p => p.id === id);
                if (!postulacion) return;

                // Si ya estaba aprobada, no dejar cambiar
                if (postulacion.estado === 'aprobada' && nuevoEstado !== 'aprobada') {
                    validaciones.alerta('No permitido', 'Una postulación aprobada no se puede revertir.', 'warning');
                    e.target.value = 'aprobada';
                    return;
                }

                // Confirmar aprobación
                if (nuevoEstado === 'aprobada') {
                    const confirmar = await validaciones.confirmar(
                        '¿Aprobar postulación?',
                        `Se creará a "${postulacion.nombre}" como presentador.`
                    );
                    if (!confirmar) {
                        e.target.value = postulacion.estado;
                        return;
                    }
                    crearOradorDesdePostulacion(postulacion);
                }

                postulacion.estado = nuevoEstado;
                renderPostulaciones();

                if (nuevoEstado === 'aprobada') {
                    renderTabla();
                    validaciones.exito('Postulación aprobada', `"${postulacion.nombre}" fue registrado como presentador.`);
                }
            });
        });
    }

    function crearOradorDesdePostulacion(postulacion) {
        const ids = window.db.oradores.map(o => parseInt(o.id.replace('OR-', ''), 10));
        const max = ids.length > 0 ? Math.max(...ids) : 0;
        const nuevoId = `OR-${String(max + 1).padStart(3, '0')}`;

        window.db.oradores.push({
            id: nuevoId,
            nombre: postulacion.nombre,
            correo: postulacion.correo,
            telefono: postulacion.telefonos ? postulacion.telefonos[0] : '',
            telefonos: postulacion.telefonos || [],
            especialidad: postulacion.especialidad,
            empresa: postulacion.empresa || '',
            biografia: postulacion.biografia || '',
            foto: postulacion.foto || null,
            eventoId: '',
            estado: 'activo',
            fechaRegistro: new Date().toISOString().slice(0, 10)
        });
    }

    // Botón Aprobar (con checks)
    btnAprobar.addEventListener('click', async () => {
        const seleccionados = [...tbodyPostulaciones.querySelectorAll('.row-check-post:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione postulaciones', 'Debe seleccionar al menos una postulación para aprobar.', 'warning');
            return;
        }

        const pendientes = seleccionados.filter(id => {
            const p = window.db.postulaciones.find(post => post.id === id);
            return p && p.estado === 'pendiente';
        });

        if (pendientes.length === 0) {
            validaciones.alerta('Sin pendientes', 'Las postulaciones seleccionadas ya fueron procesadas.', 'info');
            return;
        }

        const confirmar = await validaciones.confirmar(
            '¿Aprobar postulaciones?',
            `Se aprobarán ${pendientes.length} postulación(es) y se crearán como presentadores.`
        );
        if (!confirmar) return;

        pendientes.forEach(id => {
            const postulacion = window.db.postulaciones.find(p => p.id === id);
            if (postulacion) {
                postulacion.estado = 'aprobada';
                crearOradorDesdePostulacion(postulacion);
            }
        });

        renderPostulaciones();
        renderTabla();
        validaciones.exito('Postulaciones aprobadas', `${pendientes.length} presentador(es) registrado(s).`);
    });

    // Botón Eliminar (solo rechazadas)
    btnEliminarPost.addEventListener('click', async () => {
        const seleccionados = [...tbodyPostulaciones.querySelectorAll('.row-check-post:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione postulaciones', 'Debe seleccionar al menos una postulación para eliminar.', 'warning');
            return;
        }

        const eliminables = seleccionados.filter(id => {
            const p = window.db.postulaciones.find(post => post.id === id);
            return p && p.estado === 'rechazada';
        });

        if (eliminables.length === 0) {
            validaciones.alerta('No eliminable', 'Solo se pueden eliminar postulaciones rechazadas.', 'warning');
            return;
        }

        const confirmar = await validaciones.confirmar(
            '¿Eliminar postulaciones?',
            `Se eliminarán ${eliminables.length} postulación(es) rechazada(s).`
        );
        if (!confirmar) return;

        window.db.postulaciones = window.db.postulaciones.filter(p => !eliminables.includes(p.id));
        renderPostulaciones();
        validaciones.exito('Eliminadas', `${eliminables.length} postulación(es) eliminada(s).`);
    });

    // Select all postulaciones
    document.getElementById('selectAllPostulaciones').addEventListener('change', (e) => {
        tbodyPostulaciones.querySelectorAll('.row-check-post').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // Filtros de postulaciones
    document.getElementById('filterEstadoPostulacion').addEventListener('change', renderPostulaciones);
    document.getElementById('filterFechaPostulacion').addEventListener('change', renderPostulaciones);

    renderPostulaciones();
});
