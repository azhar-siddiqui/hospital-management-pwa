#!/usr/bin/env python3
"""Block repository changes that skip the project permission rules.

Bypass mode cannot write files or run mutating commands. Commit, push, and
the other reserved git actions are blocked in every permission mode.
"""

import json
import re
import sys

SHELL_TOOLS = {"run_terminal_command", "bash", "shell"}
TASK_TOOLS = {"spawn_subagent", "task", "workflow"}

ALWAYS_DENY_GIT = {
    "commit",
    "push",
    "merge",
    "rebase",
    "reset",
    "tag",
    "clean",
    "restore",
    "am",
    "cherry-pick",
    "revert",
    "filter-branch",
    "update-ref",
    "pull",
}

READONLY_GIT = {
    "status",
    "diff",
    "log",
    "show",
    "blame",
    "rev-parse",
    "ls-files",
    "remote",
    "shortlog",
    "describe",
    "grep",
    "version",
    "help",
    "check-ignore",
}

READONLY_BIN = {
    "ls",
    "pwd",
    "cat",
    "head",
    "tail",
    "wc",
    "file",
    "stat",
    "which",
    "whoami",
    "uname",
    "date",
    "echo",
    "printf",
    "true",
    "false",
    "rg",
    "grep",
    "dirname",
    "basename",
    "realpath",
    "readlink",
    "diff",
    "cmp",
    "cut",
    "tr",
    "sort",
    "uniq",
    "nl",
    "column",
    "tree",
    "du",
    "df",
    "awk",
}


def emit(decision, reason=None):
    payload = {"decision": decision}
    if reason:
        payload["reason"] = reason
    json.dump(payload, sys.stdout)
    raise SystemExit(2 if decision == "deny" else 0)


def deny(reason):
    emit("deny", reason)


def ask(reason):
    emit("ask", reason)


def allow():
    emit("allow")


def field(event, *names):
    for name in names:
        if name in event and event[name] is not None:
            return event[name]
    return None


def outside_quotes(text):
    """Yield characters that are not inside single or double quotes."""
    quote = None
    for char in text:
        if quote:
            if char == quote:
                quote = None
            continue
        if char in "'\"":
            quote = char
            continue
        yield char
    if quote:
        raise ValueError("unclosed quote")


def split_outside_quotes(text, separators):
    parts = []
    buf = []
    quote = None
    index = 0
    while index < len(text):
        char = text[index]
        if quote:
            buf.append(char)
            if char == quote:
                quote = None
            index += 1
            continue
        if char in "'\"":
            quote = char
            buf.append(char)
            index += 1
            continue
        matched = False
        for separator in separators:
            if text.startswith(separator, index):
                parts.append("".join(buf))
                buf = []
                index += len(separator)
                matched = True
                break
        if matched:
            continue
        buf.append(char)
        index += 1
    if quote:
        raise ValueError("unclosed quote")
    parts.append("".join(buf))
    return parts


def tokenize(segment):
    words = []
    buf = []
    quote = None
    for char in segment:
        if quote:
            if char == quote:
                quote = None
            else:
                buf.append(char)
            continue
        if char in "'\"":
            quote = char
            continue
        if char.isspace():
            if buf:
                words.append("".join(buf))
                buf = []
            continue
        buf.append(char)
    if quote:
        raise ValueError("unclosed quote")
    if buf:
        words.append("".join(buf))
    return words


def command_words(words):
    index = 0
    while index < len(words):
        word = words[index]
        if word in {"sudo", "command", "exec", "env"}:
            index += 1
            while index < len(words) and words[index].startswith("-"):
                index += 1
            continue
        if "=" in word and not word.startswith(("=", "-")):
            index += 1
            continue
        break
    return words[index:]


def git_subcommand(words):
    index = 1
    while index < len(words):
        word = words[index]
        if word in {"-C", "-c", "--git-dir", "--work-tree"} and index + 1 < len(words):
            index += 2
            continue
        if word.startswith("-"):
            index += 1
            continue
        return word
    return ""


def branch_is_readonly(words):
    args = words[2:]
    return all(arg.startswith("-") for arg in args)


def stash_is_readonly(words):
    args = [word for word in words[2:] if not word.startswith("-")]
    return bool(args) and args[0] in {"list", "show"}


def find_is_readonly(words):
    blocked = {"-delete", "-exec", "-execdir", "-ok", "-okdir", "-fls", "-fprint", "-fprintf"}
    return not any(word in blocked for word in words)


def sed_is_readonly(words):
    return "-i" not in words and not any(word.startswith("--in-place") for word in words)


def is_seed(text, words):
    lowered = text.lower()
    if "db:seed" in lowered or "prisma db seed" in lowered:
        return True
    flat = [word.lower() for word in words]
    return "db" in flat and "seed" in flat


RESERVED_TEXT = re.compile(
    r"\bgit(?:\s+(?:-[Cc]\s+\S+|--git-dir(?:=\S+|\s+\S+)|--work-tree(?:=\S+|\s+\S+)))*\s+"
    r"(?:commit|push|merge|rebase|reset|tag|clean|restore|pull|am|cherry-pick|revert|"
    r"filter-branch|update-ref)\b"
    r"|\bgit\s+stash\b(?!\s+(?:list|show)\b)"
    r"|db:seed|\bprisma\s+db\s+seed\b|\bdb\s+seed\b",
    re.IGNORECASE,
)


def without_single_quotes(text):
    return re.sub(r"'[^']*'", " ", text)


def substitution_rank(segment, bypass):
    visible = without_single_quotes(segment)
    if "$(" not in visible and "`" not in visible:
        return None
    if RESERVED_TEXT.search(visible):
        return "deny"
    return "deny" if bypass else "ask"


def is_reserved_git(words):
    if not words or words[0] != "git":
        return False
    sub = git_subcommand(words)
    if sub in ALWAYS_DENY_GIT:
        return True
    if sub == "stash" and not stash_is_readonly(words):
        return True
    return False


def classify_stage(segment, bypass):
    hidden = substitution_rank(segment, bypass)
    if hidden:
        return hidden
    try:
        if any(char in {"<", ">"} for char in outside_quotes(segment)):
            raise ValueError("redirection")
        words = command_words(tokenize(segment))
    except ValueError:
        return "deny" if bypass else "ask"
    if not words:
        return "allow"
    if any(word.startswith("<(") for word in words):
        return "deny" if bypass else "ask"
    if is_seed(segment, words) or is_reserved_git(words):
        return "deny"
    program = words[0]
    if program == "git":
        sub = git_subcommand(words)
        if sub in READONLY_GIT or (sub == "branch" and branch_is_readonly(words)) or (
            sub == "stash" and stash_is_readonly(words)
        ):
            return "allow"
        return "deny" if bypass else "ask"
    if program == "find" and find_is_readonly(words):
        return "allow"
    if program == "sed" and sed_is_readonly(words):
        return "allow"
    if program in READONLY_BIN:
        return "allow"
    return "deny" if bypass else "ask"


def classify_command(command, bypass, truncated):
    if truncated or not command.strip():
        return "deny"
    try:
        segments = split_outside_quotes(command, ("&&", "||", ";", "\n"))
    except ValueError:
        return "deny" if bypass else "ask"
    worst = "allow"
    for segment in segments:
        if not segment.strip():
            continue
        try:
            stages = split_outside_quotes(segment, ("|",))
        except ValueError:
            return "deny" if bypass else "ask"
        for stage in stages:
            if not stage.strip():
                continue
            rank = classify_stage(stage, bypass)
            if rank == "deny":
                return "deny"
            if rank == "ask":
                worst = "ask"
    return worst


def file_path(tool_input):
    if not isinstance(tool_input, dict):
        return ""
    for key in ("file_path", "target_file", "path", "filePath"):
        value = tool_input.get(key)
        if isinstance(value, str) and value:
            return value
    return ""


def main():
    raw = sys.stdin.read()
    try:
        event = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        deny("The permission hook could not read this tool call, so it was blocked.")
    if not isinstance(event, dict):
        deny("The permission hook could not read this tool call, so it was blocked.")

    mode = str(field(event, "permissionMode", "permission_mode") or "")
    bypass = mode == "bypassPermissions"
    tool = str(field(event, "toolName", "tool_name") or "").lower()
    tool_input = field(event, "toolInput", "tool_input") or {}
    if not isinstance(tool_input, dict):
        tool_input = {}
    truncated = bool(field(event, "toolInputTruncated", "tool_input_truncated"))

    if tool in TASK_TOOLS:
        if bypass:
            deny(
                "Bypass mode cannot start another agent. Turn bypass off and ask before changing this repository."
            )
        ask("Starting another agent needs your permission before it can change this repository.")

    if tool in SHELL_TOOLS:
        command = tool_input.get("command") or tool_input.get("cmd") or ""
        if not isinstance(command, str):
            command = ""
        rank = classify_command(command, bypass, truncated)
        if rank == "deny":
            if truncated or not command.strip():
                deny("The command could not be checked against the project rules, so it was blocked.")
            deny(
                "Blocked by the project permission hook. Commit, push, merge, rebase, reset, seed, and other reserved git or database writes stay with the user. Bypass mode cannot run a command that changes the repository."
            )
        if rank == "ask":
            ask(
                "This command can change the repository. The project rules require your permission before it runs."
            )
        allow()

    path = file_path(tool_input)
    where = f" ({path})" if path else ""
    if bypass:
        deny(
            f"Bypass mode cannot edit files{where}. Turn bypass off. The project rules forbid changes without your permission."
        )
    ask(f"This file change{where} needs your permission. The project rules forbid changes without it.")


if __name__ == "__main__":
    main()
