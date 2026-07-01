"""Configuration API routes."""
import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import DATA_DIR
from ..services import script_runner, session_manager

router = APIRouter(prefix="/api", tags=["config"])


class ConfigureRequest(BaseModel):
    role: str | None = None
    strength: str | None = None
    tone: str | None = None
    level: str | None = None
    mode: str | None = None
    focus: list[str] | None = None
    jd_text: str | None = None
    jd_file: str | None = None
    fundamentals_count: int | None = None
    algorithms_count: int | None = None
    defer_if_running: bool = False


class JDRequest(BaseModel):
    jd_text: str | None = None
    jd_file: str | None = None
    defer_if_running: bool = False


@router.post("/session/{session_id}/configure")
async def configure_session(session_id: str, req: ConfigureRequest):
    """Configure an interview session."""
    session_dir = session_manager._resolve_path(session_id)
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    args = ["configure", str(session_dir)]
    if req.role:
        args.extend(["--role", req.role])
    if req.strength:
        args.extend(["--strength", req.strength])
    if req.tone:
        args.extend(["--tone", req.tone])
    if req.level:
        args.extend(["--level", req.level])
    if req.mode:
        args.extend(["--mode", req.mode])
    if req.focus:
        args.extend(["--focus", ",".join(req.focus)])
    if req.jd_text:
        args.extend(["--jd-text", req.jd_text])
    if req.jd_file:
        args.extend(["--jd-file", req.jd_file])
    if req.fundamentals_count:
        args.extend(["--fundamentals-count", str(req.fundamentals_count)])
    if req.algorithms_count:
        args.extend(["--algorithms-count", str(req.algorithms_count)])
    if req.defer_if_running:
        args.append("--defer-if-running")

    try:
        result = script_runner.run_script("interview_session.py", args, timeout=60)
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))

    updated_state = session_manager.read_session_state(session_dir)
    return {"result": result, "session_state": updated_state}


@router.post("/session/{session_id}/jd")
async def set_jd(session_id: str, req: JDRequest):
    """Set the job description for a session."""
    session_dir = session_manager._resolve_path(session_id)
    if not session_dir.exists():
        raise HTTPException(status_code=404, detail="Session not found")

    args = ["jd", str(session_dir)]
    if req.jd_text:
        args.extend(["--jd-text", req.jd_text])
    if req.jd_file:
        args.extend(["--jd-file", req.jd_file])
    if req.defer_if_running:
        args.append("--defer-if-running")

    try:
        result = script_runner.run_script("interview_session.py", args)
    except (FileNotFoundError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))

    updated_state = session_manager.read_session_state(session_dir)
    return {"result": result, "session_state": updated_state}


@router.get("/config/roles")
async def list_roles():
    """Get all role profiles."""
    path = DATA_DIR / "role_profiles.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Role profiles not found")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/config/modes")
async def list_modes():
    """Get all interview mode profiles."""
    path = DATA_DIR / "interview_mode_profiles.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Mode profiles not found")
    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/config/constants")
async def get_constants():
    """Get all configuration constants (roles, strengths, tones, levels, modes, focuses)."""
    # These are derived from scripts/session_router.py known values
    return {
        "roles": [
            {"id": "backend-java", "label": "Java 后端"},
            {"id": "backend-python", "label": "Python 后端"},
            {"id": "backend-go", "label": "Go 后端"},
            {"id": "ai-agent", "label": "AI Agent"},
            {"id": "ai-rag", "label": "AI RAG"},
            {"id": "ai-eval", "label": "AI 评测"},
            {"id": "sre-platform", "label": "SRE 平台"},
        ],
        "strengths": [
            {"id": "人上人", "label": "人上人", "description": "标准追问深度"},
            {"id": "顶级", "label": "顶级", "description": "深度追问，高标准"},
            {"id": "夯", "label": "夯", "description": "最高强度追问"},
            {"id": "NPC", "label": "NPC", "description": "降低深度，更多引导"},
            {"id": "拉完了", "label": "拉完了", "description": "基础级别，最多引导"},
        ],
        "tones": [
            {"id": "默认", "label": "默认", "description": "专业直接，适度施压"},
            {"id": "温和", "label": "温和", "description": "支持性更强"},
            {"id": "铁面", "label": "铁面", "description": "尖锐追问，压力面"},
        ],
        "levels": [
            {"id": "简单", "label": "简单"},
            {"id": "中等", "label": "中等"},
            {"id": "困难", "label": "困难"},
        ],
        "modes": [
            {"id": "完整模拟", "label": "完整模拟", "description": "自我介绍→项目深挖→CS基础→算法→反问→复盘"},
            {"id": "项目深挖", "label": "项目深挖", "description": "重点拷打项目 ownership、架构、难点、tradeoff"},
            {"id": "八股快问快答", "label": "八股快问快答", "description": "密集抽查基础知识"},
            {"id": "算法陪练", "label": "算法陪练", "description": "多题算法练习，思路、复杂度、边界"},
            {"id": "JD 定向面", "label": "JD 定向面", "description": "围绕岗位JD做能力匹配"},
            {"id": "简历拷打", "label": "简历拷打", "description": "盯住简历里最易被质疑的表述"},
            {"id": "复盘教练", "label": "复盘教练", "description": "基于transcript生成复盘"},
        ],
        "stages": [
            "SELF_INTRO",
            "PROJECT_DEEP_DIVE",
            "CS_FUNDAMENTALS",
            "CODING_INTERVIEW",
            "CANDIDATE_QUESTIONS",
        ],
        "stage_labels": {
            "SELF_INTRO": "自我介绍",
            "PROJECT_DEEP_DIVE": "项目深挖",
            "CS_FUNDAMENTALS": "CS 基础",
            "CODING_INTERVIEW": "算法面试",
            "CANDIDATE_QUESTIONS": "候选人反问",
        },
    }
