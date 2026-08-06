// ==========================================================================
// VALIDACIONES GLOBALES DEL SISTEMA
// Archivo centralizado con todas las funciones de validación reutilizables.
// Ningún HTML usa 'required'; toda validación se ejecuta aquí via JS.
// ==========================================================================

const validaciones = {

    // ── UTILIDADES DE ERRORES ────────────────────────────────────────────

    /**
     * Muestra un mensaje de error junto al campo.
     * Busca un <span> con id="error-{idCampo}".
     */
    mostrarError: function(idCampo, mensaje) {
        const spanError = document.getElementById(`error-${idCampo}`);
        if (spanError) {
            spanError.textContent = mensaje;
            spanError.classList.add('form__error-message--active');
        }
    },

    /**
     * Limpia todos los mensajes de error del documento o de IDs específicos.
     */
    limpiarErrores: function(...ids) {
        if (ids.length) {
            ids.forEach(id => {
                const span = document.getElementById(`error-${id}`);
                if (span) {
                    span.textContent = '';
                    span.classList.remove('form__error-message--active');
                }
            });
            return;
        }
        document.querySelectorAll('.form__error-message').forEach(span => {
            span.classList.remove('form__error-message--active');
            span.textContent = '';
        });
    },

    /**
     * Limpia el error de un solo campo.
     */
    limpiarError: function(idCampo) {
        const spanError = document.getElementById(`error-${idCampo}`);
        if (spanError) {
            spanError.textContent = '';
            spanError.classList.remove('form__error-message--active');
        }
    },

    /**
     * Muestra un mensaje de resultado (éxito o error).
     */
    mostrarResultado: function(id, mensaje, tipo) {
        const span = document.getElementById(id);
        if (!span) return;
        span.textContent = mensaje;
        span.className = 'form__result-message form__result-message--' + tipo;
    },

    /**
     * Oculta un mensaje de resultado.
     */
    ocultarResultado: function(id) {
        const span = document.getElementById(id);
        if (!span) return;
        span.textContent = '';
        span.className = 'form__result-message';
    },

    // ── VALIDADORES DE CAMPO ────────────────────────────────────────────

    /**
     * Valida que un campo no esté vacío.
     * @returns {boolean}
     */
    validarRequerido: function(valor) {
        return valor.trim() !== '';
    },

    /**
     * Valida formato de correo electrónico.
     * Regex: usuario@dominio.ext
     */
    validarCorreo: function(correo) {
        const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return patron.test(correo.trim());
    },

    /**
     * RF-02: Contraseña sin vocales.
     * Longitud 8-16, al menos 1 número, 1 especial, 1 mayúscula, 1 minúscula, CERO vocales.
     */
    validarContrasena: function(password) {
        const tieneLongitud = password.length >= 8 && password.length <= 16;
        const tieneNumero = /[0-9]/.test(password);
        const tieneEspecial = /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'/~`]/.test(password);
        const tieneMayuscula = /[A-Z]/.test(password);
        const tieneMinuscula = /[a-z]/.test(password);
        const ceroVocales = /^[^aeiouAEIOUáéíóúÁÉÍÓÚ]+$/.test(password);

        return tieneLongitud && tieneNumero && tieneEspecial && tieneMayuscula && tieneMinuscula && ceroVocales;
    },

    /**
     * Valida teléfono costarricense (8 dígitos, con o sin guión).
     */
    validarTelefono: function(telefono) {
        const limpio = telefono.replace(/-/g, '');
        return /^[0-9]{8}$/.test(limpio);
    },

    /**
     * Valida cédula/ID (solo dígitos y guiones, entre 8 y 12 dígitos).
     */
    validarCedula: function(idDocumento) {
        const limpio = idDocumento.replace(/-/g, '');
        return /^[0-9]{8,12}$/.test(limpio);
    },

    /**
     * Valida nombre (mínimo 3 caracteres).
     */
    validarNombre: function(nombre) {
        return nombre.trim().length >= 3;
    },

    /**
     * Valida que una fecha sea futura (posterior a hoy).
     */
    validarFechaFutura: function(fechaStr) {
        if (!fechaStr) return false;
        const fecha = new Date(fechaStr + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return fecha > hoy;
    },

    /**
     * Valida descripción (opcional, pero si tiene contenido no puede superar 200 chars).
     * Si esRequerido=true, no puede estar vacío.
     */
    validarDescripcion: function(texto, esRequerido) {
        if (esRequerido && texto.trim() === '') return false;
        if (texto.trim() === '') return true; // Opcional y vacío = válido
        return texto.trim().length <= 200;
    },

    /**
     * Valida edad (número entero entre 15 y 120).
     */
    validarEdad: function(edad) {
        const num = parseInt(edad, 10);
        return !isNaN(num) && num >= 15 && num <= 120;
    },

    /**
     * Valida cupo máximo (número entero positivo).
     */
    validarCupo: function(cupo) {
        const num = parseInt(cupo, 10);
        return !isNaN(num) && num >= 1;
    },

    /**
     * Valida que la hora fin sea posterior a la hora inicio.
     */
    validarHorasOrden: function(horaInicio, horaFin) {
        if (!horaInicio || !horaFin) return true; // Si alguna falta, otra validación lo atrapa
        return horaFin > horaInicio;
    },

    /**
     * Valida que fecha fin no sea anterior a fecha inicio.
     */
    validarFechasOrden: function(fechaInicio, fechaFin) {
        if (!fechaInicio || !fechaFin) return true;
        return new Date(fechaFin + 'T00:00:00') >= new Date(fechaInicio + 'T00:00:00');
    },

    // ── VALIDADORES DE LÓGICA DE NEGOCIO ────────────────────────────────

    /**
     * RF-25: Verifica si un correo ya está inscrito en una actividad específica.
     */
    validarInscripcionDuplicada: function(correo, actividadId, participantes) {
        return participantes.some(p =>
            p.estado === 'Activo' &&
            p.correo.toLowerCase() === correo.toLowerCase() &&
            p.actividades.includes(actividadId)
        );
    },

    /**
     * Verifica si un correo es de un responsable de la actividad.
     */
    esResponsableDeActividad: function(correo, actividadId, responsables, actividades) {
        const actividad = actividades.find(a => a.id === actividadId);
        if (!actividad || !actividad.responsableId) return false;
        const responsable = responsables.find(r => r.id === actividad.responsableId);
        return responsable && responsable.correo.toLowerCase() === correo.toLowerCase();
    },

    /**
     * Verifica conflicto de horario entre actividades seleccionadas.
     * Retorna array de nombres de actividades en conflicto.
     */
    detectarConflictosHorario: function(actividadesSeleccionadas) {
        const conflictos = new Set();
        for (let i = 0; i < actividadesSeleccionadas.length; i++) {
            for (let j = i + 1; j < actividadesSeleccionadas.length; j++) {
                const a = actividadesSeleccionadas[i];
                const b = actividadesSeleccionadas[j];
                if (a.fecha === b.fecha && a.horaInicio === b.horaInicio) {
                    conflictos.add(a.nombre);
                    conflictos.add(b.nombre);
                }
            }
        }
        return Array.from(conflictos);
    },

    /**
     * Verifica si una actividad tiene cupo disponible.
     */
    tieneCupoDisponible: function(actividad) {
        if (actividad.entradaLibre) return true;
        return actividad.cupoOcupado < actividad.cupoMaximo;
    },

    // ── HELPER: Validar campo con feedback visual ───────────────────────

    /**
     * Valida un campo y muestra/oculta error.
     * @param {string} idCampo - ID del campo (sin 'error-' prefix)
     * @param {function} reglaFn - Función que recibe el valor y retorna boolean
     * @param {string} mensajeError - Mensaje a mostrar si falla
     * @returns {boolean} - true si válido
     */
    validarCampo: function(idCampo, reglaFn, mensajeError) {
        const input = document.getElementById(idCampo);
        if (!input) return true;
        const valor = input.value;
        if (!reglaFn(valor)) {
            this.mostrarError(idCampo, mensajeError);
            return false;
        } else {
            this.limpiarError(idCampo);
            return true;
        }
    }
};


// ── NAVBAR SEARCH DROPDOWN (paginas publicas) ───────────────────────────

/**
 * Inicializa el dropdown de busqueda en la navbar.
 * Busca eventos publicos y muestra resultados al escribir.
 * @param {string} basePath - prefijo de ruta para los links ('' para index, '../' para subpaginas)
 */
validaciones.inicializarNavbarSearch = function(basePath) {
    const input = document.getElementById('searchInput');
    const results = document.getElementById('navSearchResults');
    if (!input || !results) return;

    let debounceTimer = null;

    input.addEventListener('input', () => {
        const termino = input.value.trim();

        if (termino.length < 2) {
            results.classList.remove('active');
            results.innerHTML = '';
            return;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            try {
                const respuesta = await fetch(`/api/eventos?q=${encodeURIComponent(termino)}&visibilidad=publico`);
                const data = await respuesta.json();
                const eventos = Array.isArray(data) ? data : (data.data || []);

                if (eventos.length === 0) {
                    results.innerHTML = '<span class="navbar-search-result-item">No se encontraron eventos.</span>';
                    results.classList.add('active');
                    return;
                }

                results.innerHTML = eventos.slice(0, 5).map(ev => {
                    const evId = ev._id || ev.id || ev.codigo;
                    const href = basePath + 'detalle-evento.html?id=' + evId;
                    return `<a class="navbar-search-result-item" href="${href}">
                        ${ev.nombre}
                        <small>${ev.fechaInicio} · ${ev.lugar}</small>
                    </a>`;
                }).join('');
                results.classList.add('active');
            } catch (error) {
                results.innerHTML = '<span class="navbar-search-result-item">Error al buscar.</span>';
                results.classList.add('active');
            }
        }, 300);
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !results.contains(e.target)) {
            results.classList.remove('active');
        }
    });
};


// ── SWEETALERT2 WRAPPERS ────────────────────────────────────────────────

/**
 * Muestra una alerta informativa (reemplaza alert()).
 */
validaciones.alerta = function(titulo, texto, icono) {
    return Swal.fire({
        title: titulo,
        text: texto || '',
        icon: icono || 'info',
        confirmButtonColor: '#164a98'
    });
};

/**
 * Muestra un mensaje de éxito.
 */
validaciones.exito = function(titulo, texto) {
    return Swal.fire({
        title: titulo,
        text: texto || '',
        icon: 'success',
        confirmButtonColor: '#164a98'
    });
};

/**
 * Muestra una confirmación (reemplaza confirm()).
 * Retorna una promesa que resuelve a true si el usuario confirma.
 */
validaciones.confirmar = function(titulo, texto) {
    return Swal.fire({
        title: titulo,
        text: texto || '',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#164a98',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar'
    }).then(result => result.isConfirmed);
};
