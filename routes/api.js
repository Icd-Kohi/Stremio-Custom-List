import crypto from "crypto";
import { Router } from "express";
import { db } from "../db.js";
import { requireUser } from "../middleware/auth.js";
import {
  addItemToList,
  createList,
  deleteList,
  getItemsForList,
  getListForUser,
  getListsForUser,
  itemTypes,
  listTypes,
  removeItemFromList,
  updateList
} from "../services/lists.js";
import { resolveItemMetadata } from "../services/metadata.js";

const router = Router();
const createUserStatement = db.prepare("INSERT INTO users(token, created_at) VALUES (?, ?)");

function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeName(name) {
  return typeof name === "string" ? name.trim() : "";
}

router.post("/login", (req, res) => {
  const token = crypto.randomBytes(16).toString("hex");
  createUserStatement.run(token, Date.now());
  res.status(201).json({
    token,
    installUrl: `${getBaseUrl(req)}/u/${token}/manifest.json`
  });
});

router.use(requireUser);

router.get("/me", (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      token: req.token,
      installUrl: `${getBaseUrl(req)}/u/${req.token}/manifest.json`
    }
  });
});

router.get("/lists", (req, res) => {
  res.json({ lists: getListsForUser(req.user.id) });
});

router.post("/lists", (req, res) => {
  const name = normalizeName(req.body?.name);
  const type = req.body?.type ?? "both";

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }
  if (!listTypes.has(type)) {
    return res.status(400).json({ error: "bad type" });
  }

  const list = createList(req.user.id, name, type);
  res.status(201).json({ list });
});

router.get("/lists/:id/items", (req, res) => {
  const listId = parseId(req.params.id);
  if (!listId) {
    return res.status(400).json({ error: "bad list id" });
  }

  const list = getListForUser(listId, req.user.id);
  if (!list) {
    return res.status(404).json({ error: "not found" });
  }

  const type = req.query.type;
  if (type && !itemTypes.has(type)) {
    return res.status(400).json({ error: "bad type" });
  }

  res.json({ list, items: getItemsForList(listId, type) });
});

router.patch("/lists/:id", (req, res) => {
  const listId = parseId(req.params.id);
  if (!listId) {
    return res.status(400).json({ error: "bad list id" });
  }

  const list = getListForUser(listId, req.user.id);
  if (!list) {
    return res.status(404).json({ error: "not found" });
  }

  const nextName = req.body?.name === undefined ? list.name : normalizeName(req.body.name);
  const nextType = req.body?.type ?? list.type;

  if (!nextName) {
    return res.status(400).json({ error: "name required" });
  }
  if (!listTypes.has(nextType)) {
    return res.status(400).json({ error: "bad type" });
  }

  res.json({ list: updateList(listId, req.user.id, nextName, nextType) });
});

router.delete("/lists/:id", (req, res) => {
  const listId = parseId(req.params.id);
  if (!listId) {
    return res.status(400).json({ error: "bad list id" });
  }

  const deleted = deleteList(listId, req.user.id);
  res.json({ deleted });
});

router.post("/lists/:id/items", async (req, res) => {
  const listId = parseId(req.params.id);
  if (!listId) {
    return res.status(400).json({ error: "bad list id" });
  }

  const list = getListForUser(listId, req.user.id);
  if (!list) {
    return res.status(404).json({ error: "not found" });
  }

  const stremioId = typeof req.body?.stremioId === "string" ? req.body.stremioId.trim() : "";
  const type = req.body?.type;

  if (!stremioId || !type) {
    return res.status(400).json({ error: "stremioId and type required" });
  }
  if (!itemTypes.has(type)) {
    return res.status(400).json({ error: "bad type" });
  }

  const metadata = await resolveItemMetadata(stremioId, type);
  addItemToList(listId, stremioId, metadata.itemName, type);
  res.status(201).json({
    item: {
      list_id: listId,
      stremio_id: stremioId,
      item_name: metadata.itemName,
      type
    }
  });
});

router.delete("/lists/:id/items/:stremioId", (req, res) => {
  const listId = parseId(req.params.id);
  if (!listId) {
    return res.status(400).json({ error: "bad list id" });
  }

  const list = getListForUser(listId, req.user.id);
  if (!list) {
    return res.status(404).json({ error: "not found" });
  }

  const deleted = removeItemFromList(listId, req.params.stremioId);
  res.json({ deleted });
});

export default router;
