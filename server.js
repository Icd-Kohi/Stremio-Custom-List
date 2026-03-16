import { networkInterfaces } from "node:os";
import * as http from "node:http";
import { createApp } from "./app.js";

const DEFAULT_PORT = 7000;
const DEFAULT_HOST = "0.0.0.0";

function readCliOptions(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--host") {
      const nextArg = argv[index + 1];
      options.host = nextArg && !nextArg.startsWith("-") ? nextArg : DEFAULT_HOST;
      if (options.host === nextArg) {
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--host=")) {
      options.host = arg.slice("--host=".length) || DEFAULT_HOST;
      continue;
    }

    if (arg === "--port") {
      const nextArg = argv[index + 1];
      if (!nextArg || nextArg.startsWith("-")) {
        throw new Error("Missing value for --port");
      }
      options.port = nextArg;
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = arg.slice("--port=".length);
    }
  }

  return options;
}

function parsePort(value) {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

function getNetworkUrls(host, port) {
  if (host !== "0.0.0.0" && host !== "::") {
    return [];
  }

  return Object.values(networkInterfaces())
    .flat()
    .filter(Boolean)
    .filter((address) => address.family === "IPv4" && !address.internal)
    .map((address) => `http://${address.address}:${port}`);
}

const cliOptions = readCliOptions(process.argv.slice(2));
const app = createApp();
const host = cliOptions.host ?? process.env.HOST ?? DEFAULT_HOST;
const port = parsePort(cliOptions.port ?? process.env.PORT ?? String(DEFAULT_PORT));
const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use on host ${host}.`);
  } else if (error.code === "EACCES" || error.code === "EPERM") {
    console.error(`The process is not allowed to listen on ${host}:${port}.`);
  } else {
    console.error(error);
  }

  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Addon server listening on http://${host}:${port}`);
  console.log(`Local UI: http://localhost:${port}`);

  const networkUrls = getNetworkUrls(host, port);
  if (networkUrls.length > 0) {
    console.log(`Network UI: ${networkUrls.join(", ")}`);
  }
});
