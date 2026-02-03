import * as vscode from 'vscode';
import type { WorktreeItem } from '../providers/worktree-item';
import type { WorktreeService } from '../services/worktree-service';

export async function openWorktree(
  worktreeService: WorktreeService,
  item?: WorktreeItem,
  forceNewWindow = true,
): Promise<void> {
  let worktreePath: string;

  if (item?.worktree) {
    worktreePath = item.worktree.path;
  } else {
    const worktrees = await worktreeService.list();

    if (worktrees.length === 0) {
      vscode.window.showWarningMessage('No worktrees found');
      return;
    }

    const items = worktrees.map((wt) => ({
      label: wt.isCurrent
        ? `$(check) ${wt.branch}`
        : `$(git-branch) ${wt.branch}`,
      description: wt.path,
      worktree: wt,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a worktree to open',
      matchOnDescription: true,
    });

    if (!selected) {
      return;
    }

    worktreePath = selected.worktree.path;
  }

  await vscode.commands.executeCommand(
    'vscode.openFolder',
    vscode.Uri.file(worktreePath),
    { forceNewWindow },
  );
}

export async function switchToWorktree(
  worktreeService: WorktreeService,
): Promise<void> {
  await openWorktree(worktreeService, undefined, true);
}
