'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * vendor prefixes that being taken into consideration.
 */
var vendors = ['webkit', 'ms', 'moz', 'o'];
/**
 * get vendor property name that contains uppercase letter.
 * e.g. webkitTransform
 * @param prop property name. for example: transform
 * @param host optional. property owner. default to `document.body.style`.
 */
function getProperty(prop, host) {
    var targetHost = host || document.body.style;
    if (!(prop in targetHost)) {
        var char1 = prop.charAt(0).toUpperCase();
        var charLeft = prop.substr(1);
        for (var i = 0; i < vendors.length; i++) {
            var vendorProp = vendors[i] + char1 + charLeft;
            if (vendorProp in targetHost) {
                return vendorProp;
            }
        }
    }
    return prop;
}

/**
 * bind event
 * @param target window | HTMLElement
 * @param type event type
 * @param handler event handler
 * @param capture if capture phase
 */
function on(target, type, handler, capture) {
    if (capture === void 0) { capture = false; }
    target.addEventListener(type, handler, capture);
}
/**
 * unbind event
 * @param target window | HTMLElement
 * @param type event type
 * @param handler event handler
 * @param capture if capture phase
 */
function off(target, type, handler, capture) {
    if (capture === void 0) { capture = false; }
    target.removeEventListener(type, handler, capture);
}
/**
 * bind mouse or touch event according to current env
 * @param el  window | HTMLElement
 * @param onStart on start handler
 * @param onMove on move handler
 * @param onEnd on end handler
 * @param onCancel on cancel handler. useless in none-touch device.
 */
function XTouch(el, onStart, onMove, onEnd, onCancel) {
    var isTouchDevice = 'ontouchstart' in window;
    if (isTouchDevice) {
        on(el, 'touchstart', onStart);
        on(window, 'touchmove', onMove);
        on(window, 'touchend', onEnd);
        on(el, 'touchcancel', onCancel);
    }
    else {
        var oldStart_1 = onStart, oldMove_1 = onMove, oldEnd_1 = onEnd;
        onStart = function (e) {
            // @ts-ignore
            e.identifier = 0;
            // @ts-ignore
            e.touches = e.changedTouches = [e];
            oldStart_1(e);
        };
        onMove = function (e) {
            // @ts-ignore
            e.identifier = 0;
            // @ts-ignore
            e.touches = e.changedTouches = [e];
            oldMove_1(e);
        };
        onEnd = function (e) {
            // @ts-ignore
            e.identifier = 0;
            // @ts-ignore
            e.touches = [];
            // @ts-ignore
            e.changedTouches = [e];
            oldEnd_1(e);
        };
        on(el, 'mousedown', onStart);
        on(window, 'mousemove', onMove);
        on(window, 'mouseup', onEnd);
    }
    return function unbind() {
        if (isTouchDevice) {
            off(el, 'touchstart', onStart);
            off(window, 'touchmove', onMove);
            off(window, 'touchend', onEnd);
            off(el, 'touchcancel', onCancel);
        }
        else {
            off(el, 'mousedown', onStart);
            off(window, 'mousemove', onMove);
            off(window, 'mouseup', onEnd);
        }
    };
}

/**
 * `transform` property name with browser vendor prefix if needed.
 */
var transformProperty = getProperty('transform');
/**
 * make a element draggable
 * @param el target html element
 * @param options options
 */
function Draggable(el, options) {
    // matrix(1, 0, 0, 1, -60, -49)
    // matrix(3.5, 0, 0, 3.5, 0, 0)
    var unbind = XTouch(el, handleDown, handleMove, handleUp, handleUp);
    var oldParts = getTransform(el);
    var _a = options || {}, onMoving = _a.onMoving, onStart = _a.onStart, onEnd = _a.onEnd, maxX = _a.maxX, maxY = _a.maxY, minX = _a.minX, minY = _a.minY;
    var startX = 0, startY = 0;
    var beginX = 0, beginY = 0;
    var isTouchDown = false;
    function handleDown(e) {
        isTouchDown = true;
        beginX = startX = e.touches[0].pageX;
        beginY = startY = e.touches[0].pageY;
        onStart && onStart(e);
    }
    function handleMove(e) {
        if (isTouchDown) {
            var touch = e.touches[0];
            var parts = getTransform(el);
            var deltX = touch.pageX - startX;
            var deltY = touch.pageY - startY;
            var x = deltX + +parts[4];
            var y = deltY + +parts[5];
            startX = touch.pageX;
            startY = touch.pageY;
            // take transform: scale into consideration
            // TODO: does transformOrigin affect the result?
            if (parts[0] > 1) {
                maxX *= +parts[0];
                minX *= +parts[0];
            }
            if (parts[3] > 1) {
                maxY *= +parts[3];
                minY *= +parts[3];
            }
            if (x > maxX) {
                x = maxX;
            }
            else if (x < minX) {
                x = minX;
            }
            if (y > maxY) {
                y = maxY;
            }
            else if (y < minY) {
                y = minY;
            }
            if (onMoving && onMoving({
                totalDeltX: touch.pageX - beginX,
                totalDeltY: touch.pageY - beginY,
                deltX: deltX,
                deltY: deltY,
                originalEvent: e
            }) === false) {
                return;
            }
            parts[4] = x;
            parts[5] = y;
            // @ts-ignore ts handle string index incorrectly, so ignore it.
            el.style[transformProperty] = "matrix(" + parts.join(',') + ")";
        }
    }
    function handleUp(e) {
        isTouchDown = false;
        onEnd && onEnd(e);
    }
    function reset() {
        var parts = getTransform(el);
        parts[4] = oldParts[4];
        parts[5] = oldParts[5];
        // @ts-ignore
        el.style[transformProperty] = "matrix(" + parts.join(',') + ")";
    }
    return {
        reset: reset,
        destroy: unbind
    };
}
/**
 * get computed style of transform
 * @param el target html element
 */
function getTransform(el) {
    // @ts-ignore
    var transform = window.getComputedStyle(el)[transformProperty];
    if (!transform || transform === 'none') {
        transform = 'matrix(1, 0, 0, 1, 0, 0)';
    }
    return transform.replace(/\(|\)|matrix|\s+/g, '').split(',');
}

exports.default = Draggable;
exports.getTransform = getTransform;
exports.transformProperty = transformProperty;
