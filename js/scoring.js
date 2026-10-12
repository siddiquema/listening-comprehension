// Scoring helpers. Pure functions, no DOM.
window.Scoring = (function () {
  const NUM_WORDS = {
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten"
  };

  function normWords(s) {
    return s
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/(\w)-(\w)/g, "$1$2")
      .replace(/[^a-z0-9' ]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(w => NUM_WORDS[w] || w);
  }

  // Word-level alignment (Levenshtein). Returns ops for display and counts.
  function alignWords(ref, hyp) {
    const n = ref.length, m = hyp.length;
    const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const sub = d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1);
        d[i][j] = Math.min(sub, d[i - 1][j] + 1, d[i][j - 1] + 1);
      }
    }
    const ops = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) {
        ops.push(ref[i - 1] === hyp[j - 1] ? { t: "ok", w: ref[i - 1] } : { t: "sub", w: ref[i - 1], got: hyp[j - 1] });
        i--; j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        ops.push({ t: "miss", w: ref[i - 1] }); i--;
      } else {
        ops.push({ t: "extra", got: hyp[j - 1] }); j--;
      }
    }
    ops.reverse();
    return { ops, errors: d[n][m], refLen: n };
  }

  function dictation(refText, typed) {
    const r = normWords(refText), h = normWords(typed);
    const a = alignWords(r, h);
    const accuracy = r.length ? Math.max(0, 1 - a.errors / r.length) : 0;
    return { accuracy, ops: a.ops, errors: a.errors, words: r.length };
  }

  // Typing: character comparison against target (position-wise).
  function typing(target, typed, seconds) {
    let correct = 0;
    const len = Math.min(target.length, typed.length);
    for (let i = 0; i < len; i++) if (target[i] === typed[i]) correct++;
    const errors = typed.length - correct;
    const minutes = Math.max(seconds, 1) / 60;
    const grossWpm = (typed.length / 5) / minutes;
    const netWpm = Math.max(0, (correct / 5) / minutes);
    const accuracy = typed.length ? correct / typed.length : 0;
    const completion = Math.min(1, typed.length / target.length);
    return { grossWpm, netWpm, accuracy, completion, errors };
  }

  // Fact capture: a fact scores if any accepted term appears in the learner's answer.
  // Short terms (<=3 chars) must match as whole words so "2" doesn't match "2024".
  function factMatch(answer, accept) {
    const a = " " + answer.toLowerCase().replace(/[^a-z0-9:.\- ]+/g, " ") + " ";
    return accept.some(term => {
      const t = term.toLowerCase();
      if (t.length <= 3) {
        const body = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const after = /^[0-9]+$/.test(t) ? "(?![0-9])" : "(?![a-z0-9])";
        const re = new RegExp("(?<![a-z0-9])" + body + after);
        return re.test(a);
      }
      return a.includes(t);
    });
  }

  function capture(facts, answers) {
    const results = facts.map((f, i) => ({ label: f.label, answer: answers[i] || "", hit: factMatch(answers[i] || "", f.accept), expected: f.accept[0] }));
    const hits = results.filter(r => r.hit).length;
    return { results, accuracy: facts.length ? hits / facts.length : 0, hits, total: facts.length };
  }

  return { dictation, typing, capture, factMatch, normWords };
})();
