import * as vscode from 'vscode';
import type { GitService } from '../services/git-service';
import { TaskRunner } from '../services/task-runner';
import type { WorktreeService } from '../services/worktree-service';
import { getConfig } from '../utils/config';
import { WorktreeError, WorktreeErrorCode } from '../utils/errors';

export async function createWorktree(
  git: GitService,
  worktreeService: WorktreeService,
  refresh: () => void,
): Promise<void> {
  const createType = await vscode.window.showQuickPick(
    [
      {
        label: '$(git-branch) From existing branch',
        description: 'Create worktree from an existing branch',
        value: 'existing',
      },
      {
        label: '$(add) Create new branch',
        description: 'Create a new branch and worktree',
        value: 'new',
      },
    ],
    {
      placeHolder: 'How would you like to create the worktree?',
    },
  );

  if (!createType) {
    return;
  }

  if (createType.value === 'existing') {
    await createFromExistingBranch(git, worktreeService, refresh);
  } else {
    await createWithNewBranch(git, worktreeService, refresh);
  }
}

async function createFromExistingBranch(
  git: GitService,
  worktreeService: WorktreeService,
  refresh: () => void,
): Promise<void> {
  const branches = await git.getBranches();

  const existingWorktrees = await worktreeService.list();
  const usedBranches = new Set(existingWorktrees.map((wt) => wt.branch));

  const availableBranches = branches
    .filter(
      (b) =>
        !usedBranches.has(b) && !usedBranches.has(b.replace('origin/', '')),
    )
    .map((b) => ({
      label: b.startsWith('origin/') ? `$(cloud) ${b}` : `$(git-branch) ${b}`,
      description: b.startsWith('origin/') ? 'remote' : 'local',
      branch: b.startsWith('origin/') ? b.replace('origin/', '') : b,
      remoteBranch: b.startsWith('origin/') ? b : undefined,
    }));

  if (availableBranches.length === 0) {
    vscode.window.showWarningMessage(
      'No available branches. All branches already have worktrees.',
    );
    return;
  }

  const selected = await vscode.window.showQuickPick(availableBranches, {
    placeHolder: 'Select a branch for the worktree',
    matchOnDescription: true,
  });

  if (!selected) {
    return;
  }

  await createWorktreeForBranch(
    selected.branch,
    false,
    worktreeService,
    refresh,
    undefined,
    selected.remoteBranch,
  );
}

async function createWithNewBranch(
  git: GitService,
  worktreeService: WorktreeService,
  refresh: () => void,
): Promise<void> {
  const branchName = await vscode.window.showInputBox({
    prompt: 'Enter the new branch name',
    placeHolder: 'feature/my-feature',
    validateInput: (value) => {
      if (!value) {
        return 'Branch name is required';
      }
      if (!/^[\w\-./]+$/.test(value)) {
        return 'Invalid branch name';
      }
      return null;
    },
  });

  if (!branchName) {
    return;
  }

  const currentBranch = await git.getCurrentBranch();
  const defaultBranch = await git.getDefaultBranch();
  const branches = await git.getLocalBranches();

  const baseBranchOptions = branches
    .map((b) => ({
      label:
        b === currentBranch
          ? `$(location) ${b}`
          : b === defaultBranch
            ? `$(star) ${b}`
            : `$(git-branch) ${b}`,
      description:
        b === currentBranch
          ? 'current'
          : b === defaultBranch
            ? 'default'
            : undefined,
      branch: b,
    }))
    .sort((a, b) => {
      if (a.branch === currentBranch) return -1;
      if (b.branch === currentBranch) return 1;
      if (a.branch === defaultBranch) return -1;
      if (b.branch === defaultBranch) return 1;
      return 0;
    });

  const selectedBase = await vscode.window.showQuickPick(baseBranchOptions, {
    placeHolder: 'Select base branch',
  });

  if (!selectedBase) {
    return;
  }

  await createWorktreeForBranch(
    branchName,
    true,
    worktreeService,
    refresh,
    selectedBase.branch,
  );
}

async function createWorktreeForBranch(
  branch: string,
  createBranch: boolean,
  worktreeService: WorktreeService,
  refresh: () => void,
  baseBranch?: string,
  trackRemote?: string,
): Promise<void> {
  let currentBranch = branch;
  let currentPath = await worktreeService.getDefaultWorktreePath(currentBranch);
  const hasConfiguredFolder = worktreeService.hasConfiguredWorktreesFolder();

  while (true) {
    let worktreePath: string | undefined;

    if (hasConfiguredFolder) {
      // Skip prompt if worktreesFolder is configured
      worktreePath = currentPath;
    } else {
      worktreePath = await vscode.window.showInputBox({
        prompt: 'Worktree path',
        value: currentPath,
        valueSelection: [currentPath.lastIndexOf('/') + 1, currentPath.length],
      });

      if (!worktreePath) {
        return;
      }
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Creating worktree for ${currentBranch}...`,
          cancellable: false,
        },
        async () => {
          await worktreeService.create({
            path: worktreePath,
            branch: currentBranch,
            createBranch,
            baseBranch,
            trackRemote,
          });
        },
      );

      refresh();

      // Run post-create tasks
      const config = getConfig();
      if (config.postCreateTasks.length > 0) {
        const mainWorktree = await worktreeService.getMainWorktreePath();
        const taskRunner = new TaskRunner();
        await taskRunner.runPostCreateTasks(config.postCreateTasks, {
          worktreePath,
          mainWorktree,
          branchName: currentBranch,
        });
      }

      if (config.openInNewWindow) {
        const openNow = await vscode.window.showInformationMessage(
          `Worktree created at ${worktreePath}`,
          'Open in New Window',
          'Later',
        );

        if (openNow === 'Open in New Window') {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(worktreePath),
            { forceNewWindow: true },
          );
        }
      } else {
        vscode.window.showInformationMessage(
          `Worktree created at ${worktreePath}`,
        );
      }
      return;
    } catch (error) {
      if (error instanceof WorktreeError) {
        if (error.code === WorktreeErrorCode.BRANCH_ALREADY_CHECKED_OUT) {
          const existing =
            await worktreeService.branchHasWorktree(currentBranch);
          if (existing) {
            const action = await vscode.window.showWarningMessage(
              error.message,
              'Open Existing',
              'Cancel',
            );
            if (action === 'Open Existing') {
              await vscode.commands.executeCommand(
                'vscode.openFolder',
                vscode.Uri.file(existing.path),
                { forceNewWindow: true },
              );
            }
          }
          return;
        }

        const branchExistsMatch = error.details?.match(
          /branch named '([^']+)' already exists/,
        );
        if (branchExistsMatch && createBranch) {
          const newBranchName = await vscode.window.showInputBox({
            prompt: `Branch "${currentBranch}" already exists. Enter a different name:`,
            value: currentBranch,
            validateInput: (value) => {
              if (!value) return 'Branch name is required';
              if (!/^[\w\-./]+$/.test(value)) return 'Invalid branch name';
              if (value === currentBranch)
                return 'Please enter a different name';
              return null;
            },
          });

          if (!newBranchName) {
            return;
          }

          currentBranch = newBranchName;
          currentPath =
            await worktreeService.getDefaultWorktreePath(currentBranch);
          continue;
        }

        const details = error.details ? `\n${error.details}` : '';
        vscode.window.showErrorMessage(
          `Failed to create worktree: ${error.message}${details}`,
        );
      } else {
        vscode.window.showErrorMessage(`Failed to create worktree: ${error}`);
      }
      return;
    }
  }
}
