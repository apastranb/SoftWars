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

// VALIDACIÓN DEL FORMULARIO
const validarInscripcion = (e) => {
    e.preventDefault();
    limpiarErrores();
    let esValido = true;

    // 1. Validar campos de texto requeridos
    const camposRequeridos = [
        { id: 'nombreVisitante', mensaje: 'El nombre completo es requerido.' },
        { id: 'cedulaVisitante', mensaje: 'La cédula es requerida.' },
        { id: 'telefonoVisitante', mensaje: 'El teléfono es requerido.' }, // NUEVO
        { id: 'carreraVisitante', mensaje: 'La carrera o profesión es requerida.' } // NUEVO
    ];

    camposRequeridos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento && elemento.value.trim() === '') {
            mostrarError(campo.id, campo.mensaje);
            esValido = false;
        }
    });

    // 2. Validación RegEx para el Correo Electrónico
    const emailInput = document.getElementById('emailVisitante');
    if (emailInput) {
        // Expresión regular estándar para validación de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value.trim() === '') {
            mostrarError('emailVisitante', 'El correo es requerido.');
            esValido = false;
        } else if (!emailRegex.test(emailInput.value.trim())) {
            mostrarError('emailVisitante', 'Ingrese un correo válido (ej: usuario@dominio.com).');
            esValido = false;
        }
    }

    // 3. Validación de Edad (Mayor de 18 años)
    const edadInput = document.getElementById('edadVisitante');
    if (edadInput) {
        if (edadInput.value.trim() === '') {
            mostrarError('edadVisitante', 'La edad es requerida.');
            esValido = false;
        } else {
            const edad = parseInt(edadInput.value);
            if (isNaN(edad) || edad < 18) {
                mostrarError('edadVisitante', 'Debe ser mayor de 18 años para inscribirte.');
                esValido = false;
            }
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
        console.log("Inscripción validada correctamente.");
        alert("¡Inscripción exitosa! Te hemos enviado un correo con los detalles.");
        // limpiar el formulario
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