import { Router } from "express";
import { db } from "../db.js";
import { buildManifest } from "../manifest.js";
import { getItemsForList, getListForUser, getListsForUser, itemTypes } from "../services/lists.js";
import { getBackgroundFallback, getPosterFallback } from "../services/metadata.js";

const router = Router();
const getUserStatement = db.prepare("SELECT * FROM users WHERE token = ?");

function getUserByToken(token) {
  return getUserStatement.get(token);
}

function toMetaPreview(item) {
  const poster = item.poster || getPosterFallback(item.stremio_id);
  const background = item.background || getBackgroundFallback(item.stremio_id);
  const meta = {
    id: item.stremio_id,
    type: item.type,
    name: item.item_name || item.stremio_id
  };

  if (poster) {
    meta.poster = poster;
  }
  if (background) {
    meta.background = background;
  }
  if (item.logo) {
    meta.logo = item.logo;
  }
  if (item.description) {
    meta.description = item.description;
  }
  if (item.release_info) {
    meta.releaseInfo = item.release_info;
  }
  if (item.genres.length > 0) {
    meta.genres = item.genres;
  }

  return meta;
}

router.get("/u/:token/manifest.json", (req, res) => {
  const user = getUserByToken(req.params.token);
  if (!user) {
    return res.status(404).json({ error: "invalid token" });
  }

  res.json(buildManifest({ lists: getListsForUser(user.id) }));
});

router.get("/u/:token/catalog/:type/:catalogId.json", handleCatalog);
router.get("/u/:token/catalog/:type/:catalogId/:extra.json", handleCatalog);

function handleCatalog(req, res) {
  const { token, type, catalogId } = req.params;
  const user = getUserByToken(token);

  if (!user || !catalogId.startsWith("list_") || !itemTypes.has(type)) {
    return res.json({ metas: [] });
  }

  const listId = Number.parseInt(catalogId.slice("list_".length), 10);
  if (!Number.isInteger(listId) || listId <= 0) {
    return res.json({ metas: [] });
  }

  const list = getListForUser(listId, user.id);
  if (!list) {
    return res.json({ metas: [] });
  }

  const items = getItemsForList(listId, type);
  res.json({ metas: items.map(toMetaPreview) });
}

export default router;
