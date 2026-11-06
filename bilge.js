/**
 * Bilge — frontend error reporting snippet.
 * Include on any page to send uncaught errors and unhandled promise rejections to Bilge.
 * Canonical URL: <your Bilge origin>/js/bilge.js
 *
 * Configuration (one of):
 * - data-ingest-url / data-api-key on the script tag (or data-bilge-ingest-url / data-bilge-api-key)
 * - window.BILGE_INGEST_URL and window.BILGE_API_KEY
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var ingestUrl =
    (script && script.getAttribute('data-ingest-url')) ||
    (script && script.getAttribute('data-bilge-ingest-url')) ||
    (typeof window.BILGE_INGEST_URL !== 'undefined' ? window.BILGE_INGEST_URL : '');
  var apiKey =
    (script && script.getAttribute('data-api-key')) ||
    (script && script.getAttribute('data-bilge-api-key')) ||
    (typeof window.BILGE_API_KEY !== 'undefined' ? window.BILGE_API_KEY : '');

  if (!ingestUrl || !apiKey) return;

  var endpoint = ingestUrl.replace(/\/$/, '') + '/api/ingest';

  function send(payload) {
    try {
      if (typeof fetch !== 'undefined') {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
          body: JSON.stringify(payload),
          keepalive: true
        });
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-Api-Key', apiKey);
        xhr.send(JSON.stringify(payload));
      }
    } catch (e) {
      // avoid throwing while reporting
    }
  }

  function buildPayload(message, level, exceptionClass, file, line, stackTrace) {
    return {
      message: message || 'Unknown error',
      level: level || 'error',
      exception_class: exceptionClass || null,
      file: file || null,
      line: line != null ? line : null,
      stack_trace: stackTrace || null,
      context: {},
      url: typeof location !== 'undefined' ? location.href : null,
      timestamp: new Date().toISOString()
    };
  }

  window.addEventListener('error', function (event) {
    var payload = buildPayload(
      event.message,
      'error',
      event.error && event.error.name,
      event.filename,
      event.lineno,
      event.error && event.error.stack
    );
    send(payload);
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var message = typeof reason === 'string' ? reason : (reason && reason.message);
    var stack = reason && reason.stack;
    var name = reason && reason.name;
    var payload = buildPayload(
      message || 'Unhandled promise rejection',
      'error',
      name || 'UnhandledRejection',
      null,
      null,
      stack
    );
    send(payload);
  });

  var reportHttp404 = typeof window.BILGE_REPORT_HTTP_404 === 'undefined' || window.BILGE_REPORT_HTTP_404 !== false;
  if (reportHttp404 && typeof performance !== 'undefined' && performance.getEntriesByType) {
    var nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.responseStatus === 404) {
      send(buildPayload(
        'HTTP 404 Not Found: ' + (typeof location !== 'undefined' ? location.pathname : '/'),
        'warning',
        'HttpNotFound',
        null,
        null,
        null
      ));
    }
  }
})();
