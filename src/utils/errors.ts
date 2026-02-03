export enum WorktreeErrorCode {
  NOT_GIT_REPO = 'NOT_GIT_REPO',
  WORKTREE_EXISTS = 'WORKTREE_EXISTS',
  BRANCH_NOT_FOUND = 'BRANCH_NOT_FOUND',
  BRANCH_ALREADY_CHECKED_OUT = 'BRANCH_ALREADY_CHECKED_OUT',
  WORKTREE_DIRTY = 'WORKTREE_DIRTY',
  WORKTREE_LOCKED = 'WORKTREE_LOCKED',
  PATH_EXISTS = 'PATH_EXISTS',
  GIT_ERROR = 'GIT_ERROR',
}

export class WorktreeError extends Error {
  constructor(
    message: string,
    public readonly code: WorktreeErrorCode,
    public readonly details?: string,
  ) {
    super(message);
    this.name = 'WorktreeError';
  }
}
