const translations = {
  "pt-BR": {
    documentTitle: "Listas Personalizadas",
    languageLabel: "Idioma",
    eyebrow: "para o Stremio",
    heroTitle: "Gerencie listas no Stremio.",
    heroLead:
      "Crie listas com nome, adicione filmes ou séries por ID do Stremio e instale sua URL pessoal do addon no Stremio.",
    accessTitle: "Acesso",
    accessText: "Crie um token anônimo ou reutilize um existente.",
    createToken: "Criar token",
    tokenPlaceholder: "Cole um token existente",
    useToken: "Usar token",
    activeToken: "Token ativo",
    installUrl: "URL de instalação",
    openManifest: "Abrir manifest",
    installNotice:
      "Ao criar uma nova lista, reinstale ou atualize o addon no Stremio para que um novo catálogo apareça.",
    latestTokenLabel: "Último token usado:",
    latestTokenNone: "Nenhum token usado recentemente neste navegador.",
    listsTitle: "Suas listas",
    listsText: "Crie coleções como Favoritos, Ação ou Ver depois.",
    listNamePlaceholder: "Nome da lista",
    both: "Filmes + séries",
    movieOnly: "Somente filmes",
    seriesOnly: "Somente séries",
    createList: "Criar lista",
    latestSelected: "Última selecionada",
    connectToManage: "Conecte-se com um token para gerenciar listas.",
    noLists: "Nenhuma lista ainda. Crie a primeira.",
    selectedListTitle: "Lista selecionada",
    selectedListText: "Edite a lista e adicione ou remova itens por ID do Stremio.",
    selectListEmpty: "Selecione uma lista para gerenciar os itens.",
    editList: "Editar lista",
    closeEditor: "Fechar edição",
    deleteList: "Excluir lista",
    saveList: "Salvar lista",
    addItems: "Adicionar itens",
    itemPlaceholder: "ID do Stremio, ex: tt0133093 ou ID de série",
    movie: "Filme",
    series: "Série",
    addItem: "Adicionar item",
    noItems: "Nenhum item nesta lista ainda.",
    fallbackItemName: "Sem nome resolvido",
    remove: "Remover",
    manage: "Gerenciar",
    tokenRequired: "Token obrigatório.",
    tokenCreated: "Token criado.",
    tokenLoaded: "Token carregado.",
    listCreated: "Lista criada.",
    listUpdated: "Lista atualizada.",
    listDeleted: "Lista excluída.",
    itemAdded: "Item adicionado.",
    itemRemoved: "Item removido.",
    moviesAndSeries: "Filmes e séries",
    moviesOnly: "Somente filmes",
    seriesOnlyMeta: "Somente séries"
  },
  en: {
    documentTitle: "Custom Lists",
    languageLabel: "Language",
    eyebrow: "Stremio List Maker",
    heroTitle: "List manager for Stremio.",
    heroLead:
      "Create named lists, add movies or series by Stremio ID, and install your personal addon URL in Stremio.",
    accessTitle: "Access",
    accessText: "Create an anonymous token or reuse an existing one.",
    createToken: "Create token",
    tokenPlaceholder: "Paste an existing token",
    useToken: "Use token",
    activeToken: "Active token",
    installUrl: "Install URL",
    openManifest: "Open manifest",
    installNotice:
      "After creating a new list, reinstall or update the addon in Stremio so the new catalog can appear.",
    latestTokenLabel: "Latest token used:",
    latestTokenNone: "No token was used recently in this browser.",
    listsTitle: "Your lists",
    listsText: "Create collections such as Favorites, Action, or Watch Later.",
    listNamePlaceholder: "List name",
    both: "Movies + series",
    movieOnly: "Movies only",
    seriesOnly: "Series only",
    createList: "Create list",
    latestSelected: "Latest selected",
    connectToManage: "Connect with a token to manage lists.",
    noLists: "No lists yet. Create the first one.",
    selectedListTitle: "Selected list",
    selectedListText: "Edit the list and add or remove items by Stremio ID.",
    selectListEmpty: "Select a list to manage its items.",
    editList: "Edit list",
    closeEditor: "Close editor",
    deleteList: "Delete list",
    saveList: "Save list",
    addItems: "Add items",
    itemPlaceholder: "Stremio ID, e.g. tt0133093 or series ID",
    movie: "Movie",
    series: "Series",
    addItem: "Add item",
    noItems: "No items in this list yet.",
    fallbackItemName: "Unresolved title",
    remove: "Remove",
    manage: "Manage",
    tokenRequired: "Token required.",
    tokenCreated: "Token created.",
    tokenLoaded: "Token loaded.",
    listCreated: "List created.",
    listUpdated: "List updated.",
    listDeleted: "List deleted.",
    itemAdded: "Item added.",
    itemRemoved: "Item removed.",
    moviesAndSeries: "Movies and series",
    moviesOnly: "Movies only",
    seriesOnlyMeta: "Series only"
  }
};

const defaultLanguage = localStorage.getItem("customListsLanguage") || "pt-BR";

const state = {
  token: localStorage.getItem("customListsToken") || "",
  installUrl: "",
  lists: [],
  selectedListId: null,
  items: [],
  editListOpen: false,
  language: translations[defaultLanguage] ? defaultLanguage : "pt-BR"
};

const nodes = {
  languageSelect: document.querySelector("#language-select"),
  createToken: document.querySelector("#create-token"),
  tokenForm: document.querySelector("#token-form"),
  tokenInput: document.querySelector("#token-input"),
  latestToken: document.querySelector("#latest-token"),
  session: document.querySelector("#session"),
  activeToken: document.querySelector("#active-token"),
  installUrl: document.querySelector("#install-url"),
  installLink: document.querySelector("#install-link"),
  createListForm: document.querySelector("#create-list-form"),
  latestUsed: document.querySelector("#latest-used"),
  lists: document.querySelector("#lists"),
  listEmpty: document.querySelector("#list-empty"),
  detail: document.querySelector("#detail"),
  detailEmpty: document.querySelector("#detail-empty"),
  toggleEditList: document.querySelector("#toggle-edit-list"),
  renameListForm: document.querySelector("#rename-list-form"),
  deleteList: document.querySelector("#delete-list"),
  addItemForm: document.querySelector("#add-item-form"),
  items: document.querySelector("#items"),
  toast: document.querySelector("#toast")
};

function t(key) {
  return translations[state.language][key];
}

function showToast(message, isError = false) {
  nodes.toast.textContent = message;
  nodes.toast.classList.remove("hidden");
  nodes.toast.style.background = isError ? "rgba(177, 69, 49, 0.96)" : "rgba(22, 34, 24, 0.9)";
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    nodes.toast.classList.add("hidden");
  }, 2600);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { "x-token": state.token } : {}),
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function saveLanguage(language) {
  state.language = language;
  localStorage.setItem("customListsLanguage", language);
}

function latestTokenStorageKey() {
  return "customLists:lastToken";
}

function saveToken(token) {
  state.token = token;
  localStorage.setItem("customListsToken", token);
  localStorage.setItem(latestTokenStorageKey(), token);
}

function latestSelectedListStorageKey() {
  return state.token ? `customLists:lastSelectedList:${state.token}` : "";
}

function setLatestSelectedList(listId) {
  const key = latestSelectedListStorageKey();
  if (!key) return;
  localStorage.setItem(key, String(listId));
}

function getLatestSelectedList() {
  const key = latestSelectedListStorageKey();
  if (!key) return null;
  const value = localStorage.getItem(key);
  return value ? Number.parseInt(value, 10) : null;
}

function clearSession() {
  state.installUrl = "";
  state.lists = [];
  state.selectedListId = null;
  state.items = [];
  state.editListOpen = false;
  render();
}

function formField(form, name) {
  return form.elements.namedItem(name);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function describeListType(type) {
  if (type === "both") return t("moviesAndSeries");
  if (type === "movie") return t("moviesOnly");
  return t("seriesOnlyMeta");
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language;
  document.title = t("documentTitle");
  nodes.languageSelect.value = state.language;

  document.querySelector(".language-switcher span").textContent = t("languageLabel");
  document.querySelector(".eyebrow").textContent = t("eyebrow");
  document.querySelector(".hero h1").textContent = t("heroTitle");
  document.querySelector(".lede").textContent = t("heroLead");
  document.querySelector("#auth-panel h2").textContent = t("accessTitle");
  document.querySelector("#auth-panel .panel-head p").textContent = t("accessText");
  nodes.createToken.textContent = t("createToken");
  nodes.tokenInput.placeholder = t("tokenPlaceholder");
  nodes.tokenForm.querySelector("button").textContent = t("useToken");
  document.querySelector('label[for="active-token"]').textContent = t("activeToken");
  document.querySelector('label[for="install-url"]').textContent = t("installUrl");
  nodes.installLink.textContent = t("openManifest");
  document.querySelector(".notice").textContent = t("installNotice");
  document.querySelector(".content-grid .panel h2").textContent = t("listsTitle");
  document.querySelector(".content-grid .panel .panel-head p").textContent = t("listsText");
  formField(nodes.createListForm, "name").placeholder = t("listNamePlaceholder");
  formField(nodes.createListForm, "type").options[0].textContent = t("both");
  formField(nodes.createListForm, "type").options[1].textContent = t("movieOnly");
  formField(nodes.createListForm, "type").options[2].textContent = t("seriesOnly");
  nodes.createListForm.querySelector("button").textContent = t("createList");

  const detailPanel = document.querySelectorAll(".content-grid .panel")[1];
  detailPanel.querySelector("h2").textContent = t("selectedListTitle");
  detailPanel.querySelector(".panel-head p").textContent = t("selectedListText");
  nodes.detailEmpty.textContent = t("selectListEmpty");
  nodes.deleteList.textContent = t("deleteList");
  formField(nodes.renameListForm, "name").placeholder = t("listNamePlaceholder");
  formField(nodes.renameListForm, "type").options[0].textContent = t("both");
  formField(nodes.renameListForm, "type").options[1].textContent = t("movieOnly");
  formField(nodes.renameListForm, "type").options[2].textContent = t("seriesOnly");
  nodes.renameListForm.querySelector("button").textContent = t("saveList");
  document.querySelector('label[for="item-id-input"]').textContent = t("addItems");
  formField(nodes.addItemForm, "stremioId").placeholder = t("itemPlaceholder");
  formField(nodes.addItemForm, "type").options[0].textContent = t("movie");
  formField(nodes.addItemForm, "type").options[1].textContent = t("series");
  nodes.addItemForm.querySelector("button").textContent = t("addItem");
}

function renderLatestToken() {
  const latestToken = localStorage.getItem(latestTokenStorageKey());
  nodes.latestToken.classList.remove("hidden");
  nodes.latestToken.textContent = latestToken
    ? `${t("latestTokenLabel")} ${latestToken}`
    : t("latestTokenNone");
}

function renderSession() {
  const hasToken = Boolean(state.token);
  nodes.session.classList.toggle("hidden", !hasToken);
  nodes.createListForm.classList.toggle("hidden", !hasToken);
  nodes.activeToken.value = state.token;
  nodes.installUrl.value = state.installUrl;
  nodes.installLink.href = state.installUrl || "#";
}

function renderLatestSelectedList() {
  if (!state.token) {
    nodes.latestUsed.classList.add("hidden");
    return;
  }

  const latestId = getLatestSelectedList();
  const latestList = state.lists.find((list) => list.id === latestId);
  if (!latestList) {
    nodes.latestUsed.classList.add("hidden");
    return;
  }

  nodes.latestUsed.classList.remove("hidden");
  nodes.latestUsed.textContent = `${t("latestSelected")}: ${latestList.name}`;
}

function renderLists() {
  nodes.listEmpty.textContent = state.token
    ? state.lists.length
      ? ""
      : t("noLists")
    : t("connectToManage");

  nodes.listEmpty.classList.toggle("hidden", state.token && state.lists.length > 0);
  nodes.lists.innerHTML = "";

  const latestId = getLatestSelectedList();
  for (const list of state.lists) {
    const card = document.createElement("article");
    card.className = `list-card${list.id === state.selectedListId ? " active" : ""}`;
    card.innerHTML = `
      <div class="list-row">
        <div>
          <div class="list-title">
            <div class="list-name">${escapeHtml(list.name)}</div>
            ${list.id === latestId ? `<span class="badge">${t("latestSelected")}</span>` : ""}
          </div>
          <div class="meta">${describeListType(list.type)}</div>
        </div>
        <button class="button" type="button">${t("manage")}</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => selectList(list.id));
    nodes.lists.append(card);
  }
}

function renderDetail() {
  const selectedList = state.lists.find((list) => list.id === state.selectedListId);
  const visible = Boolean(selectedList);
  nodes.detail.classList.toggle("hidden", !visible);
  nodes.detailEmpty.classList.toggle("hidden", visible);

  if (!selectedList) {
    nodes.items.innerHTML = "";
    nodes.renameListForm.classList.add("hidden");
    return;
  }

  formField(nodes.renameListForm, "name").value = selectedList.name;
  formField(nodes.renameListForm, "type").value = selectedList.type;
  nodes.renameListForm.classList.toggle("hidden", !state.editListOpen);
  nodes.toggleEditList.textContent = state.editListOpen ? t("closeEditor") : t("editList");

  nodes.items.innerHTML = "";
  if (!state.items.length) {
    nodes.items.innerHTML = `<div class="empty-state">${t("noItems")}</div>`;
    return;
  }

  for (const item of state.items) {
    const card = document.createElement("article");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-row">
        <div>
          <div class="item-id">${escapeHtml(item.item_name || item.stremio_id || t("fallbackItemName"))}</div>
          <div class="meta">${escapeHtml(item.stremio_id)} · ${item.type}</div>
        </div>
        <button class="button button-danger" type="button">${t("remove")}</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => removeItem(item.stremio_id));
    nodes.items.append(card);
  }
}

function render() {
  applyStaticTranslations();
  renderLatestToken();
  renderSession();
  renderLatestSelectedList();
  renderLists();
  renderDetail();
}

async function bootstrap() {
  render();
  if (!state.token) {
    return;
  }

  try {
    const session = await api("/api/me");
    state.installUrl = session.user.installUrl;
    await loadLists();
  } catch (error) {
    localStorage.removeItem("customListsToken");
    state.token = "";
    clearSession();
    showToast(error.message, true);
  }
}

async function loadLists() {
  const { lists } = await api("/api/lists");
  state.lists = lists;
  const latestId = getLatestSelectedList();
  if (!state.lists.some((list) => list.id === state.selectedListId)) {
    state.selectedListId = state.lists.some((list) => list.id === latestId)
      ? latestId
      : state.lists[0]?.id ?? null;
  }
  render();
  if (state.selectedListId) {
    await loadItems(state.selectedListId);
  } else {
    state.items = [];
    render();
  }
}

async function loadItems(listId) {
  const { items } = await api(`/api/lists/${listId}/items`);
  state.items = items;
  render();
}

async function selectList(listId) {
  state.selectedListId = listId;
  setLatestSelectedList(listId);
  render();
  await loadItems(listId);
}

nodes.languageSelect.addEventListener("change", (event) => {
  saveLanguage(event.target.value);
  render();
});

nodes.createToken.addEventListener("click", async () => {
  try {
    const session = await api("/api/login", { method: "POST" });
    saveToken(session.token);
    state.installUrl = session.installUrl;
    state.selectedListId = null;
    await loadLists();
    showToast(t("tokenCreated"));
  } catch (error) {
    showToast(error.message, true);
  }
});

nodes.tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = new FormData(nodes.tokenForm).get("token")?.toString().trim();
  if (!token) {
    showToast(t("tokenRequired"), true);
    return;
  }

  saveToken(token);
  try {
    const session = await api("/api/me");
    state.installUrl = session.user.installUrl;
    await loadLists();
    showToast(t("tokenLoaded"));
  } catch (error) {
    localStorage.removeItem("customListsToken");
    state.token = "";
    clearSession();
    showToast(error.message, true);
  }
});

nodes.createListForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(nodes.createListForm);

  try {
    await api("/api/lists", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        type: formData.get("type")
      })
    });
    nodes.createListForm.reset();
    formField(nodes.createListForm, "type").value = "both";
    await loadLists();
    showToast(t("listCreated"));
  } catch (error) {
    showToast(error.message, true);
  }
});

nodes.renameListForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedListId) return;

  const formData = new FormData(nodes.renameListForm);
  try {
    await api(`/api/lists/${state.selectedListId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: formData.get("name"),
        type: formData.get("type")
      })
    });
    state.editListOpen = false;
    await loadLists();
    await loadItems(state.selectedListId);
    showToast(t("listUpdated"));
  } catch (error) {
    showToast(error.message, true);
  }
});

nodes.deleteList.addEventListener("click", async () => {
  if (!state.selectedListId) return;
  try {
    await api(`/api/lists/${state.selectedListId}`, { method: "DELETE" });
    state.selectedListId = null;
    state.items = [];
    state.editListOpen = false;
    await loadLists();
    showToast(t("listDeleted"));
  } catch (error) {
    showToast(error.message, true);
  }
});

nodes.addItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedListId) return;

  const formData = new FormData(nodes.addItemForm);
  try {
    await api(`/api/lists/${state.selectedListId}/items`, {
      method: "POST",
      body: JSON.stringify({
        stremioId: formData.get("stremioId"),
        type: formData.get("type")
      })
    });
    nodes.addItemForm.reset();
    formField(nodes.addItemForm, "type").value = "movie";
    await loadItems(state.selectedListId);
    showToast(t("itemAdded"));
  } catch (error) {
    showToast(error.message, true);
  }
});

async function removeItem(stremioId) {
  if (!state.selectedListId) return;
  try {
    await api(`/api/lists/${state.selectedListId}/items/${encodeURIComponent(stremioId)}`, {
      method: "DELETE"
    });
    await loadItems(state.selectedListId);
    showToast(t("itemRemoved"));
  } catch (error) {
    showToast(error.message, true);
  }
}

nodes.toggleEditList.addEventListener("click", () => {
  if (!state.selectedListId) return;
  state.editListOpen = !state.editListOpen;
  render();
});

bootstrap();
