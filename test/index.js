'use strict';

/**
 * Zero-dependency DOM stub test. jmSlip is a browser component; this harness
 * models just enough of the DOM to verify construction, event binding,
 * configuration normalisation and the regression fixes without a browser.
 */

const assert = require('node:assert/strict');

class StubStyle {
    constructor() {
        this.transform = '';
        this.transition = '';
        this.props = {};
    }
    setProperty(name, value) { this.props[name] = String(value); }
}

class StubElement {
    constructor(tag) {
        this.tagName = tag || 'DIV';
        this.nodeType = 1;
        this.style = new StubStyle();
        this.children = [];
        this.parentNode = null;
        this.offsetWidth = 100;
        this.offsetHeight = 100;
        this.attrs = {};
        this.listeners = {};
        this.className = '';
    }
    get classList() { return null; }
    addEventListener(name, fn) {
        (this.listeners[name] = this.listeners[name] || []).push(fn);
    }
    removeEventListener(name, fn) {
        const list = this.listeners[name] || [];
        const i = list.indexOf(fn);
        if (i >= 0) list.splice(i, 1);
    }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null; }
    appendChild(node) {
        node.parentNode = this;
        this.children.push(node);
        return node;
    }
    removeChild(node) {
        const i = this.children.indexOf(node);
        if (i >= 0) this.children.splice(i, 1);
        node.parentNode = null;
        return node;
    }
    cloneNode(deep) {
        const copy = new StubElement(this.tagName);
        copy.attrs = { ...this.attrs };
        copy.className = this.className;
        if (deep) this.children.forEach((child) => copy.appendChild(child.cloneNode(true)));
        return copy;
    }
    querySelector() { return null; }
    matches() { return false; }
    count(name) { return (this.listeners[name] || []).length; }
    fire(name, evt) { (this.listeners[name] || []).slice().forEach((fn) => fn && fn(evt)); }
}

const byId = {};
const doc = new StubElement('#document');
doc.getElementById = (id) => byId[id] || null;
const win = {
    navigator: { maxTouchPoints: 0 },
    onwheel: null, // modern browser: only the 'wheel' event is bound
    addEventListener() {},
    removeEventListener() {}
};
global.window = win;
global.document = doc;

const jmSlip = require('../src/jmSlip.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
    try {
        fn();
        passed++;
        console.log('  ok  ' + name);
    } catch (err) {
        failed++;
        console.error('  FAIL  ' + name);
        console.error(err);
        process.exitCode = 1;
    }
}

function makeContainer(pages) {
    const container = new StubElement('section');
    const inner = new StubElement('ul');
    container.appendChild(inner);
    for (let i = 0; i < pages; i++) inner.appendChild(new StubElement('li'));
    return { container, inner };
}

function gestureEvent(x, y) {
    return {
        clientX: x,
        clientY: y,
        pageX: x + 999, // must never be used when clientX is a number (even 0)
        pageY: y + 999,
        timeStamp: 1,
        target: null,
        preventDefault() {},
        stopPropagation() {}
    };
}

// -------------------------------------------------------------------------
test('module exports a usable UMD constructor', () => {
    assert.equal(typeof jmSlip, 'function');
    assert.equal(typeof jmSlip.jmSlip, 'function');
    assert.equal(typeof jmSlip.default, 'function');
    assert.equal(typeof global.jmSlip, 'undefined', 'must not pollute globalThis in Node');
});

test('constructs a page instance and normalises options', () => {
    const { container } = makeContainer(3);
    const slip = new jmSlip(container, 'page', { direction: 'x' });
    assert.equal(slip.mode, 'page');
    assert.ok(slip.slipObj);
    assert.equal(slip.option.duration, 500);
    assert.equal(slip.option.minOffset, 30);
    assert.equal(slip.option.zIndex, 10000);
    slip.destroy();
});

test('never mutates the caller options object', () => {
    const options = { direction: 'x', T: 1 };
    const { container } = makeContainer(3);
    const slip = new jmSlip(container, 'page', options);
    assert.deepEqual(options, { direction: 'x', T: 1 });
    assert.notStrictEqual(slip.option, options);
    slip.destroy();
});

test('zero values are preserved instead of being replaced by defaults', () => {
    const { container } = makeContainer(3);
    const slip = new jmSlip(container, 'page', {
        duration: 0, minOffset: 0, zIndex: 0, itemOffWidth: 0
    });
    assert.equal(slip.option.duration, 0);
    assert.equal(slip.option.durations, 0);
    assert.equal(slip.option.minOffset, 0);
    assert.equal(slip.option.zIndex, 0);
    slip.destroy();
});

test('minOffset is per instance (no shared module-level state)', () => {
    const a = makeContainer(3);
    const b = makeContainer(3);
    const first = new jmSlip(a.container, 'page', { minOffset: 5 });
    const second = new jmSlip(b.container, 'page', { minOffset: 80 });
    assert.equal(first.option.minOffset, 5);
    assert.equal(second.option.minOffset, 80);
    first.destroy();
    second.destroy();
});

test('invalid inputs fail with clear messages', () => {
    assert.throws(() => new jmSlip(null, 'page'), /element must be/);
    assert.throws(() => new jmSlip('missing-id', 'page'), /element must be/);
    const empty = new StubElement('section');
    assert.throws(() => new jmSlip(empty, 'page'), /first child/);
    const { container } = makeContainer(2);
    assert.throws(() => new jmSlip(container, 'nope'), /unknown mode/);
    assert.throws(() => new jmSlip(container, 'page', { duration: -1 }), /option.duration/);
});

test('accepts an id string, an array-like element and option.mode', () => {
    const { container } = makeContainer(2);
    byId.banner = container;
    const byString = new jmSlip('banner', 'page');
    const byArrayLike = new jmSlip({ 0: container, length: 1 }, { mode: 'page' });
    assert.equal(byString.mode, 'page');
    assert.equal(byArrayLike.mode, 'page');
    byString.destroy();
    byArrayLike.destroy();
});

test('all six modes can be constructed', () => {
    for (const mode of ['page', 'item', 'scroll', 'scrollItem', 'drag', 'scale']) {
        const { container, inner } = makeContainer(3);
        const options = mode === 'scale' ? { target: inner.children[0] } : {};
        const slip = new jmSlip(container, mode, options);
        assert.equal(slip.mode, mode);
        slip.destroy();
    }
});

test('bindEvent is idempotent and destroy() removes every listener', () => {
    const { container } = makeContainer(3);
    const slip = new jmSlip(container, 'page', { mousewheel: true });
    const target = slip.target;
    assert.equal(target.count('mousedown'), 1);
    slip.bindEvent();
    assert.equal(target.count('mousedown'), 1, 'must not double-bind');
    assert.equal(target.count('wheel'), 1, 'exactly one wheel event is bound');
    assert.equal(target.count('mousewheel'), 0);
    assert.equal(target.count('DOMMouseScroll'), 0);
    slip.destroy();
    assert.equal(target.count('mousedown'), 0);
    assert.equal(target.count('mousemove'), 0);
    assert.equal(target.count('mouseup'), 0);
    assert.equal(target.count('wheel'), 0);
    assert.equal(slip._handlers, null);
});

test('destory() is a working alias of destroy()', () => {
    const { container } = makeContainer(3);
    const slip = new jmSlip(container, 'page');
    assert.equal(slip.destory, slip.destroy);
    assert.equal(slip.destory(), slip);
    assert.equal(container.count('mousedown'), 0);
});

test('onTouchEnd returning false still restores gesture state', () => {
    const { container } = makeContainer(3);
    let ended = false;
    const slip = new jmSlip(container, 'page', {
        onTouchEnd() { ended = true; return false; }
    });
    container.fire('mousedown', gestureEvent(10, 10));
    assert.equal(slip.touched, true);
    container.fire('mousemove', gestureEvent(60, 10));
    container.fire('mouseup', gestureEvent(60, 10));
    assert.equal(ended, true);
    assert.equal(slip.touched, false, 'component must not get stuck');
    slip.destroy();
});

test('onTouchMove returning false does not synthesise a touch-end', () => {
    const { container } = makeContainer(3);
    let endCalls = 0;
    const slip = new jmSlip(container, 'page', {
        onTouchMove() { return false; },
        onTouchEnd() { endCalls++; }
    });
    container.fire('mousedown', gestureEvent(10, 10));
    container.fire('mousemove', gestureEvent(60, 10));
    assert.equal(endCalls, 0);
    assert.equal(slip.touched, true, 'gesture is still active');
    container.fire('mouseup', gestureEvent(60, 10));
    assert.equal(endCalls, 1);
    slip.destroy();
});

test('vertical repeat lays out pages along Y (not X)', () => {
    const { container, inner } = makeContainer(3);
    const slip = new jmSlip(container, 'page', { repeat: true, height: 100 });
    const transforms = inner.children.map((child) => child.style.transform);
    assert.equal(transforms[0], 'translate3d(0px,0px,0px)');
    assert.match(transforms[1], /translate3d\(0px,100px,0px\)/);
    assert.match(transforms[2], /translate3d\(0px,200px,0px\)/);
    slip.destroy();
});

test('data-page is written and onPageEnd receives a number', () => {
    const { container, inner } = makeContainer(3);
    let received;
    const slip = new jmSlip(container, 'page', {
        direction: 'x',
        onPageEnd(oldPage, page) { received = [oldPage, page]; }
    });
    inner.children.forEach((child, i) => assert.equal(child.getAttribute('data-page'), String(i)));
    slip.go(1);
    assert.equal(typeof received[1], 'number');
    assert.equal(received[1], 1);
    slip.destroy();
});

test('onPageStart returning false cancels without recursing', () => {
    const { container } = makeContainer(3);
    let calls = 0;
    const slip = new jmSlip(container, 'page', {
        direction: 'x',
        onPageStart() { calls++; return false; }
    });
    const afterInit = calls; // reset() during construction calls go() once
    assert.doesNotThrow(() => slip.go(2));
    assert.equal(calls, afterInit + 1, 'must not re-enter via reset()/go()');
    assert.equal(slip.page, 0);
    slip.destroy();
});

test('go() and reset() remain usable after the changes', () => {
    const { container } = makeContainer(4);
    const slip = new jmSlip(container, 'page', { direction: 'x', loop: true });
    assert.doesNotThrow(() => { slip.go(2); slip.reset(); });
    assert.equal(slip.page, 2);
    slip.destroy();
});

test('destroy() cannot be undone by a later bindEvent()', () => {
    const { container } = makeContainer(3);
    const slip = new jmSlip(container, 'page', { mousewheel: true });
    slip.destroy();
    slip.bindEvent();
    assert.equal(container.count('mousedown'), 0);
    assert.equal(container.count('wheel'), 0);
});

test('maxScale / minScale accept an explicit 0', () => {
    const { container, inner } = makeContainer(2);
    const slip = new jmSlip(container, 'scale', {
        target: inner.children[0], maxScale: 0, minScale: 0
    });
    slip.slipObj.set(5);
    assert.equal(slip.slipObj.scaleX, 0);
    slip.destroy();
});

test('onPageStart numeric override is clamped to a valid page', () => {
    const { container } = makeContainer(3);
    let calls = 0;
    const slip = new jmSlip(container, 'page', {
        direction: 'x',
        onPageStart() { calls++; return calls === 1 ? 999 : undefined; }
    });
    assert.doesNotThrow(() => slip.go(1));
    assert.ok(slip.page >= 0 && slip.page <= 2);
    assert.equal(container.children.length, 1, 'container must not be structurally broken');
    slip.destroy();
});

console.log('\n' + passed + ' checks passed, ' + failed + ' failed');
