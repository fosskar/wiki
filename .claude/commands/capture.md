---
description: Smart capture command
argument-hint: [content to capture]
allowed-tools:
  - Write(*)
  - Read(*)
  - Bash(date:*)
---

## Context

- **Today's Date:** !`date "+%Y-%m-%d"`
- **User Input:** `$ARGUMENTS`
- **Idea Command:** .claude/commands/idea.md
- **YouTube Command:** .claude/commands/youtube-note.md

## Your Task

Create a smart capture item that automatically routes to the appropriate Obsidian base using intelligent categorization.

### Mode 1: Idea Capture
When input contains idea-related keywords (idea, concept, thought, insight):

**Route to:** .claude/commands/idea.md

### Mode 2: YouTube Capture
When input contains YouTube URLs (youtube.com, youtu.be):

**Route to:** .claude/commands/youtube-note.md
