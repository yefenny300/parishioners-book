const express = require('express');
const connectDb = require('./config/db');

const app = express();

// Connect Database
connectDb();

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send(`API Running`));

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/parishioners', require('./routes/api/parishioners'));
app.use('/api/unions', require('./routes/api/unions'));
app.use('/api/associations', require('./routes/api/associations'));
app.use('/api/districts', require('./routes/api/districts'));
app.use('/api/churches', require('./routes/api/churches'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
