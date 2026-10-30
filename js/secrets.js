'use strict';
// Words you can type anywhere outside an expedition. Nobody tells you about these.
G.Secrets = {
  buf: '',
  words: {
    wick() {
      G.earn('sayname');
      G.say(G.pick(['You said my name! Say it again! No, don\'t, I\'ll get a big head. Bigger.', 'Yes? Yes? I\'m here! I\'m always here. I\'m a candle.']));
      if (G.view.tab === 'hut') G.refresh();
    },
    lightsout() {
      G.earn('lightsout');
      document.body.classList.toggle('lightsout');
      G.S.flags.lightsOn = !document.body.classList.contains('lightsout');
      G.log(document.body.classList.contains('lightsout') ? '*click* Someone turned the lights out. It was you.' : '*click* Lights back on.');
      G.refresh();
    },
    moth() {
      G.toast('&nbsp;&nbsp;° &nbsp;~&nbsp; a small moth flutters across your screen &nbsp;~ °');
      if (G.S.flags.pip) G.log('Pip flutters over to see who is calling.');
    },
    solenne() {
      if (G.S.flags.wick) G.say(G.S.mem.sun ? 'Don\'t... say her name like that. It makes me feel warm and sad at the same time.' : 'Solenne? That\'s a pretty name. It makes my wax tingle. Why does it make my wax tingle?');
      if (G.view.tab === 'hut') G.refresh();
    },
    gerald() {
      if (G.has('rock')) G.log('Gerald the rock acknowledges you with a slight increase in rockness.');
    },
    xyzzy() { G.log('A hollow voice says: "Wrong game."'); },
  },
  key(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    this.buf = (this.buf + e.key.toLowerCase()).slice(-12);
    for (const w in this.words) {
      if (this.buf.endsWith(w)) { this.buf = ''; this.words[w](); return; }
    }
  },
};
