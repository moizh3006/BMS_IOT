const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');

// Express server for API / UI
const server = express();
server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(8081, '0.0.0.0', () => {
  console.log('Web server running at http://0.0.0.0:8081');
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadURL('http://0.0.0.0:8081');
}

app.whenReady().then(() => {
  createWindow();
});
