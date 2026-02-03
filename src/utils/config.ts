import * as vscode from 'vscode';
import type { PostCreateTask } from '../types/worktree';

export interface WorktreeConfig {
  worktreesFolder: string;
  groupByRepository: boolean;
  openInNewWindow: boolean;
  confirmArchive: boolean;
  showStatusBarItem: boolean;
  postCreateTasks: PostCreateTask[];
}

export function getConfig(): WorktreeConfig {
  const config = vscode.workspace.getConfiguration('worktree-easy');
  return {
    worktreesFolder: config.get('worktreesFolder', ''),
    groupByRepository: config.get('groupByRepository', false),
    openInNewWindow: config.get('openInNewWindow', true),
    confirmArchive: config.get('confirmArchive', true),
    showStatusBarItem: config.get('showStatusBarItem', true),
    postCreateTasks: config.get('postCreateTasks', []),
  };
}
