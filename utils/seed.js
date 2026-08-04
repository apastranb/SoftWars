const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

async function seedDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'softwars_eventos';

  if (!uri) {
    throw new Error('Falta MONGODB_URI. Copie .env.example como .env y complete los valores.');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('[db] Ejecutando seed inicial...');
    const db = client.db(dbName);

    await db.collection('usuarios').deleteMany({});
    await db.collection('oradores').deleteMany({});
    await db.collection('actividades').deleteMany({});
    await db.collection('stands').deleteMany({});
    await db.collection('participantes').deleteMany({});
    await db.collection('postulaciones').deleteMany({});
    await db.collection('eventos').deleteMany({});
    await db.collection('contadores').deleteMany({});

    const eventoId = new ObjectId();
    const oradorId = new ObjectId();
    const actividadId = new ObjectId();

    await db.collection('eventos').insertOne({
      _id: eventoId,
      codigo: 'EV-001',
      nombre: 'Seminario de IA',
      categoria: 'Tecnológicas',
      descripcion: 'Evento de apertura del ciclo académico.',
      fechaInicio: '2026-11-15',
      fechaFin: '2026-11-16',
      horaInicio: '08:00',
      horaFin: '17:00',
      lugar: 'Auditorio Principal',
      cupoMax: 150,
      cupoActual: 0,
      responsable: 'María Gómez',
      tipoEntrada: 'libre',
      entradaLibre: true,
      visibilidad: 'publico',
      estado: 'Disponible',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null
    });

    const passwordHash = await bcrypt.hash('SoftWars2026!', 10);
    await db.collection('usuarios').insertMany([
      {
        nombre: 'Adonis Pastrana',
        correo: 'apastranb@ucenfotec.ac.cr',
        passwordHash,
        rol: 'Administrador',
        estado: 'Activo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Josué Arroyo',
        correo: 'jarroyor@ucenfotec.ac.cr',
        passwordHash,
        rol: 'Administrador',
        estado: 'Activo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await db.collection('oradores').insertOne({
      _id: oradorId,
      codigo: 'OR-001',
      nombre: 'Dra. Elena Rostova',
      correo: 'elena.rostova@tech.org',
      telefonos: ['8888-0001'],
      telefono: '8888-0001',
      especialidad: 'Inteligencia Artificial',
      empresa: 'AI Research Lab',
      biografia: 'Experta en IA y aprendizaje automático.',
      foto: null,
      eventoId,
      estado: 'Activo',
      fechaRegistro: new Date()
    });

    await db.collection('actividades').insertOne({
      _id: actividadId,
      codigo: 'ACT-001',
      nombre: 'Conferencia: El Futuro de la IA',
      descripcion: 'Una mirada profunda a la evolución de los modelos de lenguaje.',
      eventoId,
      fecha: '2026-10-15',
      horaInicio: '10:00',
      horaFin: '12:00',
      lugar: 'Auditorio Principal',
      cupoMaximo: 100,
      cupoOcupado: 0,
      categoria: 'Tecnológicas',
      estado: 'Disponible',
      visibilidad: 'publica',
      entradaLibre: true,
      incluyeRefrigerio: true,
      responsableId: oradorId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null
    });

    await db.collection('stands').insertOne({
      codigo: 'S-2026-001',
      numero: 1,
      anio: new Date().getFullYear(),
      eventoId,
      nombre: 'Tech Innovators Stand',
      categoria: 'empresa',
      descripcion: 'Exposición de proyectos tecnológicos.',
      encargado: 'Roberto Gómez',
      empresa: 'Tech Innovators',
      correo: 'contacto@techinnovators.com',
      telefono: '8765-4321',
      estado: 'Aprobado',
      fechaRegistro: new Date()
    });

    await db.collection('participantes').insertOne({
      codigo: 'P-001',
      nombreCompleto: 'María Rodríguez',
      correo: 'maria.rod@mail.com',
      telefono: '7000-1122',
      edad: 22,
      carrera: 'Ingeniería en Sistemas',
      actividades: [actividadId],
      estado: 'Activo',
      fechaInscripcion: new Date(),
      metodoPago: 'Gratuito'
    });

    await db.collection('postulaciones').insertOne({
      codigo: 'PT-001',
      nombre: 'Ing. Javier Martínez',
      correo: 'javier.martinez@dev.com',
      telefonos: ['8999-3344'],
      especialidad: 'Ciberseguridad',
      biografia: 'Experto en ethical hacking y seguridad en la nube.',
      organizacion: 'CyberShield',
      empresa: 'CyberShield',
      foto: null,
      actividadId,
      eventoId,
      estado: 'Pendiente',
      fechaPostulacion: new Date()
    });

    await db.collection('contadores').insertMany([
      { _id: 'eventos', valor: 1 },
      { _id: 'actividades', valor: 1 },
      { _id: 'oradores', valor: 1 },
      { _id: 'postulaciones', valor: 1 },
      { _id: 'stands-2026', valor: 1 }
    ]);

    console.log('[db] Seed ejecutado con éxito.');
  } catch (error) {
    console.error('[db] Error al poblar la base de datos:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

module.exports = { seedDB };