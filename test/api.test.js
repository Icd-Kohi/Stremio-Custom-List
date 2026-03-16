import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tempDir = mkdtempSync(join(tmpdir(), "custom-lists-"));
process.env.DB_PATH = join(tempDir, "test.sqlite");
process.env.DISABLE_REMOTE_METADATA = "1";

const [{ createApp }, { db }] = await Promise.all([
  import("../app.js"),
  import("../db.js")
]);

async function createServer() {
  const app = createApp();

  return await new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        close: () =>
          new Promise((done) => {
            server.close(() => {
              done();
            });
          })
      });
    });
  });
}

function resetDb() {
  db.exec(`
    DELETE FROM list_items;
    DELETE FROM lists;
    DELETE FROM users;
  `);
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const json = await response.json();
  return { response, json };
}

test("list CRUD, item CRUD, and manifest work", { concurrency: false }, async () => {
  resetDb();
  const ctx = await createServer();

  try {
    const login = await jsonFetch(`${ctx.baseUrl}/api/login`, { method: "POST" });
    assert.equal(login.response.status, 201);
    const token = login.json.token;

    const created = await jsonFetch(`${ctx.baseUrl}/api/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-token": token },
      body: JSON.stringify({ name: "Favorites", type: "both" })
    });
    assert.equal(created.response.status, 201);
    const listId = created.json.list.id;

    const updated = await jsonFetch(`${ctx.baseUrl}/api/lists/${listId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-token": token },
      body: JSON.stringify({ name: "Action", type: "movie" })
    });
    assert.equal(updated.json.list.name, "Action");
    assert.equal(updated.json.list.type, "movie");

    const item = await jsonFetch(`${ctx.baseUrl}/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-token": token },
      body: JSON.stringify({ stremioId: "tt0133093", type: "movie" })
    });
    assert.equal(item.response.status, 201);

    const items = await jsonFetch(`${ctx.baseUrl}/api/lists/${listId}/items`, {
      headers: { "x-token": token }
    });
    assert.equal(items.json.items.length, 1);
    assert.equal(items.json.items[0].stremio_id, "tt0133093");
    assert.equal(items.json.items[0].item_name, "tt0133093");
    assert.equal(items.json.items[0].poster, "https://images.metahub.space/poster/medium/tt0133093/img");

    const manifest = await jsonFetch(`${ctx.baseUrl}/u/${token}/manifest.json`);
    assert.equal(manifest.response.status, 200);
    assert.equal(manifest.json.catalogs.length, 1);
    assert.equal(manifest.json.catalogs[0].name, "Action");

    const catalog = await jsonFetch(`${ctx.baseUrl}/u/${token}/catalog/movie/list_${listId}.json`);
    assert.equal(catalog.json.metas.length, 1);
    assert.equal(catalog.json.metas[0].id, "tt0133093");
    assert.equal(catalog.json.metas[0].poster, "https://images.metahub.space/poster/medium/tt0133093/img");
    assert.equal(catalog.json.metas[0].background, "https://images.metahub.space/background/medium/tt0133093/img");
  } finally {
    await ctx.close();
  }
});

test("deleting another user's list does not remove its items", { concurrency: false }, async () => {
  resetDb();
  const ctx = await createServer();

  try {
    const loginA = await jsonFetch(`${ctx.baseUrl}/api/login`, { method: "POST" });
    const loginB = await jsonFetch(`${ctx.baseUrl}/api/login`, { method: "POST" });
    const tokenA = loginA.json.token;
    const tokenB = loginB.json.token;

    const created = await jsonFetch(`${ctx.baseUrl}/api/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-token": tokenA },
      body: JSON.stringify({ name: "Secret", type: "movie" })
    });
    const listId = created.json.list.id;

    await jsonFetch(`${ctx.baseUrl}/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-token": tokenA },
      body: JSON.stringify({ stremioId: "tt0110912", type: "movie" })
    });

    const deleted = await jsonFetch(`${ctx.baseUrl}/api/lists/${listId}`, {
      method: "DELETE",
      headers: { "x-token": tokenB }
    });
    assert.equal(deleted.json.deleted, false);

    const items = await jsonFetch(`${ctx.baseUrl}/api/lists/${listId}/items`, {
      headers: { "x-token": tokenA }
    });
    assert.equal(items.json.items.length, 1);
    assert.equal(items.json.items[0].stremio_id, "tt0110912");
  } finally {
    await ctx.close();
  }
});

process.on("exit", () => {
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
});
