/**
 * Undo/redo as a stack of commands. Each command knows how to apply and revert
 * itself, so undo and redo are symmetric by construction — the old implementation
 * kept parallel per-object snapshot lists that drifted out of sync after a few steps.
 *
 * No Three.js here on purpose: this is plain logic and is unit-tested.
 */
export interface Command {
  undo(): void;
  redo(): void;
  /**
   * Called once when the command drops out of history and can never run again.
   * `applied` tells whether its effect is currently in place — e.g. an "add" that
   * was undone and then discarded leaves a mesh nobody references, which the
   * command can now free.
   */
  discard?(applied: boolean): void;
}

export class History {
  private done: Command[] = [];
  private undone: Command[] = [];

  constructor(private readonly limit = 50) {}

  get canUndo(): boolean { return this.done.length > 0; }
  get canRedo(): boolean { return this.undone.length > 0; }

  /** Records a command whose effect has already been applied. Clears the redo branch. */
  push(cmd: Command): void {
    for (const c of this.undone) c.discard?.(false);
    this.undone = [];
    this.done.push(cmd);
    while (this.done.length > this.limit) this.done.shift()!.discard?.(true);
  }

  undo(): boolean {
    const cmd = this.done.pop();
    if (!cmd) return false;
    cmd.undo();
    this.undone.push(cmd);
    return true;
  }

  redo(): boolean {
    const cmd = this.undone.pop();
    if (!cmd) return false;
    cmd.redo();
    this.done.push(cmd);
    return true;
  }

  clear(): void {
    for (const c of this.done) c.discard?.(true);
    for (const c of this.undone) c.discard?.(false);
    this.done = [];
    this.undone = [];
  }
}
