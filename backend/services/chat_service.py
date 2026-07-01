"""Chat orchestration — connects frontend messages to Anthropic API + skill scripts."""
import json
import tempfile
import time
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from ..config import SKILL_MD_CONTENT
from . import anthropic_client, script_runner, session_manager


def build_tool_definitions() -> list[dict[str, Any]]:
    """Build Anthropic tool definitions matching interview_session subcommands."""
    return [
        {
            "name": "read_session_state",
            "description": "Read current interview session state including runtime_status, active_stage, current_question, config, progress, and available commands. Call this first to understand where the interview is.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_start",
            "description": "Start the interview — move from CONFIG_READY to RUNNING with the first question.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_next",
            "description": "Advance to the next question in the current stage.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_hint",
            "description": "Increase the hint level for the current question. Hints range from 1 (direction) to 5 (full solution).",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_repeat",
            "description": "Repeat the current question to the candidate.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_explain",
            "description": "Explain the current question's intent and what a good answer should cover.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_skip",
            "description": "Skip the current question and record it as skipped.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "feedback": {"type": "string", "description": "Brief reason for skipping"}
                },
                "required": [],
            },
        },
        {
            "name": "interview_session_pause",
            "description": "Pause the interview at the current question. State changes to PAUSED.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_continue",
            "description": "Continue a paused interview from the current question.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_score",
            "description": "Generate a mid-session score snapshot showing current performance without ending the interview.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_report",
            "description": "Generate the final structured interview evaluation report. Only call when the interview stage sequence is complete or the candidate explicitly requests it.",
            "input_schema": {"type": "object", "properties": {}, "required": []},
        },
        {
            "name": "interview_session_configure",
            "description": "Update interview configuration: role, mode, strength, tone, level, or focus.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "mode": {"type": "string", "description": "Interview mode: 完整模拟, 项目深挖, 八股快问快答, 算法陪练, JD 定向面, 简历拷打, 复盘教练"},
                    "strength": {"type": "string", "description": "Interview strength: 人上人, 顶级, 夯, NPC, 拉完了"},
                    "tone": {"type": "string", "description": "Interviewer tone: 默认, 温和, 铁面"},
                    "level": {"type": "string", "description": "Difficulty level: 简单, 中等, 困难"},
                    "role": {"type": "string", "description": "Role bias: backend-java, backend-python, backend-go, ai-agent, ai-rag, ai-eval, sre-platform"},
                    "focus": {"type": "array", "items": {"type": "string"}, "description": "Focus topics"},
                },
                "required": [],
            },
        },
        {
            "name": "interview_session_jd",
            "description": "Set or update the job description for this interview session.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "jd_text": {"type": "string", "description": "Full job description text"}
                },
                "required": ["jd_text"],
            },
        },
        {
            "name": "apply_llm_answer_judgement",
            "description": "Score a candidate's free-form answer and record it to the transcript. The judgement JSON is saved and the interview state advances automatically.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "quality": {
                        "type": "string",
                        "enum": ["strong", "partial", "weak", "wrong"],
                        "description": "Answer quality level"
                    },
                    "score": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 5,
                        "description": "Score 1-5"
                    },
                    "strengths": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "What the candidate did well"
                    },
                    "issues": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "What was missing or wrong"
                    },
                    "answer_summary": {
                        "type": "string",
                        "description": "Summary of the candidate's actual answer content"
                    },
                    "feedback": {
                        "type": "string",
                        "description": "One-line feedback to show the candidate"
                    },
                    "confidence": {
                        "type": "number",
                        "minimum": 0,
                        "maximum": 1,
                        "description": "Confidence in this judgement"
                    },
                    "next_followup": {
                        "type": "string",
                        "description": "Optional: next followup question if continuing"
                    },
                },
                "required": ["quality", "score", "answer_summary", "feedback"],
            },
        },
    ]


def execute_tool(tool_name: str, tool_input: dict[str, Any], session_dir: str) -> dict[str, Any]:
    """Execute a tool call by running the appropriate skill script."""
    sdir = session_manager._resolve_path(session_dir)
    start_time = time.time()

    try:
        if tool_name == "read_session_state":
            state = session_manager.read_session_state(sdir)
            return {
                "type": "tool_result",
                "tool_name": tool_name,
                "result": {
                    "runtime_status": state.get("runtime_status"),
                    "active_stage": state.get("active_stage"),
                    "stage_sequence": state.get("stage_sequence"),
                    "stage_status": state.get("stage_status"),
                    "config": state.get("config"),
                    "current_question": state.get("current_question"),
                    "progress": state.get("progress"),
                    "pending_reconfiguration": state.get("pending_reconfiguration"),
                },
            }

        elif tool_name == "interview_session_start":
            result = script_runner.run_script("interview_session.py", ["start", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_next":
            result = script_runner.run_script("interview_session.py", ["next", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_hint":
            result = script_runner.run_script("interview_session.py", ["hint", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_repeat":
            result = script_runner.run_script("interview_session.py", ["repeat", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_explain":
            result = script_runner.run_script("interview_session.py", ["explain", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_skip":
            args = ["skip", str(sdir)]
            if tool_input.get("feedback"):
                args.extend(["--feedback", tool_input["feedback"]])
            result = script_runner.run_script("interview_session.py", args)
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_pause":
            result = script_runner.run_script("interview_session.py", ["pause", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_continue":
            result = script_runner.run_script("interview_session.py", ["continue", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_score":
            result = script_runner.run_script("interview_session.py", ["score", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_report":
            result = script_runner.run_script("interview_session.py", ["report", str(sdir)])
            after_state = session_manager.read_session_state(sdir)
            eval_data = session_manager.read_evaluation(sdir)
            return {
                "type": "tool_result",
                "tool_name": tool_name,
                "result": result,
                "session_state": _state_snapshot(after_state),
                "evaluation": eval_data,
            }

        elif tool_name == "interview_session_configure":
            args = ["configure", str(sdir)]
            for key in ("mode", "strength", "tone", "level", "role"):
                if tool_input.get(key):
                    args.extend([f"--{key}", tool_input[key]])
            if tool_input.get("focus"):
                args.extend(["--focus", ",".join(tool_input["focus"])])
            result = script_runner.run_script("interview_session.py", args, timeout=60)
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "interview_session_jd":
            args = ["jd", str(sdir), "--jd-text", tool_input.get("jd_text", "")]
            result = script_runner.run_script("interview_session.py", args)
            after_state = session_manager.read_session_state(sdir)
            return {"type": "tool_result", "tool_name": tool_name, "result": result, "session_state": _state_snapshot(after_state)}

        elif tool_name == "apply_llm_answer_judgement":
            # Save judgement to temp JSON, then call apply_llm_answer_judgement.py
            judgement = {
                "quality": tool_input.get("quality", "partial"),
                "score": tool_input.get("score", 3),
                "strengths": tool_input.get("strengths", []),
                "issues": tool_input.get("issues", []),
                "answer_summary": tool_input.get("answer_summary", ""),
                "feedback": tool_input.get("feedback", ""),
                "confidence": tool_input.get("confidence", 0.75),
                "next_followup": tool_input.get("next_followup", ""),
            }
            # Write to temp dir and call script
            with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
                json.dump(judgement, f, ensure_ascii=False)
                temp_path = f.name
            result = script_runner.run_script(
                "apply_llm_answer_judgement.py", [str(sdir), temp_path], timeout=30
            )
            # Clean up temp file (script may delete it if inside session dir)
            try:
                Path(temp_path).unlink(missing_ok=True)
            except OSError:
                pass
            after_state = session_manager.read_session_state(sdir)
            return {
                "type": "tool_result",
                "tool_name": tool_name,
                "result": result,
                "session_state": _state_snapshot(after_state),
            }

        else:
            return {"type": "tool_result", "tool_name": tool_name, "error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"type": "tool_result", "tool_name": tool_name, "error": str(e)}


def _state_snapshot(state: dict[str, Any]) -> dict[str, Any]:
    """Extract a minimal useful state snapshot."""
    return {
        "runtime_status": state.get("runtime_status"),
        "active_stage": state.get("active_stage"),
        "stage_status": state.get("stage_status"),
        "current_question": state.get("current_question"),
        "progress": state.get("progress"),
        "available_commands": state.get("available_commands"),
    }


def build_messages_from_transcript(
    transcript: dict[str, Any],
    state: dict[str, Any],
    user_message: str,
) -> list[dict[str, Any]]:
    """Build the Anthropic messages array from transcript history and current user input."""
    messages = []

    # Add context about current session state as a system-like user message
    state_context = _build_state_context(state)
    if state_context:
        messages.append({"role": "user", "content": state_context})

    # Add previous Q&A pairs from transcript
    answers = transcript.get("answers", [])
    for ans in answers[-20:]:  # Last 20 exchanges
        q_text = ans.get("question_text", "")
        if q_text:
            messages.append({"role": "assistant", "content": q_text})
        answer_text = ans.get("candidate_answer_text") or ans.get("candidate_answer_summary", "")
        if answer_text:
            messages.append({"role": "user", "content": answer_text})

        # Add judgement context if available
        quality = ans.get("quality")
        score_val = ans.get("score")
        if quality or score_val:
            fb = ans.get("interviewer_feedback", "")
            if fb:
                messages.append({
                    "role": "assistant",
                    "content": f"[Feedback: {fb} | Quality: {quality or 'N/A'} | Score: {score_val or 'N/A'}/5]",
                })

    # Add the current user input
    messages.append({"role": "user", "content": user_message})

    return messages


def _build_state_context(state: dict[str, Any]) -> str:
    """Build a concise state context string for the model."""
    runtime_status = state.get("runtime_status", "INIT")
    active_stage = state.get("active_stage")
    stage_status = state.get("stage_status", {})
    config = state.get("config", {})
    current_q = state.get("current_question") or {}
    progress = state.get("progress", {})
    pending = state.get("pending_reconfiguration") or {}

    lines = [f"[Session State: runtime_status={runtime_status}]"]

    if active_stage:
        lines.append(f"active_stage={active_stage}, stage_status={json.dumps(stage_status, ensure_ascii=False)}")

    if config:
        lines.append(f"config: mode={config.get('mode', 'N/A')}, strength={config.get('strength', 'N/A')}, tone={config.get('tone', 'N/A')}, level={config.get('level', 'N/A')}, role={config.get('role', 'N/A')}, focus={config.get('focus', [])}")

    if config.get("jd_text"):
        jd = config["jd_text"]
        lines.append(f"JD (full text): {jd}")

    if current_q and current_q.get("question_text"):
        lines.append(f"Current question: \"{current_q['question_text']}\" [stage={current_q.get('stage', '')}, hint_level={current_q.get('hint_level', 0)}]")

    if progress:
        lines.append(f"Progress: {json.dumps(progress, ensure_ascii=False)}")

    if pending:
        lines.append(f"Pending reconfiguration: {json.dumps(pending, ensure_ascii=False)}")

    lines.append("---")
    lines.append("You are the CS Technical Interviewer. Follow SKILL.md rules strictly. Use Chinese by default. Ask ONE question at a time. After the candidate answers, judge the answer using apply_llm_answer_judgement, then proceed to the next question.")

    return "\n".join(lines)


async def stream_chat_response(
    session_id: str,
    user_message: str,
) -> AsyncIterator[dict[str, Any]]:
    """Stream a full chat response with tool execution loop."""
    session_dir = session_manager._resolve_path(session_id)
    if not session_dir.exists():
        yield {"type": "error", "error": "Session not found"}
        return

    state = session_manager.read_session_state(session_dir)
    transcript = session_manager.read_transcript(session_dir)

    messages = build_messages_from_transcript(transcript, state, user_message)
    tools = build_tool_definitions()

    max_tool_rounds = 5
    tool_round = 0

    while tool_round < max_tool_rounds:
        tool_round += 1
        text_buffer = []
        tool_uses: list[dict[str, Any]] = []

        async for event in anthropic_client.stream_chat(
            system=SKILL_MD_CONTENT,
            messages=messages,
            tools=tools,
        ):
            event_type = event.get("type")

            if event_type == "text_delta":
                text_buffer.append(event.get("content", ""))
                yield {"type": "text_delta", "content": event.get("content", "")}

            elif event_type == "tool_use_start":
                tool_uses.append({
                    "tool_name": event.get("tool_name"),
                    "tool_id": event.get("tool_id"),
                    "tool_input": event.get("tool_input", {}),
                })
                yield {"type": "tool_use_start", "tool_name": event.get("tool_name")}

            elif event_type == "tool_use_delta":
                # Accumulate tool input JSON
                pass

            elif event_type == "message_done":
                break

            elif event_type == "error":
                yield event
                return

        # If no tool calls, we're done
        if not tool_uses:
            break

        # Execute tool calls
        for tool_use in tool_uses:
            tool_result = execute_tool(
                tool_use["tool_name"],
                tool_use["tool_input"],
                session_id,
            )
            yield {
                "type": "tool_result",
                "tool_name": tool_use["tool_name"],
                "result": tool_result,
            }

            # Add tool use + result to messages for next loop
            messages.append({
                "role": "assistant",
                "content": [
                    {
                        "type": "tool_use",
                        "id": tool_use.get("tool_id", "tool_1"),
                        "name": tool_use["tool_name"],
                        "input": tool_use["tool_input"],
                    }
                ],
            })
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use.get("tool_id", "tool_1"),
                        "content": json.dumps(tool_result, ensure_ascii=False),
                    }
                ],
            })

    # Final state snapshot
    try:
        final_state = session_manager.read_session_state(session_dir)
        yield {
            "type": "message_done",
            "session_state": _state_snapshot(final_state),
            "full_state": final_state,
        }
    except FileNotFoundError:
        yield {"type": "message_done"}
