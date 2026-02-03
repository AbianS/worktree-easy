export interface Worktree {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  isDirty?: boolean;
}

export interface PostCreateTask {
  name: string;
  command: string;
  cwd?: string;
}

export interface WorktreeCreateOptions {
  path: string;
  branch: string;
  createBranch: boolean;
  baseBranch?: string;
  trackRemote?: string;
}

export interface WorktreeListItem {
  worktree: Worktree;
  type: 'worktree';
}

export interface CreateWorktreeListItem {
  type: 'create';
}

export type TreeItemData = WorktreeListItem | CreateWorktreeListItem;
