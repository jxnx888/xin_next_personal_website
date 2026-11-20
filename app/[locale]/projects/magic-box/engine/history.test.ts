import { describe, expect, it } from 'vitest';
import { History, type Command } from './history';

/** A command that edits a shared number and logs discards. */
function setter(state: { v: number }, from: number, to: number, log: string[] = []): Command {
  return {
    undo: () => { state.v = from; },
    redo: () => { state.v = to; },
    discard: applied => { log.push(`${from}->${to}:${applied ? 'applied' : 'undone'}`); },
  };
}

/** Applies and records a step, as the engine does. */
function step(h: History, state: { v: number }, to: number, log?: string[]) {
  const cmd = setter(state, state.v, to, log);
  cmd.redo();
  h.push(cmd);
}

describe('History', () => {
  it('undoes and redoes several steps in order', () => {
    const s = { v: 0 }, h = new History();
    step(h, s, 1); step(h, s, 2); step(h, s, 3);

    expect(h.undo()).toBe(true); expect(s.v).toBe(2);
    expect(h.undo()).toBe(true); expect(s.v).toBe(1);
    // The old implementation applied the wrong snapshot here.
    expect(h.redo()).toBe(true); expect(s.v).toBe(2);
    expect(h.redo()).toBe(true); expect(s.v).toBe(3);
    expect(h.redo()).toBe(false); expect(s.v).toBe(3);
  });

  it('reports canUndo / canRedo', () => {
    const s = { v: 0 }, h = new History();
    expect([h.canUndo, h.canRedo]).toEqual([false, false]);
    step(h, s, 1);
    expect([h.canUndo, h.canRedo]).toEqual([true, false]);
    h.undo();
    expect([h.canUndo, h.canRedo]).toEqual([false, true]);
    expect(h.undo()).toBe(false);
  });

  it('drops the redo branch on a new step and discards it as undone', () => {
    const s = { v: 0 }, h = new History(), log: string[] = [];
    step(h, s, 1, log); step(h, s, 2, log);
    h.undo();
    step(h, s, 5, log);

    expect(log).toEqual(['1->2:undone']);
    expect(h.canRedo).toBe(false);
    h.undo(); expect(s.v).toBe(1);
  });

  it('keeps at most `limit` steps and discards the oldest as applied', () => {
    const s = { v: 0 }, h = new History(2), log: string[] = [];
    step(h, s, 1, log); step(h, s, 2, log); step(h, s, 3, log);

    expect(log).toEqual(['0->1:applied']);
    h.undo(); h.undo();
    expect(h.undo()).toBe(false);
    expect(s.v).toBe(1);
  });

  it('clear() discards everything with the right applied flag', () => {
    const s = { v: 0 }, h = new History(), log: string[] = [];
    step(h, s, 1, log); step(h, s, 2, log);
    h.undo();
    h.clear();

    expect(log.sort()).toEqual(['0->1:applied', '1->2:undone']);
    expect([h.canUndo, h.canRedo]).toEqual([false, false]);
  });
});
