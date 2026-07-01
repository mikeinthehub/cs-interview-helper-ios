"""Report and artifact API routes."""
from fastapi import HTTPException, APIRouter
from fastapi.responses import FileResponse

from ..services import session_manager

router = APIRouter(prefix="/api/session/{session_id}", tags=["report"])


@router.get("/evaluation")
async def get_evaluation(session_id: str):
    """Get the interview evaluation."""
    eval_data = session_manager.read_evaluation(session_id)
    if eval_data is None:
        raise HTTPException(status_code=404, detail="Evaluation not found. Generate a report first.")
    return eval_data


@router.get("/score-snapshot")
async def get_score_snapshot(session_id: str):
    """Get the mid-session score snapshot."""
    snap = session_manager.read_score_snapshot(session_id)
    if snap is None:
        raise HTTPException(status_code=404, detail="Score snapshot not found")
    return snap


@router.get("/next-round")
async def get_next_round(session_id: str):
    """Get the next round recommendation."""
    rec = session_manager.read_next_round(session_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Next round recommendation not found")
    return rec


@router.get("/resume-rewrite")
async def get_resume_rewrite(session_id: str):
    """Get resume rewrite suggestions."""
    suggestions = session_manager.read_resume_rewrite(session_id)
    if suggestions is None:
        raise HTTPException(status_code=404, detail="Resume rewrite suggestions not found")
    return suggestions


@router.get("/artifacts")
async def list_artifacts(session_id: str):
    """List all artifacts for a session."""
    return session_manager.get_artifacts(session_id)


@router.get("/artifacts/{artifact_name:path}")
async def download_artifact(session_id: str, artifact_name: str):
    """Download a specific artifact file."""
    try:
        path = session_manager.get_artifact_path(session_id, artifact_name)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=404, detail=str(e))
    return FileResponse(str(path), filename=path.name)
