// FUNCIONES DE UTILIDAD
const mostrarError = (idCampo, mensaje) => {
    validaciones.mostrarError(idCampo, mensaje);
};

const limpiarErrores = () => {
    validaciones.limpiarErrores();
};


// MODULOS DE FUNCIONALIDAD

const inicializarDragAndDrop = () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('portadaEvento');

    if (!uploadArea || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files;
            procesarArchivo(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            procesarArchivo(e.target.files[0]);
        }
    });

    function procesarArchivo(file) {
        const formatosValidos = ['image/jpeg', 'image/png'];
        if (!formatosValidos.includes(file.type)) {
            alert('Formato inválido. Por favor, selecciona un archivo PNG o JPG.');
            fileInput.value = '';
            return;
        }
        const icon = uploadArea.querySelector('i');
        const text = uploadArea.querySelector('p');
        if (icon) icon.className = "bi bi-check-circle-fill";
        if (icon) icon.style.color = "var(--success)";
        if (text) text.textContent = file.name;
    }
};

const inicializarPreviewImagen = () => {
    const portadaEvento = document.getElementById('portadaEvento');
    const previewPortada = document.getElementById('previewPortada');

    if (!portadaEvento || !previewPortada) return;

    portadaEvento.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evento) => {
                previewPortada.src = evento.target.result;
                previewPortada.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
};

const inicializarAsistenteIA = () => {
    const btnMejorarDesc = document.getElementById('btnMejorarDesc');
    const descEvento = document.getElementById('descEvento');

    if (!btnMejorarDesc || !descEvento) return;

    btnMejorarDesc.addEventListener('click', () => {
        if (descEvento.value.trim() === '') {
            mostrarError('descEvento', 'Escribe algo primero para que la IA lo mejore.');
            return;
        }
    });
};

const inicializarFechasInteligentes = () => {
    const fechaInicio = document.getElementById('fechaInicioEvento');
    const fechaFin = document.getElementById('fechaFinEvento');

    if (!fechaInicio || !fechaFin) return;

    fechaInicio.addEventListener('change', () => {
        if (fechaFin.value === '') {
            fechaFin.value = fechaInicio.value;
        }
    });
};


// MODO EDICIÓN: rellenar el formulario si venimos a editar un evento existente

const cargarDatosEdicion = () => {
    const params = new URLSearchParams(window.location.search);
    const indice = params.get('editar');

    if (indice === null) return; // modo creación normal

    const eventos = obtenerEventos();
    const evento = eventos[parseInt(indice)];
    if (!evento) return;

    // Cambiar título y breadcrumb
    const titulo = document.querySelector('.headerTitle h1');
    if (titulo) titulo.textContent = 'Editar Evento';
    const breadcrumbActual = document.querySelector('.breadcrumb-item[aria-current="page"]');
    if (breadcrumbActual) breadcrumbActual.textContent = 'Editar Evento';

    // Rellenar campos
    document.getElementById('nombreEvento').value = evento.nombre || '';
    document.getElementById('categoriaEvento').value = evento.categoria || '';
    document.getElementById('cupoEvento').value = evento.cupoMax || '';
    document.getElementById('descEvento').value = evento.descripcion || '';
    document.getElementById('fechaInicioEvento').value = evento.fechaInicio || '';
    document.getElementById('fechaFinEvento').value = evento.fechaFin || '';
    document.getElementById('lugarEvento').value = evento.lugar || '';
    document.getElementById('horaInicio').value = evento.horaInicio || '';
    document.getElementById('horaFin').value = evento.horaFin || '';
    document.getElementById('responsableEvento').value = evento.responsable || '';

    if (evento.tipoEntrada) {
        const radioTipo = document.querySelector(`input[name="tipoEntrada"][value="${evento.tipoEntrada}"]`);
        if (radioTipo) radioTipo.checked = true;
    }
    if (evento.visibilidad) {
        const radioVis = document.querySelector(`input[name="visibilidad"][value="${evento.visibilidad}"]`);
        if (radioVis) radioVis.checked = true;
    }

    // Guardar el índice en el formulario para usarlo al guardar
    const form = document.getElementById('formCrearEvento');
    if (form) form.dataset.indiceEdicion = indice;

    // Cambiar texto del botón publicar
    const btnPublicar = document.getElementById('publicarEvento');
    if (btnPublicar) btnPublicar.textContent = 'Guardar Cambios';
};


// ALMACENAMIENTO (usa window.db.eventos como fuente unica)

const obtenerEventos = () => {
    return window.db.eventos;
};

const guardarEventos = (eventos) => {
    window.db.eventos = eventos;
};


// VALIDACION DEL FORMULARIO

const validarFormularioEvento = (e) => {
    e.preventDefault();
    limpiarErrores();
    let esValido = true;

    // 1. Campos obligatorios
    const camposRequeridos = [
        { id: 'nombreEvento',      mensaje: 'El nombre del evento es obligatorio.' },
        { id: 'categoriaEvento',   mensaje: 'Debe seleccionar una categoría.' },
        { id: 'descEvento',        mensaje: 'La descripción es obligatoria.' },
        { id: 'fechaInicioEvento', mensaje: 'Debe seleccionar una fecha de inicio.' },
        { id: 'fechaFinEvento',    mensaje: 'Debe seleccionar una fecha de finalización.' },
        { id: 'lugarEvento',       mensaje: 'El lugar es obligatorio.' },
        { id: 'horaInicio',        mensaje: 'Establezca una hora de inicio.' },
        { id: 'horaFin',           mensaje: 'Establezca una hora de finalización.' },
        { id: 'responsableEvento', mensaje: 'El nombre del responsable es obligatorio.' }
    ];

    camposRequeridos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento && elemento.value.trim() === '') {
            mostrarError(campo.id, campo.mensaje);
            esValido = false;
        }
    });

    // 2. Radio buttons
    const tipoEntrada = document.querySelector('input[name="tipoEntrada"]:checked');
    if (!tipoEntrada) {
        mostrarError('tipoEntrada', 'Debe seleccionar el tipo de entrada.');
        esValido = false;
    }

    const visibilidad = document.querySelector('input[name="visibilidad"]:checked');
    if (!visibilidad) {
        mostrarError('visibilidad', 'Debe seleccionar la visibilidad del evento.');
        esValido = false;
    }

    // 3. Cupo
    const cupoEvento = document.getElementById('cupoEvento');
    if (cupoEvento) {
        if (cupoEvento.value.trim() === '') {
            mostrarError('cupoEvento', 'El cupo es obligatorio.');
            esValido = false;
        } else if (parseInt(cupoEvento.value) < 1) {
            mostrarError('cupoEvento', 'El cupo debe ser al menos de 1 persona.');
            esValido = false;
        }
    }

    // 4. Lógica de horas
    const horaInicio = document.getElementById('horaInicio');
    const horaFin = document.getElementById('horaFin');
    if (horaInicio && horaFin && horaInicio.value.trim() !== '' && horaFin.value.trim() !== '') {
        if (horaInicio.value >= horaFin.value) {
            mostrarError('horaFin', 'La hora de finalización debe ser posterior a la de inicio.');
            esValido = false;
        }
    }

    // 5. Lógica de fechas
    const fechaInicio = document.getElementById('fechaInicioEvento');
    const fechaFin = document.getElementById('fechaFinEvento');
    if (fechaInicio && fechaFin && fechaInicio.value.trim() !== '' && fechaFin.value.trim() !== '') {
        const dateInicio = new Date(fechaInicio.value + 'T00:00:00');
        const dateFin = new Date(fechaFin.value + 'T00:00:00');

        if (dateFin < dateInicio) {
            mostrarError('fechaFinEvento', 'La fecha final no puede ser anterior a la de inicio.');
            esValido = false;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (dateFin < hoy && esValido) {
            const confirmacion = confirm('La fecha de finalización ya pasó. Este evento se registrará como histórico (Finalizado). ¿Desea continuar?');
            if (!confirmacion) {
                mostrarError('fechaFinEvento', 'Cambie la fecha para publicar el evento de forma activa.');
                esValido = false;
            }
        }
    }

    // 6. Si todo es válido, guardar y redirigir
    if (esValido) {
        const form = document.getElementById('formCrearEvento');
        const cupoMax = parseInt(document.getElementById('cupoEvento').value);

        const nuevoEvento = {
            nombre:      document.getElementById('nombreEvento').value.trim(),
            categoria:   document.getElementById('categoriaEvento').value,
            cupoMax:     cupoMax,
            cupoActual:  0,
            descripcion: document.getElementById('descEvento').value.trim(),
            fechaInicio: document.getElementById('fechaInicioEvento').value,
            fechaFin:    document.getElementById('fechaFinEvento').value,
            lugar:       document.getElementById('lugarEvento').value.trim(),
            horaInicio:  document.getElementById('horaInicio').value,
            horaFin:     document.getElementById('horaFin').value,
            responsable: document.getElementById('responsableEvento').value.trim(),
            tipoEntrada: document.querySelector('input[name="tipoEntrada"]:checked').value,
            visibilidad: document.querySelector('input[name="visibilidad"]:checked').value,
            estado:      'disponible'
        };

        const eventos = obtenerEventos();

        // Si estamos editando, reemplazamos el evento; si no, lo agregamos
        if (form.dataset.indiceEdicion !== undefined && form.dataset.indiceEdicion !== '') {
            const indice = parseInt(form.dataset.indiceEdicion);
            // Conservar el estado y cupo actual del evento original
            nuevoEvento.estado = eventos[indice].estado;
            nuevoEvento.cupoActual = eventos[indice].cupoActual;
            eventos[indice] = nuevoEvento;
        } else {
            nuevoEvento.id = 'EV-' + String(eventos.length + 1).padStart(3, '0');
            eventos.push(nuevoEvento);
        }

        guardarEventos(eventos);
        window.location.href = 'admin-eventos.html';
    }
};


// INICIALIZADOR PRINCIPAL
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

    inicializarDragAndDrop();
    inicializarPreviewImagen();
    inicializarAsistenteIA();
    inicializarFechasInteligentes();
    cargarDatosEdicion();

    const form = document.getElementById('formCrearEvento');
    if (form) {
        form.addEventListener('submit', validarFormularioEvento);
    }

    // Botón cancelar regresa a la lista
    const btnCancelar = document.getElementById('newEventCancel');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            window.location.href = 'admin-eventos.html';
        });
    }
});
