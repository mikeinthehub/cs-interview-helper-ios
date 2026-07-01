"""Chat API routes — SSE streaming and WebSocket."""
import json
import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ..services import session_manager, chat_service

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    content: str


@router.post("/api/chat/{session_id}")
async def chat_non_streaming(session_id: str, msg: ChatMessage):
    """Non-streaming chat endpoint. Returns full response."""
    if not session_manager.session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    # Accumulate all streaming events into a single response
    text_parts = []
    tool_results = []
    final_state = None

    async for event in chat_service.stream_chat_response(session_id, msg.content):
        if event["type"] == "text_delta":
            text_parts.append(event.get("content", ""))
        elif event["type"] == "tool_result":
            tool_results.append(event)
        elif event["type"] == "message_done":
            final_state = event.get("session_state")
        elif event["type"] == "error":
            raise HTTPException(status_code=500, detail=event.get("error", "Chat error"))

    return {
        "response": "".join(text_parts),
        "tool_calls": tool_results,
        "session_state": final_state,
    }


@router.post("/api/chat/{session_id}/stream")
async def chat_stream(session_id: str, msg: ChatMessage):
    """SSE streaming chat endpoint."""
    if not session_manager.session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        async for event in chat_service.stream_chat_response(session_id, msg.content):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.websocket("/api/ws/chat/{session_id}")
async def chat_websocket(websocket: WebSocket, session_id: str):
    """WebSocket chat endpoint for real-time bidirectional communication."""
    if not session_manager.session_exists(session_id):
        await websocket.close(code=4004, reason="Session not found")
        return

    await websocket.accept()

    try:
        while True:
            # Receive message from frontend
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                user_content = msg.get("content", "")
                msg_type = msg.get("type", "message")
            except json.JSONDecodeError:
                user_content = data
                msg_type = "message"

            if msg_type == "command":
                # Direct command execution
                command = msg.get("command", "")
                if command in ("hint", "repeat", "explain", "skip", "pause", "continue", "start", "score", "report"):
                    result = chat_service.execute_tool(
                        f"interview_session_{command}", {}, session_id
                    )
                    await websocket.send_text(json.dumps({
                        "type": "command_result",
                        "command": command,
                        "result": result,
                    }, ensure_ascii=False))
                continue

            # Stream chat response
            async for event in chat_service.stream_chat_response(session_id, user_content):
                await websocket.send_text(json.dumps(event, ensure_ascii=False))

            # Send done signal
            await websocket.send_text(json.dumps({"type": "stream_end"}, ensure_ascii=False))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "error": str(e),
            }, ensure_ascii=False))
        except Exception:
            pass
