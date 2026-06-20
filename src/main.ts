// main.ts — UI entry point for DSO Decompiler
// Uses the improved decompiler from internectual/dso-sharp

import {
  decompile as decompileDso,
  disassembleText,
  isDecompileSupported,
} from "./decompiler";
import {
  processUpload,
  GAME_NAMES,
  bytesToText,
  buildDecompiledOnly,
  buildDisassembly,
  type DsoFileResult,
  type FileKind,
  effectiveFileKind,
  detectFileKind,
} from "./dso";

// ─── State ───
let lastOutput = "";
let lastFileName = "";
let currentResults: DsoFileResult[] = [];
let selectedIndex = 0;

// ─── DOM refs ───
const dropZone = document.getElementById("drop-zone")!;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const engineSelect = document.getElementById("engine-select") as HTMLSelectElement;
const outputEl = document.getElementById("output")!;
const statusEl = document.getElementById("status")!;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const copyBtn = document.getElementById("copy-btn") as HTMLButtonElement;
const tabsEl = document.getElementById("tabs")!;
const fileListEl = document.getElementById("file-list")!;
const layoutEl = document.getElementById("layout")!;
const versionCardEl = document.getElementById("version-card")!;

// ─── File handling ───
dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) handleFile(file);
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer?.files[0];
  if (file) handleFile(file);
});

["dragover", "drop"].forEach((evt) => {
  document.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

async function handleFile(file: File) {
  statusEl.textContent = "Processing…";
  outputEl.innerHTML = "";
  outputEl.classList.remove("error");
  downloadBtn.disabled = true;
  lastOutput = "";

  try {
    const results = await processUpload(file);
    currentResults = results;
    selectedIndex = 0;
    layoutEl.style.display = "grid";
    renderFileList();
    renderResult(results[0]);
  } catch (e: any) {
    outputEl.textContent = `Error: ${e.message || String(e)}`;
    outputEl.classList.add("error");
    statusEl.textContent = "Failed";
  }
}

// ─── Render file list ───
function renderFileList() {
  fileListEl.innerHTML = "";
  currentResults.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = `file-item ${i === selectedIndex ? "selected" : ""}`;
    div.addEventListener("click", () => {
      selectedIndex = i;
      renderFileList();
      renderResult(r);
    });

    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = r.name;
    div.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "file-meta";
    const game =
      r.candidates.length === 1
        ? GAME_NAMES[r.candidates[0]]
        : r.candidates.length > 1
          ? `Ambiguous: ${r.candidates.map((c) => GAME_NAMES[c]).join(" | ")}`
          : r.version !== null
            ? `v${r.version} (unknown)`
            : "Not a DSO";
    meta.textContent = `${r.size.toLocaleString()} bytes · ${game}`;
    div.appendChild(meta);

    fileListEl.appendChild(div);
  });
}

// ─── Render result ───
function renderResult(result: DsoFileResult) {
  const kind = effectiveFileKind(result.name, result.bytes);

  // Render version card
  renderVersionCard(result, kind);

  // Build tabs
  tabsEl.innerHTML = "";
  const tabs: { id: string; label: string; text: string; isError?: boolean }[] = [];

  if (kind.kind === "dso") {
    const decompiled = buildDecompiledOnly(result, result.bytes);
    tabs.push({
      id: "decompiled",
      label: "Decompiled",
      text: decompiled.text,
      isError: !decompiled.ok,
    });
    const disasm = buildDisassembly(result.bytes);
    tabs.push({
      id: "disasm",
      label: "Disassembly",
      text: disasm.text,
      isError: !disasm.ok,
    });
  } else if (kind.kind === "text" && result.bytes) {
    tabs.push({ id: "raw", label: "Content", text: bytesToText(result.bytes) });
  } else if (kind.kind === "binary" && result.bytes) {
    tabs.push({ id: "raw", label: "Hex", text: renderHexFull(result.bytes) });
  }

  if (tabs.length === 0) {
    outputEl.innerHTML = '<div class="empty-state">No preview available</div>';
    statusEl.textContent = result.error || "Unsupported file";
    return;
  }

  // Render tab buttons
  tabs.forEach((tab, i) => {
    const btn = document.createElement("button");
    btn.className = `tab-btn ${i === 0 ? "active" : ""}`;
    btn.textContent = tab.label;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTabContent(tab);
    });
    tabsEl.appendChild(btn);
  });

  renderTabContent(tabs[0]);
}

function renderVersionCard(result: DsoFileResult, kind: FileKind) {
  let gameDisplay = "—";
  if (result.version !== null) {
    if (result.candidates.length === 1) {
      gameDisplay = GAME_NAMES[result.candidates[0]];
    } else if (result.candidates.length > 1) {
      gameDisplay = result.candidates.map((c) => GAME_NAMES[c]).join(" · ");
    } else {
      gameDisplay = `Unknown (version ${result.version})`;
    }
  }

  versionCardEl.innerHTML = `
    <div class="version-card">
      <div class="label">Detected game</div>
      <div class="game-name">${gameDisplay}</div>
      <div class="version-num">DSO version ${result.version ?? "—"} · ${result.size.toLocaleString()} bytes</div>
      ${result.error ? `<div style="color:var(--error);font-size:0.8em;margin-top:4px;">${result.error}</div>` : ""}
    </div>
  `;
}

function renderTabContent(tab: { id: string; label: string; text: string; isError?: boolean }) {
  lastOutput = tab.text;
  lastFileName = downloadName(currentResults[selectedIndex]?.name || "output");
  outputEl.textContent = tab.text;
  outputEl.className = tab.isError ? "error" : "";
  downloadBtn.disabled = false;

  const result = currentResults[selectedIndex];
  const kind = effectiveFileKind(result.name, result.bytes);
  let status = "";
  if (kind.kind === "dso") {
    const decompiled = buildDecompiledOnly(result, result.bytes);
    const stats = decompiled.ok ? `(${decompiled.text.split("\n").length} lines)` : "";
    status = tab.isError ? `Decompilation failed ${stats}` : `Decompiled TorqueScript ${stats}`;
  } else if (kind.kind === "text") {
    status = `Text file (${tab.text.split("\n").length} lines)`;
  } else if (kind.kind === "binary") {
    status = `Binary file (${result.size.toLocaleString()} bytes)`;
  } else if (kind.kind === "image") {
    status = "Image file";
  }
  statusEl.textContent = status;
}

// ─── Download ───
downloadBtn.addEventListener("click", () => {
  if (!lastOutput) return;
  const ext = lastFileName.endsWith(".dso")
    ? tabId() === "disasm" ? ".disasm" : ".cs"
    : "";
  downloadText(lastOutput, lastFileName + ext);
});

function tabId(): string {
  const active = document.querySelector(".tab-btn.active");
  return active?.textContent === "Disassembly" ? "disasm" : "decompiled";
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadName(name: string): string {
  return name.replace(/\.dso$/i, "");
}

function renderHexFull(bytes: Uint8Array): string {
  const lines: string[] = [];
  const max = Math.min(bytes.length, 4096);
  for (let i = 0; i < max; i += 16) {
    const row = bytes.slice(i, i + 16);
    const hex = Array.from(row).map((b) => b.toString(16).padStart(2, "0")).join(" ");
    const ascii = Array.from(row)
      .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
      .join("");
    lines.push(`${i.toString(16).padStart(8, "0")}  ${hex.padEnd(48)}  ${ascii}`);
  }
  if (bytes.length > max) lines.push(`… (${bytes.length - max} more bytes)`);
  return lines.join("\n");
}

// ─── Copy button ───
copyBtn.addEventListener("click", () => {
  if (!lastOutput) return;
  navigator.clipboard.writeText(lastOutput).catch(() => {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = lastOutput;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
});

// ─── Engine select (legacy — new code auto-detects) ───
engineSelect.addEventListener("change", () => {
  if (currentResults.length > 0) {
    renderResult(currentResults[selectedIndex]);
  }
});
