cat > main.js << 'EOF'
const { app, BrowserWindow } = require('electron');
const path = require('path');
const Fastify = require('fastify');
const fastifyStatic = require('fastify-static');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');

const PORT = 8081;
const HOST = '0.0.0.0';

// --- Database ---
const db = new sqlite3.Database('bms.db');
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS branding (id INTEGER PRIMARY KEY, logo TEXT)");
  db.run("INSERT OR IGNORE INTO users (id, username, password) VALUES (1, 'admin', 'syncro123')");
});

// --- Fastify server ---
const server = Fastify();
server.register(require('@fastify/cors'), { origin: '*' });
server.register(fastifyStatic, { root: path.join(__dirname, 'public'), prefix: '/' });

// Multer for logo uploads
const upload = multer({ dest: path.join(__dirname, 'public', 'uploads') });

// API: Login
server.post('/api/login', async (req, reply) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username=? AND password=?", [username, password], (err, row) => {
    if (row) reply.send({ success: true });
    else reply.send({ success: false });
  });
});

// API: Upload logo
server.post('/api/upload-logo', { preHandler: upload.single('logo') }, (req, reply) => {
  const logoPath = `/uploads/${req.file.filename}`;
  db.run("INSERT INTO branding (logo) VALUES (?)", [logoPath]);
  reply.send({ success: true, path: logoPath });
});

// API: Get logo
server.get('/api/logo', (req, reply) => {
  db.get("SELECT logo FROM branding ORDER BY id DESC LIMIT 1", (err, row) => {
    reply.send(row || { logo: null });
  });
});

server.listen(PORT, HOST, (err) => {
  if (err) throw err;
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// --- Electron window ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: false }
  });
  win.loadURL(`http://localhost:${PORT}`);
}
app.whenReady().then(createWindow);
EOF
