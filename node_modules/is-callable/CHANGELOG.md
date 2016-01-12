1.1.1 / 2015-11-30
=================
  * [Fix] do not throw when a non-function has a function in its [[Prototype]] (#2)
  * [Dev Deps] update `tape`, `eslint`, `@ljharb/eslint-config`, `jscs`, `nsp`, `semver`
  * [Tests] up to `node` `v5.1`
  * [Tests] no longer allow node 0.8 to fail.
  * [Tests] fix npm upgrades in older nodes

1.1.0 / 2015-10-02
=================
  * [Fix] Some browsers report TypedArray constructors as `typeof object`
  * [New] return false for "class" constructors, when possible.
  * [Tests] up to `io.js` `v3.3`, `node` `v4.1`
  * [Dev Deps] update `eslint`, `editorconfig-tools`, `nsp`, `tape`, `semver`, `jscs`, `covert`, `make-arrow-function`
  * [Docs] Switch from vb.teelaun.ch to versionbadg.es for the npm version badge SVG

1.0.4 / 2015-01-30
=================
  * If @@toStringTag is not present, use the old-school Object#toString test.

1.0.3 / 2015-01-29
=================
  * Add tests to ensure arrow functions are callable.
  * Refactor to aid optimization of non-try/catch code.

1.0.2 / 2015-01-29
=================
  * Fix broken package.json

1.0.1 / 2015-01-29
=================
  * Add early exit for typeof not "function"

1.0.0 / 2015-01-29
=================
  * Initial release.
