import * as vscode from 'vscode';
import type { WorktreeService } from '../services/worktree-service';
import { CreateWorktreeItem, WorktreeItem } from './worktree-item';

type TreeItem = WorktreeItem | CreateWorktreeItem;

export class WorktreeTreeProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private worktreeService: WorktreeService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (element) {
      return [];
    }

    try {
      const worktrees = await this.worktreeService.list();
      const items: TreeItem[] = worktrees.map((wt) => new WorktreeItem(wt));
      items.push(new CreateWorktreeItem());
      return items;
    } catch (error) {
      console.error('Failed to get worktrees:', error);
      return [new CreateWorktreeItem()];
    }
  }

  getParent(): vscode.ProviderResult<TreeItem> {
    return null;
  }
}
