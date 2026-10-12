(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");
  const C = window.CONTENT, S = window.Scoring;

  // ---------- storage (always guarded) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const state = {
    track: store.get("elt_track", "desk"),
    accent: store.get("elt_accent", "random"),
    rate: store.get("elt_rate", 1),
    noise: store.get("elt_noise", "off"),
    name: store.get("elt_name", "")
  };
  const save = () => { ["track", "accent", "rate", "noise", "name"].forEach(k => store.set("elt_" + k, state[k])); };
  const history = () => store.get("elt_history", []);
  function record(entry) {
    const h = history();
    h.push(Object.assign({ at: new Date().toISOString(), track: state.track, learner: state.name }, entry));
    store.set("elt_history", h.slice(-500));
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = x => Math.round(x * 100) + "%";
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ---------- voices ----------
  let voices = [];
  function loadVoices() {
    if (!("speechSynthesis" in window)) return;
    voices = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang));
  }
  if ("speechSynthesis" in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = () => { loadVoices(); if (location.hash === "#home" || !location.hash) render(); };
  }
  const tag = v => v.lang.replace("_", "-");
  function accentOf(v) {
    const t = tag(v);
    return ACCENTS[t] || ACCENTS[Object.keys(ACCENTS).find(k => k.toLowerCase() === t.toLowerCase())] || t;
  }
  function accentList() {
    const m = {};
    voices.forEach(v => { m[tag(v)] = accentOf(v); });
    return Object.entries(m).sort((a, b) => a[1].localeCompare(b[1]));
  }
  function chooseVoice() {
    if (!voices.length) return null;
    if (state.accent === "random") return pick(voices);
    const pool = voices.filter(v => tag(v) === state.accent);
    return pool.length ? pick(pool) : pick(voices);
  }

  // ---------- background noise (Web Audio) ----------
  let actx = null, noiseNode = null;
  function startNoise() {
    if (state.noise === "off") return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const len = actx.sampleRate * 2, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = state.noise === "office" ? last * 3.5 : w; }
      const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      const filt = actx.createBiquadFilter();
      filt.type = state.noise === "line" ? "bandpass" : "lowpass";
      filt.frequency.value = state.noise === "line" ? 1800 : 900;
      const g = actx.createGain(); g.gain.value = state.noise === "line" ? 0.05 : 0.18;
      src.connect(filt).connect(g).connect(actx.destination);
      src.start(); noiseNode = src;
    } catch (e) { noiseNode = null; }
  }
  function stopNoise() { try { noiseNode && noiseNode.stop(); } catch (e) {} noiseNode = null; }

  // Speech playback. Browsers drop a new utterance if it is queued right after cancel(),
  // online voices (Edge) sometimes never start, and long utterances can cut off in Chrome.
  // So: wait after cancelling, speak sentence by sentence, keep references alive,
  // and retry once (then fall back to an offline voice of the same accent) if nothing starts.
  let playId = 0, live = [], last = { text: null, accent: null, voice: null };
  const statusEl = () => document.getElementById("plays");
  const playBtn = () => document.getElementById("play");
  function setPlaying(on) { const b = playBtn(); if (b) { b.disabled = on; b.textContent = on ? "Playing…" : (b.dataset.label || "▶ Play"); } }

  function speak(text, onEnd) {
    if (!("speechSynthesis" in window)) { const pl = statusEl(); if (pl) pl.textContent = "This browser can't play speech. Please use Chrome or Edge."; return null; }
    const b = playBtn(); if (b && !b.dataset.label) b.dataset.label = b.textContent;
    // Same text and same accent setting: reuse the voice so replays sound identical.
    let v = (last.text === text && last.accent === state.accent && last.voice) ? last.voice : chooseVoice();
    last = { text, accent: state.accent, voice: v };
    const id = ++playId;
    const chunks = text.match(/[^.!?]+[.!?]*/g).map(s => s.trim()).filter(Boolean);
    const wasBusy = speechSynthesis.speaking || speechSynthesis.pending;
    speechSynthesis.cancel(); stopNoise();
    setPlaying(true);
    let started = false, retried = false;

    function finish() { if (id !== playId) return; live = []; stopNoise(); setPlaying(false); onEnd && onEnd(); }
    function run(voice) {
      if (id !== playId) return;
      speechSynthesis.resume();
      live = chunks.map((c, i) => {
        const u = new SpeechSynthesisUtterance(c);
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        u.rate = state.rate;
        u.onstart = () => { if (id !== playId) return; if (!started) { started = true; startNoise(); } };
        if (i === chunks.length - 1) u.onend = finish;
        u.onerror = e => { if (id !== playId || e.error === "interrupted" || e.error === "canceled") return; finish(); };
        return u;
      });
      live.forEach(u => speechSynthesis.speak(u));
      // Watchdog: if nothing has started in 4 s, retry once, then try an offline voice.
      setTimeout(() => {
        if (id !== playId || started) return;
        speechSynthesis.cancel();
        if (!retried) {
          retried = true;
          const offline = voice && !voice.localService && voices.find(x => tag(x) === tag(voice) && x.localService);
          const next = offline || voice;
          if (offline) last.voice = offline;
          const pl = statusEl(); if (pl) pl.textContent = offline ? "Online voice didn't respond, using an offline voice…" : "Retrying…";
          setTimeout(() => run(next), 300);
        } else {
          const pl = statusEl(); if (pl) pl.textContent = "The voice didn't start. Pick another accent or reload the page.";
          playId++; live = []; setPlaying(false);
        }
      }, 4000);
    }
    setTimeout(() => run(v), wasBusy ? 350 : 60);
    return v ? accentOf(v) : "Default";
  }
  function stopAudio() { playId++; live = []; if ("speechSynthesis" in window) speechSynthesis.cancel(); stopNoise(); setPlaying(false); }

  // ---------- shared UI ----------
  function settingsBar() {
    const accents = accentList();
    const have = t => accents.some(([tg]) => tg.toLowerCase() === t);
    const missing = ["en-gb", "en-au"].filter(t => !have(t)).map(t => t === "en-gb" ? "British" : "Australian");
    const tip = missing.length ? `<p class="warn">This browser has no ${missing.join(" or ")} voice. For more accents, open this page in Microsoft Edge (widest choice) or Chrome on a laptop.</p>` : "";
    return `${tip}
      <div class="settings">
        <label>Accent
          <select id="set-accent">
            <option value="random">Mixed (random)</option>
            ${accents.map(([t, n]) => `<option value="${t}" ${state.accent === t ? "selected" : ""}>${esc(n)} (${t})</option>`).join("")}
          </select>
        </label>
        <label>Speed <span id="rate-val">${state.rate.toFixed(2)}×</span>
          <input id="set-rate" type="range" min="0.7" max="1.4" step="0.05" value="${state.rate}">
        </label>
        <label>Background
          <select id="set-noise">
            <option value="off" ${state.noise === "off" ? "selected" : ""}>Quiet</option>
            <option value="office" ${state.noise === "office" ? "selected" : ""}>Busy office</option>
            <option value="line" ${state.noise === "line" ? "selected" : ""}>Noisy phone line</option>
          </select>
        </label>
      </div>`;
  }
  function bindSettings() {
    const a = $("#set-accent"), r = $("#set-rate"), n = $("#set-noise");
    if (a) a.onchange = () => { stopAudio(); last.voice = null; state.accent = a.value; save(); };
    if (r) r.oninput = () => { state.rate = +r.value; $("#rate-val").textContent = state.rate.toFixed(2) + "×"; save(); };
    if (n) n.onchange = () => { state.noise = n.value; save(); };
  }
  const back = `<a class="back" href="#home">← All exercises</a>`;

  // ---------- home ----------
  function home() {
    const h = history().filter(x => x.track === state.track);
    const avg = m => { const r = h.filter(x => x.mode === m); return r.length ? pct(r.reduce((s, x) => s + x.accuracy, 0) / r.length) : "—"; };
    const noVoices = ("speechSynthesis" in window) && voices.length === 0;
    app.innerHTML = `
      <section class="hero">
        <h1>Hear it right. Type it right.</h1>
        <p>Short daily drills for typing speed, listening across English accents, and capturing the facts that matter, for support desk jobs, interviews and college.</p>
        <div class="who">
          <label>Your name (optional, for your results file)
            <input id="learner" value="${esc(state.name)}" placeholder="e.g. Ravi K" maxlength="40">
          </label>
          <div class="track" role="radiogroup" aria-label="Choose your track">
            <button data-track="desk" class="${state.track === "desk" ? "on" : ""}">Service desk</button>
            <button data-track="student" class="${state.track === "student" ? "on" : ""}">Student</button>
          </div>
        </div>
      </section>
      ${noVoices ? `<p class="warn">No English voices found on this device yet. Listening drills work best in Chrome or Edge on a laptop.</p>` : ""}
      <section class="cards">
        <a class="card" href="#typing">
          <span class="lvl">Level 1</span><h2>Typing drill</h2>
          <p>Type a real-world passage. Speed counts, but accuracy counts more.</p>
          <span class="stat">Avg accuracy: <b>${avg("typing")}</b></span>
        </a>
        <a class="card" href="#dictation">
          <span class="lvl">Level 2</span><h2>Listen &amp; type</h2>
          <p>Hear one sentence in an English accent. Type exactly what was said.</p>
          <span class="stat">Avg accuracy: <b>${avg("dictation")}</b></span>
        </a>
        <a class="card" href="#capture">
          <span class="lvl">Level 3</span><h2>Listen or read &amp; capture</h2>
          <p>Hear (or read) a longer message, then write down the key facts without seeing it again.</p>
          <span class="stat">Avg facts captured: <b>${avg("capture")}</b></span>
        </a>
      </section>`;
    $("#learner").oninput = e => { state.name = e.target.value.trim(); save(); };
    app.querySelectorAll("[data-track]").forEach(b => b.onclick = () => { state.track = b.dataset.track; save(); render(); });
  }

  // ---------- typing ----------
  function typing() {
    const item = pick(C.typing[state.track]);
    app.innerHTML = `${back}
      <section class="panel">
        <div class="phead"><span class="lvl">Level 1 · Typing drill</span><h2>${esc(item.title)}</h2></div>
        <p class="hint">The timer starts with your first key. Press <kbd>Enter</kbd> or Submit when done.</p>
        <div class="target" id="target">${item.text.split("").map(ch => `<span>${esc(ch)}</span>`).join("")}</div>
        <textarea id="typed" rows="4" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Start typing here…"></textarea>
        <div class="live"><span>Time <b id="t">0s</b></span><span>Speed <b id="w">0</b> wpm</span><span>Accuracy <b id="a">—</b></span></div>
        <div class="actions"><button id="submit" class="primary">Submit</button><button id="next">New passage</button></div>
        <div id="result"></div>
      </section>`;
    const ta = $("#typed"), spans = $("#target").children;
    let start = null, timer = null, done = false;
    const elapsed = () => start ? (Date.now() - start) / 1000 : 0;
    ta.focus();
    ta.addEventListener("input", () => {
      if (done) return;
      if (!start) { start = Date.now(); timer = setInterval(tick, 250); }
      const v = ta.value;
      for (let i = 0; i < spans.length; i++) {
        spans[i].className = i < v.length ? (v[i] === item.text[i] ? "ok" : "bad") : (i === v.length ? "cur" : "");
      }
      tick();
      if (v.length >= item.text.length) finish();
    });
    ta.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); finish(); } });
    function tick() {
      const r = S.typing(item.text, ta.value, elapsed());
      $("#t").textContent = Math.round(elapsed()) + "s";
      $("#w").textContent = Math.round(r.netWpm);
      $("#a").textContent = ta.value.length ? pct(r.accuracy) : "—";
    }
    function finish() {
      if (done || !ta.value.length) return;
      done = true; clearInterval(timer); ta.disabled = true;
      const r = S.typing(item.text, ta.value, elapsed());
      record({ mode: "typing", item: item.id, accuracy: r.accuracy, completion: r.completion, wpm: Math.round(r.netWpm), seconds: Math.round(elapsed()) });
      $("#result").innerHTML = resultBox([
        ["Net speed", Math.round(r.netWpm) + " wpm"], ["Accuracy", pct(r.accuracy)], ["Wrong keys", r.errors], ["Completed", pct(r.completion)], ["Time", Math.round(elapsed()) + "s"]
      ], r.accuracy >= 0.97 ? "Clean work. Try to go a little faster next time." : "Slow down slightly. In a ticket, one wrong character can change the meaning.");
    }
    $("#submit").onclick = finish;
    $("#next").onclick = typing;
  }

  // ---------- dictation ----------
  function dictation() {
    const item = pick(C.dictation[state.track]);
    let plays = 0, accent = "", firstEnd = null;
    app.innerHTML = `${back}
      <section class="panel">
        <div class="phead"><span class="lvl">Level 2 · Listen &amp; type</span><h2>Type exactly what you hear</h2></div>
        ${settingsBar()}
        <div class="actions"><button id="play" class="primary big">▶ Play</button><span class="plays" id="plays">Not played yet</span></div>
        <textarea id="typed" rows="3" spellcheck="false" autocomplete="off" placeholder="Type what you heard…"></textarea>
        <div class="actions"><button id="submit" class="primary">Check</button><button id="next">Next sentence</button></div>
        <div id="result"></div>
      </section>`;
    bindSettings();
    $("#play").onclick = () => {
      plays++;
      $("#plays").textContent = `Played ${plays}× · replays lower your score slightly`;
      accent = speak(item.text, () => { if (!firstEnd) firstEnd = Date.now(); $("#typed").focus(); }) || accent;
    };
    $("#typed").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); check(); } });
    let done = false;
    function check() {
      if (done) return;
      if (!plays) { $("#plays").textContent = "Press Play first"; return; }
      done = true; stopAudio();
      const r = S.dictation(item.text, $("#typed").value);
      const secs = firstEnd ? Math.round((Date.now() - firstEnd) / 1000) : 0;
      record({ mode: "dictation", item: item.id, accuracy: r.accuracy, seconds: secs, replays: plays - 1, accent, rate: state.rate, noise: state.noise });
      const diff = r.ops.map(o =>
        o.t === "ok" ? `<span class="w ok">${esc(o.w)}</span>` :
        o.t === "sub" ? `<span class="w sub" title="You typed: ${esc(o.got)}">${esc(o.w)}</span>` :
        o.t === "miss" ? `<span class="w miss" title="Missed">${esc(o.w)}</span>` :
        `<span class="w extra" title="Extra word">${esc(o.got)}</span>`).join(" ");
      $("#result").innerHTML = resultBox([
        ["Word accuracy", pct(r.accuracy)], ["Replays", plays - 1], ["Time to type", secs + "s"], ["Accent", accent || "—"]
      ], "") + `<div class="diff"><p class="hint">Green: correct · Amber: misheard (hover to see what you typed) · Red, struck through: missed · Grey: extra</p>${diff}</div>
        <p class="said">It said: “${esc(item.text)}”</p>`;
    }
    $("#submit").onclick = check;
    $("#next").onclick = () => { stopAudio(); dictation(); };
  }

  // ---------- capture ----------
  function capture() {
    const item = pick(C.capture[state.track]);
    let plays = 0, accent = "", startAt = null, mode = "listen", reading = false;
    app.innerHTML = `${back}
      <section class="panel">
        <div class="phead"><span class="lvl">Level 3 · Capture the facts</span><h2>${esc(item.title)}</h2></div>
        <div class="seg" role="radiogroup" aria-label="How do you want to receive the message?">
          <button data-m="listen" class="on">Listen</button><button data-m="read">Read</button>
        </div>
        <div id="src"></div>
        <form id="facts" class="facts" autocomplete="off">
          ${item.facts.map((f, i) => `<label>${esc(f.label)}<input name="f${i}" spellcheck="false"></label>`).join("")}
        </form>
        <div class="actions"><button id="submit" class="primary">Check my notes</button><button id="next">New message</button></div>
        <div id="result"></div>
      </section>`;
    function drawSrc() {
      if (mode === "listen") {
        $("#src").innerHTML = settingsBar() + `<div class="actions"><button id="play" class="primary big">▶ Play message</button><span class="plays" id="plays">${plays ? `Played ${plays}×` : "Listen once if you can. Real callers rarely repeat themselves."}</span></div>`;
        bindSettings();
        $("#play").onclick = () => {
          plays++; $("#plays").textContent = `Played ${plays}×`;
          accent = speak(item.script, () => { if (!startAt) startAt = Date.now(); }) || accent;
        };
      } else {
        $("#src").innerHTML = `<p class="hint">Read the message, then press Hide and fill in the facts from memory.</p>
          <blockquote id="script">${esc(item.script)}</blockquote>
          <div class="actions"><button id="hide" class="primary">Hide and answer</button></div>`;
        reading = true;
        $("#hide").onclick = () => { $("#script").classList.add("hidden"); $("#hide").remove(); reading = false; if (!startAt) startAt = Date.now(); };
      }
    }
    app.querySelectorAll(".seg button").forEach(b => b.onclick = () => {
      if (plays || startAt) return;
      stopAudio(); mode = b.dataset.m;
      app.querySelectorAll(".seg button").forEach(x => x.classList.toggle("on", x === b));
      drawSrc();
    });
    drawSrc();
    let done = false;
    $("#submit").onclick = () => {
      if (done) return;
      if (mode === "listen" && !plays) { $("#plays").textContent = "Press Play first"; return; }
      if (mode === "read" && reading) { $("#hide").textContent = "Hide and answer first"; $("#hide").focus(); return; }
      done = true; stopAudio();
      const answers = item.facts.map((_, i) => $(`[name=f${i}]`).value);
      const r = S.capture(item.facts, answers);
      const secs = startAt ? Math.round((Date.now() - startAt) / 1000) : 0;
      record({ mode: "capture", via: mode, item: item.id, accuracy: r.accuracy, seconds: secs, replays: Math.max(0, plays - 1), accent: mode === "listen" ? accent : "", rate: state.rate, noise: mode === "listen" ? state.noise : "" });
      $("#result").innerHTML = resultBox([
        ["Facts captured", `${r.hits} / ${r.total}`], ["Score", pct(r.accuracy)], ["Time to capture", secs + "s"], [mode === "listen" ? "Replays" : "Mode", mode === "listen" ? Math.max(0, plays - 1) : "Read"]
      ], "") + `<table class="ftable"><thead><tr><th>Fact</th><th>You wrote</th><th></th></tr></thead><tbody>
        ${r.results.map(x => `<tr><td>${esc(x.label)}</td><td>${esc(x.answer) || "<i>blank</i>"}</td><td class="${x.hit ? "ok" : "bad"}">${x.hit ? "✓" : "✗ e.g. " + esc(x.expected)}</td></tr>`).join("")}
        </tbody></table>
        <details><summary>Show the full message</summary><blockquote>${esc(item.script)}</blockquote></details>`;
      $("#facts").querySelectorAll("input").forEach(i => i.disabled = true);
    };
    $("#next").onclick = () => { stopAudio(); capture(); };
  }

  function resultBox(rows, tip) {
    return `<div class="result">${rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</div>${tip ? `<p class="tip">${esc(tip)}</p>` : ""}`;
  }

  // ---------- progress ----------
  function progress() {
    const h = history().slice().reverse();
    const label = { typing: "Typing", dictation: "Listen & type", capture: "Capture" };
    app.innerHTML = `${back}
      <section class="panel">
        <div class="phead"><span class="lvl">My progress</span><h2>${h.length} attempts on this device</h2></div>
        <p class="hint">Testing for us? Download or copy your results and send them back. Nothing is uploaded automatically.</p>
        <div class="actions"><button id="csv" class="primary" ${h.length ? "" : "disabled"}>Download results (CSV)</button><button id="copy" ${h.length ? "" : "disabled"}>Copy results</button><button id="clear" ${h.length ? "" : "disabled"}>Clear history</button><span class="plays" id="copied"></span></div>
        <textarea id="csvbox" rows="5" hidden readonly></textarea>
        ${h.length ? `<div class="tablewrap"><table class="ptable"><thead><tr><th>When</th><th>Track</th><th>Exercise</th><th>Score</th><th>Speed</th><th>Time</th><th>Accent</th></tr></thead><tbody>
          ${h.slice(0, 100).map(x => `<tr><td>${new Date(x.at).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td><td>${x.track === "desk" ? "Desk" : "Student"}</td><td>${label[x.mode]}${x.via === "read" ? " (read)" : ""}</td><td>${pct(x.accuracy)}</td><td>${x.wpm ? x.wpm + " wpm" : "—"}</td><td>${x.seconds}s</td><td>${esc(x.accent || "—")}</td></tr>`).join("")}
        </tbody></table></div>` : `<p>No attempts yet. <a href="#home">Start practising</a>.</p>`}
      </section>`;
    const toCsv = () => {
      const cols = ["at", "learner", "track", "mode", "via", "item", "accuracy", "completion", "wpm", "seconds", "replays", "accent", "rate", "noise"];
      return [cols.join(",")].concat(history().map(x => cols.map(c => `"${String(x[c] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
    };
    $("#csv").onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([toCsv()], { type: "text/csv" }));
      a.download = `listen-type-results-${(state.name || "learner").replace(/\W+/g, "-")}.csv`;
      a.click();
    };
    $("#copy").onclick = () => {
      const csv = toCsv(), msg = $("#copied");
      const fallback = () => { const t = $("#csvbox"); t.hidden = false; t.value = csv; t.select(); msg.textContent = "Select-all and copy the text below, then paste it into an email."; };
      try { navigator.clipboard.writeText(csv).then(() => { msg.textContent = "Copied. Paste it into an email or a spreadsheet."; }, fallback); } catch (e) { fallback(); }
    };
    let armed = false;
    $("#clear").onclick = () => {
      if (!armed) { armed = true; $("#clear").textContent = "Click again to delete all"; return; }
      store.set("elt_history", []); progress();
    };
  }

  // ---------- router ----------
  const routes = { home, typing, dictation, capture, progress };
  function render() {
    stopAudio();
    const r = (location.hash || "#home").slice(1);
    (routes[r] || home)();
    document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === (r === "progress" ? "progress" : "home")));
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", render);
  render();
})();
