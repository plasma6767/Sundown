# Agent Teams — Best Practices Reference

> Source: https://code.claude.com/docs/en/agent-teams
> Use this document when designing agent team strategies for Sundown.

---

## What Are Agent Teams?

Multiple Claude Code instances working together. One session acts as the **team lead** — it coordinates work, assigns tasks, and synthesizes results. **Teammates** work independently, each in its own context window, and can communicate directly with each other and the lead.

---

## When TO Use Agent Teams

| Scenario | Why it fits |
|---|---|
| Research & review | Multiple teammates investigate different angles simultaneously |
| New modules / features | Each teammate owns a separate, non-overlapping piece |
| Competing hypotheses | Test different theories in parallel, teammates debate findings |
| Cross-layer changes | Frontend, backend, and tests can be owned by separate agents |

## When NOT to Use Agent Teams

- **Sequential tasks** — no parallelism benefit, use a single session
- **Same-file edits** — teammates will overwrite each other
- **Work with many interdependencies** — coordination overhead outweighs gains
- Use **subagents** instead for lightweight delegation without inter-agent coordination

---

## Enabling Agent Teams

Disabled by default. Add to `settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## Architecture Overview

| Component | Description |
|---|---|
| **Team lead** | Main Claude Code session; creates and coordinates the team |
| **Teammates** | Separate Claude Code instances, each with own context window |
| **Task list** | Shared work items stored at `~/.claude/tasks/{team-name}/` |
| **Mailbox** | Messaging system between agents |
| **Team config** | Stored at `~/.claude/teams/{team-name}/config.json` |

**Key context rules:**
- Each teammate has its own context window — the lead's conversation history does NOT carry over
- Teammates load `CLAUDE.md`, MCP servers, and skills from the project
- Teammates can message each other directly (`message` for one, `broadcast` for all)
- Broadcast costs scale with team size — use sparingly

---

## Best Practices

### 1. Give teammates enough context at spawn time
The lead's conversation history is not available to teammates. Include all task-specific details, constraints, and background directly in the spawn prompt — don't assume they know what the lead knows.

### 2. Choose the right team size
Start with **3–5 teammates**. Larger teams increase token cost and coordination overhead faster than they increase parallelism benefit.

### 3. Size tasks appropriately
Aim for **5–6 self-contained tasks per teammate**, each with clear deliverables and defined file ownership. Vague or overlapping tasks cause confusion and merge conflicts.

### 4. Avoid file conflicts
Each teammate should own **different files or modules**. Shared file edits cause overwrites. Design team structure around file boundaries before spawning.

### 5. Let teammates finish before the lead acts
Don't have the lead start synthesis or downstream work before teammates signal completion. Use the task list and `TeammateIdle` hook to gate progress.

### 6. Start with research/review tasks
Research and review are safer than parallel implementation — no write conflicts, easier to synthesize, good way to learn agent team dynamics before tackling feature work.

### 7. Monitor and steer actively
Agent teams are not fully autonomous. Check progress, redirect approaches that are going off-track, and synthesize findings deliberately rather than letting them pile up.

---

## Hooks for Quality Gates

| Hook | Trigger | Use |
|---|---|---|
| `TeammateIdle` | Teammate about to go idle | Exit code 2 to keep the teammate working |
| `TaskCompleted` | Task marked complete | Exit code 2 to block premature completion |

---

## Controlling the Team

```text
# Cycle through teammates (keyboard)
Shift+Down

# Direct a specific teammate
[Type message while that teammate is active]

# Shut down one teammate
Ask the researcher teammate to shut down

# Clean up entire team
Clean up the team
```

---

## Token Cost Awareness

Agent teams consume tokens **multiplicatively** — each teammate has its own context window running independently. Reserve agent teams for work where parallel exploration genuinely saves time (research, review, new modules). For simple or sequential tasks the token cost is rarely justified.

---

## Display Modes

| Mode | How | Requirement |
|---|---|---|
| In-process (default) | All teammates in main terminal, Shift+Down to cycle | None |
| Split panes | Each teammate in own pane | tmux or iTerm2 |

Configure in `settings.json`:
```json
{
  "teammateMode": "in-process"
}
```

---

## Known Limitations (Experimental)

- No session resumption with in-process teammates
- Task status can lag between teammates
- Shutdown can be slow
- One team per session — no nested teams
- Lead is fixed for team lifetime
- Permissions are set at spawn time (lead's settings propagate to all teammates)

---

## Example Team Prompts

### Parallel code review
```text
Create an agent team to review PR #142. Spawn three reviewers:
- Security: focus on auth, input validation, data exposure
- Performance: focus on query efficiency, render cost, bundle size
- Test coverage: validate edge cases and missing assertions
Have each reviewer report findings independently, then synthesize.
```

### Competing hypotheses / debugging
```text
Users report the app exits after one message. Spawn 5 teammates to investigate
different hypotheses. Have them talk to each other to try to disprove each
other's theories — treat it like a scientific debate.
```

### New feature with cross-layer changes
```text
Build the distress-detection pipeline. Assign:
- Teammate A: ElevenLabs webhook handler + transcript parsing
- Teammate B: risk scoring logic + incident creation
- Teammate C: Supabase Realtime broadcast + dashboard alert
Each teammate owns their files exclusively. Lead synthesizes when all three complete.
```

---

## Quick Reference Checklist

Before spawning a team, verify:

- [ ] Task is genuinely parallelizable (not sequential)
- [ ] No two teammates will touch the same file
- [ ] Each teammate's spawn prompt contains full context (don't rely on lead history)
- [ ] Team size is 3–5 (not larger without strong justification)
- [ ] Tasks are self-contained with clear deliverables
- [ ] You have a synthesis plan for when teammates finish
- [ ] Token cost is justified by the work being parallelized
