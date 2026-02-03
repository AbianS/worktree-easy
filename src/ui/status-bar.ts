import * as vscode from 'vscode';
import type { WorktreeService } from '../services/worktree-service';

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor(private worktreeService: WorktreeService) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'worktree-easy.switchTo';
    this.statusBarItem.tooltip = 'Click to switch worktree';
  }

  async update(): Promise<void> {
    try {
      const worktrees = await this.worktreeService.list();
      const current = worktrees.find((wt) => wt.isCurrent);

      if (current) {
        this.statusBarItem.text = `$(git-branch) ${current.branch}`;
        this.statusBarItem.show();
      } else {
        this.statusBarItem.hide();
      }
    } catch {
      this.statusBarItem.hide();
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
