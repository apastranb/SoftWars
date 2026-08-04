import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'gestionEventos';

async function seedDB() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado a la base de datos para ejecutar el Seed...');
    const db = client.db(dbName);

    // Limpiar colecciones previas
    await db.collection('usuarios').deleteMany({});
    await db.collection('oradores').deleteMany({});
    await db.collection('actividades').deleteMany({});
    await db.collection('stands').deleteMany({});
    await db.collection('participantes').deleteMany({});
    await db.collection('postulaciones').deleteMany({});

    // ID de evento simulado para vincular referencias
    const eventoIdSimulado = new ObjectId();

    // 1. USUARIOS (Roles oficiales: Administrador, Super Administrador, Editor, Moderador)
    const usuarios = [
      {
        nombreCompleto: 'Ana García',
        correo: 'ana.admin@evento.com',
        contrasenia: '$2b$10$HASHED_PASSWORD_HERE', // Recordar cifrar en prod
        rol: 'Super Administrador',
        estado: 'Activo',
        fechaCreacion: new Date()
      },
      {
        nombreCompleto: 'Carlos López',
        correo: 'carlos.editor@evento.com',
        contrasenia: '$2b$10$HASHED_PASSWORD_HERE',
        rol: 'Editor',
        estado: 'Activo',
        fechaCreacion: new Date()
      }
    ];
    await db.collection('usuarios').insertMany(usuarios);

    // 2. ORADORES (Código oficial: OR-XXX, campos completados)
    const oradorId = new ObjectId();
    const oradores = [
      {
        _id: oradorId,
        codigo: 'OR-001',
        nombreCompleto: 'Dra. Elena Rostova',
        correo: 'elena.rostova@tech.org',
        telefonos: ['8888-0001', '2222-0001'],
        empresa: 'AI Research Lab',
        biografia: 'Especialista en Inteligencia Artificial y Machine Learning con 10 años de experiencia.',
        foto: 'https://ejemplo.com/fotos/or-001.jpg',
        eventoId: eventoIdSimulado,
        fechaRegistro: new Date()
      }
    ];
    await db.collection('oradores').insertMany(oradores);

    // 3. ACTIVIDADES (Campos oficiales: nombre, responsableId, estado: 'Disponible')
    const actividadId = new ObjectId();
    const actividades = [
      {
        _id: actividadId,
        codigo: 'ACT-001',
        nombre: 'Conferencia: El Futuro de la IA',
        descripcion: 'Una mirada profunda a la evolución de los modelos de lenguaje.',
        fecha: new Date('2026-10-15T10:00:00Z'),
        lugar: 'Auditorio Principal',
        cupoMaximo: 100,
        cupoOcupado: 0,
        categoria: 'Conferencia',
        estado: 'Disponible', // Valores oficiales: Disponible, Llena, Cancelada, Finalizada
        visibilidad: 'Pública',
        entradaLibre: true,
        incluyeRefrigerio: true,
        responsableId: oradorId,
        eventoId: eventoIdSimulado
      }
    ];
    await db.collection('actividades').insertMany(actividades);

    // 4. STANDS (Estados oficiales: Aprobado, Cerrado; Tipo categoria: empresa/personal)
    const stands = [
      {
        codigo: 'ST-001',
        nombre: 'Tech Innovators Stand',
        encargado: 'Roberto Gómez',
        correo: 'contacto@techinnovators.com',
        telefono: '8765-4321',
        descripcion: 'Exposición de gadgets de última generación.',
        ubicacion: 'Pabellón A - Stand 12',
        categoria: 'empresa',
        estado: 'Aprobado', // Valores oficiales: Aprobado, Cerrado
        eventoId: eventoIdSimulado
      }
    ];
    await db.collection('stands').insertMany(stands);

    // 5. PARTICIPANTES (Campos oficiales: nombreCompleto, estado: 'Activo', actividades)
    const participantes = [
      {
        codigo: 'P-001',
        nombreCompleto: 'María Rodríguez',
        correo: 'maria.rod@mail.com',
        telefono: '7000-1122',
        edad: 22,
        carrera: 'Ingeniería en Sistemas',
        actividades: [actividadId],
        estado: 'Activo', // Valores oficiales: Activo, Cancelado
        fechaInscripcion: new Date(),
        metodoPago: 'Gratuito'
      }
    ];
    await db.collection('participantes').insertMany(participantes);

    // 6. POSTULACIONES (Campos según especificación, sin 'propuesta')
    const postulaciones = [
      {
        nombre: 'Ing. Javier Martínez',
        correo: 'javier.martinez@dev.com',
        telefonos: ['8999-3344'],
        especialidad: 'Ciberseguridad',
        biografia: 'Experto en ethical hacking y seguridad en la nube.',
        empresa: 'CyberShield',
        foto: 'https://ejemplo.com/fotos/post-001.jpg',
        actividadId: actividadId,
        aceptaTerminos: true,
        estado: 'Pendiente', // Pendiente, Aprobada, Rechazada
        fechaPostulacion: new Date()
      }
    ];
    await db.collection('postulaciones').insertMany(postulaciones);

    console.log(' ¡Seed ejecutado con éxito! Datos insertados alineados al Documento de Diseño 2.');
  } catch (error) {
    console.error(' Error al poblar la base de datos:', error);
  } finally {
    await client.close();
  }
}

seedDB();