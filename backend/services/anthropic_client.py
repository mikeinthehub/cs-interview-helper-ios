"""Anthropic API client — configured for DeepSeek endpoint."""
import json
from collections.abc import AsyncIterator
from typing import Any

import anthropic

from ..config import ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    """Get or create the Anthropic async client."""
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(
            api_key=ANTHROPIC_API_KEY,
            base_url=ANTHROPIC_BASE_URL,
            timeout=120.0,
        )
    return _client


async def stream_chat(
    system: str,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int = 4096,
) -> AsyncIterator[dict[str, Any]]:
    """
    Stream a chat completion from the Anthropic API.

    Yields dicts with types: text_delta, tool_use_start, tool_use_delta, content_block_stop, message_done, error.
    """
    client = get_client()

    system_content = [{"type": "text", "text": system}]

    try:
        async with client.messages.stream(
            model=ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system_content,
            messages=messages,
            tools=tools or [],
        ) as stream:
            async for event in stream:
                yield _parse_stream_event(event)

    except anthropic.APIStatusError as e:
        yield {
            "type": "error",
            "error": f"API Error ({e.status_code}): {e.message}",
        }
    except Exception as e:
        yield {
            "type": "error",
            "error": str(e),
        }


async def send_chat(
    system: str,
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    max_tokens: int = 4096,
) -> dict[str, Any]:
    """Non-streaming chat completion."""
    client = get_client()
    system_content = [{"type": "text", "text": system}]

    try:
        response = await client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system_content,
            messages=messages,
            tools=tools or [],
        )
        return {"type": "message_done", "content": _extract_response_content(response)}
    except anthropic.APIStatusError as e:
        return {"type": "error", "error": f"API Error ({e.status_code}): {e.message}"}
    except Exception as e:
        return {"type": "error", "error": str(e)}


def _parse_stream_event(event: Any) -> dict[str, Any]:
    """Parse a streaming event into a standardized dict."""
    event_type = getattr(event, "type", "unknown")

    if event_type == "content_block_delta":
        delta = getattr(event, "delta", None)
        if delta and hasattr(delta, "text"):
            return {"type": "text_delta", "content": delta.text}
        elif delta and hasattr(delta, "partial_json"):
            return {"type": "tool_use_delta", "partial_json": delta.partial_json}

    elif event_type == "content_block_start":
        block = getattr(event, "content_block", None)
        if block and hasattr(block, "name"):
            return {
                "type": "tool_use_start",
                "tool_name": block.name,
                "tool_id": block.id,
                "tool_input": getattr(block, "input", {}),
            }

    elif event_type == "content_block_stop":
        return {"type": "content_block_stop"}

    elif event_type == "message_start":
        msg = getattr(event, "message", None)
        return {"type": "message_start", "usage": getattr(msg, "usage", {}) if msg else {}}

    elif event_type == "message_delta":
        delta = getattr(event, "delta", None)
        return {
            "type": "message_delta",
            "stop_reason": getattr(delta, "stop_reason", None) if delta else None,
            "usage": getattr(event, "usage", {}),
        }

    elif event_type == "message_stop":
        return {"type": "message_done"}

    return {"type": str(event_type)}


def _extract_response_content(response: Any) -> list[dict[str, Any]]:
    """Extract content blocks from a non-streaming response."""
    blocks = []
    for block in getattr(response, "content", []):
        if hasattr(block, "text"):
            blocks.append({"type": "text", "text": block.text})
        elif hasattr(block, "name"):
            blocks.append({
                "type": "tool_use",
                "name": block.name,
                "id": block.id,
                "input": getattr(block, "input", {}),
            })
    return blocks
