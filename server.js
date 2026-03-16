import { createApp } from "./app.js";
//const http = require('node:http');
import * as http from 'node:http';
// CHANGE THE PORT IF YOU WANT
const app = createApp();
const port = 8000;
const ipv4 = 'localhost';

var server = http.createServer(app);

server.listen(port, ipv4, () => {
  console.log(`Addon server on http://${ipv4}:${port}`);
});
