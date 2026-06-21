// main.ts — UI entry point for DSO Decompiler

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
let dsoFilter = false;

// ─── DOM refs ───
const dropZone = document.getElementById("drop-zone")!;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const engineSelect = document.getElementById("engine-select") as HTMLSelectElement;
const panelBody = document.getElementById("panel-body")!;
const statusEl = document.getElementById("status")!;
const downloadBtn = document.getElementById("download-btn") as HTMLButtonElement;
const copyBtn = document.getElementById("copy-btn") as HTMLButtonElement;
const tabsEl = document.getElementById("tabs")!;
const fileListEl = document.getElementById("file-list")!;
const layoutEl = document.getElementById("layout")!;
const versionCardEl = document.getElementById("version-card")!;
const controlsEl = document.getElementById("controls")!;
const dsoFilterEl = document.getElementById("dso-filter") as HTMLInputElement;
const sidebarEl = document.getElementById("sidebar")!;
const resizeHandle = document.getElementById("resize-handle")!;

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
  panelBody.innerHTML = "";
  downloadBtn.disabled = true;
  lastOutput = "";

  try {
    const results = await processUpload(file);
    currentResults = results;
    selectedIndex = 0;
    layoutEl.classList.add("active");
    controlsEl.style.display = "flex";
    renderFileList();
    renderResult(results[0]);
  } catch (e: any) {
    panelBody.innerHTML = `<div class="code-output"><div class="line-nums"></div><div class="code-content error">Error: ${e.message || String(e)}</div></div>`;
    statusEl.textContent = "Failed";
  }
}

// ─── DSO filter ───
dsoFilterEl.addEventListener("change", () => {
  dsoFilter = dsoFilterEl.checked;
  renderFileList();
});

// ─── Resize handle ───
let isResizing = false;
resizeHandle.addEventListener("mousedown", (e) => {
  isResizing = true;
  e.preventDefault();
});
document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;
  const newWidth = e.clientX;
  if (newWidth >= 160 && newWidth <= 500) {
    sidebarEl.style.width = newWidth + "px";
  }
});
document.addEventListener("mouseup", () => { isResizing = false; });

// ─── Render file list ───
function renderFileList() {
  fileListEl.innerHTML = "";
  let visibleIndex = 0;
  currentResults.forEach((r, i) => {
    const isDso = r.version !== null;
    if (dsoFilter && !isDso) return;

    const div = document.createElement("div");
    div.className = `file-item ${i === selectedIndex ? "selected" : ""} ${!isDso ? "non-dso" : ""}`;
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
            : "Not a .dso file";
    meta.textContent = `${r.size.toLocaleString()} bytes · ${game}`;
    div.appendChild(meta);

    fileListEl.appendChild(div);
    visibleIndex++;
  });

  if (visibleIndex === 0) {
    fileListEl.innerHTML = '<div class="empty-state" style="padding:20px;">No .dso files</div>';
  }
}

// ─── Render result ───
function renderResult(result: DsoFileResult) {
  const kind = effectiveFileKind(result.name, result.bytes);

  // Render version card (hide for non-DSO files)
  if (kind.kind === "dso" && result.version !== null) {
    renderVersionCard(result);
  } else {
    versionCardEl.innerHTML = "";
  }

  // Build tabs
  tabsEl.innerHTML = "";
  const tabs: { id: string; label: string }[] = [];

  if (kind.kind === "dso") {
    tabs.push({ id: "decompiled", label: "Decompiled" });
    tabs.push({ id: "disasm", label: "Disassembly" });
  } else if (kind.kind === "text" && result.bytes) {
    tabs.push({ id: "raw", label: "Content" });
  } else if (kind.kind === "image" && result.bytes) {
    tabs.push({ id: "image", label: "Image" });
  } else if (kind.kind === "audio" && result.bytes) {
    tabs.push({ id: "audio", label: "Audio" });
  } else if (kind.kind === "binary" && result.bytes) {
    tabs.push({ id: "raw", label: "Hex" });
  }

  if (tabs.length === 0) {
    panelBody.innerHTML = '<div class="empty-state">No preview available</div>';
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
      renderTabContent(tab.id, result, kind);
    });
    tabsEl.appendChild(btn);
  });

  renderTabContent(tabs[0].id, result, kind);
}

function renderVersionCard(result: DsoFileResult) {
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

function renderTabContent(tabId: string, result: DsoFileResult, kind: FileKind) {
  if (kind.kind === "dso") {
    if (tabId === "decompiled") {
      const decompiled = buildDecompiledOnly(result, result.bytes);
      if (decompiled.ok) {
        renderCodeOutput(decompiled.text, false);
        statusEl.textContent = `Decompiled TorqueScript (${decompiled.text.split("\n").length} lines)`;
      } else {
        renderCodeOutput(decompiled.text, true);
        statusEl.textContent = "Decompilation failed";
      }
      lastOutput = decompiled.text;
    } else if (tabId === "disasm") {
      const disasm = buildDisassembly(result.bytes);
      if (disasm.ok) {
        renderCodeOutput(disasm.text, false);
        statusEl.textContent = `Disassembly (${disasm.text.split("\n").length} lines)`;
      } else {
        renderCodeOutput(disasm.text, true);
        statusEl.textContent = "Disassembly failed";
      }
      lastOutput = disasm.text;
    }
    lastFileName = downloadName(result.name || "output") + (tabId === "disasm" ? ".disasm" : ".cs");
    downloadBtn.disabled = false;
  } else if (kind.kind === "text" && result.bytes) {
    const text = bytesToText(result.bytes);
    renderCodeOutput(text, false, kind.language);
    statusEl.textContent = `Text file (${text.split("\n").length} lines)`;
    lastOutput = text;
    lastFileName = downloadName(result.name || "output");
    downloadBtn.disabled = false;
  } else if (kind.kind === "image" && result.bytes) {
    renderImageOutput(result.bytes, kind.mime, result.name);
    statusEl.textContent = `Image file (${result.size.toLocaleString()} bytes)`;
    lastOutput = "";
    lastFileName = downloadName(result.name || "image");
    downloadBtn.disabled = false;
  } else if (kind.kind === "audio" && result.bytes) {
    renderAudioOutput(result.bytes, kind.mime, result.name);
    statusEl.textContent = `Audio file (${result.size.toLocaleString()} bytes)`;
    lastOutput = "";
    lastFileName = downloadName(result.name || "audio");
    downloadBtn.disabled = true;
  } else if (kind.kind === "binary" && result.bytes) {
    const hex = renderHexFull(result.bytes);
    renderCodeOutput(hex, false);
    statusEl.textContent = `Binary file (${result.size.toLocaleString()} bytes)`;
    lastOutput = hex;
    lastFileName = downloadName(result.name || "output") + ".hex";
    downloadBtn.disabled = false;
  }
}

// ─── Code output with line numbers and syntax highlighting ───
function renderCodeOutput(text: string, isError: boolean, language?: string) {
  const lines = text.split("\n");
  const lineNumsHtml = lines.map((_, i) => `<span>${i + 1}</span>`).join("");

  let contentHtml: string;
  if (isError) {
    contentHtml = escapeHtml(text);
  } else if (language === "cpp" || !language) {
    contentHtml = lines.map(line => highlightLine(line)).join("\n");
  } else {
    contentHtml = escapeHtml(text);
  }

  panelBody.innerHTML = `
    <div class="code-output">
      <div class="line-nums">${lineNumsHtml}</div>
      <div class="code-content${isError ? " error" : ""}">${contentHtml}</div>
    </div>
  `;
}

// Token-based syntax highlighting — avoids nested spans
const KEYWORDS = new Set([
  'function','package','if','else','for','while','do','switch','case','default',
  'break','continue','return','new','datablock','singleton','foreach','in','or',
  'and','not','true','false','null','local','global','this','super','isObject',
  'isDefined','strLen','strPos','strSub','strCat','trim','ltrim','rtrim',
  'stripChars','firstWord','getWord','getWords','setWord','removeWord',
  'getWordCount','findFirstFile','findNextFile','fileExt','fileName','filePath',
  'exec','export','delete','schedule','echo','warn','error','activatePackage',
  'deactivatePackage','isPackage','getPackageList','nameToID','getTag',
  'getTaggedString','addTaggedString','containerBoxEmpty','containerCastRay',
  'containerSearchNext','containerSearchCurrRadius','containerSearchCurrDist',
  'vectorAdd','vectorSub','vectorCross','vectorDot','vectorLen','vectorDist',
  'vectorNormalize','vectorScale','vectorLerp','MatrixCreate','MatrixMulVector',
  'MatrixMulPoint','alxGetListenerf','alxListenerfv','alxGetSourcef','alxSourcefv',
  'alxPlay','alxStop','alxStopAll','alxCreateSource','setRandomSeed','getRandom',
  'getRandomF','spawnObject','createDataBlock','getName','getID','getClassName',
  'save','loadJournal','playJournal','addComment','setModPaths','getModPaths',
  'getBuildString','getSimTime','getRealTime','getTimeOfDay','setTimeOfDay',
  'isFile','isWriteableFileName','fileOpenForRead','fileOpenForWrite',
  'fileOpenForAppend','fileClose','fileReadLine','fileWriteLine','fileIsEOF',
  'fileGetPosition','fileSetPosition',
]);

function highlightLine(line: string): string {
  const out: string[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    // Whitespace
    if (line[i] === ' ' || line[i] === '\t') {
      let start = i;
      while (i < len && (line[i] === ' ' || line[i] === '\t')) i++;
      out.push(escapeHtml(line.slice(start, i)));
      continue;
    }

    // Line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      out.push(`<span class="cm">${escapeHtml(line.slice(i))}</span>`);
      break;
    }

    // Block comment start
    if (line[i] === '/' && line[i + 1] === '*') {
      let end = line.indexOf('*/', i + 2);
      if (end === -1) { out.push(`<span class="cm">${escapeHtml(line.slice(i))}</span>`); break; }
      out.push(`<span class="cm">${escapeHtml(line.slice(i, end + 2))}</span>`);
      i = end + 2;
      continue;
    }

    // Double-quoted string
    if (line[i] === '"') {
      let j = i + 1;
      while (j < len && line[j] !== '"') { if (line[j] === '\\') j++; j++; }
      if (j < len) j++; // include closing quote
      out.push(`<span class="str">${escapeHtml(line.slice(i, j))}</span>`);
      i = j;
      continue;
    }

    // Single-quoted string
    if (line[i] === "'") {
      let j = i + 1;
      while (j < len && line[j] !== "'") { if (line[j] === '\\') j++; j++; }
      if (j < len) j++;
      out.push(`<span class="str">${escapeHtml(line.slice(i, j))}</span>`);
      i = j;
      continue;
    }

    // Number
    if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < len && /[0-9.xXa-fA-F]/.test(line[j])) j++;
      out.push(`<span class="num">${line.slice(i, j)}</span>`);
      i = j;
      continue;
    }

    // Identifier or keyword
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < len && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word.toLowerCase())) {
        out.push(`<span class="kw">${word}</span>`);
      } else if (j < len && line[j] === '(') {
        out.push(`<span class="fn">${word}</span>`);
      } else {
        out.push(escapeHtml(word));
      }
      i = j;
      continue;
    }

    // Variable ($, %, @)
    if (line[i] === '$' || line[i] === '%' || line[i] === '@') {
      let j = i + 1;
      while (j < len && /[a-zA-Z0-9_]/.test(line[j])) j++;
      out.push(`<span class="var">${line.slice(i, j)}</span>`);
      i = j;
      continue;
    }

    // Operators and punctuation
    if ('=<>!+-*/%&|.,;:{}[]()'.includes(line[i])) {
      // Check for multi-char operators
      const two = line.slice(i, i + 2);
      if (['==','!=','<=','>=','+=','-=','*=','/=','%=','&&','||','::','..'].includes(two)) {
        out.push(`<span class="op">${two}</span>`);
        i += 2;
        continue;
      }
      const three = line.slice(i, i + 3);
      if (['>>=','<<='].includes(three)) {
        out.push(`<span class="op">${three}</span>`);
        i += 3;
        continue;
      }
      out.push(`<span class="op">${line[i]}</span>`);
      i++;
      continue;
    }

    // Anything else
    out.push(escapeHtml(line[i]));
    i++;
  }

  return out.join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Image output ───
function renderImageOutput(bytes: Uint8Array, mime: string, name: string) {
  // @ts-ignore BlobPart type compatibility
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  panelBody.innerHTML = `
    <div class="image-output">
      <img src="${url}" alt="${escapeHtml(name)}" />
    </div>
  `;
}

// ─── Audio output ───
function renderAudioOutput(bytes: Uint8Array, mime: string, name: string) {
  // @ts-ignore BlobPart type compatibility
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  panelBody.innerHTML = `
    <div class="audio-output">
      <div class="audio-filename">${escapeHtml(name)}</div>
      <audio controls src="${url}">Your browser does not support audio playback.</audio>
    </div>
  `;
}

// ─── Hex output ───
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

// ─── Copy button ───
copyBtn.addEventListener("click", () => {
  if (!lastOutput) return;
  navigator.clipboard.writeText(lastOutput).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = lastOutput;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  });
});

// ─── Engine select ───
engineSelect.addEventListener("change", () => {
  if (currentResults.length > 0) {
    renderResult(currentResults[selectedIndex]);
  }
});
