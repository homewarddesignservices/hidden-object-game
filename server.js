const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from src directory
app.use(express.static(path.join(__dirname, 'src')));
// Serve images from public/images directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});