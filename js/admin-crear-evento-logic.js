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


// --- MÓDULOS DE FUNCIONALIDAD ---

const inicializarDragAndDrop = () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('portadaEvento');

    if (!uploadArea || !fileInput) return;

    // Evitar comportamientos por defecto del navegador al arrastrar
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Manejo visual del estado "dragover"
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

    // Capturar el archivo al soltarlo (Drop)
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files; // Sincroniza el input nativo
            procesarArchivo(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            procesarArchivo(e.target.files[0]);
        }
    });

    // Lógica de validación y actualización del DOM para el Drag & Drop
    function procesarArchivo(file) {
        const formatosValidos = ['image/jpeg', 'image/png'];
        
        if (!formatosValidos.includes(file.type)) {
            alert('Formato inválido. Por favor, selecciona un archivo PNG o JPG.');
            fileInput.value = ''; 
            return;
        }

        // Actualiza UI para mostrar éxito (sin borrar la imagen de preview que maneja el otro módulo)
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
        
        const textoOriginal = btnMejorarDesc.innerHTML;
        btnMejorarDesc.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
        btnMejorarDesc.disabled = true;

        setTimeout(() => {
            descEvento.value = `[Texto mejorado mockup]: ${descEvento.value} ¡Únete y amplía tus horizontes!`;
            btnMejorarDesc.innerHTML = textoOriginal;
            btnMejorarDesc.disabled = false;
            limpiarErrores();
        }, 1500);
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


// --- VALIDACIÓN PRINCIPAL DEL FORMULARIO ---

const validarFormularioEvento = (e) => {
    e.preventDefault();
    limpiarErrores(); 
    let esValido = true;

    // 1. Validar campos obligatorios que están vacíos
    const camposRequeridos = [
        { id: 'nombreEvento', mensaje: 'El nombre del evento es obligatorio.' },
        { id: 'categoriaEvento', mensaje: 'Debe seleccionar una categoría.' },
        { id: 'descEvento', mensaje: 'La descripción es obligatoria.' },
        { id: 'fechaInicioEvento', mensaje: 'Debe seleccionar una fecha de inicio.' },
        { id: 'fechaFinEvento', mensaje: 'Debe seleccionar una fecha de finalización.' },
        { id: 'lugarEvento', mensaje: 'El lugar es obligatorio.' },
        { id: 'horaInicio', mensaje: 'Establezca una hora de inicio.' },
        { id: 'horaFin', mensaje: 'Establezca una hora de finalización.' },
        { id: 'responsableEvento', mensaje: 'El nombre del responsable es obligatorio.' }
    ];

    camposRequeridos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (elemento && elemento.value.trim() === '') {
            mostrarError(campo.id, campo.mensaje);
            esValido = false;
        }
    });

    // 2. Validación de Regla de Negocio: Cupo
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

    // 3. Validación de Regla de Negocio: Lógica de Horas
    const horaInicio = document.getElementById('horaInicio');
    const horaFin = document.getElementById('horaFin');
    
    if (horaInicio && horaFin && horaInicio.value.trim() !== '' && horaFin.value.trim() !== '') {
        if (horaInicio.value >= horaFin.value) {
            mostrarError('horaFin', 'La hora de finalización debe ser posterior a la de inicio.');
            esValido = false;
        }
    }

    // 4. Validación de Regla de Negocio: Lógica de Fechas
    const fechaInicio = document.getElementById('fechaInicioEvento');
    const fechaFin = document.getElementById('fechaFinEvento');

    if (fechaInicio && fechaFin && fechaInicio.value.trim() !== '' && fechaFin.value.trim() !== '') {
        const dateInicio = new Date(fechaInicio.value + 'T00:00:00');
        const dateFin = new Date(fechaFin.value + 'T00:00:00');

        // La fecha final no puede ser antes de la de inicio
        if (dateFin < dateInicio) {
            mostrarError('fechaFinEvento', 'La fecha final no puede ser anterior a la de inicio.');
            esValido = false;
        }

        // Evaluar si la fecha final ya pasó
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); 

        if (dateFin < hoy && esValido) {
            const confirmacion = confirm('⚠️ La fecha de finalización ya pasó. Este evento se registrará como histórico (Finalizado). ¿Desea continuar?');
            
            if (!confirmacion) {
                mostrarError('fechaFinEvento', 'Cambie la fecha para publicar el evento de forma activa.');
                esValido = false;
            } else {
                console.log('El administrador ha confirmado la creación de un evento histórico.');
            }
        }
    }

    // 5. Resultado Final
    if (esValido) {
        console.log('Formulario válido. Todos los campos están correctos.');
        alert('¡Evento creado exitosamente!');
        // document.getElementById('formCrearEvento').reset(); 
    }
};


// --- INICIALIZADOR PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar todos los módulos independientes
    inicializarDragAndDrop();
    inicializarPreviewImagen();
    inicializarAsistenteIA();
    inicializarFechasInteligentes();

    // Asignar evento de validación al formulario
    const form = document.getElementById('formCrearEvento');
    if (form) {
        form.addEventListener('submit', validarFormularioEvento);
    }
});