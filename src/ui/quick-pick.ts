import * as vscode from 'vscode';
import type { Worktree } from '../types/worktree';

export interface WorktreeQuickPickItem extends vscode.QuickPickItem {
  worktree: Worktree;
}

export function createWorktreeQuickPickItems(
  worktrees: Worktree[],
): WorktreeQuickPickItem[] {
  return worktrees.map((wt) => ({
    label: wt.isCurrent
      ? `$(check) ${wt.branch}`
      : `$(git-branch) ${wt.branch}`,
    description: shortenPath(wt.path),
    detail: wt.isCurrent ? 'Current workspace' : undefined,
    worktree: wt,
  }));
}

function shortenPath(fullPath: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home && fullPath.startsWith(home)) {
    return `~${fullPath.substring(home.length)}`;
  }
  return fullPath;
}
