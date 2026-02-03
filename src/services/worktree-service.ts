import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Worktree, WorktreeCreateOptions } from '../types/worktree';
import { getConfig } from '../utils/config';
import { WorktreeError, WorktreeErrorCode } from '../utils/errors';
import type { GitService } from './git-service';

export class WorktreeService {
  constructor(
    private git: GitService,
    private currentWorkspacePath: string,
  ) {}

  async list(): Promise<Worktree[]> {
    const result = await this.git.exec(['worktree', 'list', '--porcelain']);
    return this.parseWorktreeList(result.stdout);
  }

  private parseWorktreeList(output: string): Worktree[] {
    if (!output.trim()) {
      return [];
    }

    const worktrees: Worktree[] = [];
    const entries = output.split('\n\n').filter(Boolean);

    for (const entry of entries) {
      const lines = entry.split('\n');
      const worktree: Partial<Worktree> = {
        isLocked: false,
        isMain: false,
        isCurrent: false,
      };

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          worktree.path = line.substring(9);
        } else if (line.startsWith('HEAD ')) {
          worktree.head = line.substring(5);
        } else if (line.startsWith('branch ')) {
          worktree.branch = line.substring(7).replace('refs/heads/', '');
        } else if (line === 'bare') {
          worktree.isMain = true;
          worktree.branch = '(bare)';
        } else if (line === 'detached') {
          worktree.branch = `(detached at ${worktree.head?.substring(0, 7)})`;
        } else if (line === 'locked') {
          worktree.isLocked = true;
        }
      }

      if (worktree.path) {
        const isFirst = worktrees.length === 0;
        worktree.isMain = isFirst;
        worktree.isCurrent =
          this.normalizePath(worktree.path) ===
          this.normalizePath(this.currentWorkspacePath);

        worktrees.push(worktree as Worktree);
      }
    }

    return worktrees;
  }

  private normalizePath(p: string): string {
    return path.normalize(p).toLowerCase();
  }

  async create(options: WorktreeCreateOptions): Promise<Worktree> {
    const existing = await this.branchHasWorktree(options.branch);
    if (existing && !options.createBranch) {
      throw new WorktreeError(
        `Branch "${options.branch}" already has a worktree at ${existing.path}`,
        WorktreeErrorCode.BRANCH_ALREADY_CHECKED_OUT,
      );
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(options.path);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    const args = ['worktree', 'add'];

    if (options.createBranch) {
      args.push('-b', options.branch);
      args.push(options.path);
      if (options.baseBranch) {
        args.push(options.baseBranch);
      }
    } else if (options.trackRemote) {
      args.push('--track', '-b', options.branch);
      args.push(options.path);
      args.push(options.trackRemote);
    } else {
      args.push(options.path, options.branch);
    }

    await this.git.exec(args);

    const worktrees = await this.list();
    const created = worktrees.find(
      (wt) => this.normalizePath(wt.path) === this.normalizePath(options.path),
    );

    if (!created) {
      throw new WorktreeError(
        'Worktree was created but could not be found',
        WorktreeErrorCode.GIT_ERROR,
      );
    }

    return created;
  }

  async remove(worktree: Worktree, force = false): Promise<void> {
    if (worktree.isMain) {
      throw new WorktreeError(
        'Cannot remove the main worktree',
        WorktreeErrorCode.GIT_ERROR,
      );
    }

    const args = ['worktree', 'remove'];
    if (force) {
      args.push('--force');
    }
    args.push(worktree.path);

    await this.git.exec(args);
  }

  async prune(): Promise<void> {
    await this.git.exec(['worktree', 'prune']);
  }

  async isDirty(worktree: Worktree): Promise<boolean> {
    try {
      const result = await this.git.exec(
        ['status', '--porcelain'],
        worktree.path,
      );
      return result.stdout.length > 0;
    } catch {
      return false;
    }
  }

  async branchHasWorktree(branch: string): Promise<Worktree | null> {
    const worktrees = await this.list();
    return worktrees.find((wt) => wt.branch === branch) || null;
  }

  async getDefaultWorktreePath(branch: string): Promise<string> {
    const config = getConfig();
    const repoName = await this.git.getRepoName();
    const sanitizedBranch = branch.replace(/[/\\]/g, '-');

    if (config.worktreesFolder) {
      let basePath = config.worktreesFolder;
      if (config.groupByRepository) {
        // Use: {worktreesFolder}/{repoName}/{branchName}
        basePath = path.join(basePath, repoName);
      }
      // Use: {worktreesFolder}/{branchName}
      return path.join(basePath, sanitizedBranch);
    }

    // No worktreesFolder: use {parent of repo}/{repoName}-{branchName}
    const repoRoot = await this.git.getRepoRoot();
    return path.join(path.dirname(repoRoot), `${repoName}-${sanitizedBranch}`);
  }

  async getMainWorktreePath(): Promise<string> {
    const worktrees = await this.list();
    const mainWorktree = worktrees.find((wt) => wt.isMain);
    return mainWorktree?.path || (await this.git.getRepoRoot());
  }

  hasConfiguredWorktreesFolder(): boolean {
    const config = getConfig();
    return Boolean(config.worktreesFolder);
  }
}
