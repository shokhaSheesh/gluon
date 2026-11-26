/** Recharts entry animations never finish in headless Chrome (used for screenshots); disable them there only. */
export const ANIM = typeof navigator === 'undefined' || !/HeadlessChrome/.test(navigator.userAgent);
