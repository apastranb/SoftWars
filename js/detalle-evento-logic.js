// TABS DE AGENDA

const openAgendaDay = (evt) => {
  // 1. Obtener el ID del día a mostrar desde el atributo data-day
  const day = evt.currentTarget.dataset.day;

  // 2. Ocultar todas las tablas agregándoles la clase 'oculto'
  const eventAgendaTables = document.querySelectorAll(".eventAgendaTable");
  eventAgendaTables.forEach(table => {
    table.classList.add("oculto"); 
  });

  // 3. Quitar la clase 'active' de todos los botones para reiniciarlos
  const tabLinks = document.querySelectorAll(".eventAgendaDatesTabLinks");
  tabLinks.forEach(link => {
    link.classList.remove("active");
  });

  // 4. Mostrar la tabla seleccionada quitándole la clase 'oculto'
  document.getElementById(day).classList.remove("oculto");

  // 5. Resaltar el botón que recibió el clic agregándole 'active'
  evt.currentTarget.classList.add("active");
};

// INICIAR TAB AGENDA EVENTOS
document.addEventListener('DOMContentLoaded', () => {
  const tabLinks = document.querySelectorAll(".eventAgendaDatesTabLinks");
  
  // Asignar el evento 'click' a cada pestaña
  tabLinks.forEach(link => {
    link.addEventListener('click', openAgendaDay);
  });
});

// FUNCIONES DE UTILIDAD PARA ERRORES
const mostrarError = (idCampo, mensaje) => {
    validaciones.mostrarError(idCampo, mensaje);
};

const limpiarErrores = () => {
    validaciones.limpiarErrores();
};

// FILTROS DE ENTRADA
const inicializarFiltrosEntrada = () => {
    const cedulaInput = document.getElementById('cedulaVisitante');
    const telefonoInput = document.getElementById('telefonoVisitante');

    const bloquearLetras = (e) => {
        // Reemplaza cualquier carácter que no sea un número del 0 al 9 por nada
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    };

    // Escucha cada vez que el usuario teclea algo
    if (cedulaInput) cedulaInput.addEventListener('input', bloquearLetras);
    if (telefonoInput) telefonoInput.addEventListener('input', bloquearLetras);
};

// VALIDACION DEL FORMULARIO
const validarInscripcion = (e) => {
    e.preventDefault();
    limpiarErrores();
    let esValido = true;

    // 1. Campos de texto requeridos
    const camposRequeridos = [
        { id: 'nombreVisitante', mensaje: 'El nombre completo es requerido.' },
        { id: 'carreraVisitante', mensaje: 'La carrera o profesion es requerida.' }
    ];

    camposRequeridos.forEach(campo => {
        if (!validaciones.validarCampo(campo.id, validaciones.validarRequerido, campo.mensaje)) {
            esValido = false;
        }
    });

    // 1b. Nombre minimo 3 caracteres
    const nombreInput = document.getElementById('nombreVisitante');
    if (nombreInput && validaciones.validarRequerido(nombreInput.value) && !validaciones.validarNombre(nombreInput.value)) {
        mostrarError('nombreVisitante', 'El nombre debe tener al menos 3 caracteres.');
        esValido = false;
    }

    // 1c. Cedula formato (8-12 digitos)
    const cedulaInput = document.getElementById('cedulaVisitante');
    if (cedulaInput) {
        if (!validaciones.validarRequerido(cedulaInput.value)) {
            mostrarError('cedulaVisitante', 'La cedula es requerida.');
            esValido = false;
        } else if (!validaciones.validarCedula(cedulaInput.value)) {
            mostrarError('cedulaVisitante', 'Ingrese una cedula valida (8-12 digitos).');
            esValido = false;
        }
    }

    // 1d. Telefono formato (8 digitos)
    const telefonoInput = document.getElementById('telefonoVisitante');
    if (telefonoInput) {
        if (!validaciones.validarRequerido(telefonoInput.value)) {
            mostrarError('telefonoVisitante', 'El telefono es requerido.');
            esValido = false;
        } else if (!validaciones.validarTelefono(telefonoInput.value)) {
            mostrarError('telefonoVisitante', 'Ingrese un telefono valido (8 digitos).');
            esValido = false;
        }
    }

    // 2. Correo electronico
    const emailInput = document.getElementById('emailVisitante');
    if (emailInput) {
        if (!validaciones.validarRequerido(emailInput.value)) {
            mostrarError('emailVisitante', 'El correo es requerido.');
            esValido = false;
        } else if (!validaciones.validarCorreo(emailInput.value)) {
            mostrarError('emailVisitante', 'Ingrese un correo valido (ej: usuario@dominio.com).');
            esValido = false;
        }
    }

    // 3. Edad (15-120)
    const edadInput = document.getElementById('edadVisitante');
    if (edadInput) {
        if (!validaciones.validarRequerido(edadInput.value)) {
            mostrarError('edadVisitante', 'La edad es requerida.');
            esValido = false;
        } else if (!validaciones.validarEdad(edadInput.value)) {
            mostrarError('edadVisitante', 'Ingrese una edad valida (15-120).');
            esValido = false;
        }
    }

    // 4. Validación de Choque de Horarios (Actividades)
    const checkboxes = document.querySelectorAll('input[name="actividades_seleccionadas"]:checked');
    if (checkboxes.length === 0) {
        mostrarError('actividades', 'Debe seleccionar al menos una actividad.');
        esValido = false;
    } else {
        const horasSeleccionadas = [];
        let hayChoque = false;

        checkboxes.forEach(cb => {
            const hora = cb.getAttribute('data-hora');
            // Si la hora ya existe en nuestro arreglo, hay un choque
            if (horasSeleccionadas.includes(hora)) {
                hayChoque = true;
            } else {
                horasSeleccionadas.push(hora);
            }
        });

        if (hayChoque) {
            mostrarError('actividades', 'Tiene un choque de horarios en las actividades seleccionadas.');
            esValido = false;
        }
    }

    // 5. Final
    if (esValido) {
        const nombre   = document.getElementById('nombreVisitante').value.trim();
        const cedula   = document.getElementById('cedulaVisitante').value.trim();
        const email    = document.getElementById('emailVisitante').value.trim();
        const telefono = document.getElementById('telefonoVisitante').value.trim();
        const edad     = parseInt(document.getElementById('edadVisitante').value.trim());
        const carrera  = document.getElementById('carreraVisitante').value.trim();
        const actividadesSeleccionadas = Array.from(
            document.querySelectorAll('input[name="actividades_seleccionadas"]:checked')
        ).map(cb => cb.value);

        // Buscar si ya existe una inscripción activa con el mismo correo
        const inscripcionExistente = window.db.participantes.find(
            p => p.estado === 'Activo' && p.correo.toLowerCase() === email.toLowerCase()
        );

        if (inscripcionExistente) {
            // Agregar actividades nuevas a la inscripción existente
            actividadesSeleccionadas.forEach(actId => {
                if (!inscripcionExistente.actividades.includes(actId)) {
                    inscripcionExistente.actividades.push(actId);
                }
            });
            alert('¡Ya tenías una inscripción activa! Se agregaron las nuevas actividades a tu registro.');
        } else {
            // Registrar nueva inscripción
            const nuevoId = 'P-' + String(window.db.participantes.length + 1).padStart(3, '0');
            window.db.participantes.push({
                id: nuevoId,
                idDocumento: cedula,
                nombreCompleto: nombre,
                correo: email,
                telefono: telefono,
                edad: edad,
                carrera: carrera,
                actividades: actividadesSeleccionadas,
                estado: 'Activo',
                fechaInscripcion: new Date().toISOString().slice(0, 10)
            });
            alert('¡Inscripción exitosa! Te hemos enviado un correo con los detalles.');
        }

        document.getElementById('inscribirVisitante').reset();
    }
};

// INICIALIZADOR PRINCIPAL
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar bloqueo de letras
    inicializarFiltrosEntrada();

    // Asignar evento de validación al formulario
    const formInscripcion = document.getElementById('inscribirVisitante');
    if (formInscripcion) {
        formInscripcion.addEventListener('submit', validarInscripcion);
    }
});