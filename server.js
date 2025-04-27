const express = require('express');
const userRoutes = require('./routes/user');
const app = express();
const path = require('path');

app.use(express.json());

app.use(express.static(path.join(__dirname, 'front')));

app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'front', 'index.html'));
});



app.listen(3000, () => console.log('Servidor rodando na porta 3000'));