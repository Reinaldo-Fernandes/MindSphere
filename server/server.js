// server.js (Ajustado)
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname));

// Rota protegida: No futuro, você pode implementar um middleware aqui
app.get('/adm', (req, res) => {
    // Por enquanto, enviamos o arquivo. A trava real estará no JS frontal.
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(3000, () => {
    console.log('🚀 Servidor rodando em http://localhost:3000');
});