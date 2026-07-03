// Expresión para validar formato de correo (misma convención usada en el resto del sitio)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- FUNCIONES DE UTILIDAD ---
const mostrarError = (idCampo, mensaje) => {
    const spanError = document.getElementById(`error-${idCampo}`);
    if (spanError) {
        spanError.textContent = mensaje;
        spanError.classList.add('form__error-message--active');
    }
};

const limpiarErrores = () => {
    document.querySelectorAll('.form__error-message').forEach(span => {
        span.classList.remove('form__error-message--active');
        span.textContent = '';
    });
};

// Limpia el error de un solo campo (usado en validación en tiempo real - RF-32)
const limpiarError = (idCampo) => {
    const spanError = document.getElementById(`error-${idCampo}`);
    if (spanError) {
        spanError.textContent = '';
        spanError.classList.remove('form__error-message--active');
    }
};

// HU-02: Cerrar Sesión (disponible desde el layout de admin)
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
    // GUARDA DE SESIÓN: solo usuarios con sesión activa (HU-01/HU-02)
    // pueden ver esta página de administración.
    // ==========================================================
    if (localStorage.getItem('sesionActiva') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    document.querySelector('#headerUserName').textContent = localStorage.getItem('sesionNombre') || 'Administrador';
    document.querySelector('#headerUserRol').textContent = localStorage.getItem('sesionRol') || '';

    // Cerrar sesión
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

    // Cargar catálogo de roles en el filtro y en el modal de asignación (HU-08)
    const selectRolModal = document.querySelector('#select-rol');
    window.db.roles.forEach(rol => {
        const optFiltro = document.createElement('option');
        optFiltro.value = rol;
        optFiltro.textContent = rol;
        filtroRol.appendChild(optFiltro);

        const optModal = document.createElement('option');
        optModal.value = rol;
        optModal.textContent = rol;
        selectRolModal.appendChild(optModal);
    });

    // ==========================================================
    // HU-05: Listar Administradores
    // ==========================================================
    const renderTabla = () => {
        const texto = searchInput.value.trim().toLowerCase();

        thead.innerHTML = `
            <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
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
                <td class="acciones-cell">
                    <button class="btn-edit" data-email="${user.email}">Editar</button>
                    <button class="btn-role" data-email="${user.email}">Rol</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tablaVacia.style.display = usuarios.length ? 'none' : 'block';
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

    tbody.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-edit')) return;

        const email = e.target.dataset.email;
        const usuario = window.db.usuarios.find(u => u.email === email);
        if (!usuario) return;

        emailUsuarioEditando = email;
        limpiarErrores();
        document.querySelector('#edit-nombre').value = usuario.nombre;
        document.querySelector('#edit-email').value = usuario.email;
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

        // RF-04: el correo es inmutable, solo se actualiza el nombre.
        const usuario = window.db.usuarios.find(u => u.email === emailUsuarioEditando);
        usuario.nombre = nombre;

        cerrarModalEditar();
        renderTabla();
        mostrarToast('Usuario actualizado correctamente.');
    });

    // ==========================================================
    // RF-03: Creación de Cuentas de Administrador
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
        if (!crearNombreInput.value.trim()) {
            mostrarError('crear-nombre', 'El nombre completo es obligatorio.');
            return false;
        }
        limpiarError('crear-nombre');
        return true;
    };

    const validarCrearEmail = () => {
        const email = crearEmailInput.value.trim();
        if (!email) {
            mostrarError('crear-email', 'El correo es obligatorio.');
            return false;
        }
        if (!emailRegex.test(email)) {
            mostrarError('crear-email', 'Ingresa un correo válido.');
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
        if (!crearPasswordInput.value) {
            mostrarError('crear-password', 'La contraseña temporal es obligatoria.');
            return false;
        }
        if (!validaciones.validarContrasena(crearPasswordInput.value)) {
            mostrarError('crear-password', 'La contraseña no cumple con los requisitos de seguridad.');
            return false;
        }
        limpiarError('crear-password');
        return true;
    };

    const validarCrearRol = () => {
        if (!crearRolSelect.value) {
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

    // ==========================================================
    // HU-08: Asignar Roles
    // ==========================================================
    const modalRol = document.querySelector('#modalAsignarRol');
    let emailUsuarioRol = null;

    const cerrarModalRol = () => modalRol.classList.remove('active');

    tbody.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-role')) return;

        const email = e.target.dataset.email;
        const usuario = window.db.usuarios.find(u => u.email === email);
        if (!usuario) return;

        emailUsuarioRol = email;
        limpiarErrores();
        document.querySelector('#rol-usuario-nombre').textContent = `Usuario: ${usuario.nombre}`;
        document.querySelector('#select-rol').value = usuario.rol;
        modalRol.classList.add('active');
    });

    document.querySelector('#btnCerrarRol').addEventListener('click', cerrarModalRol);
    document.querySelector('#btnCancelarRol').addEventListener('click', cerrarModalRol);
    modalRol.addEventListener('click', (e) => {
        if (e.target === modalRol) cerrarModalRol();
    });

    document.querySelector('#btnGuardarRol').addEventListener('click', () => {
        limpiarErrores();

        const nuevoRol = document.querySelector('#select-rol').value;
        if (!nuevoRol) {
            mostrarError('select-rol', 'Selecciona un rol.');
            return;
        }

        const usuario = window.db.usuarios.find(u => u.email === emailUsuarioRol);
        usuario.rol = nuevoRol;

        cerrarModalRol();
        renderTabla();
        mostrarToast(`Rol de ${usuario.nombre} actualizado a "${nuevoRol}".`);
    });

    // Primer render
    renderTabla();
});
