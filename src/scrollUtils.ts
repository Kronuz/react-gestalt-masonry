/**
 * Measuring scroll positions, element heights, etc is different between
 * different browsers and the window object vs other DOM nodes. These
 * utils abstract away these differences.
 */

export function getElementHeight(element: HTMLElement | Window): number {
  return element === window ? window.innerHeight : (element as HTMLElement).clientHeight;
}

export function getWindowScrollPos() {
  if (window.scrollY !== undefined) {
    // Modern browser
    return window.scrollY;
  }
  if (
    document.documentElement &&
    document.documentElement.scrollTop !== undefined
  ) {
    // IE support.
    return document.documentElement.scrollTop;
  }
  return 0;
}

export function getRelativeScrollTop(element: HTMLElement | Window): number {
  return element === window
    ? getWindowScrollPos()
    : (element as HTMLElement).scrollTop - (element as HTMLElement).getBoundingClientRect().top;
}

export function getScrollHeight(element: HTMLElement | Window): number {
  return element === window && document.documentElement
    ? document.documentElement.scrollHeight
    : (element as HTMLElement).scrollHeight;
}

export function getScrollPos(element: HTMLElement | Window): number {
  return element === window ? getWindowScrollPos() : (element as HTMLElement).scrollTop;
}
