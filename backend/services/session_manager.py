"""Session directory management and file I/O helpers."""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..config import SESSIONS_ROOT, UPLOADS_DIR


def create_session_dir(session_name: str | None = None) -> Path:
    """Create a new session directory and return its path."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    name = session_name or "interview"
    dirname = f"{name}_session_{timestamp}"
    session_dir = SESSIONS_ROOT / dirname
    session_dir.mkdir(parents=True, exist_ok=True)
    (session_dir / "llm_judgements").mkdir(exist_ok=True)
    (session_dir / "question_selection").mkdir(exist_ok=True)
    return session_dir


def list_sessions() -> list[dict[str, Any]]:
    """List all sessions with basic metadata."""
    sessions = []
    if not SESSIONS_ROOT.exists():
        return sessions

    for d in sorted(SESSIONS_ROOT.iterdir(), reverse=True):
        if not d.is_dir():
            continue
        state_file = d / "session_state.json"
        info = {
            "session_id": d.name,
            "path": str(d),
            "created_at": datetime.fromtimestamp(d.stat().st_mtime, tz=timezone.utc).isoformat(),
        }
        if state_file.exists():
            try:
                state = json.loads(state_file.read_text(encoding="utf-8"))
                info["runtime_status"] = state.get("runtime_status", "UNKNOWN")
                info["mode"] = state.get("config", {}).get("mode", "")
                info["role"] = state.get("config", {}).get("role", "")
                info["active_stage"] = state.get("active_stage")
            except (json.JSONDecodeError, KeyError):
                info["runtime_status"] = "CORRUPT"
        else:
            info["runtime_status"] = "EMPTY"
        sessions.append(info)

    return sessions


def read_session_state(session_dir: Path | str) -> dict[str, Any]:
    """Read session_state.json."""
    path = _resolve_path(session_dir) / "session_state.json"
    if not path.exists():
        raise FileNotFoundError(f"session_state.json not found at {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def write_session_state(session_dir: Path | str, state: dict[str, Any]) -> None:
    """Write session_state.json."""
    path = _resolve_path(session_dir) / "session_state.json"
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def read_transcript(session_dir: Path | str) -> dict[str, Any]:
    """Read transcript.json."""
    path = _resolve_path(session_dir) / "transcript.json"
    if not path.exists():
        return {"schema_version": "0.5", "session": {}, "answers": []}
    return json.loads(path.read_text(encoding="utf-8"))


def read_candidate_profile(session_dir: Path | str) -> dict[str, Any] | None:
    """Read candidate_profile.json if it exists."""
    path = _resolve_path(session_dir) / "candidate_profile.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def read_question_selection(session_dir: Path | str) -> dict[str, Any] | None:
    """Read question_selection.json if it exists."""
    path = _resolve_path(session_dir) / "question_selection" / "question_selection.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def read_evaluation(session_dir: Path | str) -> dict[str, Any] | None:
    """Read interview_evaluation.json if it exists."""
    path = _resolve_path(session_dir) / "interview_evaluation.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def read_score_snapshot(session_dir: Path | str) -> dict[str, Any] | None:
    """Read score_snapshot.json if it exists."""
    path = _resolve_path(session_dir) / "score_snapshot.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def read_next_round(session_dir: Path | str) -> dict[str, Any] | None:
    """Read next_round_recommendation.json if it exists."""
    path = _resolve_path(session_dir) / "next_round_recommendation.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def read_resume_rewrite(session_dir: Path | str) -> dict[str, Any] | None:
    """Read resume_rewrite_suggestions.json if it exists."""
    path = _resolve_path(session_dir) / "resume_rewrite_suggestions.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def get_artifacts(session_dir: Path | str) -> list[dict[str, Any]]:
    """List all artifact files in a session directory."""
    dir_path = _resolve_path(session_dir)
    artifacts = []
    for f in sorted(dir_path.rglob("*")):
        if f.is_file() and f.suffix in (".json", ".md"):
            artifacts.append({
                "name": str(f.relative_to(dir_path)),
                "size": f.stat().st_size,
                "modified": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
            })
    return artifacts


def get_artifact_path(session_dir: Path | str, artifact_name: str) -> Path:
    """Get the full path to an artifact, ensuring it stays within session_dir."""
    dir_path = _resolve_path(session_dir).resolve()
    artifact_path = (dir_path / artifact_name).resolve()
    # Security: ensure artifact is within the session dir
    if not str(artifact_path).startswith(str(dir_path)):
        raise ValueError(f"Artifact path escapes session directory: {artifact_name}")
    if not artifact_path.exists():
        raise FileNotFoundError(f"Artifact not found: {artifact_name}")
    return artifact_path


def save_upload(file_content: bytes, filename: str) -> Path:
    """Save an uploaded file to the uploads directory."""
    safe_name = Path(filename).name  # Strip any path components
    dest = UPLOADS_DIR / safe_name
    dest.write_bytes(file_content)
    return dest


def delete_session(session_dir: Path | str) -> None:
    """Delete a session directory entirely."""
    path = _resolve_path(session_dir)
    if path.exists() and path.is_dir():
        shutil.rmtree(path)


def session_exists(session_dir: Path | str) -> bool:
    """Check if a session directory exists."""
    return _resolve_path(session_dir).exists()


def _resolve_path(session_dir: Path | str) -> Path:
    """Resolve a session directory path (accepts full path or session name)."""
    path = Path(session_dir)
    if not path.is_absolute():
        path = SESSIONS_ROOT / path
    return path
