import * as vscode from 'vscode';
import type { Worktree } from '../types/worktree';

export class WorktreeItem extends vscode.TreeItem {
  constructor(public readonly worktree: Worktree) {
    super(worktree.branch, vscode.TreeItemCollapsibleState.None);

    this.description = this.getDescription();
    this.tooltip = this.getTooltip();
    this.contextValue = this.getContextValue();
    this.iconPath = this.getIcon();

    this.command = {
      command: 'worktree-easy.open',
      title: 'Open Worktree',
      arguments: [this],
    };
  }

  private getDescription(): string {
    if (this.worktree.isCurrent) {
      return '(current)';
    }
    return this.shortenPath(this.worktree.path);
  }

  private shortenPath(fullPath: string): string {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    if (home && fullPath.startsWith(home)) {
      return `~${fullPath.substring(home.length)}`;
    }
    return fullPath;
  }

  private getTooltip(): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.appendMarkdown(`**Branch:** ${this.worktree.branch}\n\n`);
    md.appendMarkdown(`**Path:** ${this.worktree.path}\n\n`);
    md.appendMarkdown(
      `**Commit:** ${this.worktree.head?.substring(0, 7) || 'unknown'}\n\n`,
    );

    if (this.worktree.isCurrent) {
      md.appendMarkdown('*Current workspace*');
    }
    if (this.worktree.isMain) {
      md.appendMarkdown('*Main worktree*');
    }
    if (this.worktree.isLocked) {
      md.appendMarkdown('*Locked*');
    }

    return md;
  }

  private getContextValue(): string {
    if (this.worktree.isCurrent) {
      return 'worktree-current';
    }
    if (this.worktree.isMain) {
      return 'worktree-main';
    }
    return 'worktree';
  }

  private getIcon(): vscode.ThemeIcon {
    if (this.worktree.isCurrent) {
      return new vscode.ThemeIcon(
        'check',
        new vscode.ThemeColor('gitDecoration.addedResourceForeground'),
      );
    }
    if (this.worktree.isLocked) {
      return new vscode.ThemeIcon('lock');
    }
    return new vscode.ThemeIcon('git-branch');
  }
}

export class CreateWorktreeItem extends vscode.TreeItem {
  constructor() {
    super('Create New Worktree', vscode.TreeItemCollapsibleState.None);

    this.iconPath = new vscode.ThemeIcon('add');
    this.contextValue = 'create-action';
    this.command = {
      command: 'worktree-easy.create',
      title: 'Create Worktree',
    };
  }
}
