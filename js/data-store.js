// ==========================================================================
// BASE DE DATOS SIMULADA EN MEMORIA
// Fuente única de datos mock para Fase 1. Será reemplazada por MongoDB en Fase 2.
// ==========================================================================

window.db = window.db || {

    // ── USUARIOS (Administradores) ──────────────────────────────────────────
    usuarios: [
        { id: "U-001", nombre: "Carlos Carballo", email: "ccarballov@ucenfotec.ac.cr", password: "Crbl#2026x", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" },
        { id: "U-002", nombre: "Kenner Gamboa",   email: "kgamboas@ucenfotec.ac.cr",   password: "Knnr$2026z", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" },
        { id: "U-003", nombre: "Adonis Pastrana", email: "apastranb@ucenfotec.ac.cr",  password: "Dnsp%2026w", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" },
        { id: "U-004", nombre: "Josué Arroyo",   email: "jarroyor@ucenfotec.ac.cr",   password: "Jsrr&2026v", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" }
    ],

    // Catálogo de roles disponibles
    roles: ["Administrador", "Super Administrador", "Editor", "Moderador"],

    // ── EVENTOS ─────────────────────────────────────────────────────────────
    eventos: [
        {
            id: "EV-001",
            nombre: "Seminario de Inteligencia Artificial",
            categoria: "tecnologica",
            descripcion: "Evento académico sobre las últimas tendencias en IA, modelos fundacionales y ética tecnológica.",
            fechaInicio: "2026-11-15",
            fechaFin: "2026-11-16",
            lugar: "Auditorio Principal",
            horaInicio: "08:00",
            horaFin: "17:00",
            cupoMax: 150,
            cupoActual: 62,
            responsable: "María Gómez",
            tipoEntrada: "libre",
            visibilidad: "publico",
            estado: "disponible"
        },
        {
            id: "EV-002",
            nombre: "Torneo Deportivo Interuniversitario",
            categoria: "deportiva",
            descripcion: "Competencia deportiva entre universidades con disciplinas de fútbol, básquetbol y atletismo.",
            fechaInicio: "2026-11-20",
            fechaFin: "2026-11-22",
            lugar: "Cancha Principal",
            horaInicio: "09:00",
            horaFin: "18:00",
            cupoMax: 300,
            cupoActual: 120,
            responsable: "Juan Pérez",
            tipoEntrada: "libre",
            visibilidad: "publico",
            estado: "disponible"
        },
        {
            id: "EV-003",
            nombre: "Expo CENFOTEC 2026",
            categoria: "tecnologica",
            descripcion: "Feria de proyectos estudiantiles con demostraciones de software, hardware y diseño.",
            fechaInicio: "2026-12-05",
            fechaFin: "2026-12-06",
            lugar: "Campus CENFOTEC",
            horaInicio: "10:00",
            horaFin: "16:00",
            cupoMax: 500,
            cupoActual: 0,
            responsable: "Ana Rodríguez",
            tipoEntrada: "libre",
            visibilidad: "publico",
            estado: "disponible"
        },
        {
            id: "EV-004",
            nombre: "Taller de Ciberseguridad Avanzada",
            categoria: "tecnologica",
            descripcion: "Taller interno para estudiantes sobre pentesting, defensa y respuesta a incidentes.",
            fechaInicio: "2026-10-10",
            fechaFin: "2026-10-10",
            lugar: "Laboratorio 5",
            horaInicio: "14:00",
            horaFin: "18:00",
            cupoMax: 30,
            cupoActual: 30,
            responsable: "Carlos Mora",
            tipoEntrada: "pago",
            visibilidad: "privado",
            estado: "lleno"
        },
        {
            id: "EV-005",
            nombre: "Festival Cultural CENFOTEC",
            categoria: "cultural",
            descripcion: "Actividades culturales incluyendo música, arte y gastronomía para la comunidad universitaria.",
            fechaInicio: "2026-09-15",
            fechaFin: "2026-09-15",
            lugar: "Plaza Central",
            horaInicio: "11:00",
            horaFin: "20:00",
            cupoMax: 200,
            cupoActual: 180,
            responsable: "Luis Vargas",
            tipoEntrada: "libre",
            visibilidad: "publico",
            estado: "finalizado"
        }
    ],

    // ── ACTIVIDADES (Subeventos) ────────────────────────────────────────────
    actividades: [
        {
            id: "ACT-001",
            eventoId: "EV-001",
            nombre: "Taller: Prompt Engineering Avanzado",
            categoria: "Tecnológicas",
            descripcion: "Técnicas de diseño de prompts para modelos generativos.",
            fecha: "2026-11-15",
            horaInicio: "14:00",
            horaFin: "16:00",
            lugar: "Auditorio Principal",
            cupoMaximo: 40,
            cupoOcupado: 12,
            responsableId: "OR-001",
            estado: "Disponible",
            visibilidad: "publica",
            entradaLibre: false,
            incluyeRefrigerio: true
        },
        {
            id: "ACT-002",
            eventoId: "EV-001",
            nombre: "Panel: Ética en IA",
            categoria: "Tecnológicas",
            descripcion: "Discusión sobre sesgos algorítmicos y regulación de la IA.",
            fecha: "2026-11-16",
            horaInicio: "10:00",
            horaFin: "12:00",
            lugar: "Sala Magna",
            cupoMaximo: 60,
            cupoOcupado: 60,
            responsableId: "OR-002",
            estado: "Llena",
            visibilidad: "publica",
            entradaLibre: false,
            incluyeRefrigerio: false
        },
        {
            id: "ACT-003",
            eventoId: "EV-001",
            nombre: "Feria de Stands Tecnológicos",
            categoria: "Tecnológicas",
            descripcion: "Espacio abierto para recorrer los stands de empresas y proyectos.",
            fecha: "2026-11-16",
            horaInicio: "09:00",
            horaFin: "17:00",
            lugar: "Pasillo Central",
            cupoMaximo: 0,
            cupoOcupado: 0,
            responsableId: "OR-003",
            estado: "Disponible",
            visibilidad: "publica",
            entradaLibre: true,
            incluyeRefrigerio: true
        },
        {
            id: "ACT-004",
            eventoId: "EV-002",
            nombre: "Partido de Fútbol Inaugural",
            categoria: "Deportivas",
            descripcion: "Partido inaugural entre CENFOTEC y Universidad Latina.",
            fecha: "2026-11-20",
            horaInicio: "15:00",
            horaFin: "17:00",
            lugar: "Cancha Principal",
            cupoMaximo: 200,
            cupoOcupado: 50,
            responsableId: "OR-004",
            estado: "Disponible",
            visibilidad: "publica",
            entradaLibre: false,
            incluyeRefrigerio: false
        },
        {
            id: "ACT-005",
            eventoId: "EV-003",
            nombre: "Charla: Cloud Computing en Costa Rica",
            categoria: "Tecnológicas",
            descripcion: "Panorama actual y oportunidades laborales en la nube.",
            fecha: "2026-12-05",
            horaInicio: "11:00",
            horaFin: "12:30",
            lugar: "Laboratorio 3",
            cupoMaximo: 35,
            cupoOcupado: 10,
            responsableId: "OR-005",
            estado: "Disponible",
            visibilidad: "publica",
            entradaLibre: false,
            incluyeRefrigerio: true
        }
    ],

    // ── ORADORES / RESPONSABLES ─────────────────────────────────────────────
    oradores: [
        {
            id: "OR-001",
            nombre: "Ana Rodríguez",
            correo: "ana.rodriguez@techcorp.cr",
            telefono: "8888-0001",
            especialidad: "Ingeniería de Software",
            empresa: "Tech Corp",
            biografia: "Especialista en arquitectura de software con 10 años de experiencia.",
            foto: null,
            eventoId: "EV-001",
            estado: "activo",
            fechaRegistro: "2026-06-01"
        },
        {
            id: "OR-002",
            nombre: "Carlos Mora",
            correo: "carlos.mora@aisolutions.cr",
            telefono: "8888-0002",
            especialidad: "Inteligencia Artificial",
            empresa: "AI Solutions",
            biografia: "Investigador en modelos de aprendizaje profundo y NLP.",
            foto: null,
            eventoId: "EV-001",
            estado: "activo",
            fechaRegistro: "2026-06-05"
        },
        {
            id: "OR-003",
            nombre: "María López",
            correo: "maria.lopez@securenet.cr",
            telefono: "8888-0003",
            especialidad: "Ciberseguridad",
            empresa: "SecureNet",
            biografia: "Experta en seguridad ofensiva y defensa de infraestructuras.",
            foto: null,
            eventoId: "EV-001",
            estado: "activo",
            fechaRegistro: "2026-06-10"
        },
        {
            id: "OR-004",
            nombre: "Roberto Jiménez",
            correo: "roberto.jimenez@deportecr.cr",
            telefono: "8888-0004",
            especialidad: "Educación Física",
            empresa: "CENFOTEC",
            biografia: "Coordinador de actividades deportivas interuniversitarias.",
            foto: null,
            eventoId: "EV-002",
            estado: "activo",
            fechaRegistro: "2026-06-15"
        },
        {
            id: "OR-005",
            nombre: "Laura Vindas",
            correo: "laura.vindas@cloudcr.cr",
            telefono: "8888-0005",
            especialidad: "Cloud Computing",
            empresa: "CloudSystems CR",
            biografia: "Arquitecta de soluciones cloud con certificación AWS y Azure.",
            foto: null,
            eventoId: "EV-003",
            estado: "inactivo",
            fechaRegistro: "2026-06-20"
        }
    ],

    // ── STANDS ──────────────────────────────────────────────────────────────
    stands: [
        { id: "S-001", eventoId: "EV-001", nombre: "Tech Corp",        categoria: "empresa",  descripcion: "Soluciones empresariales de software.",         encargado: "Juan Pérez",      empresa: "Tech Corp",      correo: "juan@techcorp.cr",    telefono: "8888-1001", estado: "aprobado" },
        { id: "S-002", eventoId: "EV-001", nombre: "AI Solutions",      categoria: "empresa",  descripcion: "Inteligencia artificial aplicada a negocios.",  encargado: "Carlos Mora",     empresa: "AI Solutions",   correo: "carlos@aisol.cr",    telefono: "8888-1002", estado: "aprobado" },
        { id: "S-003", eventoId: "EV-001", nombre: "SecureNet",         categoria: "empresa",  descripcion: "Consultoría en ciberseguridad empresarial.",    encargado: "María López",     empresa: "SecureNet",      correo: "maria@securenet.cr",  telefono: "8888-1003", estado: "aprobado" },
        { id: "S-004", eventoId: "EV-003", nombre: "Proyecto Estudiantil IoT", categoria: "personal", descripcion: "Demostración de dispositivos IoT conectados.",  encargado: "Pedro Ramírez",   empresa: "CENFOTEC",       correo: "pedro@estudiante.cr", telefono: "8888-1004", estado: "aprobado" },
        { id: "S-005", eventoId: "EV-003", nombre: "CloudSystems CR",   categoria: "empresa",  descripcion: "Infraestructura en la nube para startups.",     encargado: "Laura Vindas",    empresa: "CloudSystems CR", correo: "laura@cloudcr.cr",   telefono: "8888-1005", estado: "cerrado" }
    ],

    // ── PARTICIPANTES / ASISTENTES ──────────────────────────────────────────
    participantes: [
        {
            id: "P-001",
            idDocumento: "111110001",
            nombreCompleto: "Ana Solano",
            correo: "ana.solano@estudiante.cr",
            telefono: "8811-2233",
            edad: 21,
            carrera: "Ingeniería en Sistemas",
            actividades: ["ACT-001"],
            estado: "Activo",
            fechaInscripcion: "2026-06-20"
        },
        {
            id: "P-002",
            idDocumento: "222220002",
            nombreCompleto: "Luis Fernández",
            correo: "luis.fernandez@estudiante.cr",
            telefono: "8722-4455",
            edad: 24,
            carrera: "Administración de Empresas",
            actividades: ["ACT-004"],
            estado: "Activo",
            fechaInscripcion: "2026-06-22"
        },
        {
            id: "P-003",
            idDocumento: "333330003",
            nombreCompleto: "Sofía Castillo",
            correo: "sofia.castillo@estudiante.cr",
            telefono: "8633-7788",
            edad: 22,
            carrera: "Ingeniería de Software",
            actividades: ["ACT-001", "ACT-002"],
            estado: "Activo",
            fechaInscripcion: "2026-07-01"
        },
        {
            id: "P-004",
            idDocumento: "444440004",
            nombreCompleto: "Diego Vargas",
            correo: "diego.vargas@profesional.cr",
            telefono: "8544-9900",
            edad: 30,
            carrera: "Ciencias de la Computación",
            actividades: ["ACT-005"],
            estado: "Activo",
            fechaInscripcion: "2026-07-03"
        },
        {
            id: "P-005",
            idDocumento: "555550005",
            nombreCompleto: "Valeria Rojas",
            correo: "valeria.rojas@estudiante.cr",
            telefono: "8455-1122",
            edad: 19,
            carrera: "Diseño Digital",
            actividades: ["ACT-003"],
            estado: "Cancelado",
            fechaInscripcion: "2026-06-25"
        }
    ],

    // ── POSTULACIONES DE ORADORES (solicitudes públicas) ────────────────────
    postulaciones: [],

    // ── SESIÓN ──────────────────────────────────────────────────────────────
    sesionActual: null
};
