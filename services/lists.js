import { db } from "../db.js";

const getUserListsStatement = db.prepare(`
  SELECT id, user_id, name, type, created_at
  FROM lists
  WHERE user_id = ?
  ORDER BY id DESC
`);

const getUserListStatement = db.prepare(`
  SELECT id, user_id, name, type, created_at
  FROM lists
  WHERE id = ? AND user_id = ?
`);

const getListItemsStatement = db.prepare(`
  SELECT
    list_id,
    stremio_id,
    item_name,
    type,
    poster,
    background,
    logo,
    description,
    release_info,
    genres_json,
    added_at
  FROM list_items
  WHERE list_id = ?
  ORDER BY added_at DESC
  LIMIT 200
`);

const createListStatement = db.prepare(`
  INSERT INTO lists(user_id, name, type)
  VALUES (?, ?, ?)
`);

const updateListStatement = db.prepare(`
  UPDATE lists
  SET name = ?, type = ?
  WHERE id = ? AND user_id = ?
`);

const deleteListStatement = db.prepare(`
  DELETE FROM lists
  WHERE id = ? AND user_id = ?
`);

const deleteListItemsStatement = db.prepare(`
  DELETE FROM list_items
  WHERE list_id = ?
`);

const upsertItemStatement = db.prepare(`
  INSERT INTO list_items(
    list_id,
    stremio_id,
    item_name,
    type,
    poster,
    background,
    logo,
    description,
    release_info,
    genres_json,
    added_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(list_id, stremio_id) DO UPDATE SET
    item_name = excluded.item_name,
    type = excluded.type,
    poster = excluded.poster,
    background = excluded.background,
    logo = excluded.logo,
    description = excluded.description,
    release_info = excluded.release_info,
    genres_json = excluded.genres_json,
    added_at = excluded.added_at
`);

const deleteItemStatement = db.prepare(`
  DELETE FROM list_items
  WHERE list_id = ? AND stremio_id = ?
`);

export const listTypes = new Set(["movie", "series", "both"]);
export const itemTypes = new Set(["movie", "series"]);

function parseGenres(rawValue) {
  if (typeof rawValue !== "string" || !rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((genre) => typeof genre === "string" && genre) : [];
  } catch {
    return [];
  }
}

function mapListItem(row) {
  return {
    ...row,
    genres: parseGenres(row.genres_json)
  };
}

export function getListsForUser(userId) {
  return getUserListsStatement.all(userId);
}

export function getListForUser(listId, userId) {
  return getUserListStatement.get(listId, userId);
}

export function getItemsForList(listId, type) {
  const items = getListItemsStatement.all(listId).map(mapListItem);
  if (!type) {
    return items;
  }
  return items.filter((item) => item.type === type);
}

export function createList(userId, name, type) {
  const result = createListStatement.run(userId, name, type);
  return getListForUser(Number(result.lastInsertRowid), userId);
}

export function updateList(listId, userId, name, type) {
  updateListStatement.run(name, type, listId, userId);
  return getListForUser(listId, userId);
}

export function deleteList(listId, userId) {
  const removeList = db.transaction((targetListId, targetUserId) => {
    const list = getListForUser(targetListId, targetUserId);
    if (!list) {
      return false;
    }

    deleteListItemsStatement.run(targetListId);
    deleteListStatement.run(targetListId, targetUserId);
    return true;
  });

  return removeList(listId, userId);
}

export function addItemToList(listId, stremioId, metadata, type) {
  upsertItemStatement.run(
    listId,
    stremioId,
    metadata.itemName,
    type,
    metadata.poster || "",
    metadata.background || "",
    metadata.logo || "",
    metadata.description || "",
    metadata.releaseInfo || "",
    JSON.stringify(Array.isArray(metadata.genres) ? metadata.genres : []),
    Date.now()
  );
}

export function removeItemFromList(listId, stremioId) {
  return deleteItemStatement.run(listId, stremioId).changes > 0;
}
