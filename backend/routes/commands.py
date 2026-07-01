"""Interview control command API routes."""
from fastapi import APIRouter, HTTPException

from ..services import script_runner, session_manager

router = APIRouter(prefix="/api/session/{session_id}", tags=["commands"])


def _run_command(session_id: str, command: str, extra_args: list[str] | None = None):
    """Execute an interview_session subcommand against a session."""
    session_dir = session_manager._resolve_path(session_id)
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    args = [command, str(session_dir)] + (extra_args or [])
    try:
        result = script_runner.run_script("interview_session.py", args)
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Return updated state alongside the result
    try:
        updated_state = session_manager.read_session_state(session_dir)
    except FileNotFoundError:
        updated_state = None

    return {"result": result, "session_state": updated_state}


@router.post("/start")
async def start_interview(session_id: str):
    """Start the interview."""
    return _run_command(session_id, "start")


@router.post("/hint")
async def request_hint(session_id: str):
    """Request a hint for the current question."""
    return _run_command(session_id, "hint")


@router.post("/repeat")
async def repeat_question(session_id: str):
    """Repeat the current question."""
    return _run_command(session_id, "repeat")


@router.post("/explain")
async def explain_question(session_id: str):
    """Explain the current question."""
    return _run_command(session_id, "explain")


@router.post("/skip")
async def skip_question(session_id: str):
    """Skip the current question."""
    return _run_command(session_id, "skip")


@router.post("/pause")
async def pause_interview(session_id: str):
    """Pause the interview."""
    return _run_command(session_id, "pause")


@router.post("/continue")
async def continue_interview(session_id: str):
    """Continue a paused interview."""
    return _run_command(session_id, "continue")


@router.post("/score")
async def mid_session_score(session_id: str):
    """Generate a mid-session score snapshot."""
    return _run_command(session_id, "score")


@router.post("/report")
async def generate_report(session_id: str):
    """Generate the final interview report."""
    return _run_command(session_id, "report")


@router.post("/next")
async def next_question(session_id: str):
    """Advance to the next question."""
    return _run_command(session_id, "next")


@router.post("/record-answer")
async def record_answer(
    session_id: str,
    quality: str = "partial",
    score: int = 3,
    strengths: str = "",
    issues: str = "",
    answer_summary: str = "",
    feedback: str = "",
    duration_seconds: int = 0,
    hints_used: int = 0,
    skipped: bool = False,
):
    """Record a candidate's answer."""
    args = [
        "record-answer",
        str(session_manager._resolve_path(session_id)),
        "--quality", quality,
        "--score", str(score),
        "--strengths", strengths or " ",
        "--issues", issues or " ",
        "--answer-summary", answer_summary or " ",
        "--feedback", feedback or " ",
        "--duration-seconds", str(duration_seconds),
        "--hints-used", str(hints_used),
    ]
    if skipped:
        args.append("--skipped")
    return _run_command(session_id, "record-answer", args[2:])
