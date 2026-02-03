import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { WorktreeError, WorktreeErrorCode } from '../utils/errors';

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export class GitService {
  constructor(private workspaceRoot: string) {}

  async exec(args: string[], cwd?: string): Promise<ExecResult> {
    const command = `git ${args.join(' ')}`;
    try {
      const result = await execAsync(command, {
        cwd: cwd || this.workspaceRoot,
        maxBuffer: 10 * 1024 * 1024,
      });
      return {
        stdout: result.stdout.trim(),
        stderr: result.stderr.trim(),
      };
    } catch (error) {
      const execError = error as { stderr?: string; message?: string };
      const stderr =
        execError.stderr || execError.message || 'Unknown git error';
      throw new WorktreeError(
        `Git command failed: ${command}`,
        WorktreeErrorCode.GIT_ERROR,
        stderr,
      );
    }
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.exec(['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async getRepoRoot(): Promise<string> {
    const result = await this.exec(['rev-parse', '--show-toplevel']);
    return result.stdout;
  }

  async getRepoName(): Promise<string> {
    const root = await this.getRepoRoot();
    return root.split('/').pop() || 'repo';
  }

  async getBranches(): Promise<string[]> {
    const result = await this.exec(['branch', '-a']);
    if (!result.stdout) {
      return [];
    }
    return result.stdout
      .split('\n')
      .map((b) =>
        b
          .trim()
          .replace(/^\*\s*/, '')
          .trim(),
      )
      .filter((b) => b && !b.includes('HEAD') && !b.includes('->'));
  }

  async getLocalBranches(): Promise<string[]> {
    const result = await this.exec(['branch']);
    if (!result.stdout) {
      return [];
    }
    return result.stdout
      .split('\n')
      .map((b) =>
        b
          .trim()
          .replace(/^\*\s*/, '')
          .trim(),
      )
      .filter(Boolean);
  }

  async getCurrentBranch(): Promise<string> {
    const result = await this.exec(['branch', '--show-current']);
    return result.stdout;
  }

  async getDefaultBranch(): Promise<string> {
    try {
      const result = await this.exec([
        'symbolic-ref',
        'refs/remotes/origin/HEAD',
        '--short',
      ]);
      return result.stdout.replace('origin/', '');
    } catch {
      const branches = await this.getLocalBranches();
      if (branches.includes('main')) return 'main';
      if (branches.includes('master')) return 'master';
      return branches[0] || 'main';
    }
  }
}
