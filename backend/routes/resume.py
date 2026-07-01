"""Resume upload and parsing API routes."""
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..config import UPLOADS_DIR
from ..services import script_runner, session_manager

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Upload a resume file (PDF/DOCX/MD/TXT)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = Path(file.filename).suffix.lower()
    allowed = {".pdf", ".docx", ".md", ".markdown", ".txt"}
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(allowed)}",
        )

    content = await file.read()
    saved_path = session_manager.save_upload(content, file.filename)

    return {
        "filename": file.filename,
        "path": str(saved_path),
        "size": len(content),
        "content_type": file.content_type,
    }


@router.post("/parse")
async def parse_resume(resume_path: str, output_dir: str | None = None, pdf_converter: str = "api"):
    """Parse a resume file into a structured candidate profile."""
    path = Path(resume_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Resume file not found: {resume_path}")

    if not output_dir:
        output_dir = str(path.parent / f"{path.stem}_parsed")

    args = [str(path), "-o", output_dir, "--pdf-converter", pdf_converter]
    try:
        result = script_runner.run_script("parse_resume.py", args, timeout=120)
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Read back the generated files
    import json
    profile_path = Path(output_dir) / "candidate_profile.json"
    profile = None
    if profile_path.exists():
        try:
            profile = json.loads(profile_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass

    risks_path = Path(output_dir) / "resume_risks.md"
    risks_md = risks_path.read_text(encoding="utf-8") if risks_path.exists() else ""

    source_path = Path(output_dir) / "source_resume.md"
    source_md = source_path.read_text(encoding="utf-8") if source_path.exists() else ""

    return {
        "status": "ok",
        "output_dir": output_dir,
        "profile": profile,
        "source_resume_md": source_md,
        "resume_risks_md": risks_md,
        "files": [f.name for f in Path(output_dir).iterdir() if f.is_file()],
    }
