import * as vscode from 'vscode';
import type { WorktreeItem } from '../providers/worktree-item';
import type { WorktreeService } from '../services/worktree-service';
import type { Worktree } from '../types/worktree';
import { getConfig } from '../utils/config';

export async function archiveWorktree(
  worktreeService: WorktreeService,
  item: WorktreeItem,
  refresh: () => void,
): Promise<void> {
  if (!item?.worktree) {
    vscode.window.showWarningMessage('No worktree selected');
    return;
  }

  const worktree = item.worktree;

  if (worktree.isMain) {
    vscode.window.showWarningMessage('Cannot archive the main worktree');
    return;
  }

  if (worktree.isCurrent) {
    vscode.window.showWarningMessage(
      'Cannot archive the current worktree. Please open a different worktree first.',
    );
    return;
  }

  if (worktree.isLocked) {
    const unlock = await vscode.window.showWarningMessage(
      `Worktree "${worktree.branch}" is locked.`,
      'Unlock & Archive',
      'Cancel',
    );
    if (unlock !== 'Unlock & Archive') {
      return;
    }
  }

  const isDirty = await worktreeService.isDirty(worktree);

  if (isDirty) {
    await archiveDirtyWorktree(worktreeService, worktree, refresh);
  } else {
    await archiveCleanWorktree(worktreeService, worktree, refresh);
  }
}

async function archiveDirtyWorktree(
  worktreeService: WorktreeService,
  worktree: Worktree,
  refresh: () => void,
): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    `Worktree "${worktree.branch}" has uncommitted changes.`,
    { modal: true },
    'Force Archive (Lose Changes)',
    'Cancel',
  );

  if (choice === 'Force Archive (Lose Changes)') {
    await doArchive(worktreeService, worktree, true, refresh);
  }
}

async function archiveCleanWorktree(
  worktreeService: WorktreeService,
  worktree: Worktree,
  refresh: () => void,
): Promise<void> {
  const config = getConfig();

  if (config.confirmArchive) {
    const confirm = await vscode.window.showWarningMessage(
      `Archive worktree "${worktree.branch}"?`,
      { modal: true },
      'Archive',
      'Cancel',
    );

    if (confirm !== 'Archive') {
      return;
    }
  }

  await doArchive(worktreeService, worktree, false, refresh);
}

async function doArchive(
  worktreeService: WorktreeService,
  worktree: Worktree,
  force: boolean,
  refresh: () => void,
): Promise<void> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Archiving worktree ${worktree.branch}...`,
        cancellable: false,
      },
      async () => {
        await worktreeService.remove(worktree, force);
      },
    );

    refresh();
    vscode.window.showInformationMessage(
      `Worktree "${worktree.branch}" archived`,
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to archive worktree: ${error}`);
  }
}
