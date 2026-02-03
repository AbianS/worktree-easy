import * as vscode from 'vscode';
import type { WorktreeItem } from '../providers/worktree-item';
import type { WorktreeTreeProvider } from '../providers/worktree-tree-provider';
import type { GitService } from '../services/git-service';
import type { WorktreeService } from '../services/worktree-service';
import { archiveWorktree } from './archive-worktree';
import { createWorktree } from './create-worktree';
import { openWorktree, switchToWorktree } from './open-worktree';

export function registerCommands(
  context: vscode.ExtensionContext,
  git: GitService,
  worktreeService: WorktreeService,
  treeProvider: WorktreeTreeProvider,
): void {
  const refresh = () => treeProvider.refresh();

  context.subscriptions.push(
    vscode.commands.registerCommand('worktree-easy.create', () =>
      createWorktree(git, worktreeService, refresh),
    ),

    vscode.commands.registerCommand(
      'worktree-easy.open',
      (item?: WorktreeItem) => openWorktree(worktreeService, item, true),
    ),

    vscode.commands.registerCommand(
      'worktree-easy.openInCurrentWindow',
      (item?: WorktreeItem) => openWorktree(worktreeService, item, false),
    ),

    vscode.commands.registerCommand(
      'worktree-easy.archive',
      (item: WorktreeItem) => archiveWorktree(worktreeService, item, refresh),
    ),

    vscode.commands.registerCommand('worktree-easy.refresh', () => refresh()),

    vscode.commands.registerCommand(
      'worktree-easy.reveal',
      (item: WorktreeItem) => {
        if (item?.worktree) {
          vscode.commands.executeCommand(
            'revealFileInOS',
            vscode.Uri.file(item.worktree.path),
          );
        }
      },
    ),

    vscode.commands.registerCommand(
      'worktree-easy.copyPath',
      (item: WorktreeItem) => {
        if (item?.worktree) {
          vscode.env.clipboard.writeText(item.worktree.path);
          vscode.window.showInformationMessage('Path copied to clipboard');
        }
      },
    ),

    vscode.commands.registerCommand('worktree-easy.switchTo', () =>
      switchToWorktree(worktreeService),
    ),
  );
}
