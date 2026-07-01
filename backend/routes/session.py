"""Session management API routes."""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import SESSIONS_ROOT
from ..services import script_runner, session_manager

router = APIRouter(prefix="/api/session", tags=["session"])


class InitSessionRequest(BaseModel):
    resume_path: str | None = None
    session_name: str | None = None
    sessions_root: str | None = None
    profile_json: str | None = None


class SessionInfo(BaseModel):
    session_id: str
    path: str
    created_at: str
    runtime_status: str


@router.post("/init")
async def init_session(req: InitSessionRequest):
    """Create a new interview session."""
    # The init subcommand takes --session-name and --sessions-root, NOT a positional session_dir.
    # It creates the session directory internally and returns its path.
    args = ["init"]
    if req.session_name:
        args.extend(["--session-name", req.session_name])
    if req.resume_path:
        args.extend(["--resume", req.resume_path])
    if req.profile_json:
        args.extend(["--profile-json", req.profile_json])
    sessions_root = req.sessions_root or str(SESSIONS_ROOT)
    args.extend(["--sessions-root", sessions_root])

    try:
        result = script_runner.run_script("interview_session.py", args, timeout=60)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # The init command returns the session_dir in its response
    session_dir_str = result.get("session_dir") if isinstance(result, dict) else None
    if session_dir_str:
        session_dir = session_manager._resolve_path(session_dir_str)
        try:
            state = session_manager.read_session_state(session_dir)
        except FileNotFoundError:
            state = {"runtime_status": "INIT"}
        return {
            "session_id": session_dir.name,
            "path": str(session_dir),
            "runtime_status": state.get("runtime_status", "INIT"),
            "state": state,
        }
    else:
        # Fallback: scan for the newly created session
        return {
            "session_id": "unknown",
            "path": "",
            "runtime_status": "INIT",
            "state": {"runtime_status": "INIT"},
            "detail": "Init completed but session_dir not returned",
        }


@router.get("/{session_id}/state")
async def get_session_state(session_id: str):
    """Get the full session state."""
    try:
        state = session_manager.read_session_state(session_id)
        return state
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/{session_id}/status")
async def get_session_status(session_id: str):
    """Get a summary status for the session."""
    try:
        result = script_runner.run_script(
            "interview_session.py", ["status", str(session_manager._resolve_path(session_id))]
        )
        return result
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/transcript")
async def get_transcript(session_id: str):
    """Get the interview transcript."""
    try:
        return session_manager.read_transcript(session_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")


@router.get("/{session_id}/selection")
async def get_question_selection(session_id: str):
    """Get the question selection."""
    sel = session_manager.read_question_selection(session_id)
    if sel is None:
        raise HTTPException(status_code=404, detail="Question selection not found")
    return sel


@router.get("/{session_id}/profile")
async def get_candidate_profile(session_id: str):
    """Get the candidate profile."""
    profile = session_manager.read_candidate_profile(session_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return profile


@router.post("/{session_id}/reset")
async def reset_session(session_id: str):
    """Reset (archive) a session."""
    session_dir = session_manager._resolve_path(session_id)
    try:
        result = script_runner.run_script(
            "interview_session.py", ["reset", str(session_dir)]
        )
        return result
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_all_sessions():
    """List all sessions."""
    return session_manager.list_sessions()
