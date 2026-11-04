# In-browser code reading check (LLD Studio)

Proves that Python and Scala 3 code can be read in the browser, without running it,
and reviewed with plain-English rules.

## Run
    npm i web-tree-sitter@0.22.6 tree-sitter-wasms@0.1.12
    npm pack tree-sitter-scala@0.24.0 && tar xzf tree-sitter-scala-0.24.0.tgz package/tree-sitter-scala.wasm
    cp package/tree-sitter-scala.wasm scala3.wasm
    node cases.js

## Files
- review.js  - Python and Scala -> one class model; Strategy review rules with plain-English messages
- cases.js   - 8 test cases (correct, buggy, naming, half-written, not-Strategy) in both languages

Note: use tree-sitter-scala 0.24.0's wasm. The Scala grammar bundled in tree-sitter-wasms 0.1.12
does not understand Scala 3 indentation syntax.
