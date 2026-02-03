---
name: skill-creator
description: Create new AI agent skills for this project. Use when asked to create a skill, add a skill, or document a new module for AI context.
---

# Skill Creator

Use this skill to create new skills for the Propel project.

## Skill Structure

```
.claude/skills/<skill-name>/
├── SKILL.md          # Required: main instructions
├── scripts/          # Optional: automation
├── references/       # Optional: detailed docs
└── assets/           # Optional: templates
```

## SKILL.md Template

```markdown
---
name: skill-name
description: Clear description with trigger keywords. Triggers on "keyword1", "keyword2".
---

# Skill Name

Brief description.

## Core Concepts
## Code Patterns
## Guidelines
## Common Mistakes
```

## Writing Good Triggers

Good:
```yaml
description: Use when working with auth, login, signup, sessions. Triggers on "auth", "login", "user".
```

Bad:
```yaml
description: Authentication skill.  # Too vague
```

## Best Practices

1. Keep SKILL.md under 500 lines
2. Include working code examples
3. List explicit guidelines (numbered)
4. Add common mistakes
5. Use H2 for sections, H3 for subsections

## Creating a New Skill

```bash
mkdir -p .claude/skills/<skill-name>
# Create SKILL.md with frontmatter and content
```

Test by asking Claude a question that should trigger the skill.
