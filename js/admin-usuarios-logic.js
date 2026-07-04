// --- FUNCIONES DE UTILIDAD ---
const mostrarError = (idCampo, mensaje) => {
    validaciones.mostrarError(idCampo, mensaje);
};

const limpiarErrores = () => {
    validaciones.limpiarErrores();
};

// Limpia el error de un solo campo (usado en validacion en tiempo real - RF-32)
const limpiarError = (idCampo) => {
    validaciones.limpiarError(idCampo);
};

// HU-02: Cerrar Sesion (disponible desde el layout de admin)
window.cerrarSesion = function () {
    localStorage.removeItem('sesionActiva');
    localStorage.removeItem('sesionEmail');
    localStorage.removeItem('sesionNombre');
    localStorage.removeItem('sesionRol');
    window.location.href = 'login.html';
};

let toastTimeout;
const mostrarToast = (mensaje, tipo = 'success') => {
    const toast = document.getElementById('toast');
    toast.textContent = mensaje;
    toast.className = 'toast toast--visible' + (tipo === 'error' ? ' toast--error' : '');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('toast--visible');
    }, 2800);
};

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // GUARDA DE SESION: solo usuarios con Sesion activa (HU-01/HU-02)
    // pueden ver esta pagina de administracion.
    // ==========================================================
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    document.querySelector('#headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.querySelector('#headerUserRol').textContent = localStorage.getItem('sesionRol') || '';

    // Cerrar Sesion
    document.getElementById('btnLogOut').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('sesionActiva');
        localStorage.removeItem('sesionEmail');
        localStorage.removeItem('sesionNombre');
        localStorage.removeItem('sesionRol');
        window.location.href = 'login.html';
    });

    // --- Referencias a elementos ---
    const thead = document.querySelector('#thead-usuarios');
    const tbody = document.querySelector('#tbody-usuarios');
    const tablaVacia = document.querySelector('#tabla-vacia');
    const filtroRol = document.querySelector('#filtro-rol');
    const filtroEstado = document.querySelector('#filtro-estado');
    const searchInput = document.querySelector('#searchInput');

    // Cargar catalogo de roles en el filtro y en el modal de edicion
    const editRolSelect = document.querySelector('#edit-rol');
    window.db.roles.forEach(rol => {
        const optFiltro = document.createElement('option');
        optFiltro.value = rol;
        optFiltro.textContent = rol;
        filtroRol.appendChild(optFiltro);

        const optEdit = document.createElement('option');
        optEdit.value = rol;
        optEdit.textContent = rol;
        editRolSelect.appendChild(optEdit);
    });

    // ==========================================================
    // HU-05: Listar Administradores
    // ==========================================================
    const renderTabla = () => {
        const texto = searchInput.value.trim().toLowerCase();

        thead.innerHTML = `
            <tr>
                <th><input type="checkbox" id="selectAll" title="Seleccionar todos"></th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Creacion</th>
            </tr>
        `;

        const usuarios = window.db.usuarios.filter(u => {
            const coincideTexto = !texto || u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto);
            const coincideRol   = filtroRol.value === 'todos'   || u.rol    === filtroRol.value;
            const coincideEstado = filtroEstado.value === 'todos' || u.estado === filtroEstado.value;
            return coincideTexto && coincideRol && coincideEstado;
        });

        tbody.innerHTML = '';
        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="checkbox" class="row-check" data-email="${user.email}"></td>
                <td>${user.nombre}</td>
                <td>${user.email}</td>
                <td>${user.rol}</td>
                <td>
                    <select class="tableSelectStatus estado-${user.estado.toLowerCase()}" data-email="${user.email}">
                        <option value="Activo"   ${user.estado === 'Activo'   ? 'selected' : ''}>Activo</option>
                        <option value="Inactivo" ${user.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                    </select>
                </td>
                <td>${user.fechaCreacion || '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        tablaVacia.style.display = usuarios.length ? 'none' : 'block';

        // Select all checkbox
        document.getElementById('selectAll')?.addEventListener('change', (e) => {
            tbody.querySelectorAll('.row-check').forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    };

    filtroRol.addEventListener('change', renderTabla);
    filtroEstado.addEventListener('change', renderTabla);
    searchInput.addEventListener('input', renderTabla);
    document.querySelector('#buscar-usuario').addEventListener('click', renderTabla);

    // ==========================================================
    // HU-07: Cambiar Estado de Usuario (select en la tabla)
    // ==========================================================
    tbody.addEventListener('change', (e) => {
        if (!e.target.classList.contains('tableSelectStatus')) return;

        const email = e.target.dataset.email;
        const nuevoEstado = e.target.value;
        const usuario = window.db.usuarios.find(u => u.email === email);
        if (!usuario) return;

        usuario.estado = nuevoEstado;
        e.target.className = `tableSelectStatus estado-${nuevoEstado.toLowerCase()}`;
        mostrarToast(`Estado de ${usuario.nombre} actualizado a "${nuevoEstado}".`);
    });

    // ==========================================================
    // HU-06: Modificar Usuario
    // ==========================================================
    const modalEditar = document.querySelector('#modalEditarUsuario');
    let emailUsuarioEditando = null;

    const cerrarModalEditar = () => modalEditar.classList.remove('active');

    // Edit from toolbar button
    document.getElementById('btnEditarUsuario').addEventListener('click', () => {
        const seleccionados = [...tbody.querySelectorAll('.row-check:checked')].map(cb => cb.dataset.email);
        if (seleccionados.length === 0) {
            alert('Seleccione un usuario para editar.');
            return;
        }
        if (seleccionados.length > 1) {
            alert('Solo puede editar un usuario a la vez.');
            return;
        }

        const email = seleccionados[0];
        const usuario = window.db.usuarios.find(u => u.email === email);
        if (!usuario) return;

        emailUsuarioEditando = email;
        limpiarErrores();
        document.querySelector('#edit-nombre').value = usuario.nombre;
        document.querySelector('#edit-email').value = usuario.email;
        document.querySelector('#edit-rol').value = usuario.rol;
        modalEditar.classList.add('active');
    });

    document.querySelector('#btnCerrarEditar').addEventListener('click', cerrarModalEditar);
    document.querySelector('#btnCancelarEditar').addEventListener('click', cerrarModalEditar);
    modalEditar.addEventListener('click', (e) => {
        if (e.target === modalEditar) cerrarModalEditar();
    });

    const editNombreInput = document.querySelector('#edit-nombre');
    const validarEditNombre = () => {
        if (!editNombreInput.value.trim()) {
            mostrarError('edit-nombre', 'El nombre es obligatorio.');
            return false;
        }
        limpiarErrores();
        return true;
    };
    editNombreInput.addEventListener('blur', validarEditNombre);

    document.querySelector('#btnGuardarEditar').addEventListener('click', () => {
        limpiarErrores();

        const nombre = editNombreInput.value.trim();

        if (!nombre) {
            mostrarError('edit-nombre', 'El nombre es obligatorio.');
            return;
        }

        // RF-04: el correo es inmutable, se actualiza nombre y rol.
        const usuario = window.db.usuarios.find(u => u.email === emailUsuarioEditando);
        usuario.nombre = nombre;
        usuario.rol = document.querySelector('#edit-rol').value;

        cerrarModalEditar();
        renderTabla();
        mostrarToast('Usuario actualizado correctamente.');
    });

    // ==========================================================
    // RF-03: Creacion de Cuentas de Administrador
    // ==========================================================
    const modalCrear = document.querySelector('#modalCrearUsuario');
    const crearNombreInput = document.querySelector('#crear-nombre');
    const crearEmailInput = document.querySelector('#crear-email');
    const crearPasswordInput = document.querySelector('#crear-password');
    const crearRolSelect = document.querySelector('#crear-rol');

    window.db.roles.forEach(rol => {
        const opt = document.createElement('option');
        opt.value = rol;
        opt.textContent = rol;
        crearRolSelect.appendChild(opt);
    });

    const abrirModalCrear = () => {
        crearNombreInput.value = '';
        crearEmailInput.value = '';
        crearPasswordInput.value = '';
        crearRolSelect.value = window.db.roles.includes('Administrador') ? 'Administrador' : window.db.roles[0];
        limpiarErrores();
        modalCrear.classList.add('active');
    };

    const cerrarModalCrear = () => modalCrear.classList.remove('active');

    const btnNuevoUsuario = document.querySelector('#btnNuevoUsuario');
    btnNuevoUsuario.addEventListener('click', abrirModalCrear);
    document.querySelector('#btnCerrarCrear').addEventListener('click', cerrarModalCrear);
    document.querySelector('#btnCancelarCrear').addEventListener('click', cerrarModalCrear);
    modalCrear.addEventListener('click', (e) => {
        if (e.target === modalCrear) cerrarModalCrear();
    });

    const validarCrearNombre = () => {
        if (!validaciones.validarRequerido(crearNombreInput.value)) {
            mostrarError('crear-nombre', 'El nombre completo es obligatorio.');
            return false;
        }
        limpiarError('crear-nombre');
        return true;
    };

    const validarCrearEmail = () => {
        const email = crearEmailInput.value.trim();
        if (!validaciones.validarRequerido(email)) {
            mostrarError('crear-email', 'El correo es obligatorio.');
            return false;
        }
        if (!validaciones.validarCorreo(email)) {
            mostrarError('crear-email', 'Ingresa un correo valido.');
            return false;
        }
        const yaExiste = window.db.usuarios.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (yaExiste) {
            mostrarError('crear-email', 'Ya existe una cuenta con ese correo.');
            return false;
        }
        limpiarError('crear-email');
        return true;
    };

    const validarCrearPassword = () => {
        if (!validaciones.validarRequerido(crearPasswordInput.value)) {
            mostrarError('crear-password', 'La contrasena temporal es obligatoria.');
            return false;
        }
        if (!validaciones.validarContrasena(crearPasswordInput.value)) {
            mostrarError('crear-password', 'La contrasena no cumple con los requisitos de seguridad.');
            return false;
        }
        limpiarError('crear-password');
        return true;
    };

    const validarCrearRol = () => {
        if (!validaciones.validarRequerido(crearRolSelect.value)) {
            mostrarError('crear-rol', 'Selecciona un rol.');
            return false;
        }
        limpiarError('crear-rol');
        return true;
    };

    crearNombreInput.addEventListener('blur', validarCrearNombre);
    crearEmailInput.addEventListener('blur', validarCrearEmail);
    crearPasswordInput.addEventListener('blur', validarCrearPassword);
    crearRolSelect.addEventListener('blur', validarCrearRol);

    document.querySelector('#btnGuardarCrear').addEventListener('click', () => {
        limpiarErrores();

        const nombreValido = validarCrearNombre();
        const emailValido = validarCrearEmail();
        const passwordValido = validarCrearPassword();
        const rolValido = validarCrearRol();

        if (!nombreValido || !emailValido || !passwordValido || !rolValido) return;

        const nuevoId = `U-${String(window.db.usuarios.length + 1).padStart(3, '0')}`;
        window.db.usuarios.push({
            id: nuevoId,
            nombre: crearNombreInput.value.trim(),
            email: crearEmailInput.value.trim(),
            password: crearPasswordInput.value,
            rol: crearRolSelect.value,
            estado: 'Activo',
            fechaCreacion: new Date().toISOString().slice(0, 10)
        });

        cerrarModalCrear();
        renderTabla();
        mostrarToast('Administrador creado correctamente.');
    });

    // Primer render
    renderTabla();
});
