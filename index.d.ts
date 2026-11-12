/**
 * Type definitions for jmSlip.
 *
 * The package is CommonJS/UMD: `require('jmslip')` (or
 * `import jmSlip from 'jmslip'` with esModuleInterop) returns the constructor.
 * In a browser it is also available as `window.jmSlip`.
 *
 * A DOM is required to construct an instance; loading the module in Node is
 * safe but only useful for tooling/tests.
 */

declare class jmSlip {
    // Mode-specific overloads keep options in sync with the mode argument.
    constructor(element: jmSlip.ElementLike, mode: 'page', options?: jmSlip.PageOptions);
    constructor(element: jmSlip.ElementLike, mode: 'item', options?: jmSlip.ItemOptions);
    constructor(element: jmSlip.ElementLike, mode: 'scroll', options?: jmSlip.ScrollOptions);
    constructor(element: jmSlip.ElementLike, mode: 'scrollItem', options?: jmSlip.ScrollItemOptions);
    constructor(element: jmSlip.ElementLike, mode: 'drag', options?: jmSlip.DragOptions);
    constructor(element: jmSlip.ElementLike, mode: 'scale', options?: jmSlip.ScaleOptions);
    constructor(element: jmSlip.ElementLike, options?: jmSlip.Options);
    constructor(element: jmSlip.ElementLike, mode: null | undefined, options: jmSlip.Options);

    readonly mode: jmSlip.Mode;
    readonly option: jmSlip.CommonOptions;
    readonly slipObj: any;
    go(index: number): void;
    reset(): void;
    destroy(): jmSlip.Instance;
    /** @deprecated Misspelled legacy alias of `destroy()`. */
    destory(): jmSlip.Instance;
    /** Internal helpers; avoid depending on them. */
    bindEvent(enable?: boolean): void;
    transition(enable?: boolean, el?: Element, easing?: string): void;
    setStyle(name: string, value: string, map?: string[], children?: ArrayLike<Element>): void;
    auto(): void;
}

declare namespace jmSlip {
    type Mode = 'page' | 'item' | 'scroll' | 'scrollItem' | 'drag' | 'scale';

    /** An id string, a native DOM node, or any array-like (jQuery/Zepto/NodeList). */
    type ElementLike = string | Element | ArrayLike<Element>;

    interface Offset {
        /** Absolute displacement from the gesture start (not a per-frame delta). */
        offx: number;
        offy: number;
    }

    type GestureEvent = TouchEvent | MouseEvent | WheelEvent | Event;

    /** In every callback `this` is the mode implementation object (`slipObj`). */
    interface Callbacks {
        /** Gesture begins. Return `false` to skip the gesture. */
        onTouchStart?(this: any, evt: GestureEvent): false | void;
        /** Fired on every move. Return `false` to skip this displacement. */
        onTouchMove?(this: any, evt: GestureEvent, offset: Offset): false | void;
        /** Gesture ends. Return `false` to cancel the final action only. */
        onTouchEnd?(this: any, evt: GestureEvent, offset: Offset): false | void;
        /**
         * Before switching pages. Return `false` to cancel, or a number to
         * override the target page (supported by both `page` and `item`).
         */
        onPageStart?(
            this: any,
            page: number,
            oldPage: number,
            actionType: string | null
        ): number | false | void;
        /** After switching pages; `page` is always a number. */
        onPageEnd?(
            this: any,
            oldPage: number,
            page: number,
            actionType: string | null
        ): void;
        onScrollEnd?(
            this: any,
            offsetX: number,
            offsetY: number,
            xDirection: string,
            yDirection: string,
            evt: GestureEvent,
            target?: Element
        ): void;
        /** Return `false` to cancel this zoom step. */
        onScaleStart?(this: any, per: number, evt: GestureEvent): false | void;
        onScaleEnd?(this: any, per: number, evt: GestureEvent): void;
        /** `drag` mode; `this.offsetX` / `this.offsetY` / `this.move()` are available. */
        dragEnd?(this: any, offx: number, offy: number): void;
        /** `item` mode; return a number to override, or `false` to keep the current item. */
        selectHandler?(currentIndex: number, newIndex: number): number | false | void;
    }

    interface CommonOptions extends Callbacks {
        /** Alternative to the second `mode` argument. */
        mode?: Mode;
        /** Only the exact value `'x'` is horizontal; anything else is vertical. */
        direction?: 'x' | 'y' | (string & {});
        /** CSS transition duration in ms. Default 500; `0` is allowed. */
        duration?: number;
        /** Minimum drag distance in px. Default 30. Per-instance, `0` allowed. */
        minOffset?: number | string;
        itemOffWidth?: number;
        itemOffHeight?: number;
        zIndex?: number;
        /** Initial page / item index. Default 0. */
        page?: number;
        /** Auto-advance interval in ms; falsy disables it. */
        changeTime?: number;
        /** Enables wheel input; binds exactly one of `wheel` / `mousewheel` / `DOMMouseScroll`. */
        mousewheel?: boolean;
        /** `page`: prevent dragging beyond the boundaries. */
        locked?: boolean;
        animate?: 'page' | 'default' | 'flip' | string;
        width?: number;
        height?: number;
        paddingRight?: number;
        paddingBottom?: number;
    }

    interface PageOptions extends CommonOptions {
        mode?: 'page';
        /** Wrap around from the last page to the first. */
        loop?: boolean;
        /** Lay out all pages as a strip. Do not combine with `loop`. */
        repeat?: boolean;
    }

    interface ItemOptions extends CommonOptions {
        mode?: 'item';
    }

    interface ScrollOptions extends CommonOptions {
        mode?: 'scroll';
    }

    interface ScrollItemOptions extends CommonOptions {
        mode?: 'scrollItem';
        orientation?: 'left' | 'right' | 'top' | 'bottom';
        maxOffset?: number;
        itemSelector?: string;
    }

    interface DragOptions extends CommonOptions {
        mode?: 'drag';
    }

    interface ScaleOptions extends CommonOptions {
        mode?: 'scale';
        /** The element to transform (e.g. an `<img>` inside the container). */
        target?: Element | null;
        supportTranslate?: boolean;
        maxScale?: number;
        minScale?: number;
    }

    type Options =
        | PageOptions
        | ItemOptions
        | ScrollOptions
        | ScrollItemOptions
        | DragOptions
        | ScaleOptions;

    interface Instance {
        readonly mode: Mode;
        /** Normalised options (a copy — the caller's object is never mutated). */
        readonly option: CommonOptions;
        /** The mode implementation object; `move`, `offset`, `next`, … live here. */
        readonly slipObj: any;
        /** Jump to a page / item. */
        go(index: number): void;
        /** Recalculate sizes and restore positions (call after resize). */
        reset(): void;
        /** Detach listeners and clear timers. */
        destroy(): Instance;
        /** @deprecated Misspelled legacy alias of `destroy()`. */
        destory(): Instance;
        /** Internal helpers; avoid depending on them. */
        bindEvent(enable?: boolean): void;
        transition(enable?: boolean, el?: Element, easing?: string): void;
        setStyle(name: string, value: string, map?: string[], children?: ArrayLike<Element>): void;
        auto(): void;
    }
}

export = jmSlip;
export as namespace jmSlip;

declare global {
    interface Window {
        jmSlip: typeof jmSlip;
    }
}
