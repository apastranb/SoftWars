document.addEventListener('DOMContentLoaded', () => {
    const tbodyRoles = document.querySelector('#tbody-roles');
    const formRol = document.querySelector('#form-rol');
    const modal = document.querySelector('#modal-rol');
    const modalTitulo = document.querySelector('#modal-titulo');

    // Datos simulados iniciales
    let mockRoles = [
        { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema y gestión de usuarios.' },
        { id: 2, nombre: 'Líder Técnico', descripcion: 'Gestión de proyectos, revisión de código y asignación de tareas.' },
        { id: 3, nombre: 'QA Leader', descripcion: 'Acceso a módulos de prueba y reportes de calidad.' },
        { id: 4, nombre: 'Participante', descripcion: 'Acceso limitado solo a visualización de eventos.' }
    ];

    // Función para renderizar la tabla
    function renderTablaRoles() {
        tbodyRoles.innerHTML = '';
        mockRoles.forEach(rol => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${rol.id}</td>
                <td><strong>${rol.nombre}</strong></td>
                <td>${rol.descripcion}</td>
                <td>
                    <button class="btn-edit" onclick="editarRol(${rol.id})">Editar</button>
                    <button class="btn-status" onclick="eliminarRol(${rol.id})">Eliminar</button>
                </td>
            `;
            tbodyRoles.appendChild(tr);
        });
    }

    // Inicializar la tabla
    renderTablaRoles();

    // Funciones del Modal expuestas globalmente
    window.abrirModalRol = () => {
        formRol.reset();
        document.querySelector('#rol-id').value = '';
        modalTitulo.textContent = 'Crear Nuevo Rol';
        modal.classList.remove('oculto');
    };

    window.cerrarModal = () => {
        modal.classList.add('oculto');
    };

    // Funciones de Acción
    window.editarRol = (id) => {
        const rol = mockRoles.find(r => r.id === id);
        if (rol) {
            document.querySelector('#rol-id').value = rol.id;
            document.querySelector('#rol-nombre').value = rol.nombre;
            document.querySelector('#rol-desc').value = rol.descripcion;
            modalTitulo.textContent = 'Editar Rol';
            modal.classList.remove('oculto');
        }
    };

    window.eliminarRol = (id) => {
        if(confirm('¿Estás seguro de que deseas eliminar este rol?')) {
            mockRoles = mockRoles.filter(r => r.id !== id);
            renderTablaRoles();
        }
    };

    // Manejo del formulario (Crear / Actualizar)
    formRol.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const idInput = document.querySelector('#rol-id').value;
        const nombre = document.querySelector('#rol-nombre').value;
        const descripcion = document.querySelector('#rol-desc').value;

        if (idInput) {
            // Actualizar existente
            const index = mockRoles.findIndex(r => r.id === parseInt(idInput));
            if (index !== -1) {
                mockRoles[index] = { id: parseInt(idInput), nombre, descripcion };
            }
        } else {
            // Crear nuevo
            const nuevoId = mockRoles.length > 0 ? Math.max(...mockRoles.map(r => r.id)) + 1 : 1;
            mockRoles.push({ id: nuevoId, nombre, descripcion });
        }

        renderTablaRoles();
        cerrarModal();
    });
});
