// Simple UI helper functions for document pages
export const qs = (selector) => document.querySelector(selector);
export const on = (element, event, handler) => element?.addEventListener(event, handler);