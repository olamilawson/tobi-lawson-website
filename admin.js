/**
 * Tobi Lawson — Editorial console.
 *
 * Every form on this page is generated from content-schema.js. There are no
 * hand-written field bindings, so a field cannot exist in the console without
 * also existing in storage, and vice versa. To add an editable section, add it
 * to the schema and put a `data-cms` attribute on the page element.
 */

import {
  GROUPS, COLLECTIONS, blankItem
} from "/content-schema.js";
import {
  loadContent, publish, seedDoc, normalize,
  esc, slugify, hashPasscode, verifyPasscode, isSupabaseConfigured
} from "/content-store.js";
import { subscribeToCloud } from "/supabase.js";

const AUTH_KEY = "tobi_admin_authenticated";

const state = {
  doc: null,
  dirty: false,
  activeTab: null,
  modal: null // { collectionId, index|null, draftSub: [] }
};

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Tab model — a tab is a group of singleton fields plus any collections bound to it
// ---------------------------------------------------------------------------

function tabs() {
  const list = GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    group: g,
    collections: COLLECTIONS.filter((c) => c.tab === g.id)
  }));
  list.push({ id: "access", label: "Access", group: null, collections: [] });
  list.push({ id: "cloud", label: "Cloud & Backup", group: null, collections: [] });
  return list;
}

// ---------------------------------------------------------------------------
// Field rendering
// ---------------------------------------------------------------------------

function fieldControl(field, value, idPrefix) {
  const id = `${idPrefix}__${field.key}`;
  const v = value ?? "";
  const help = field.help ? `<div class="admin-help meta">${esc(field.help)}</div>` : "";
  const req = field.required ? " required" : "";
  let control;

  switch (field.type) {
    case "textarea":
    case "prose":
      control = `<textarea id="${id}" class="admin-textarea" rows="${field.rows || 4}" data-field="${esc(field.key)}"${req}>${esc(v)}</textarea>`;
      break;

    case "select":
      control = `<select id="${id}" class="admin-input" data-field="${esc(field.key)}">
        ${field.options.map((o) => `<option value="${esc(o.value)}"${o.value === v ? " selected" : ""}>${esc(o.label)}</option>`).join("")}
      </select>`;
      break;

    case "image":
      control = `
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <input type="text" id="${id}" class="admin-input" data-field="${esc(field.key)}" value="${esc(v)}" style="flex: 1;" />
          <label class="admin-btn admin-btn-secondary" style="margin: 0; cursor: pointer; flex-shrink: 0;">
            Upload…
            <input type="file" accept="image/*" data-upload-for="${id}" style="display: none;" />
          </label>
        </div>
        <div style="margin-top: 0.75rem;">
          <img data-preview-for="${id}" src="${esc(v)}" alt="" style="max-height: 90px; border: 1px solid var(--line); display: ${v ? "block" : "none"};" />
        </div>`;
      break;

    case "url":
      control = `<input type="url" id="${id}" class="admin-input" data-field="${esc(field.key)}" value="${esc(v)}"${req} />`;
      break;

    case "email":
      control = `<input type="email" id="${id}" class="admin-input" data-field="${esc(field.key)}" value="${esc(v)}"${req} />`;
      break;

    default:
      control = `<input type="text" id="${id}" class="admin-input" data-field="${esc(field.key)}" value="${esc(v)}"${req} />`;
  }

  const hidden = field.showIf ? ' data-show-if="' + esc(JSON.stringify(field.showIf)) + '"' : "";
  return `<div class="admin-form-group"${hidden}>
    <label for="${id}" class="meta">${esc(field.label)}</label>
    ${control}
    ${help}
  </div>`;
}

/** Read every [data-field] control inside a container back into a plain object. */
function readFields(container) {
  const out = {};
  container.querySelectorAll("[data-field]").forEach((el) => {
    out[el.getAttribute("data-field")] = el.value;
  });
  return out;
}

/** Wire image pickers and conditional visibility inside a container. */
function bindFieldBehaviour(container) {
  container.querySelectorAll("[data-upload-for]").forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1.5 * 1024 * 1024) {
        toast("That image is over 1.5 MB. Please use a smaller file or paste a URL.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const target = $(input.getAttribute("data-upload-for"));
        if (target) {
          target.value = evt.target.result;
          target.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const preview = container.querySelector(`[data-preview-for="${input.getAttribute("data-upload-for")}"]`);
        if (preview) {
          preview.src = evt.target.result;
          preview.style.display = "block";
        }
        toast("Image attached. Save to apply it.");
      };
      reader.readAsDataURL(file);
    });
  });

  const applyConditionals = () => {
    container.querySelectorAll("[data-show-if]").forEach((group) => {
      const cond = JSON.parse(group.getAttribute("data-show-if"));
      const driver = container.querySelector(`[data-field="${cond.key}"]`);
      if (!driver) return;
      const value = driver.value;
      const visible = "notEquals" in cond ? value !== cond.notEquals : value === cond.equals;
      group.style.display = visible ? "" : "none";
    });
  };
  container.querySelectorAll("[data-field]").forEach((el) => {
    el.addEventListener("change", applyConditionals);
    el.addEventListener("input", () => { state.dirty = true; });
  });
  applyConditionals();
}

// ---------------------------------------------------------------------------
// Console rendering
// ---------------------------------------------------------------------------

function renderConsole() {
  const tabList = tabs();
  if (!state.activeTab) state.activeTab = tabList[0].id;

  $("adminTabs").innerHTML = tabList
    .map((t) => `<button class="admin-tab-btn${t.id === state.activeTab ? " active" : ""}" data-tab="${esc(t.id)}">${esc(t.label)}</button>`)
    .join("");

  $("adminPanels").innerHTML = tabList
    .map((t) => `<div class="admin-tab-content${t.id === state.activeTab ? " active" : ""}" data-panel="${esc(t.id)}">${renderPanel(t)}</div>`)
    .join("");

  $("adminTabs").querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.getAttribute("data-tab");
      renderConsole();
    });
  });

  bindPanels();
}

function renderPanel(tab) {
  if (tab.id === "access") return renderAccessPanel();
  if (tab.id === "cloud") return renderCloudPanel();

  const g = tab.group;
  const form = `
    <div class="admin-card" style="max-width: 100%;">
      <h2>${esc(g.heading)}</h2>
      <p>${esc(g.blurb)}</p>
      <form data-group="${esc(g.id)}">
        ${g.fields.map((f) => fieldControl(f, state.doc.settings[f.key], `set_${g.id}`)).join("")}
        <button type="submit" class="admin-btn" style="margin-top: 1rem;">Save ${esc(g.label)}</button>
      </form>
    </div>`;

  const lists = tab.collections.map(renderCollectionCard).join("");
  return form + lists;
}

function renderCollectionCard(col) {
  const items = state.doc.collections[col.id] || [];
  return `
    <div class="admin-card" style="max-width: 100%; margin-top: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
        <div>
          <h2>${esc(col.heading)}</h2>
          <p>${esc(col.blurb)}</p>
        </div>
        <button class="admin-btn" data-add="${esc(col.id)}" style="flex-shrink: 0;">+ Add ${esc(col.singular)}</button>
      </div>
      <div class="admin-list" style="display: grid; gap: 1rem; margin-top: 1.5rem;">
        ${items.length ? items.map((item, i) => renderCollectionRow(col, item, i, items.length)).join("")
                       : `<div class="meta" style="color: var(--text-muted); padding: 1.5rem 0;">Nothing here yet. Click “+ Add ${esc(col.singular)}”.</div>`}
      </div>
    </div>`;
}

function renderCollectionRow(col, item, index, total) {
  const sub = col.subCollection ? (item[col.subCollection.id] || []) : null;
  return `
    <div style="background: var(--bg); border: 1px solid var(--line); padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
      <div style="min-width: 0;">
        <span class="meta" style="color: var(--accent); display: block; margin-bottom: 0.25rem;">${esc(item[col.subtitleField] || "")}</span>
        <h4 style="font-size: 1.15rem; margin-bottom: 0.5rem;">${esc(item[col.titleField] || "Untitled")}</h4>
        <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.5;">${esc(item[col.bodyField] || "")}</p>
        ${sub ? `<div class="meta" style="margin-top: 0.5rem; color: var(--text-muted);">${sub.length} ${esc(col.subCollection.label.toLowerCase())}</div>` : ""}
        ${index === 0 && col.id === "books" ? `<div class="meta" style="margin-top: 0.5rem; color: var(--accent);">Featured on the books page</div>` : ""}
      </div>
      <div style="display: flex; gap: 0.5rem; flex-shrink: 0; align-items: center;">
        <button class="admin-btn admin-btn-secondary" data-move="${esc(col.id)}" data-index="${index}" data-dir="-1" ${index === 0 ? "disabled" : ""} title="Move up">↑</button>
        <button class="admin-btn admin-btn-secondary" data-move="${esc(col.id)}" data-index="${index}" data-dir="1" ${index === total - 1 ? "disabled" : ""} title="Move down">↓</button>
        <button class="admin-btn admin-btn-secondary" data-edit="${esc(col.id)}" data-index="${index}">Edit</button>
        <button class="admin-btn admin-btn-danger" data-delete="${esc(col.id)}" data-index="${index}">Delete</button>
      </div>
    </div>`;
}

function renderAccessPanel() {
  return `
    <div class="admin-card" style="max-width: 100%;">
      <h2>Console Passcode</h2>
      <p>Changing this takes effect on every device the next time it loads the console. The passcode itself is never stored — only a SHA-256 hash of it.</p>
      <form data-passcode-form>
        <div class="admin-form-group">
          <label for="newPasscode" class="meta">New Passcode</label>
          <input type="password" id="newPasscode" class="admin-input" autocomplete="new-password" minlength="8" required />
          <div class="admin-help meta">At least 8 characters.</div>
        </div>
        <div class="admin-form-group">
          <label for="confirmPasscode" class="meta">Confirm New Passcode</label>
          <input type="password" id="confirmPasscode" class="admin-input" autocomplete="new-password" required />
        </div>
        <button type="submit" class="admin-btn">Change Passcode</button>
      </form>
      <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line);">
        <div class="meta" style="color: var(--text-muted); line-height: 1.6;">
          Note: the passcode gates this console, not the database. Because the site talks to Supabase
          with a public key, anyone who reads the page source can still write to your content tables.
          Locking that down needs Supabase Auth with a row-level-security policy on <code>site_content</code>.
        </div>
      </div>
    </div>`;
}

function renderCloudPanel() {
  const stamp = state.doc.updatedAt && state.doc.updatedAt !== new Date(0).toISOString()
    ? new Date(state.doc.updatedAt).toLocaleString()
    : "never";
  return `
    <div class="admin-card" style="max-width: 100%;">
      <h2>Cloud & Backup</h2>
      <p>Cloud sync: <strong>${isSupabaseConfigured ? "connected to Supabase" : "not configured — this device only"}</strong>. Last published: <strong>${esc(stamp)}</strong>.</p>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem;">
        <button class="admin-btn admin-btn-secondary" data-export>Download JSON Backup</button>
        <label class="admin-btn admin-btn-secondary" style="margin: 0; cursor: pointer;">
          Restore From Backup…
          <input type="file" accept="application/json" data-import style="display: none;" />
        </label>
        <button class="admin-btn admin-btn-secondary" data-repush>Re-publish Everything</button>
        <button class="admin-btn admin-btn-danger" data-reset>Reset To Factory Defaults</button>
      </div>
      <div class="admin-help meta" style="margin-top: 1.5rem;">
        “Re-publish everything” pushes this device's copy over the cloud copy — useful if two devices
        have drifted apart and you know which one is right.
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Panel behaviour
// ---------------------------------------------------------------------------

function bindPanels() {
  const root = $("adminPanels");
  bindFieldBehaviour(root);

  root.querySelectorAll("form[data-group]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      Object.assign(state.doc.settings, readFields(form));
      await save(`${GROUPS.find((g) => g.id === form.getAttribute("data-group")).label} saved.`);
    });
  });

  root.querySelectorAll("[data-add]").forEach((btn) =>
    btn.addEventListener("click", () => openItemModal(btn.getAttribute("data-add"), null)));

  root.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () =>
      openItemModal(btn.getAttribute("data-edit"), Number(btn.getAttribute("data-index")))));

  root.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const col = COLLECTION(btn.getAttribute("data-delete"));
      const index = Number(btn.getAttribute("data-index"));
      const item = state.doc.collections[col.id][index];
      if (!confirm(`Delete “${item[col.titleField] || col.singular}”? This cannot be undone.`)) return;
      state.doc.collections[col.id].splice(index, 1);
      await save(`${col.singular} deleted.`);
    }));

  root.querySelectorAll("[data-move]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const col = COLLECTION(btn.getAttribute("data-move"));
      const index = Number(btn.getAttribute("data-index"));
      const target = index + Number(btn.getAttribute("data-dir"));
      const items = state.doc.collections[col.id];
      if (target < 0 || target >= items.length) return;
      [items[index], items[target]] = [items[target], items[index]];
      await save("Order updated.");
    }));

  const passcodeForm = root.querySelector("[data-passcode-form]");
  if (passcodeForm) {
    passcodeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const next = $("newPasscode").value;
      if (next !== $("confirmPasscode").value) return toast("Those two passcodes don't match.");
      if (next.length < 8) return toast("Use at least 8 characters.");
      state.doc.security.passcodeHash = await hashPasscode(next);
      await save("Passcode changed. Use the new one next time you sign in.");
    });
  }

  const exportBtn = root.querySelector("[data-export]");
  if (exportBtn) exportBtn.addEventListener("click", exportBackup);

  const importInput = root.querySelector("[data-import]");
  if (importInput) importInput.addEventListener("change", importBackup);

  const repush = root.querySelector("[data-repush]");
  if (repush) repush.addEventListener("click", async () => {
    if (!confirm("Overwrite the cloud copy with this device's content?")) return;
    await save("Re-published to the cloud.");
  });

  const reset = root.querySelector("[data-reset]");
  if (reset) reset.addEventListener("click", async () => {
    if (!confirm("Reset ALL content to factory defaults? Download a backup first if you're unsure.")) return;
    const hash = state.doc.security.passcodeHash; // don't lock yourself out
    state.doc = seedDoc();
    state.doc.security.passcodeHash = hash;
    await save("Content reset to factory defaults.");
  });
}

const COLLECTION = (id) => COLLECTIONS.find((c) => c.id === id);

// ---------------------------------------------------------------------------
// Add / edit modal
// ---------------------------------------------------------------------------

function openItemModal(collectionId, index) {
  const col = COLLECTION(collectionId);
  const existing = index === null ? null : state.doc.collections[col.id][index];
  const item = existing ? { ...existing } : blankItem(col.fields);

  state.modal = {
    collectionId,
    index,
    draftSub: col.subCollection ? JSON.parse(JSON.stringify(existing?.[col.subCollection.id] || [])) : null
  };

  $("modalTitle").textContent = `${existing ? "Edit" : "Add"} ${col.singular}`;
  $("modalBody").innerHTML =
    col.fields.map((f) => fieldControl(f, item[f.key], "item")).join("") +
    (col.subCollection ? renderSubEditor(col.subCollection, state.modal.draftSub) : "");

  bindFieldBehaviour($("modalBody"));
  if (col.subCollection) bindSubEditor(col.subCollection);

  $("itemModal").style.display = "flex";
  const first = $("modalBody").querySelector("input, textarea, select");
  if (first) first.focus();
}

function closeItemModal() {
  $("itemModal").style.display = "none";
  state.modal = null;
}

function renderSubEditor(sub, items) {
  return `
    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.2rem;">${esc(sub.label)}</h3>
        <button type="button" class="admin-btn admin-btn-secondary" data-sub-add>+ Add ${esc(sub.singular)}</button>
      </div>
      <div data-sub-list style="display: grid; gap: 1rem;">
        ${items.map((item, i) => renderSubRow(sub, item, i)).join("")}
      </div>
    </div>`;
}

function renderSubRow(sub, item, index) {
  return `
    <div data-sub-row="${index}" style="border: 1px solid var(--line); padding: 1rem; background: var(--bg);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <span class="meta" style="color: var(--text-muted);">${esc(sub.singular)} ${index + 1}</span>
        <div style="display: flex; gap: 0.4rem;">
          <button type="button" class="admin-btn admin-btn-secondary" data-sub-move="${index}" data-dir="-1" title="Move up">↑</button>
          <button type="button" class="admin-btn admin-btn-secondary" data-sub-move="${index}" data-dir="1" title="Move down">↓</button>
          <button type="button" class="admin-btn admin-btn-danger" data-sub-remove="${index}">Remove</button>
        </div>
      </div>
      <input type="hidden" data-sub-id value="${esc(item.id || "")}" />
      ${sub.fields.map((f) => fieldControl(f, item[f.key], `sub${index}`)).join("")}
    </div>`;
}

/** Read the sub-rows out of the DOM so edits survive add/remove/reorder. */
function captureSub(sub) {
  const rows = [];
  $("modalBody").querySelectorAll("[data-sub-row]").forEach((row) => {
    // Carry the existing id through, so renaming a chapter doesn't change its URL.
    const item = { id: row.querySelector("[data-sub-id]")?.value || "" };
    sub.fields.forEach((f) => {
      const el = row.querySelector(`[data-field="${f.key}"]`);
      item[f.key] = el ? el.value : (f.default ?? "");
    });
    if (!item.id) delete item.id; // let normalize() mint one from the title
    rows.push(item);
  });
  return rows;
}

function bindSubEditor(sub) {
  const body = $("modalBody");
  const refresh = () => {
    const list = body.querySelector("[data-sub-list]");
    list.innerHTML = state.modal.draftSub.map((item, i) => renderSubRow(sub, item, i)).join("");
    bindFieldBehaviour(list);
    bindSubButtons();
  };

  const bindSubButtons = () => {
    body.querySelectorAll("[data-sub-remove]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.modal.draftSub = captureSub(sub);
        state.modal.draftSub.splice(Number(btn.getAttribute("data-sub-remove")), 1);
        refresh();
      }));

    body.querySelectorAll("[data-sub-move]").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.modal.draftSub = captureSub(sub);
        const i = Number(btn.getAttribute("data-sub-move"));
        const t = i + Number(btn.getAttribute("data-dir"));
        if (t < 0 || t >= state.modal.draftSub.length) return;
        [state.modal.draftSub[i], state.modal.draftSub[t]] = [state.modal.draftSub[t], state.modal.draftSub[i]];
        refresh();
      }));
  };

  const addBtn = body.querySelector("[data-sub-add]");
  if (addBtn) addBtn.addEventListener("click", () => {
    state.modal.draftSub = captureSub(sub);
    state.modal.draftSub.push(blankItem(sub.fields));
    refresh();
  });

  bindSubButtons();
}

async function submitItemModal(e) {
  e.preventDefault();
  const { collectionId, index } = state.modal;
  const col = COLLECTION(collectionId);

  // Only read the top-level fields, not the sub-rows, which share [data-field].
  const values = {};
  col.fields.forEach((f) => {
    const el = $("modalBody").querySelector(`#item__${f.key}`);
    if (el) values[f.key] = el.value;
  });

  if (!String(values[col.titleField] || "").trim()) {
    return toast(`${col.singular} needs a ${col.titleField}.`);
  }

  const items = state.doc.collections[col.id];
  const existing = index === null ? null : items[index];

  const item = {
    ...(existing || {}),
    ...values,
    id: existing?.id || uniqueId(items, slugify(values[col.titleField]))
  };

  if (col.subCollection) item[col.subCollection.id] = captureSub(col.subCollection);

  // Give new essays a working URL if one wasn't supplied.
  if (col.id === "posts" && !String(item.url || "").trim()) {
    item.url = `/writing/post#id=${encodeURIComponent(item.id)}`;
  }

  if (existing) items[index] = item;
  else items.unshift(item);

  closeItemModal();
  await save(`${col.singular} saved.`);
}

function uniqueId(items, base) {
  let id = base;
  let n = 2;
  while (items.some((i) => i.id === id)) id = `${base}-${n++}`;
  return id;
}

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

async function save(successMessage) {
  const result = await publish(state.doc);
  state.dirty = false;
  renderConsole();

  if (result.success) toast(successMessage);
  else if (result.offline) toast("Saved on this device. Cloud sync isn't configured.");
  else toast(`Saved on this device, but the cloud rejected it: ${result.error?.message || "check the site_content table exists"}`);
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

function exportBackup() {
  const blob = new Blob([JSON.stringify(state.doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tobi-lawson-content-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Backup downloaded.");
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    let parsed;
    try {
      parsed = JSON.parse(evt.target.result);
    } catch {
      return toast("That file isn't valid JSON.");
    }
    if (!parsed || !parsed.settings) return toast("That doesn't look like a site backup.");
    if (!confirm("Replace all current content with this backup?")) return;

    const hash = state.doc.security.passcodeHash;
    state.doc = normalize(parsed);
    if (!parsed.security?.passcodeHash) state.doc.security.passcodeHash = hash;
    await save("Backup restored.");
  };
  reader.readAsText(file);
  e.target.value = "";
}

// ---------------------------------------------------------------------------
// Auth & boot
// ---------------------------------------------------------------------------

async function openConsole() {
  $("authOverlay").style.display = "none";
  $("adminConsole").style.display = "block";

  const pill = $("cloudStatusIndicator");
  if (pill) {
    pill.className = isSupabaseConfigured ? "cloud-status-pill meta" : "cloud-status-pill offline meta";
    pill.textContent = isSupabaseConfigured ? "☁️ Cloud sync active" : "💾 This device only";
  }

  renderConsole();

  subscribeToCloud(async () => {
    // Don't yank content out from under an open modal or a half-typed form.
    if (state.modal || state.dirty) return;
    state.doc = await loadContent() || state.doc;
    renderConsole();
    toast("Synced changes from another device.");
  });
}

async function init() {
  state.doc = (await loadContent()) || seedDoc();

  const authForm = $("authForm");
  const input = $("passcodeInput");
  const error = $("authError");

  if (sessionStorage.getItem(AUTH_KEY) === "true") {
    await openConsole();
  }

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = await verifyPasscode(input.value, state.doc);
    if (!ok) {
      error.style.display = "block";
      input.value = "";
      input.focus();
      return;
    }
    error.style.display = "none";
    sessionStorage.setItem(AUTH_KEY, "true");
    await openConsole();
  });

  $("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    $("adminConsole").style.display = "none";
    $("authOverlay").style.display = "flex";
    $("passcodeInput").value = "";
  });

  $("itemForm").addEventListener("submit", submitItemModal);
  $("modalCancel").addEventListener("click", closeItemModal);
  $("modalClose").addEventListener("click", closeItemModal);
  $("itemModal").addEventListener("click", (e) => {
    if (e.target === $("itemModal")) closeItemModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.modal) closeItemModal();
  });

  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) { e.preventDefault(); e.returnValue = ""; }
  });
}

let toastTimer;
function toast(message) {
  const el = $("toastNotification");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
