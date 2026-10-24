// Branche le vrai SDK Firebase sur l'émulateur local (jamais la production).
(function () {
  const orig = firebase.initializeApp.bind(firebase);
  firebase.initializeApp = function (opts, name) {
    const o = Object.assign({}, opts, { databaseURL: 'http://127.0.0.1:9000?ns=demo-perfhand-default-rtdb', projectId: 'demo-perfhand' });
    const app = orig(o, name);
    try { app.auth().useEmulator('http://127.0.0.1:9099', { disableWarnings: true }); } catch (e) {}
    return app;
  };
})();
