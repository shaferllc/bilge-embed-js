/**
 * @deprecated Use /js/lookout.js. This shim loads the canonical snippet for backward compatibility.
 */
(function () {
  var cur = document.currentScript;
  if (!cur || !cur.src) {
    return;
  }
  var s = document.createElement('script');
  s.src = cur.src.replace(/\/pulse\.js(\?|#|$)/, '/lookout.js$1');
  (document.head || document.documentElement).appendChild(s);
})();
