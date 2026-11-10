// PerfHand v1789803000
console.log("PerfHand v1789803000 - chargement...");
// Force cache bust: si version en cache différente, reload
(function() {
  var VER = "1789803000";
  var stored = sessionStorage.getItem("perfhand_ver");
  if (stored && stored !== VER) { sessionStorage.setItem("perfhand_ver", VER); window.location.reload(true); }
  else { sessionStorage.setItem("perfhand_ver", VER); }

  // IMPORTANT: le contrôle ci-dessus ne se déclenche qu'AU CHARGEMENT de la page — un onglet
  // resté ouvert longtemps (parfois depuis avant un correctif) ne le revoit jamais et continue de
  // tourner avec l'ancienne logique en mémoire, ce qui peut écraser des données avec un bug déjà
  // corrigé ailleurs. On vérifie donc aussi périodiquement, en tâche de fond, si une version plus
  // récente est déployée, et on recharge automatiquement si c'est le cas.
  //
  // CORRECTIF CRITIQUE (perte de 1h30 de saisie de stats de match) : ce rechargement était
  // INCONDITIONNEL — s'il se déclenchait (toutes les 5 min, ou au retour sur l'onglet) PENDANT
  // qu'un écran de saisie longue (ex: nouveau match) était ouvert, la page se rechargeait d'un
  // coup, sans aucun avertissement, et tout ce qui n'était pas encore enregistré disparaissait —
  // exactement le symptôme rapporté. On respecte désormais un indicateur global
  // window.__perfhandBusy, positionné par les écrans à saisie longue : si une nouvelle version
  // est détectée pendant que ce drapeau est actif, le rechargement est différé et réessayé plus
  // tard, jusqu'à ce que la saisie soit terminée.
  window.__perfhandBusy = false;
  window.__perfhandPendingVersion = false;
  function applyPendingReloadIfFree() {
    if (window.__perfhandPendingVersion && !window.__perfhandBusy) {
      console.warn('[PerfHand] Saisie terminée — application de la nouvelle version...');
      window.location.reload(true);
    }
  }
  function checkForNewVersion() {
    fetch(window.location.href, { cache: 'no-store' })
      .then(function(r) { return r.text(); })
      .then(function(html) {
        var m = html.match(/PerfHand v(\d+)/);
        if (m && m[1] !== VER) {
          if (window.__perfhandBusy) {
            console.warn('[PerfHand] Nouvelle version détectée (' + m[1] + ') mais saisie en cours — rechargement différé.');
            window.__perfhandPendingVersion = true;
            return;
          }
          console.warn('[PerfHand] Nouvelle version déployée (' + m[1] + ' vs ' + VER + ') — rechargement automatique...');
          window.location.reload(true);
        }
      })
      .catch(function(){});
  }
  setInterval(checkForNewVersion, 5 * 60 * 1000); // toutes les 5 minutes
  setInterval(applyPendingReloadIfFree, 20 * 1000); // réessaie dès que la saisie se libère
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) checkForNewVersion();
  });
  // Filet de sécurité supplémentaire : avertit (fermeture d'onglet, navigation, etc.) si une
  // saisie longue est en cours et pas encore enregistrée.
  window.addEventListener('beforeunload', function(e) {
    if (window.__perfhandBusy) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
})();
console.log("Firebase:", typeof firebase !== "undefined" ? "OK" : "ABSENT");
// Wait for all deps then start
var _tries = 0;
var _timer = setInterval(function() {
  _tries++;
  var ok = typeof React !== 'undefined' && typeof ReactDOM !== 'undefined' && typeof htm !== 'undefined';
  if (ok) {
    clearInterval(_timer);
    _startApp();
  } else if (_tries > 50) {
    clearInterval(_timer);
    var missing = [];
    if (typeof React === 'undefined') missing.push('React');
    if (typeof ReactDOM === 'undefined') missing.push('ReactDOM');
    if (typeof htm === 'undefined') missing.push('htm');
    document.getElementById('ls').textContent = 'Erreur chargement: ' + missing.join(', ');
    console.error('Missing libs:', missing);
  }
}, 100);
