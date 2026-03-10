import cors from "cors";
import express from "express";
import apiRoutes from "./routes/api.js";
import stremioRoutes from "./routes/stremio.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static("public"));

  app.use("/api", apiRoutes);
  app.use(stremioRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "not found" });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  });

  return app;
}
