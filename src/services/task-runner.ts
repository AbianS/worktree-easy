import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import type { PostCreateTask } from '../types/worktree';

const execAsync = promisify(exec);

export interface TaskVariables {
  worktreePath: string;
  mainWorktree: string;
  branchName: string;
}

export interface TaskResult {
  task: PostCreateTask;
  success: boolean;
  error?: string;
}

export class TaskRunner {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Worktree Easy');
  }

  async runPostCreateTasks(
    tasks: PostCreateTask[],
    variables: TaskVariables,
  ): Promise<TaskResult[]> {
    if (tasks.length === 0) {
      return [];
    }

    const results: TaskResult[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Running post-create tasks',
        cancellable: false,
      },
      async (progress) => {
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          progress.report({
            message: `(${i + 1}/${tasks.length}) ${task.name}`,
            increment: (100 / tasks.length) * (i === 0 ? 0 : 1),
          });

          const result = await this.runTask(task, variables);
          results.push(result);

          if (!result.success) {
            this.outputChannel.appendLine(
              `[ERROR] ${task.name}: ${result.error}`,
            );
            vscode.window.showWarningMessage(
              `Task "${task.name}" failed: ${result.error}`,
            );
          } else {
            this.outputChannel.appendLine(`[OK] ${task.name}`);
          }
        }
      },
    );

    return results;
  }

  private async runTask(
    task: PostCreateTask,
    variables: TaskVariables,
  ): Promise<TaskResult> {
    const command = this.replaceVariables(task.command, variables);
    const cwd = task.cwd
      ? this.replaceVariables(task.cwd, variables)
      : variables.worktreePath;

    this.outputChannel.appendLine(`\n[TASK] ${task.name}`);
    this.outputChannel.appendLine(`  Command: ${command}`);
    this.outputChannel.appendLine(`  CWD: ${cwd}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 300000, // 5 minutes timeout
      });

      if (stdout) {
        this.outputChannel.appendLine(`  Output: ${stdout}`);
      }
      if (stderr) {
        this.outputChannel.appendLine(`  Stderr: ${stderr}`);
      }

      return { task, success: true };
    } catch (error) {
      const execError = error as { stderr?: string; message?: string };
      const errorMessage =
        execError.stderr || execError.message || 'Unknown error';
      return { task, success: false, error: errorMessage };
    }
  }

  private replaceVariables(str: string, variables: TaskVariables): string {
    return str
      .replace(/\${worktreePath}/g, variables.worktreePath)
      .replace(/\${mainWorktree}/g, variables.mainWorktree)
      .replace(/\${branchName}/g, variables.branchName);
  }

  showOutput(): void {
    this.outputChannel.show();
  }
}
