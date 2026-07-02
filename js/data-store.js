// Base de datos simulada en memoria
window.db = window.db || {
    usuarios: [
        { id: "U-001", nombre: "Admin Principal", email: "admin@ucenfotec.ac.cr", password: "T3st.Pswrd!", rol: "Super Administrador", estado: "Activo", fechaCreacion: "2026-06-01" },
        { id: "U-002", nombre: "Gestor Eventos", email: "gestor@ucenfotec.ac.cr", password: "G3st.Pswrd!", rol: "Editor", estado: "Inactivo", fechaCreacion: "2026-06-05" }
    ],
    responsables: [
        { id: "R-001", nombre: "Juan Pérez", correo: "jperez@test.com", telefonos: "8888-8888", especialidad: "DevOps", empresa: "TechCorp", estado: "Aprobado" },
        { id: "R-002", nombre: "María Gómez", correo: "mgomez@test.com", telefonos: "7777-7777", especialidad: "IA", empresa: "Independiente", estado: "Pendiente" }
    ],
    stands: [
        { id: "S-001", nombre: "Stand Alpha",   descripcion: "Tecnología e innovación",  encargado: "Juan Pérez",    empresa: "Tech Corp",    correo: "juan@tech.com",   telefono: "8888-0001", estado: "activo" },
        { id: "S-002", nombre: "Stand Beta",    descripcion: "Robótica y manufactura",   encargado: "María López",   empresa: "RoboTech",     correo: "maria@robo.com",  telefono: "8888-0002", estado: "inactivo" },
        { id: "S-003", nombre: "Stand Gamma",   descripcion: "Inteligencia Artificial",  encargado: "Carlos Mora",   empresa: "AI Solutions", correo: "carlos@ai.com",   telefono: "8888-0003", estado: "activo" },
        { id: "S-004", nombre: "Stand Delta",   descripcion: "Ciberseguridad",           encargado: "Ana Rodríguez", empresa: "SecureNet",    correo: "ana@secure.com",  telefono: "8888-0004", estado: "inactivo" },
        { id: "S-005", nombre: "Stand Epsilon", descripcion: "Desarrollo web",           encargado: "Luis Vargas",   empresa: "WebDev Co.",   correo: "luis@web.com",    telefono: "8888-0005", estado: "activo" }
    ],
    sesionActual: null
};
