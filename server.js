require('dotenv').config();  // Asegúrate de tener un archivo .env para las variables de entorno

const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL utilizando variables de entorno
const sequelize = new Sequelize(
  process.env.DB_NAME,     // El nombre de la base de datos
  process.env.DB_USER,     // El usuario de la base de datos
  process.env.DB_PASSWORD, // La contraseña de la base de datos
  {
    host: process.env.DB_HOST, // Host donde está la base de datos (por ejemplo, Render)
    dialect: 'postgres',  // El tipo de base de datos
    port: process.env.DB_PORT || 5432,  // Puerto de conexión a la base de datos
  }
);

// Modelos de base de datos

const Usuario = sequelize.define('Usuario', {
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING,
  email: { type: DataTypes.STRING, allowNull: true },  // Agregamos el campo email
});

const Ticket = sequelize.define('Ticket', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: { type: DataTypes.STRING, allowNull: false },
  dni: { type: DataTypes.STRING, allowNull: false },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
});

// Modelo de Solicitud para guardar las solicitudes de cuenta
const Solicitud = sequelize.define('Solicitud', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
});

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.send('API funcionando');
});

// Registro de usuario
app.post('/api/register', async (req, res) => {
  const { username, password, email, nombre } = req.body;

  try {
    const nuevoUsuario = await Usuario.create({ username, password, email, nombre });
    res.json(nuevoUsuario);
  } catch (err) {
    console.error('❌ Error en /register:', err);
    res.status(400).json({ error: 'Usuario ya existe' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await Usuario.findOne({ where: { username, password } });

  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Crear ticket
app.post('/api/ticket', async (req, res) => {
  const { nombre, fecha, hora, mensaje, dni } = req.body;

  try {
    const ticket = await Ticket.create({ nombre, fecha, hora, mensaje, dni });
    res.json(ticket);
  } catch (err) {
    console.error('❌ Error al crear ticket:', err);
    res.status(500).json({ error: 'Error al crear el ticket' });
  }
});

// Endpoint para manejar solicitudes de creación de cuenta (guardarlas en la base de datos)
app.post('/api/contacto', async (req, res) => {
  const { nombre, email, mensaje } = req.body;

  // Verifica si los datos son válidos
  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Guardamos la solicitud en la base de datos
    const nuevaSolicitud = await Solicitud.create({ nombre, email, mensaje });
    res.json({ success: true, message: 'Tu solicitud ha sido enviada al administrador.' });
  } catch (err) {
    console.error('❌ Error al guardar la solicitud:', err);
    res.status(500).json({ error: 'Error al guardar la solicitud' });
  }
});

// Obtener todas las solicitudes (por ejemplo, para que el administrador las vea)
app.get('/api/solicitudes', async (req, res) => {
  try {
    const solicitudes = await Solicitud.findAll();
    res.json(solicitudes);
  } catch (err) {
    console.error('❌ Error al obtener las solicitudes:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
});

// Obtener tickets filtrados por nombre
app.get('/api/ticket', async (req, res) => {
  const { dni } = req.query;

  try {
    if (!dni) {
      return res.status(400).json({ error: 'dni requerido para filtrar tickets' });
    }

    const tickets = await Ticket.findAll({
      where: { dni },
      order: [['createdAt', 'DESC']],
    });

    res.json(tickets);
  } catch (err) {
    console.error('❌ Error al obtener tickets:', err);
    res.status(500).json({ error: 'Error al obtener los tickets' });
  }
});

// Borrar ticket por ID
app.delete('/api/ticket/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const eliminado = await Ticket.destroy({ where: { id } });

    if (eliminado) {
      res.json({ message: 'Ticket eliminado' });
    } else {
      res.status(404).json({ error: 'Ticket no encontrado' });
    }
  } catch (err) {
    console.error('❌ Error al borrar ticket:', err);
    res.status(500).json({ error: 'Error al borrar el ticket' });
  }
});

// Obtener todos los usuarios (Endpoint para el Superadmin)
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios); // Responde con todos los usuarios
  } catch (err) {
    console.error('❌ Error al obtener los usuarios:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Borrar solicitud de cuenta de empleado por ID
app.delete('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const eliminado = await Solicitud.destroy({ where: { id } });

    if (eliminado) {
      res.json({ message: 'Solicitud eliminada' });
    } else {
      res.status(404).json({ error: 'Solicitud no encontrada' });
    }
  } catch (err) {
    console.error('❌ Error al borrar solicitud:', err);
    res.status(500).json({ error: 'Error al borrar la solicitud' });
  }
});

// Borrar un usuario por ID
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const eliminado = await Usuario.destroy({ where: { id } });

    if (eliminado) {
      res.json({ message: 'Usuario eliminado' });
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (err) {
    console.error('❌ Error al borrar usuario:', err);
    res.status(500).json({ error: 'Error al borrar el usuario' });
  }
});

// Usar el puerto proporcionado por la plataforma o el puerto por defecto (3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});

// Conectar a DB y arrancar servidor
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conectado a PostgreSQL');
    return sequelize.sync();
  })
  .then(() => {
    console.log('📦 Tablas sincronizadas');
  })
  .catch(err => {
    console.error('❌ Error al conectar o sincronizar:', err);
  });
