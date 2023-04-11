import React, { createContext, useState, useCallback, useMemo, useContext, useRef, useEffect, useLayoutEffect } from 'react';
import classNames from 'classnames';
import { arrow, computePosition, offset, flip, shift } from '@floating-ui/dom';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This function debounce the received function
 * @param { function } 	func				Function to be debounced
 * @param { number } 		wait				Time to wait before execut the function
 * @param { boolean } 	immediate		Param to define if the function will be executed immediately
 */
const debounce = (func, wait, immediate) => {
    let timeout = null;
    return function debounced(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) {
                func.apply(this, args);
            }
        };
        if (immediate && !timeout) {
            /**
             * there's not need to clear the timeout
             * since we expect it to resolve and set `timeout = null`
             */
            func.apply(this, args);
            timeout = setTimeout(later, wait);
        }
        if (!immediate) {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(later, wait);
        }
    };
};

const DEFAULT_TOOLTIP_ID = 'DEFAULT_TOOLTIP_ID';
const DEFAULT_CONTEXT_DATA = {
    anchorRefs: new Set(),
    activeAnchor: { current: null },
    attach: () => {
        /* attach anchor element */
    },
    detach: () => {
        /* detach anchor element */
    },
    setActiveAnchor: () => {
        /* set active anchor */
    },
};
const DEFAULT_CONTEXT_DATA_WRAPPER = {
    getTooltipData: () => DEFAULT_CONTEXT_DATA,
};
const TooltipContext = createContext(DEFAULT_CONTEXT_DATA_WRAPPER);
/**
 * @deprecated Use the `data-tooltip-id` attribute, or the `anchorSelect` prop instead.
 * See https://react-tooltip.com/docs/getting-started
 */
const TooltipProvider = ({ children }) => {
    const [anchorRefMap, setAnchorRefMap] = useState({
        [DEFAULT_TOOLTIP_ID]: new Set(),
    });
    const [activeAnchorMap, setActiveAnchorMap] = useState({
        [DEFAULT_TOOLTIP_ID]: { current: null },
    });
    const attach = (tooltipId, ...refs) => {
        setAnchorRefMap((oldMap) => {
            var _a;
            const tooltipRefs = (_a = oldMap[tooltipId]) !== null && _a !== void 0 ? _a : new Set();
            refs.forEach((ref) => tooltipRefs.add(ref));
            // create new object to trigger re-render
            return { ...oldMap, [tooltipId]: new Set(tooltipRefs) };
        });
    };
    const detach = (tooltipId, ...refs) => {
        setAnchorRefMap((oldMap) => {
            const tooltipRefs = oldMap[tooltipId];
            if (!tooltipRefs) {
                // tooltip not found
                // maybe thow error?
                return oldMap;
            }
            refs.forEach((ref) => tooltipRefs.delete(ref));
            // create new object to trigger re-render
            return { ...oldMap };
        });
    };
    const setActiveAnchor = (tooltipId, ref) => {
        setActiveAnchorMap((oldMap) => {
            var _a;
            if (((_a = oldMap[tooltipId]) === null || _a === void 0 ? void 0 : _a.current) === ref.current) {
                return oldMap;
            }
            // create new object to trigger re-render
            return { ...oldMap, [tooltipId]: ref };
        });
    };
    const getTooltipData = useCallback((tooltipId = DEFAULT_TOOLTIP_ID) => {
        var _a, _b;
        return ({
            anchorRefs: (_a = anchorRefMap[tooltipId]) !== null && _a !== void 0 ? _a : new Set(),
            activeAnchor: (_b = activeAnchorMap[tooltipId]) !== null && _b !== void 0 ? _b : { current: null },
            attach: (...refs) => attach(tooltipId, ...refs),
            detach: (...refs) => detach(tooltipId, ...refs),
            setActiveAnchor: (ref) => setActiveAnchor(tooltipId, ref),
        });
    }, [anchorRefMap, activeAnchorMap, attach, detach]);
    const context = useMemo(() => {
        return {
            getTooltipData,
        };
    }, [getTooltipData]);
    return React.createElement(TooltipContext.Provider, { value: context }, children);
};
function useTooltip(tooltipId = DEFAULT_TOOLTIP_ID) {
    return useContext(TooltipContext).getTooltipData(tooltipId);
}

/**
 * @deprecated Use the `data-tooltip-id` attribute, or the `anchorSelect` prop instead.
 * See https://react-tooltip.com/docs/getting-started
 */
const TooltipWrapper = ({ tooltipId, children, className, place, content, html, variant, offset, wrapper, events, positionStrategy, delayShow, delayHide, }) => {
    const { attach, detach } = useTooltip(tooltipId);
    const anchorRef = useRef(null);
    useEffect(() => {
        attach(anchorRef);
        return () => {
            detach(anchorRef);
        };
    }, []);
    return (React.createElement("span", { ref: anchorRef, className: classNames('react-tooltip-wrapper', className), "data-tooltip-place": place, "data-tooltip-content": content, "data-tooltip-html": html, "data-tooltip-variant": variant, "data-tooltip-offset": offset, "data-tooltip-wrapper": wrapper, "data-tooltip-events": events, "data-tooltip-position-strategy": positionStrategy, "data-tooltip-delay-show": delayShow, "data-tooltip-delay-hide": delayHide }, children));
};

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const computeTooltipPosition = async ({ elementReference = null, tooltipReference = null, tooltipArrowReference = null, place = 'top', offset: offsetValue = 10, strategy = 'absolute', middlewares = [offset(Number(offsetValue)), flip(), shift({ padding: 5 })], }) => {
    if (!elementReference) {
        // elementReference can be null or undefined and we will not compute the position
        // eslint-disable-next-line no-console
        // console.error('The reference element for tooltip was not defined: ', elementReference)
        return { tooltipStyles: {}, tooltipArrowStyles: {}, place };
    }
    if (tooltipReference === null) {
        return { tooltipStyles: {}, tooltipArrowStyles: {}, place };
    }
    const middleware = middlewares;
    if (tooltipArrowReference) {
        middleware.push(arrow({ element: tooltipArrowReference, padding: 5 }));
        return computePosition(elementReference, tooltipReference, {
            placement: place,
            strategy,
            middleware,
        }).then(({ x, y, placement, middlewareData }) => {
            var _a, _b;
            const styles = { left: `${x}px`, top: `${y}px` };
            const { x: arrowX, y: arrowY } = (_a = middlewareData.arrow) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
            const staticSide = (_b = {
                top: 'bottom',
                right: 'left',
                bottom: 'top',
                left: 'right',
            }[placement.split('-')[0]]) !== null && _b !== void 0 ? _b : 'bottom';
            const arrowStyle = {
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                right: '',
                bottom: '',
                [staticSide]: '-4px',
            };
            return { tooltipStyles: styles, tooltipArrowStyles: arrowStyle, place: placement };
        });
    }
    return computePosition(elementReference, tooltipReference, {
        placement: 'bottom',
        strategy,
        middleware,
    }).then(({ x, y, placement }) => {
        const styles = { left: `${x}px`, top: `${y}px` };
        return { tooltipStyles: styles, tooltipArrowStyles: {}, place: placement };
    });
};

var styles = {"tooltip":"styles-module_tooltip__mnnfp","fixed":"styles-module_fixed__7ciUi","arrow":"styles-module_arrow__K0L3T","noArrow":"styles-module_noArrow__T8y2L","clickable":"styles-module_clickable__Bv9o7","show":"styles-module_show__2NboJ","dark":"styles-module_dark__xNqje","light":"styles-module_light__Z6W-X","success":"styles-module_success__A2AKt","warning":"styles-module_warning__SCK0X","error":"styles-module_error__JvumD","info":"styles-module_info__BWdHW"};

const Tooltip = ({ 
// props
id, className, classNameArrow, variant = 'dark', anchorId, anchorSelect, place = 'top', offset = 10, events = ['hover'], openOnClick = false, positionStrategy = 'absolute', middlewares, wrapper: WrapperElement, delayShow = 0, delayHide = 0, float = false, noArrow = false, clickable = false, closeOnEsc = false, style: externalStyles, position, afterShow, afterHide, 
// props handled by controller
content, contentWrapperRef, isOpen, setIsOpen, activeAnchor, setActiveAnchor, }) => {
    const tooltipRef = useRef(null);
    const tooltipArrowRef = useRef(null);
    const tooltipShowDelayTimerRef = useRef(null);
    const tooltipHideDelayTimerRef = useRef(null);
    const [actualPlacement, setActualPlacement] = useState(place);
    const [inlineStyles, setInlineStyles] = useState({});
    const [inlineArrowStyles, setInlineArrowStyles] = useState({});
    const [show, setShow] = useState(false);
    const [rendered, setRendered] = useState(false);
    const wasShowing = useRef(false);
    const lastFloatPosition = useRef(null);
    /**
     * @todo Remove this in a future version (provider/wrapper method is deprecated)
     */
    const { anchorRefs, setActiveAnchor: setProviderActiveAnchor } = useTooltip(id);
    const hoveringTooltip = useRef(false);
    const [anchorsBySelect, setAnchorsBySelect] = useState([]);
    const mounted = useRef(false);
    const shouldOpenOnClick = openOnClick || events.includes('click');
    /**
     * useLayoutEffect runs before useEffect,
     * but should be used carefully because of caveats
     * https://beta.reactjs.org/reference/react/useLayoutEffect#caveats
     */
    useIsomorphicLayoutEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useEffect(() => {
        if (!show) {
            /**
             * this fixes weird behavior when switching between two anchor elements very quickly
             * remove the timeout and switch quickly between two adjancent anchor elements to see it
             *
             * in practice, this means the tooltip is not immediately removed from the DOM on hide
             */
            const timeout = setTimeout(() => {
                setRendered(false);
            }, 150);
            return () => {
                clearTimeout(timeout);
            };
        }
        return () => null;
    }, [show]);
    const handleShow = (value) => {
        if (!mounted.current) {
            return;
        }
        if (value) {
            setRendered(true);
        }
        /**
         * wait for the component to render and calculate position
         * before actually showing
         */
        setTimeout(() => {
            if (!mounted.current) {
                return;
            }
            setIsOpen === null || setIsOpen === void 0 ? void 0 : setIsOpen(value);
            if (isOpen === undefined) {
                setShow(value);
            }
        }, 10);
    };
    /**
     * this replicates the effect from `handleShow()`
     * when `isOpen` is changed from outside
     */
    useEffect(() => {
        if (isOpen === undefined) {
            return () => null;
        }
        if (isOpen) {
            setRendered(true);
        }
        const timeout = setTimeout(() => {
            setShow(isOpen);
        }, 10);
        return () => {
            clearTimeout(timeout);
        };
    }, [isOpen]);
    useEffect(() => {
        if (show === wasShowing.current) {
            return;
        }
        wasShowing.current = show;
        if (show) {
            afterShow === null || afterShow === void 0 ? void 0 : afterShow();
        }
        else {
            afterHide === null || afterHide === void 0 ? void 0 : afterHide();
        }
    }, [show]);
    const handleShowTooltipDelayed = () => {
        if (tooltipShowDelayTimerRef.current) {
            clearTimeout(tooltipShowDelayTimerRef.current);
        }
        tooltipShowDelayTimerRef.current = setTimeout(() => {
            handleShow(true);
        }, delayShow);
    };
    const handleHideTooltipDelayed = (delay = delayHide) => {
        if (tooltipHideDelayTimerRef.current) {
            clearTimeout(tooltipHideDelayTimerRef.current);
        }
        tooltipHideDelayTimerRef.current = setTimeout(() => {
            if (hoveringTooltip.current) {
                return;
            }
            handleShow(false);
        }, delay);
    };
    const handleShowTooltip = (event) => {
        var _a;
        if (!event) {
            return;
        }
        const target = ((_a = event.currentTarget) !== null && _a !== void 0 ? _a : event.target);
        if (!(target === null || target === void 0 ? void 0 : target.isConnected)) {
            /**
             * this happens when the target is removed from the DOM
             * at the same time the tooltip gets triggered
             */
            setActiveAnchor(null);
            setProviderActiveAnchor({ current: null });
            return;
        }
        if (delayShow) {
            handleShowTooltipDelayed();
        }
        else {
            handleShow(true);
        }
        setActiveAnchor(target);
        setProviderActiveAnchor({ current: target });
        if (tooltipHideDelayTimerRef.current) {
            clearTimeout(tooltipHideDelayTimerRef.current);
        }
    };
    const handleHideTooltip = () => {
        if (clickable) {
            // allow time for the mouse to reach the tooltip, in case there's a gap
            handleHideTooltipDelayed(delayHide || 100);
        }
        else if (delayHide) {
            handleHideTooltipDelayed();
        }
        else {
            handleShow(false);
        }
        if (tooltipShowDelayTimerRef.current) {
            clearTimeout(tooltipShowDelayTimerRef.current);
        }
    };
    const handleTooltipPosition = ({ x, y }) => {
        const virtualElement = {
            getBoundingClientRect() {
                return {
                    x,
                    y,
                    width: 0,
                    height: 0,
                    top: y,
                    left: x,
                    right: x,
                    bottom: y,
                };
            },
        };
        computeTooltipPosition({
            place,
            offset,
            elementReference: virtualElement,
            tooltipReference: tooltipRef.current,
            tooltipArrowReference: tooltipArrowRef.current,
            strategy: positionStrategy,
            middlewares,
        }).then((computedStylesData) => {
            if (Object.keys(computedStylesData.tooltipStyles).length) {
                setInlineStyles(computedStylesData.tooltipStyles);
            }
            if (Object.keys(computedStylesData.tooltipArrowStyles).length) {
                setInlineArrowStyles(computedStylesData.tooltipArrowStyles);
            }
            setActualPlacement(computedStylesData.place);
        });
    };
    const handleMouseMove = (event) => {
        if (!event) {
            return;
        }
        const mouseEvent = event;
        const mousePosition = {
            x: mouseEvent.clientX,
            y: mouseEvent.clientY,
        };
        handleTooltipPosition(mousePosition);
        lastFloatPosition.current = mousePosition;
    };
    const handleClickTooltipAnchor = (event) => {
        handleShowTooltip(event);
        if (delayHide) {
            handleHideTooltipDelayed();
        }
    };
    const handleClickOutsideAnchors = (event) => {
        var _a;
        const anchorById = document.querySelector(`[id='${anchorId}']`);
        const anchors = [anchorById, ...anchorsBySelect];
        if (anchors.some((anchor) => anchor === null || anchor === void 0 ? void 0 : anchor.contains(event.target))) {
            return;
        }
        if ((_a = tooltipRef.current) === null || _a === void 0 ? void 0 : _a.contains(event.target)) {
            return;
        }
        handleShow(false);
    };
    const handleEsc = (event) => {
        if (event.key !== 'Escape') {
            return;
        }
        handleShow(false);
    };
    // debounce handler to prevent call twice when
    // mouse enter and focus events being triggered toggether
    const debouncedHandleShowTooltip = debounce(handleShowTooltip, 50, true);
    const debouncedHandleHideTooltip = debounce(handleHideTooltip, 50, true);
    useEffect(() => {
        var _a, _b;
        const elementRefs = new Set(anchorRefs);
        anchorsBySelect.forEach((anchor) => {
            elementRefs.add({ current: anchor });
        });
        const anchorById = document.querySelector(`[id='${anchorId}']`);
        if (anchorById) {
            elementRefs.add({ current: anchorById });
        }
        if (closeOnEsc) {
            window.addEventListener('keydown', handleEsc);
        }
        const enabledEvents = [];
        if (shouldOpenOnClick) {
            window.addEventListener('click', handleClickOutsideAnchors);
            enabledEvents.push({ event: 'click', listener: handleClickTooltipAnchor });
        }
        else {
            enabledEvents.push({ event: 'mouseenter', listener: debouncedHandleShowTooltip }, { event: 'mouseleave', listener: debouncedHandleHideTooltip }, { event: 'focus', listener: debouncedHandleShowTooltip }, { event: 'blur', listener: debouncedHandleHideTooltip });
            if (float) {
                enabledEvents.push({
                    event: 'mousemove',
                    listener: handleMouseMove,
                });
            }
        }
        const handleMouseEnterTooltip = () => {
            hoveringTooltip.current = true;
        };
        const handleMouseLeaveTooltip = () => {
            hoveringTooltip.current = false;
            handleHideTooltip();
        };
        if (clickable && !shouldOpenOnClick) {
            (_a = tooltipRef.current) === null || _a === void 0 ? void 0 : _a.addEventListener('mouseenter', handleMouseEnterTooltip);
            (_b = tooltipRef.current) === null || _b === void 0 ? void 0 : _b.addEventListener('mouseleave', handleMouseLeaveTooltip);
        }
        enabledEvents.forEach(({ event, listener }) => {
            elementRefs.forEach((ref) => {
                var _a;
                (_a = ref.current) === null || _a === void 0 ? void 0 : _a.addEventListener(event, listener);
            });
        });
        return () => {
            var _a, _b;
            if (shouldOpenOnClick) {
                window.removeEventListener('click', handleClickOutsideAnchors);
            }
            if (closeOnEsc) {
                window.removeEventListener('keydown', handleEsc);
            }
            if (clickable && !shouldOpenOnClick) {
                (_a = tooltipRef.current) === null || _a === void 0 ? void 0 : _a.removeEventListener('mouseenter', handleMouseEnterTooltip);
                (_b = tooltipRef.current) === null || _b === void 0 ? void 0 : _b.removeEventListener('mouseleave', handleMouseLeaveTooltip);
            }
            enabledEvents.forEach(({ event, listener }) => {
                elementRefs.forEach((ref) => {
                    var _a;
                    (_a = ref.current) === null || _a === void 0 ? void 0 : _a.removeEventListener(event, listener);
                });
            });
        };
        /**
         * rendered is also a dependency to ensure anchor observers are re-registered
         * since `tooltipRef` becomes stale after removing/adding the tooltip to the DOM
         */
    }, [rendered, anchorRefs, anchorsBySelect, closeOnEsc, events]);
    useEffect(() => {
        let selector = anchorSelect !== null && anchorSelect !== void 0 ? anchorSelect : '';
        if (!selector && id) {
            selector = `[data-tooltip-id='${id}']`;
        }
        const documentObserverCallback = (mutationList) => {
            const newAnchors = [];
            mutationList.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-tooltip-id') {
                    const newId = mutation.target.getAttribute('data-tooltip-id');
                    if (newId === id) {
                        newAnchors.push(mutation.target);
                    }
                }
                if (mutation.type !== 'childList') {
                    return;
                }
                if (activeAnchor) {
                    [...mutation.removedNodes].some((node) => {
                        var _a;
                        if ((_a = node === null || node === void 0 ? void 0 : node.contains) === null || _a === void 0 ? void 0 : _a.call(node, activeAnchor)) {
                            setRendered(false);
                            handleShow(false);
                            setActiveAnchor(null);
                            return true;
                        }
                        return false;
                    });
                }
                if (!selector) {
                    return;
                }
                try {
                    const elements = [...mutation.addedNodes].filter((node) => node.nodeType === 1);
                    newAnchors.push(
                    // the element itself is an anchor
                    ...elements.filter((element) => element.matches(selector)));
                    newAnchors.push(
                    // the element has children which are anchors
                    ...elements.flatMap((element) => [...element.querySelectorAll(selector)]));
                }
                catch (_a) {
                    /**
                     * invalid CSS selector.
                     * already warned on tooltip controller
                     */
                }
            });
            if (newAnchors.length) {
                setAnchorsBySelect((anchors) => [...anchors, ...newAnchors]);
            }
        };
        const documentObserver = new MutationObserver(documentObserverCallback);
        // watch for anchor being removed from the DOM
        documentObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-tooltip-id'],
        });
        return () => {
            documentObserver.disconnect();
        };
    }, [id, anchorSelect, activeAnchor]);
    const updateTooltipPosition = () => {
        if (position) {
            // if `position` is set, override regular and `float` positioning
            handleTooltipPosition(position);
            return;
        }
        if (float) {
            if (lastFloatPosition.current) {
                /*
                  Without this, changes to `content`, `place`, `offset`, ..., will only
                  trigger a position calculation after a `mousemove` event.
        
                  To see why this matters, comment this line, run `yarn dev` and click the
                  "Hover me!" anchor.
                */
                handleTooltipPosition(lastFloatPosition.current);
            }
            // if `float` is set, override regular positioning
            return;
        }
        computeTooltipPosition({
            place,
            offset,
            elementReference: activeAnchor,
            tooltipReference: tooltipRef.current,
            tooltipArrowReference: tooltipArrowRef.current,
            strategy: positionStrategy,
            middlewares,
        }).then((computedStylesData) => {
            if (!mounted.current) {
                // invalidate computed positions after remount
                return;
            }
            if (Object.keys(computedStylesData.tooltipStyles).length) {
                setInlineStyles(computedStylesData.tooltipStyles);
            }
            if (Object.keys(computedStylesData.tooltipArrowStyles).length) {
                setInlineArrowStyles(computedStylesData.tooltipArrowStyles);
            }
            setActualPlacement(computedStylesData.place);
        });
    };
    useEffect(() => {
        updateTooltipPosition();
    }, [show, activeAnchor, content, externalStyles, place, offset, positionStrategy, position]);
    useEffect(() => {
        if (!(contentWrapperRef === null || contentWrapperRef === void 0 ? void 0 : contentWrapperRef.current)) {
            return () => null;
        }
        const contentObserver = new ResizeObserver(() => {
            updateTooltipPosition();
        });
        contentObserver.observe(contentWrapperRef.current);
        return () => {
            contentObserver.disconnect();
        };
    }, [content, contentWrapperRef === null || contentWrapperRef === void 0 ? void 0 : contentWrapperRef.current]);
    useEffect(() => {
        var _a;
        const anchorById = document.querySelector(`[id='${anchorId}']`);
        const anchors = [...anchorsBySelect, anchorById];
        if (!activeAnchor || !anchors.includes(activeAnchor)) {
            /**
             * if there is no active anchor,
             * or if the current active anchor is not amongst the allowed ones,
             * reset it
             */
            setActiveAnchor((_a = anchorsBySelect[0]) !== null && _a !== void 0 ? _a : anchorById);
        }
    }, [anchorId, anchorsBySelect, activeAnchor]);
    useEffect(() => {
        return () => {
            if (tooltipShowDelayTimerRef.current) {
                clearTimeout(tooltipShowDelayTimerRef.current);
            }
            if (tooltipHideDelayTimerRef.current) {
                clearTimeout(tooltipHideDelayTimerRef.current);
            }
        };
    }, []);
    useEffect(() => {
        let selector = anchorSelect;
        if (!selector && id) {
            selector = `[data-tooltip-id='${id}']`;
        }
        if (!selector) {
            return;
        }
        try {
            const anchors = Array.from(document.querySelectorAll(selector));
            setAnchorsBySelect(anchors);
        }
        catch (_a) {
            // warning was already issued in the controller
            setAnchorsBySelect([]);
        }
    }, [id, anchorSelect]);
    const canShow = content && show && Object.keys(inlineStyles).length > 0;
    return rendered ? (React.createElement(WrapperElement, { id: id, role: "tooltip", className: classNames('react-tooltip', styles['tooltip'], styles[variant], className, `react-tooltip__place-${actualPlacement}`, {
            [styles['show']]: canShow,
            [styles['fixed']]: positionStrategy === 'fixed',
            [styles['clickable']]: clickable,
        }), style: { ...externalStyles, ...inlineStyles }, ref: tooltipRef },
        content,
        React.createElement(WrapperElement, { className: classNames('react-tooltip-arrow', styles['arrow'], classNameArrow, {
                /**
                 * changed from dash `no-arrow` to camelcase because of:
                 * https://github.com/indooorsman/esbuild-css-modules-plugin/issues/42
                 */
                [styles['noArrow']]: noArrow,
            }), style: inlineArrowStyles, ref: tooltipArrowRef }))) : null;
};

/* eslint-disable react/no-danger */
const TooltipContent = ({ content }) => {
    return React.createElement("span", { dangerouslySetInnerHTML: { __html: content } });
};

const TooltipController = ({ id, anchorId, anchorSelect, content, html, render, className, classNameArrow, variant = 'dark', place = 'top', offset = 10, wrapper = 'div', children = null, events = ['hover'], openOnClick = false, positionStrategy = 'absolute', middlewares, delayShow = 0, delayHide = 0, float = false, noArrow = false, clickable = false, closeOnEsc = false, style, position, isOpen, setIsOpen, afterShow, afterHide, }) => {
    const [tooltipContent, setTooltipContent] = useState(content);
    const [tooltipHtml, setTooltipHtml] = useState(html);
    const [tooltipPlace, setTooltipPlace] = useState(place);
    const [tooltipVariant, setTooltipVariant] = useState(variant);
    const [tooltipOffset, setTooltipOffset] = useState(offset);
    const [tooltipDelayShow, setTooltipDelayShow] = useState(delayShow);
    const [tooltipDelayHide, setTooltipDelayHide] = useState(delayHide);
    const [tooltipFloat, setTooltipFloat] = useState(float);
    const [tooltipWrapper, setTooltipWrapper] = useState(wrapper);
    const [tooltipEvents, setTooltipEvents] = useState(events);
    const [tooltipPositionStrategy, setTooltipPositionStrategy] = useState(positionStrategy);
    const [activeAnchor, setActiveAnchor] = useState(null);
    /**
     * @todo Remove this in a future version (provider/wrapper method is deprecated)
     */
    const { anchorRefs, activeAnchor: providerActiveAnchor } = useTooltip(id);
    const getDataAttributesFromAnchorElement = (elementReference) => {
        const dataAttributes = elementReference === null || elementReference === void 0 ? void 0 : elementReference.getAttributeNames().reduce((acc, name) => {
            var _a;
            if (name.startsWith('data-tooltip-')) {
                const parsedAttribute = name.replace(/^data-tooltip-/, '');
                acc[parsedAttribute] = (_a = elementReference === null || elementReference === void 0 ? void 0 : elementReference.getAttribute(name)) !== null && _a !== void 0 ? _a : null;
            }
            return acc;
        }, {});
        return dataAttributes;
    };
    const applyAllDataAttributesFromAnchorElement = (dataAttributes) => {
        const handleDataAttributes = {
            place: (value) => {
                var _a;
                setTooltipPlace((_a = value) !== null && _a !== void 0 ? _a : place);
            },
            content: (value) => {
                setTooltipContent(value !== null && value !== void 0 ? value : content);
            },
            html: (value) => {
                setTooltipHtml(value !== null && value !== void 0 ? value : html);
            },
            variant: (value) => {
                var _a;
                setTooltipVariant((_a = value) !== null && _a !== void 0 ? _a : variant);
            },
            offset: (value) => {
                setTooltipOffset(value === null ? offset : Number(value));
            },
            wrapper: (value) => {
                var _a;
                setTooltipWrapper((_a = value) !== null && _a !== void 0 ? _a : wrapper);
            },
            events: (value) => {
                const parsed = value === null || value === void 0 ? void 0 : value.split(' ');
                setTooltipEvents(parsed !== null && parsed !== void 0 ? parsed : events);
            },
            'position-strategy': (value) => {
                var _a;
                setTooltipPositionStrategy((_a = value) !== null && _a !== void 0 ? _a : positionStrategy);
            },
            'delay-show': (value) => {
                setTooltipDelayShow(value === null ? delayShow : Number(value));
            },
            'delay-hide': (value) => {
                setTooltipDelayHide(value === null ? delayHide : Number(value));
            },
            float: (value) => {
                setTooltipFloat(value === null ? float : value === 'true');
            },
        };
        // reset unset data attributes to default values
        // without this, data attributes from the last active anchor will still be used
        Object.values(handleDataAttributes).forEach((handler) => handler(null));
        Object.entries(dataAttributes).forEach(([key, value]) => {
            var _a;
            (_a = handleDataAttributes[key]) === null || _a === void 0 ? void 0 : _a.call(handleDataAttributes, value);
        });
    };
    useEffect(() => {
        setTooltipContent(content);
    }, [content]);
    useEffect(() => {
        setTooltipHtml(html);
    }, [html]);
    useEffect(() => {
        setTooltipPlace(place);
    }, [place]);
    useEffect(() => {
        var _a;
        const elementRefs = new Set(anchorRefs);
        let selector = anchorSelect;
        if (!selector && id) {
            selector = `[data-tooltip-id='${id}']`;
        }
        if (selector) {
            try {
                const anchorsBySelect = document.querySelectorAll(selector);
                anchorsBySelect.forEach((anchor) => {
                    elementRefs.add({ current: anchor });
                });
            }
            catch (_b) {
                {
                    // eslint-disable-next-line no-console
                    console.warn(`[react-tooltip] "${anchorSelect}" is not a valid CSS selector`);
                }
            }
        }
        const anchorById = document.querySelector(`[id='${anchorId}']`);
        if (anchorById) {
            elementRefs.add({ current: anchorById });
        }
        if (!elementRefs.size) {
            return () => null;
        }
        const anchorElement = (_a = activeAnchor !== null && activeAnchor !== void 0 ? activeAnchor : anchorById) !== null && _a !== void 0 ? _a : providerActiveAnchor.current;
        const observerCallback = (mutationList) => {
            mutationList.forEach((mutation) => {
                var _a;
                if (!anchorElement ||
                    mutation.type !== 'attributes' ||
                    !((_a = mutation.attributeName) === null || _a === void 0 ? void 0 : _a.startsWith('data-tooltip-'))) {
                    return;
                }
                // make sure to get all set attributes, since all unset attributes are reset
                const dataAttributes = getDataAttributesFromAnchorElement(anchorElement);
                applyAllDataAttributesFromAnchorElement(dataAttributes);
            });
        };
        // Create an observer instance linked to the callback function
        const observer = new MutationObserver(observerCallback);
        // do not check for subtree and childrens, we only want to know attribute changes
        // to stay watching `data-attributes-*` from anchor element
        const observerConfig = { attributes: true, childList: false, subtree: false };
        if (anchorElement) {
            const dataAttributes = getDataAttributesFromAnchorElement(anchorElement);
            applyAllDataAttributesFromAnchorElement(dataAttributes);
            // Start observing the target node for configured mutations
            observer.observe(anchorElement, observerConfig);
        }
        return () => {
            // Remove the observer when the tooltip is destroyed
            observer.disconnect();
        };
    }, [anchorRefs, providerActiveAnchor, activeAnchor, anchorId, anchorSelect]);
    /**
     * content priority: children < renderContent or content < html
     * children should be lower priority so that it can be used as the "default" content
     */
    let renderedContent = children;
    const contentWrapperRef = useRef(null);
    if (render) {
        renderedContent = (React.createElement("div", { ref: contentWrapperRef, className: "react-tooltip-content-wrapper" }, render({ content: tooltipContent !== null && tooltipContent !== void 0 ? tooltipContent : null, activeAnchor })));
    }
    else if (tooltipContent) {
        renderedContent = tooltipContent;
    }
    if (tooltipHtml) {
        renderedContent = React.createElement(TooltipContent, { content: tooltipHtml });
    }
    const props = {
        id,
        anchorId,
        anchorSelect,
        className,
        classNameArrow,
        content: renderedContent,
        contentWrapperRef,
        place: tooltipPlace,
        variant: tooltipVariant,
        offset: tooltipOffset,
        wrapper: tooltipWrapper,
        events: tooltipEvents,
        openOnClick,
        positionStrategy: tooltipPositionStrategy,
        middlewares,
        delayShow: tooltipDelayShow,
        delayHide: tooltipDelayHide,
        float: tooltipFloat,
        noArrow,
        clickable,
        closeOnEsc,
        style,
        position,
        isOpen,
        setIsOpen,
        afterShow,
        afterHide,
        activeAnchor,
        setActiveAnchor: (anchor) => setActiveAnchor(anchor),
    };
    return React.createElement(Tooltip, { ...props });
};

export { TooltipController as Tooltip, TooltipProvider, TooltipWrapper };
//# sourceMappingURL=react-tooltip.mjs.map
