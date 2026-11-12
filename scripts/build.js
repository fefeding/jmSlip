'use strict';

/**
 * Zero-dependency build for jmSlip.
 *
 * `src/jmSlip.js` is the single source of truth and is already UMD-compatible.
 * This script derives the browser bundles from it so `dist/` can never drift
 * behind the source (the old checked-in bundles contained older behaviour).
 *
 * If `terser` is installed it is used for the .min.js files; otherwise those
 * files are emitted uncompressed with an explicit header. Install it with:
 *   npm i -D terser
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'src', 'jmSlip.js');
const distDir = path.join(root, 'dist');
const src = fs.readFileSync(srcPath, 'utf8');

const UMD_TAIL = /\/\* BUILD:UMD:BEGIN \*\/[\s\S]*?\/\* BUILD:UMD:END \*\//;
if (!UMD_TAIL.test(src)) {
    throw new Error('src/jmSlip.js is missing the BUILD:UMD markers');
}

const umd = src;
const esm = src.replace(UMD_TAIL, 'export default jmSlipRuntime;');

fs.mkdirSync(distDir, { recursive: true });

let terser = null;
try {
    // eslint-disable-next-line global-require
    terser = require('terser');
} catch (e) {
    terser = null;
}

const note = '/*! Uncompressed build: install terser (npm i -D terser) for minification. */\n';

async function minify(code) {
    if (!terser) return note + code;
    const result = await terser.minify(code, {
        format: { comments: /^!/, preamble: '/*! jmSlip */' }
    });
    if (result.error) throw result.error;
    return result.code;
}

(async function main() {
    fs.writeFileSync(path.join(distDir, 'jmslip.js'), umd, 'utf8');
    fs.writeFileSync(path.join(distDir, 'jmslip.es6.js'), esm, 'utf8');
    fs.writeFileSync(path.join(distDir, 'jmslip.min.js'), await minify(umd), 'utf8');
    fs.writeFileSync(path.join(distDir, 'jmslip.es6.min.js'), await minify(esm), 'utf8');
    console.log('built dist/jmslip.js, jmslip.es6.js and min variants' +
        (terser ? ' (terser)' : ' (uncompressed fallback)'));
})().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
