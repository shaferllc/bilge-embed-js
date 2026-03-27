/**
 * Lookout — frontend error reporting snippet.
 * Include on any page to send uncaught errors and unhandled promise rejections to Lookout.
 * Serve as /js/pulse.js or /js/lookout.js (same file).
 *
 * Configuration (one of):
 * - data-ingest-url / data-api-key on the script tag (or data-lookout-ingest-url / data-lookout-api-key)
 * - window.LOOKOUT_INGEST_URL and window.LOOKOUT_API_KEY (preferred), or window.PULSE_* for older embeds
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var ingestUrl =
    (script && script.getAttribute('data-ingest-url')) ||
    (script && script.getAttribute('data-lookout-ingest-url')) ||
    (typeof window.LOOKOUT_INGEST_URL !== 'undefined' ? window.LOOKOUT_INGEST_URL : '') ||
    (typeof window.PULSE_INGEST_URL !== 'undefined' ? window.PULSE_INGEST_URL : '');
  var apiKey =
    (script && script.getAttribute('data-api-key')) ||
    (script && script.getAttribute('data-lookout-api-key')) ||
    (typeof window.LOOKOUT_API_KEY !== 'undefined' ? window.LOOKOUT_API_KEY : '') ||
    (typeof window.PULSE_API_KEY !== 'undefined' ? window.PULSE_API_KEY : '');

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
})();
