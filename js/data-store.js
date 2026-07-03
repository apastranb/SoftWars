// Base de datos simulada en memoria
window.db = window.db || {
    usuarios: [
        { id: "U-001", nombre: "Carlos Carballo", email: "ccarballov@ucenfotec.ac.cr", password: "8yfrRY7IYVPuaai", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" },
        { id: "U-002", nombre: "Kenner Gamboa",   email: "kgamboas@ucenfotec.ac.cr",   password: "ZbptISbkKbtUCFd",  rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" },
        { id: "U-003", nombre: "Adonis Pastrana", email: "apastranb@ucenfotec.ac.cr",  password: "lAHhDPTPYqipP10", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" },
        { id: "U-004", nombre: "Josue Arroyo",   email: "jarroyor@ucenfotec.ac.cr",   password: "Ya9HjuR2SLWKfoDb", rol: "Administrador", estado: "Activo", fechaCreacion: "2026-07-02" }
    ],
    responsables: [
        { id: "R-001", nombre: "Juan Pérez", correo: "jperez@test.com", telefonos: "8888-8888", especialidad: "DevOps", empresa: "TechCorp", estado: "Aprobado" },
        { id: "R-002", nombre: "María Gómez", correo: "mgomez@test.com", telefonos: "7777-7777", especialidad: "IA", empresa: "Independiente", estado: "Pendiente" }
    ],
    // Catálogo de roles disponibles para asignar a los usuarios (HU-08)
    roles: ["Super Administrador", "Administrador", "Editor", "Moderador"],

    // Eventos: cada uno tiene un responsable a cargo (por correo, referencia a "responsables")
    eventos: [
        { id: "EV-001", nombre: "Seminario de Inteligencia Artificial", responsableCorreo: "mgomez@test.com" },
        { id: "EV-002", nombre: "Torneo Deportivo Interuniversitario", responsableCorreo: "jperez@test.com" }
    ],

    // Actividades ligadas a un evento. requiereInscripcion=false => no necesita registro previo.
    actividades: [
        { id: "ACT-001", eventoId: "EV-001", nombre: "Taller: Prompt Engineering Avanzado", categoria: "Tecnológica", fecha: "2026-11-15", hora: "02:00 PM", lugar: "Auditorio Principal", cupoMaximo: 40, cupoActual: 12, requiereInscripcion: true },
        { id: "ACT-002", eventoId: "EV-001", nombre: "Panel: Ética en IA", categoria: "Tecnológica", fecha: "2026-11-16", hora: "10:00 AM", lugar: "Sala Magna", cupoMaximo: 60, cupoActual: 60, requiereInscripcion: true },
        { id: "ACT-003", eventoId: "EV-001", nombre: "Feria de Stands Tecnológicos", categoria: "Tecnológica", fecha: "2026-11-16", hora: "09:00 AM", lugar: "Pasillo Central", cupoMaximo: 0, cupoActual: 0, requiereInscripcion: false },
        { id: "ACT-004", eventoId: "EV-002", nombre: "Partido de Fútbol Inaugural", categoria: "Deportiva", fecha: "2026-11-20", hora: "03:00 PM", lugar: "Cancha Principal", cupoMaximo: 200, cupoActual: 50, requiereInscripcion: true }
    ],

    // Participantes/asistentes inscritos a actividades (HU de Asistentes e Inscripciones)
    participantes: [
        {
            id: "P-001",
            idDocumento: "1-1111-1111",
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
            idDocumento: "2-2222-2222",
            nombreCompleto: "Luis Fernández",
            correo: "luis.fernandez@estudiante.cr",
            telefono: "8722-4455",
            edad: 24,
            carrera: "Administración de Empresas",
            actividades: ["ACT-004"],
            estado: "Activo",
            fechaInscripcion: "2026-06-22"
        }
    ],

    sesionActual: null
};

// Garantizar que stands siempre exista aunque el objeto ya estuviera inicializado
if (!window.db.stands) {
    window.db.stands = [
        { id: "S-001", nombre: "Stand Alpha",   categoria: "Tecnología",            descripcion: "Tecnología e innovación",  encargado: "Juan Pérez",    empresa: "Tech Corp",    correo: "juan@tech.com",   telefono: "8888-0001", estado: "activo" },
        { id: "S-002", nombre: "Stand Beta",    categoria: "Robótica",              descripcion: "Robótica y manufactura",   encargado: "María López",   empresa: "RoboTech",     correo: "maria@robo.com",  telefono: "8888-0002", estado: "inactivo" },
        { id: "S-003", nombre: "Stand Gamma",   categoria: "Inteligencia Artificial", descripcion: "Inteligencia Artificial", encargado: "Carlos Mora",   empresa: "AI Solutions", correo: "carlos@ai.com",   telefono: "8888-0003", estado: "activo" },
        { id: "S-004", nombre: "Stand Delta",   categoria: "Ciberseguridad",        descripcion: "Ciberseguridad",           encargado: "Ana Rodríguez", empresa: "SecureNet",    correo: "ana@secure.com",  telefono: "8888-0004", estado: "inactivo" },
        { id: "S-005", nombre: "Stand Epsilon", categoria: "Desarrollo Web",        descripcion: "Desarrollo web",           encargado: "Luis Vargas",   empresa: "WebDev Co.",   correo: "luis@web.com",    telefono: "8888-0005", estado: "activo" }
    ];
}

// Garantizar que oradores siempre exista
if (!window.db.oradores) {
    window.db.oradores = [
        { id: "OR-001", nombre: "Ana Rodríguez",  correo: "ana@cenfotec.ac.cr", telefono: "8888-0001", especialidad: "Ingeniería de Software", empresa: "Tech Corp",    biografia: "Especialista en arquitectura de software con 10 años de experiencia.", foto: null, eventoId: "EV-001", estado: "activo",   fechaRegistro: "2026/06/01" },
        { id: "OR-002", nombre: "Carlos Mora",     correo: "carlos@ai.com",      telefono: "8888-0002", especialidad: "Inteligencia Artificial", empresa: "AI Solutions", biografia: "Investigador en modelos de aprendizaje profundo y NLP.",              foto: null, eventoId: "EV-002", estado: "inactivo", fechaRegistro: "2026/06/05" },
        { id: "OR-003", nombre: "María López",     correo: "maria@secure.com",   telefono: "8888-0003", especialidad: "Ciberseguridad",          empresa: "SecureNet",    biografia: "Experta en seguridad ofensiva y defensa de infraestructuras críticas.", foto: null, eventoId: "EV-001", estado: "activo",   fechaRegistro: "2026/06/10" }
    ];
}
