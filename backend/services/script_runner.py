"""Subprocess wrapper for executing skill Python scripts."""
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from ..config import SCRIPTS_DIR, SKILL_DIR


def run_script(script_name: str, args: list[str] | None = None, timeout: int = 30) -> dict[str, Any]:
    """
    Run a skill Python script as a subprocess and return parsed JSON output.

    Args:
        script_name: Name of the script file (e.g. 'interview_session.py')
        args: List of CLI arguments to pass
        timeout: Maximum execution time in seconds

    Returns:
        Parsed JSON dict from stdout

    Raises:
        RuntimeError: If the script exits with non-zero code
        FileNotFoundError: If the script doesn't exist
    """
    script_path = SCRIPTS_DIR / script_name
    if not script_path.exists():
        raise FileNotFoundError(f"Script not found: {script_path}")

    cmd = [sys.executable, str(script_path)] + (args or [])

    try:
        result = subprocess.run(
            cmd,
            cwd=str(SKILL_DIR),
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=timeout,
        )

        if result.returncode != 0:
            stderr = result.stderr.strip()
            # Try to parse stderr as JSON (scripts may write errors as JSON)
            try:
                error_data = json.loads(stderr)
                return {"error": True, "detail": error_data, "exit_code": result.returncode}
            except json.JSONDecodeError:
                raise RuntimeError(
                    f"Script {script_name} failed (exit {result.returncode}): {stderr or result.stdout.strip()}"
                )

        stdout = result.stdout.strip()
        if not stdout:
            return {"status": "ok"}

        try:
            return json.loads(stdout)
        except json.JSONDecodeError:
            return {"status": "ok", "output": stdout}

    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Script {script_name} timed out after {timeout}s")


def run_script_raw(script_name: str, args: list[str] | None = None, timeout: int = 30) -> subprocess.CompletedProcess:
    """Run a script and return the raw subprocess result."""
    script_path = SCRIPTS_DIR / script_name
    cmd = [sys.executable, str(script_path)] + (args or [])

    return subprocess.run(
        cmd,
        cwd=str(SKILL_DIR),
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=timeout,
    )
