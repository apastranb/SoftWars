// ==========================================================================
// MÓDULO: GESTIÓN DE USUARIOS — admin-usuarios-logic.js
// Consume GET/POST/PUT/DELETE /api/usuarios
// ==========================================================================

const mostrarError = (idCampo, mensaje) => { validaciones.mostrarError(idCampo, mensaje); };
const limpiarErrores = () => { validaciones.limpiarErrores(); };
const limpiarError = (idCampo) => { validaciones.limpiarError(idCampo); };

const ROLES = ['Administrador', 'Super Administrador', 'Editor', 'Moderador'];
let usuariosCache = [];

document.addEventListener('DOMContentLoaded', async () => {

    // Verificar sesión
    const usuario = await apiSesion();
    if (!usuario) {
        window.location.href = 'login.html';
        return;
    }

    document.querySelector('#headerUserName').textContent = usuario.nombre || 'Administrador';
    document.querySelector('#headerUserRol').textContent = usuario.rol || '';

    // Cerrar sesión
    document.getElementById('btnLogOut').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmar = await validaciones.confirmar('¿Cerrar sesión?', 'Se cerrará tu sesión actual.');
        if (!confirmar) return;
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (err) {}
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Referencias
    const thead = document.querySelector('#thead-usuarios');
    const tbody = document.querySelector('#tbody-usuarios');
    const tablaVacia = document.querySelector('#tabla-vacia');
    const filtroRol = document.querySelector('#filtro-rol');
    const filtroEstado = document.querySelector('#filtro-estado');
    const searchInput = document.querySelector('#searchInput');

    // Poblar select de roles
    const editRolSelect = document.querySelector('#edit-rol');
    ROLES.forEach(rol => {
        const optFiltro = document.createElement('option');
        optFiltro.value = rol;
        optFiltro.textContent = rol;
        filtroRol.appendChild(optFiltro);

        const optEdit = document.createElement('option');
        optEdit.value = rol;
        optEdit.textContent = rol;
        editRolSelect.appendChild(optEdit);
    });

    // ── Cargar usuarios desde API ───────────────────────────────────────

    const cargarUsuarios = async () => {
        try {
            const resp = await apiGet('usuarios');
            usuariosCache = Array.isArray(resp) ? resp : (resp.data || []);
        } catch (e) { usuariosCache = []; }
    };

    // ── Renderizar tabla ────────────────────────────────────────────────

    const renderTabla = () => {
        const texto = searchInput.value.trim().toLowerCase();

        thead.innerHTML = `
            <tr>
                <th><input type="checkbox" id="selectAll" title="Seleccionar todos"></th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha creación</th>
            </tr>
        `;

        const usuarios = usuariosCache.filter(u => {
            const coincideTexto = !texto || u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto);
            const coincideRol = filtroRol.value === 'todos' || u.rol === filtroRol.value;
            const coincideEstado = filtroEstado.value === 'todos' || u.estado === filtroEstado.value;
            return coincideTexto && coincideRol && coincideEstado;
        });

        tbody.innerHTML = '';
        usuarios.forEach(user => {
            const userId = user._id || user.id;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-id="${userId}"></td>
                <td>${user.nombre}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td>
                    <select class="tableSelectStatus estado-${user.estado.toLowerCase()}" data-id="${userId}">
                        <option value="Activo" ${user.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${user.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </td>
                <td>${user.fechaCreacion ? new Date(user.fechaCreacion).toLocaleDateString('es-CR') : '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        tablaVacia.style.display = usuarios.length ? 'none' : 'block';

        document.getElementById('selectAll')?.addEventListener('change', (e) => {
            tbody.querySelectorAll('.row-check').forEach(cb => { cb.checked = e.target.checked; });
        });
    };

    filtroRol.addEventListener('change', renderTabla);
    filtroEstado.addEventListener('change', renderTabla);
    searchInput.addEventListener('input', renderTabla);
    document.querySelector('#buscar-usuario')?.addEventListener('click', renderTabla);

    // ── Cambiar estado ──────────────────────────────────────────────────

    tbody.addEventListener('change', async (e) => {
        if (!e.target.classList.contains('tableSelectStatus')) return;
        const id = e.target.dataset.id;
        const nuevoEstado = e.target.value;
        try {
            await apiPut('usuarios', id, { estado: nuevoEstado });
            const user = usuariosCache.find(u => (u._id || u.id) === id);
            if (user) user.estado = nuevoEstado;
            e.target.className = `tableSelectStatus estado-${nuevoEstado.toLowerCase()}`;
            validaciones.exito('Estado actualizado', `Estado actualizado a "${nuevoEstado}".`);
        } catch (error) {
            e.target.value = nuevoEstado === 'Activo' ? 'Inactivo' : 'Activo';
        }
    });

    // ── Editar usuario ──────────────────────────────────────────────────

    const modalEditar = document.querySelector('#modalEditarUsuario');
    let editandoId = null;

    const cerrarModalEditar = () => modalEditar.classList.remove('modal-visible');

    document.getElementById('btnEditarUsuario').addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.id);
        if (seleccionados.length === 0) {
            validaciones.alerta('Seleccione un usuario', 'Debe seleccionar un usuario para editar.', 'warning');
            return;
        }
        if (seleccionados.length > 1) {
            validaciones.alerta('Solo uno a la vez', 'Solo puede editar un usuario a la vez.', 'warning');
            return;
        }

        const user = usuariosCache.find(u => (u._id || u.id) === seleccionados[0]);
        if (!user) return;

        editandoId = seleccionados[0];
        limpiarErrores();
        document.querySelector('#edit-nombre').value = user.nombre;
        document.querySelector('#edit-email').value = user.email;
        document.querySelector('#edit-rol').value = user.rol;
        modalEditar.classList.add('modal-visible');
    });

    document.querySelector('#btnCerrarEditar').addEventListener('click', cerrarModalEditar);
    document.querySelector('#btnCancelarEditar').addEventListener('click', cerrarModalEditar);
    modalEditar.addEventListener('click', (e) => { if (e.target === modalEditar) cerrarModalEditar(); });

    document.querySelector('#btnGuardarEditar').addEventListener('click', async () => {
        limpiarErrores();
        const nombre = document.querySelector('#edit-nombre').value.trim();
        if (!nombre) { mostrarError('edit-nombre', 'El nombre es obligatorio.'); return; }

        try {
            await apiPut('usuarios', editandoId, { nombre, rol: document.querySelector('#edit-rol').value });
            await cargarUsuarios();
            renderTabla();
            cerrarModalEditar();
            validaciones.exito('Usuario actualizado', 'Los datos se guardaron correctamente.');
        } catch (error) { /* apiPut ya muestra el error */ }
    });

    // ── Crear usuario ───────────────────────────────────────────────────

    const modalCrear = document.querySelector('#modalCrearUsuario');
    const crearNombreInput = document.querySelector('#crear-nombre');
    const crearEmailInput = document.querySelector('#crear-email');
    const crearPasswordInput = document.querySelector('#crear-password');
    const crearRolSelect = document.querySelector('#crear-rol');

    ROLES.forEach(rol => {
        const opt = document.createElement('option');
        opt.value = rol;
        opt.textContent = rol;
        crearRolSelect.appendChild(opt);
    });

    const abrirModalCrear = () => {
        crearNombreInput.value = '';
        crearEmailInput.value = '';
        crearPasswordInput.value = '';
        crearRolSelect.value = 'Administrador';
        limpiarErrores();
        modalCrear.classList.add('modal-visible');
    };

    const cerrarModalCrear = () => modalCrear.classList.remove('modal-visible');

    document.querySelector('#btnNuevoUsuario').addEventListener('click', abrirModalCrear);
    document.querySelector('#btnCerrarCrear').addEventListener('click', cerrarModalCrear);
    document.querySelector('#btnCancelarCrear').addEventListener('click', cerrarModalCrear);
    modalCrear.addEventListener('click', (e) => { if (e.target === modalCrear) cerrarModalCrear(); });

    crearNombreInput.addEventListener('blur', () => {
        if (!validaciones.validarRequerido(crearNombreInput.value)) mostrarError('crear-nombre', 'El nombre es obligatorio.');
        else limpiarError('crear-nombre');
    });
    crearEmailInput.addEventListener('blur', () => {
        if (!validaciones.validarCorreo(crearEmailInput.value)) mostrarError('crear-email', 'Ingrese un correo válido.');
        else limpiarError('crear-email');
    });
    crearPasswordInput.addEventListener('blur', () => {
        if (!validaciones.validarContrasena(crearPasswordInput.value)) mostrarError('crear-password', 'La contraseña no cumple con los requisitos.');
        else limpiarError('crear-password');
    });

    document.querySelector('#btnGuardarCrear').addEventListener('click', async () => {
        limpiarErrores();
        let valido = true;

        if (!validaciones.validarRequerido(crearNombreInput.value)) { mostrarError('crear-nombre', 'El nombre es obligatorio.'); valido = false; }
        if (!validaciones.validarCorreo(crearEmailInput.value)) { mostrarError('crear-email', 'Ingrese un correo válido.'); valido = false; }
        if (!validaciones.validarContrasena(crearPasswordInput.value)) { mostrarError('crear-password', 'La contraseña no cumple con los requisitos.'); valido = false; }
        if (!validaciones.validarRequerido(crearRolSelect.value)) { mostrarError('crear-rol', 'Seleccione un rol.'); valido = false; }

        if (!valido) return;

        try {
            await apiPost('usuarios', {
                nombre: crearNombreInput.value.trim(),
                email: crearEmailInput.value.trim(),
                password: crearPasswordInput.value,
                rol: crearRolSelect.value
            });
            await cargarUsuarios();
            renderTabla();
            cerrarModalCrear();
            validaciones.exito('Administrador creado', 'La cuenta se creó correctamente.');
        } catch (error) { /* apiPost muestra el error (409 correo duplicado, etc.) */ }
    });

    // ── Carga inicial ───────────────────────────────────────────────────
    await cargarUsuarios();
    renderTabla();
});
