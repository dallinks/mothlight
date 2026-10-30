'use strict';
// Boot, main loop, input wiring, saving.
(function () {
  const loaded = G.load();
  const S = G.S;
  if (S.ach.lightsout && S.flags.lightsOn === false) document.body.classList.add('lightsout');

  // Offline progress: the jar keeps catching while you are away.
  if (loaded) {
    const away = Math.min(Date.now() - (S.last || Date.now()), 12 * 3600e3);
    if (away > 60e3) {
      const n = G.rate() * away / 1000;
      S.motes += n;
      S.total += n;
      S.hp = G.calc().maxHp;
      setTimeout(() => G.toast(`While you were away (${G.fmtTime(away)}), the jar caught ${G.fmt(n)} motes.`, 7000), 400);
    }
  }
  if (!S.tabs.map && S.mem.door) S.tabs.map = true;

  G.renderTop();
  G.renderTabs();
  G.refresh();
  G.renderLog();
  if (!loaded) {
    G.modal(`<pre class="art gold">
 __  __  ___ _____ _  _ _    ___ ___ _  _ _____
|  \\/  |/ _ \\_   _| || | |  |_ _/ __| || |_   _|
| |\\/| | (_) || | | __ | |__ | | (_ | __ | | |
|_|  |_|\\___/ |_| |_||_|____|___\\___|_||_| |_|</pre>
<div class="txt">It has been dusk for a very, very long time.

Nobody remembers the sun. Lamps burn on every corner of the village of Dimvale, fed with tiny drifting motes of light that fall from somewhere far to the north.

In a little hut at the edge of the village, an old jar sits on the windowsill. And on the table, a candle that has never been lit is about to wake up.</div>`, [{ label: 'Begin' }], { cls: 'wide' });
  } else if (S.flags.ngIntro) {
    delete S.flags.ngIntro;
    G.modal(`<div class="who">New Game+ (${S.ng})</div><div class="txt">The jar is empty again. The candle is quiet. But you remember everything, and the motes fall a little faster for you now.</div>`);
  }

  // ------------------------------------------------------------ loop
  let last = Date.now(), bindT = 0, achT = 0, saveT = 0, topSig = '';
  setInterval(() => {
    const now = Date.now(), dt = Math.min(now - last, 1000);
    last = now;
    G.idleTick(dt);
    G.Dun.tick(dt);
    if (G.view.loc === 'lake' && G.fish.state !== 'idle' && !G.Dun.active) {
      G.fishTick(dt);
      const fb = document.getElementById('fishbar');
      if (fb) fb.innerHTML = G.B.fishbar();
    }
    bindT += dt;
    if (bindT >= 200) {
      bindT = 0;
      G.updateBinds();
      const sig = [S.glowcaps > 0 || S.flags.got_glowcaps, S.moonstones > 0 || S.flags.got_moonstones, S.flags.showHp, !!G.shooting].join();
      if (sig !== topSig) { topSig = sig; G.renderTop(); }
    }
    achT += dt;
    if (achT >= 1000) {
      achT = 0;
      if (S.glowcaps > 0) S.flags.got_glowcaps = 1;
      if (S.moonstones > 0) S.flags.got_moonstones = 1;
      G.checkAch();
    }
    saveT += dt;
    if (saveT >= 20000) { saveT = 0; if (!G.noSave) G.save(); }
  }, 50);
  window.addEventListener('beforeunload', () => { if (!G.noSave) G.save(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !G.noSave) G.save(); });

  // ------------------------------------------------------------ input
  document.addEventListener('keydown', e => {
    G.input();
    const tag = (e.target && e.target.tagName) || '';
    if (G.modalOpen) {
      if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'INPUT') {
        const b = document.querySelector('#modal .modal-choices .btn');
        if (b) { e.preventDefault(); b.click(); }
      }
      return;
    }
    if (G.Dun.active) { G.Dun.keydown(e); return; }
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Enter' && tag === 'INPUT') {
        const b = e.target.nextElementSibling;
        if (b && b.classList.contains('btn')) { e.preventDefault(); b.click(); }
      }
      return;
    }
    if (e.key === ' ' && G.view.tab === 'map' && G.view.loc === 'lake' && G.has('rod')) {
      e.preventDefault();
      if (G.fish.state === 'idle') G.A.cast(); else G.A.reel();
      return;
    }
    G.Secrets.key(e);
  });
  document.addEventListener('keyup', e => { if (G.Dun.active) G.Dun.keyup(e); });
  document.addEventListener('pointerdown', e => {
    G.input();
    const el = e.target.closest('[data-down]');
    if (el) { const f = G.A[el.dataset.down]; if (f) f(el.dataset.arg, el, e); }
  });
})();
