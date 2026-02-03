<p align="center">
  <img src="media/logo.png" alt="Worktree Easy Logo" width="128" height="128">
</p>

<h1 align="center">Worktree Easy</h1>

<p align="center">
  Manage git worktrees with minimal friction
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  </a>
  <a href="https://code.visualstudio.com/">
    <img src="https://img.shields.io/badge/VS%20Code-1.108.1+-blue.svg" alt="VS Code">
  </a>
  <a href="https://github.com/AbianS/worktree-easy/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  </a>
</p>

---

## Features

- **TreeView in Activity Bar** - See all your worktrees at a glance
- **Create worktrees** - From existing branches or create new ones
- **Open in new window** - Double-click to open any worktree
- **Archive worktrees** - Safely remove worktrees with uncommitted changes protection
- **Status bar indicator** - See current worktree, click to switch
- **Keyboard shortcuts** - Quick access with `Cmd+Shift+W` chords
- **Post-create tasks** - Automate commands after creating worktrees
- **Repository grouping** - Optionally organize worktrees by repository name

---

## 🚀 Quick Start

### Creating a Worktree

1. Click the **➕** button in the Worktrees view
2. Or press **`Cmd+Shift+W C`** / **`Ctrl+Shift+W C`**
3. Choose **"From existing branch"** or **"Create new branch"**
4. Select your branch and confirm the path
5. Worktree opens automatically!

### Opening a Worktree

- **Double-click** any worktree to open in a new window
- **Right-click** for more options (current window, reveal in finder)
- Click **status bar** to quickly switch between worktrees
- Press **`Cmd+Shift+W S`** to open the quick switcher

### Archiving a Worktree

- Click the **🗑️** icon on any worktree (except main/current)
- Confirmation required if uncommitted changes exist
- Safely removes the worktree and cleans up

---

## ⌨️ Keyboard Shortcuts

| Windows/Linux | macOS | Action |
|---------------|-------|--------|
| `Ctrl+Shift+W C` | `Cmd+Shift+W C` | Create worktree |
| `Ctrl+Shift+W O` | `Cmd+Shift+W O` | Open worktree picker |
| `Ctrl+Shift+W S` | `Cmd+Shift+W S` | Switch worktree |

---

## ⚙️ Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `worktree-easy.worktreesFolder` | Directory where worktrees will be created | `""` (prompt) |
| `worktree-easy.groupByRepository` | Create worktrees inside repo-named folders | `false` |
| `worktree-easy.openInNewWindow` | Open worktrees in new window by default | `true` |
| `worktree-easy.confirmArchive` | Show confirmation before archiving | `true` |
| `worktree-easy.showStatusBarItem` | Display current worktree in status bar | `true` |
| `worktree-easy.postCreateTasks` | Commands to run after creating worktrees | `[]` |

### Advanced: Post-Create Tasks

Automate tasks after creating a worktree:

```json
{
  "worktree-easy.postCreateTasks": [
    {
      "name": "Install dependencies",
      "command": "npm install",
      "cwd": "${worktreePath}"
    },
    {
      "name": "Copy .env file",
      "command": "cp ${mainWorktree}/.env ${worktreePath}/.env"
    }
  ]
}
```

**Available variables:**
- `${worktreePath}` - Path to the new worktree
- `${mainWorktree}` - Path to the main worktree
- `${branchName}` - Name of the branch

---

## 📋 Requirements

- **Git 2.5+** (worktree support required)
- **VS Code 1.108.1+**
- A git repository

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest new features
- 🔧 Submit pull requests

Visit the [GitHub repository](https://github.com/AbianS/worktree-easy) to get started.

---

## 📝 License

[MIT](LICENSE)

