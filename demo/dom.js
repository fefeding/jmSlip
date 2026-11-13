/**
 * demo/dom.js
 *
 * A tiny, zero-dependency helper that re-implements the small subset of the
 * jQuery/Zepto API used by the jmSlip demos. It lets every example run without
 * any external library (no CDN, no jQuery/Zepto), keeping the demos aligned
 * with jmSlip's "dependency-free" promise.
 *
 * Supported subset:
 *   $(selector)             -> collection wrapper (array-like: [i], .length)
 *   $(element)              -> wrapper around a single DOM node
 *   $(htmlString)           -> wrapper around created element(s)
 *   $(function)             -> DOM-ready
 *   $(window) / $(document)
 *   .eq(i) .find(sel)
 *   .hasClass .addClass .removeClass .toggleClass
 *   .attr(name[, value]) .html([value]) .append(value)
 *   .css(prop[, value]) .index()
 *   .on(evt[, selector], fn) .click(fn) .delegate(sel, evt, fn)
 *   .show() .hide() .offset() .width() .height() .resize(fn) .appendTo(target)
 */
(function (global) {
    'use strict';

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function wrap(els) {
        var arr = Array.prototype.slice.call(els);

        arr.eq = function (i) {
            return wrap(this[i] ? [this[i]] : []);
        };
        arr.find = function (selector) {
            var r = [];
            this.forEach(function (el) {
                if (el.querySelectorAll) {
                    r.push.apply(r, el.querySelectorAll(selector));
                }
            });
            return wrap(r);
        };
        arr.hasClass = function (c) {
            return this.length > 0 && this[0].classList.contains(c);
        };
        arr.addClass = function (c) {
            this.forEach(function (el) { el.classList.add(c); });
            return this;
        };
        arr.removeClass = function (c) {
            this.forEach(function (el) { el.classList.remove(c); });
            return this;
        };
        arr.toggleClass = function (c, force) {
            this.forEach(function (el) { el.classList.toggle(c, !!force); });
            return this;
        };
        arr.attr = function (name, value) {
            if (value === undefined) {
                return this.length ? this[0].getAttribute(name) : null;
            }
            this.forEach(function (el) { el.setAttribute(name, value); });
            return this;
        };
        arr.html = function (value) {
            if (value === undefined) {
                return this.length ? this[0].innerHTML : '';
            }
            this.forEach(function (el) { el.innerHTML = value; });
            return this;
        };
        arr.append = function (value) {
            this.forEach(function (el) {
                if (typeof value === 'string') {
                    el.insertAdjacentHTML('beforeend', value);
                } else if (value && value.nodeType) {
                    el.appendChild(value);
                }
            });
            return this;
        };
        arr.css = function (prop, value) {
            if (value === undefined) {
                if (!this.length) return '';
                var el = this[0];
                var v = el.style[prop];
                if (v === '' || v == null) {
                    var cs = (typeof getComputedStyle === 'function') ? getComputedStyle(el) : null;
                    v = cs ? cs[prop] : '';
                }
                return v || '';
            }
            this.forEach(function (el) { el.style[prop] = value; });
            return this;
        };
        arr.index = function () {
            if (!this.length) return -1;
            var el = this[0];
            var parent = el.parentNode;
            if (!parent) return -1;
            return Array.prototype.slice.call(parent.children).indexOf(el);
        };
        arr.on = function (evt, selector, fn) {
            if (typeof selector === 'function') {
                fn = selector;
                selector = null;
            }
            this.forEach(function (el) {
                el.addEventListener(evt, function (ev) {
                    if (selector) {
                        var t = ev.target.closest ? ev.target.closest(selector) : null;
                        if (t && el.contains(t)) fn.call(t, ev);
                    } else {
                        fn.call(el, ev);
                    }
                });
            });
            return this;
        };
        arr.click = function (fn) {
            return this.on('click', fn);
        };
        arr.delegate = function (selector, evt, fn) {
            return this.on(evt, selector, fn);
        };
        arr.show = function () {
            this.forEach(function (el) { el.style.display = ''; });
            return this;
        };
        arr.hide = function () {
            this.forEach(function (el) { el.style.display = 'none'; });
            return this;
        };
        arr.offset = function () {
            var el = this[0];
            var r = el.getBoundingClientRect();
            return {
                left: r.left + (global.pageXOffset || 0),
                top: r.top + (global.pageYOffset || 0)
            };
        };
        arr.width = function () {
            if (this[0] === global.window) return global.innerWidth;
            return this[0].getBoundingClientRect().width;
        };
        arr.height = function () {
            if (this[0] === global.window) return global.innerHeight;
            return this[0].getBoundingClientRect().height;
        };
        arr.resize = function (fn) {
            global.addEventListener('resize', fn);
            return this;
        };
        arr.appendTo = function (target) {
            var t = typeof target === 'string' ? document.querySelector(target) : target;
            this.forEach(function (el) { if (t) t.appendChild(el); });
            return this;
        };
        return arr;
    }

    function $(arg) {
        if (typeof arg === 'function') {
            ready(arg);
            return undefined;
        }
        if (typeof arg === 'string') {
            var s = arg.trim();
            if (s.charAt(0) === '<') {
                var tmp = document.createElement('div');
                tmp.innerHTML = s;
                var nodes = [];
                for (var i = 0; i < tmp.childNodes.length; i++) {
                    if (tmp.childNodes[i].nodeType === 1) nodes.push(tmp.childNodes[i]);
                }
                return wrap(nodes);
            }
            return wrap(document.querySelectorAll(s));
        }
        if (arg === global.window || arg === global.document) {
            return wrap([arg]);
        }
        if (arg && arg.nodeType === 1) {
            return wrap([arg]);
        }
        return wrap(arg && arg.length != null ? arg : []);
    }

    global.$ = $;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = $;
    }
})(typeof window !== 'undefined' ? window : this);
