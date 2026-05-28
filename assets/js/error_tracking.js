/**
 * error_tracking.js
 * Отслеживание ошибок загрузки ресурсов и необработанных исключений.
 * Использует sendBeacon + FormData (нет CORS).
 */
(function() {
    'use strict';

    const SCRIPT_URL = window.APP_CONFIG?.SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbznCkIVFWT-YcP8YDQA3HAMHDC0g8jx3o_AmwzBQEoxKl2Prxw7PRhni98F303ZxwPXpA/exec';
    if (!SCRIPT_URL) return;

    let lastErrorHash = '';
    let lastErrorTime = 0;
    const ERROR_DEBOUNCE_MS = 5000;

    function getUserId() {
        return window.getOrCreateLocalUserId ? window.getOrCreateLocalUserId() : 'unknown';
    }

    function getPageContext() {
        return {
            url: window.location.href,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString()
        };
    }

    function sendErrorReport(errorType, details, isCritical = false) {
        const now = Date.now();
        const errorHash = `${errorType}|${details.message || details.src || ''}`;
        if (errorHash === lastErrorHash && (now - lastErrorTime) < ERROR_DEBOUNCE_MS) return;
        lastErrorHash = errorHash;
        lastErrorTime = now;

        const context = getPageContext();
        const formData = new FormData();
        formData.append('formType', 'Техническая ошибка');
        formData.append('name', 'System');
        formData.append('phone', ' ');
        formData.append('email', ' ');
        formData.append('consent', 'Да');
        formData.append('comment', JSON.stringify({
            errorType: errorType,
            details: details,
            page: context.url,
            userAgent: context.userAgent,
            screenSize: context.screenSize,
            viewport: context.viewport,
            userId: getUserId(),
            isCritical: isCritical
        }));
        formData.append('userId', getUserId());
        formData.append('page', context.url);
        formData.append('device', navigator.userAgent);

        if (navigator.sendBeacon) {
            navigator.sendBeacon(SCRIPT_URL, formData);
        } else {
            fetch(SCRIPT_URL, { method: 'POST', body: formData, mode: 'no-cors' })
                .catch(e => console.warn('Ошибка отправки технического лога:', e));
        }
    }

    function trackImageErrors() {
        document.addEventListener('error', function(e) {
            const target = e.target;
            if (target.tagName === 'IMG') {
                sendErrorReport('ImageLoadError', {
                    src: target.src,
                    alt: target.alt || '',
                    width: target.width,
                    height: target.height
                }, false);
                if (!target.hasAttribute('data-error-tracked')) {
                    target.setAttribute('data-error-tracked', 'true');
                }
            }
        }, true);
    }

    function trackResourceErrors() {
        if (window.PerformanceObserver) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'resource' && entry.duration === 0 && !entry.transferSize) {
                            sendErrorReport('ResourceLoadError', {
                                name: entry.name,
                                initiatorType: entry.initiatorType,
                                startTime: entry.startTime
                            }, false);
                        }
                    }
                });
                observer.observe({ entryTypes: ['resource'] });
            } catch(e) {}
        }

        document.addEventListener('error', function(e) {
            const target = e.target;
            if (target.tagName === 'LINK' || target.tagName === 'SCRIPT') {
                sendErrorReport('ResourceLoadError', {
                    src: target.href || target.src,
                    tagName: target.tagName
                }, target.tagName === 'SCRIPT');
            }
        }, true);
    }

    function trackGlobalErrors() {
        window.addEventListener('error', function(event) {
            sendErrorReport('JavaScriptError', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            }, true);
        });

        window.addEventListener('unhandledrejection', function(event) {
            sendErrorReport('UnhandledRejection', {
                reason: event.reason?.toString() || 'Unknown reason',
                stack: event.reason?.stack
            }, true);
        });
    }

    function checkVisibleImagesOnLoad() {
        window.addEventListener('load', function() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (!img.complete || img.naturalWidth === 0) {
                    sendErrorReport('ImageLoadError (delayed)', {
                        src: img.src,
                        alt: img.alt
                    }, false);
                }
            });
        });
    }

    function interceptConsoleError() {
        const originalConsoleError = console.error;
        console.error = function(...args) {
            originalConsoleError.apply(console, args);
            const message = args.map(arg => {
                if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
                return String(arg);
            }).join(' ');
            if (message.includes('Failed to load') || message.includes('404') || message.includes('network')) {
                sendErrorReport('ConsoleError', { message: message }, false);
            }
        };
    }

    function initErrorTracking() {
        if (window._errorTrackingInitialized) return;
        window._errorTrackingInitialized = true;
        trackImageErrors();
        trackResourceErrors();
        trackGlobalErrors();
        checkVisibleImagesOnLoad();
        interceptConsoleError();
        console.log('[ErrorTracking] Активен');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initErrorTracking);
    } else {
        initErrorTracking();
    }

    window.initErrorTracking = initErrorTracking;
})();