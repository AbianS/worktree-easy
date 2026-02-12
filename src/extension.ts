import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { WorktreeTreeProvider } from './providers/worktree-tree-provider';
import { GitService } from './services/git-service';
import { WorktreeService } from './services/worktree-service';
import { StatusBarManager } from './ui/status-bar';
import { getConfig } from './utils/config';

let statusBarManager: StatusBarManager | undefined;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    return;
  }

  const workspacePath = workspaceFolder.uri.fsPath;
  const gitService = new GitService(workspacePath);

  const isGitRepo = await gitService.isGitRepo();
  if (!isGitRepo) {
    const emptyProvider = new EmptyTreeProvider('Not a git repository');
    vscode.window.registerTreeDataProvider('worktreeList', emptyProvider);
    return;
  }

  const worktreeService = new WorktreeService(gitService, workspacePath);
  const treeProvider = new WorktreeTreeProvider(worktreeService);

  const treeView = vscode.window.createTreeView('worktreeList', {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  registerCommands(context, gitService, worktreeService, treeProvider);

  const config = getConfig();
  if (config.showStatusBarItem) {
    statusBarManager = new StatusBarManager(worktreeService);
    context.subscriptions.push(statusBarManager);
    await statusBarManager.update();
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('worktree-easy')) {
        treeProvider.refresh();
        statusBarManager?.update();
      }
    }),
  );

  const gitHeadWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceFolder, '.git/HEAD'),
  );
  gitHeadWatcher.onDidChange(() => {
    treeProvider.refresh();
    statusBarManager?.update();
  });
  context.subscriptions.push(gitHeadWatcher);

  treeProvider.refresh();
}

export function deactivate(): void {
  statusBarManager?.dispose();
}

class EmptyTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  constructor(private message: string) {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.ProviderResult<vscode.TreeItem[]> {
    const item = new vscode.TreeItem(this.message);
    item.contextValue = 'empty';
    return [item];
  }
}
