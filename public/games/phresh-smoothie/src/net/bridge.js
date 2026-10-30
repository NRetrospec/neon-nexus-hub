// Host bridge — lets the game live inside PhreshTeamTV (or any parent page).
//
// Standalone (phreshsmoothie.dev / localhost:8093) this is a NO-OP: nothing is
// posted, nothing breaks. Embedded in an <iframe> on the site, it posts run
// results to the parent, which stores them in Convex and renders the
// community leaderboard.
//
// Wire format (all messages, both directions):
//   { source: "phreshsmoothie", type: "...", ...payload }
//
//   game -> host:  ready        { version }
//                  run-start    { round }
//                  run-end      { score, round, kills, timeSec, character, record, perks }
//                  round-end    { round, score }
//   host -> game:  start        -> begins a fresh run (skip the menu)
//                  ping         -> replies with "ready"
//
// The parent must validate the payload: anything posted from an iframe is
// attacker-controlled by definition.

const parentWin = (() => {
  try {
    return window.parent && window.parent !== window ? window.parent : null;
  } catch {
    return null;
  }
})();

export const isEmbedded = !!parentWin;

function post(type, detail = {}) {
  if (!parentWin) return false;
  try {
    parentWin.postMessage({ source: 'phreshsmoothie', type, ...detail }, '*');
    return true;
  } catch {
    return false;
  }
}

export const announceReady = (extra = {}) => post('ready', extra);
export const announceRunStart = (run) => post('run-start', { round: run?.round ?? 1 });
export const announceRoundEnd = (run) => post('round-end', { round: run?.round ?? 1, score: run?.score ?? 0 });

/** Called once a run is over. `record` = beat the local best round/score. */
export function submitRun(run, record = false) {
  if (!run) return false;
  return post('run-end', {
    score: Math.max(0, Math.floor(run.score || 0)),
    round: Math.max(1, Math.floor(run.round || 1)),
    kills: Math.max(0, Math.floor(run.kills || 0)),
    timeSec: Math.max(0, Math.floor(run.time || 0)),
    character: run.active || 'phresh',
    perks: Array.isArray(run.perks) ? run.perks.slice(0, 32) : [],
    record: !!record,
  });
}

/** Subscribe to messages from the host. Returns an unsubscribe function. */
export function onHostMessage(handlers = {}) {
  const onMsg = (e) => {
    const d = e.data;
    if (!d || typeof d !== 'object' || d.source !== 'phreshteam') return;
    const fn = handlers[d.type];
    if (typeof fn === 'function') fn(d);
  };
  window.addEventListener('message', onMsg);
  return () => window.removeEventListener('message', onMsg);
}
