# Math Camp for Intermediate Microeconomics

An online mini-book with unlimited randomized practice, built with Quarto and
[quarto-live](https://r-wasm.github.io/quarto-live/) (R in the browser via
webR). Problem generators live in the companion
[econgen](https://github.com/cburkart/econgen) package.

## Adding a chapter with practice

1. Create `my-chapter.qmd` and list it under `chapters:` in `_quarto.yml`.
2. Put `{{< include _common.qmd >}}` right after the chapter title.
3. Wherever you want a practice problem:

   ````
   ```{ojs}
   //| echo: false
   practice("family_name", problem_json, check_json)
   ```
   ````

The family must exist in the installed version of econgen on its GitHub
Pages site, so push the package before the chapter that uses it.

## Files

| File | Purpose |
|---|---|
| `_quarto.yml` | Book structure, theme, and webR settings (package + repo URL) |
| `_common.qmd` | Hidden setup included in every practice chapter |
| `practice.js` | The practice widget (new problem, check, solution) |
| `practice.css` | Widget styling |
| `.github/workflows/publish.yml` | Renders and publishes to GitHub Pages on push |
