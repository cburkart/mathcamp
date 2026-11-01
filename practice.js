// practice.js: the reusable practice-problem widget.
//
// Usage in any chapter (inside an {ojs} cell):
//
//   import { practice } from "./practice.js"
//   practice("inverse_demand", problem_json, check_json)
//
// `problem_json` and `check_json` are R functions exported from a hidden
// {webr} cell (see _common.qmd). Called from JavaScript they return a
// Promise of a one-element array holding a JSON string.

const MAX_SEED = 99999;

function randomSeed() {
  return 1 + Math.floor(Math.random() * MAX_SEED);
}

// R character vectors arrive as arrays; accept a bare string too.
function unwrap(x) {
  if (Array.isArray(x)) return x[0];
  if (x && Array.isArray(x.values)) return x.values[0];
  return x;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

export function practice(family, problemFn, checkFn, opts = {}) {
  let seed = opts.seed ?? randomSeed();
  let problem = null;

  const root = el("div", { class: "practice", "data-family": family });

  // Header: problem number, new-problem button, jump-to-number box ---------
  const idLabel = el("span", { class: "practice-id" });
  const newBtn = el("button", {
    class: "btn btn-sm btn-outline-primary", type: "button", text: "New problem",
    onclick: () => load(randomSeed()),
  });
  const gotoInput = el("input", {
    class: "form-control form-control-sm practice-goto", type: "number",
    min: "1", max: String(MAX_SEED), placeholder: "#", "aria-label": "Problem number",
    onkeydown: (e) => { if (e.key === "Enter") goto(); },
  });
  const gotoBtn = el("button", {
    class: "btn btn-sm btn-outline-secondary", type: "button", text: "Go",
    onclick: () => goto(),
  });
  const header = el("div", { class: "practice-header" }, [
    idLabel, el("span", { class: "practice-controls" }, [newBtn, gotoInput, gotoBtn]),
  ]);

  const body = el("div", { class: "practice-body" });
  root.append(header, body);

  function goto() {
    const n = parseInt(gotoInput.value, 10);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_SEED) load(n);
  }

  async function load(newSeed) {
    seed = newSeed;
    idLabel.textContent = `Problem #${seed}`;
    body.replaceChildren(el("p", { class: "practice-status", text: "Loading…" }));
    try {
      problem = JSON.parse(unwrap(await problemFn(family, seed)));
      render();
    } catch (err) {
      body.replaceChildren(el("p", { class: "practice-status text-danger",
        text: `Couldn't load this problem (${err.message ?? err}).` }));
    }
  }

  function render() {
    const inputs = {};
    const marks = {};

    const rows = problem.parts.map((part) => {
      const input = el("input", {
        class: "form-control form-control-sm", type: "text", inputmode: "decimal",
        autocomplete: "off", "aria-label": part.id,
        onkeydown: (e) => { if (e.key === "Enter") check(); },
      });
      const mark = el("div", { class: "practice-feedback", "aria-live": "polite" });
      inputs[part.id] = input;
      marks[part.id] = mark;
      return el("div", { class: "practice-part" }, [
        el("label", { html: part.label }), input, mark,
      ]);
    });

    const status = el("p", { class: "practice-status", "aria-live": "polite" });
    const checkBtn = el("button", {
      class: "btn btn-sm btn-primary", type: "button", text: "Check answers",
      onclick: () => check(),
    });

    const solution = el("ol", { class: "practice-solution", hidden: "" },
      problem.solution.map((s) => el("li", { html: s })));
    const solBtn = el("button", {
      class: "btn btn-sm btn-outline-secondary", type: "button", text: "Show solution",
      onclick: () => {
        solution.hidden = !solution.hidden;
        solBtn.textContent = solution.hidden ? "Show solution" : "Hide solution";
      },
    });

    body.replaceChildren(
      el("div", { class: "practice-prompt", html: problem.prompt }),
      el("div", { class: "practice-parts" }, rows),
      el("div", { class: "practice-actions" }, [checkBtn, solBtn]),
      status,
      solution,
    );

    async function check() {
      const responses = {};
      for (const [id, input] of Object.entries(inputs)) responses[id] = input.value;
      checkBtn.disabled = true;
      try {
        const res = JSON.parse(unwrap(await checkFn(family, seed, JSON.stringify(responses))));
        for (const p of res.parts) {
          const mark = marks[p.id];
          mark.className = "practice-feedback " + (p.correct ? "is-correct" : "is-wrong");
          mark.innerHTML = (p.correct ? "✓ " : "✗ ") + p.message;
          inputs[p.id].classList.toggle("is-valid", p.correct);
          inputs[p.id].classList.toggle("is-invalid", !p.correct);
        }
        status.textContent = res.all_correct
          ? "All correct! Try a new problem, or compare your steps with the solution."
          : "";
      } catch (err) {
        status.textContent = `Couldn't check answers (${err.message ?? err}).`;
      } finally {
        checkBtn.disabled = false;
      }
    }
  }

  load(seed);
  return root;
}
