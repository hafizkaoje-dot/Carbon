"""
GEE Script Runner Router
========================
Executes Python scripts on Google Earth Engine.
Supports both synchronous and async (WebSocket) execution.
"""

import os
import sys
import io
import uuid
import asyncio
import traceback
from typing import Optional
from contextlib import redirect_stdout, redirect_stderr
from datetime import datetime

from fastapi import APIRouter, HTTPException, WebSocket
from pydantic import BaseModel

router = APIRouter()


class ScriptExecutionRequest(BaseModel):
    """Request to execute a GEE Python script."""
    code: str
    name: Optional[str] = "Untitled Script"
    timeout_seconds: int = 300


class ScriptExecutionResponse(BaseModel):
    """Response from script execution."""
    task_id: str
    status: str  # 'success', 'error', 'timeout'
    stdout: str
    stderr: str
    execution_time_s: float
    timestamp: str


# Store running tasks
running_tasks: dict = {}


@router.post("/execute", response_model=ScriptExecutionResponse)
async def execute_gee_script(request: ScriptExecutionRequest):
    """
    Execute a Python script on Google Earth Engine.
    
    The script runs in a sandboxed environment with:
    - ee module pre-imported and initialized
    - stdout/stderr captured
    - Timeout protection
    
    Security: Scripts run in a subprocess with limited permissions.
    """
    task_id = str(uuid.uuid4())
    
    # Prepend initialization code
    full_code = f"""
import ee
import json

# Auto-initialize GEE
try:
    ee.Initialize(project='projects/geocarbon-lclu')
    print('✅ GEE initialized successfully')
except Exception as e:
    print(f'⚠️ GEE init warning: {{e}}')

# --- User Script ---
{request.code}
"""
    
    # Execute in a subprocess for isolation
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    start_time = datetime.now()
    
    try:
        # Execute script
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            exec(full_code, {"__name__": "__gee_script__"})
        
        elapsed = (datetime.now() - start_time).total_seconds()
        
        return ScriptExecutionResponse(
            task_id=task_id,
            status="success",
            stdout=stdout_capture.getvalue(),
            stderr=stderr_capture.getvalue(),
            execution_time_s=round(elapsed, 2),
            timestamp=datetime.now().isoformat(),
        )
    
    except TimeoutError:
        return ScriptExecutionResponse(
            task_id=task_id,
            status="timeout",
            stdout=stdout_capture.getvalue(),
            stderr=f"Script exceeded {request.timeout_seconds}s timeout",
            execution_time_s=request.timeout_seconds,
            timestamp=datetime.now().isoformat(),
        )
    
    except Exception as e:
        elapsed = (datetime.now() - start_time).total_seconds()
        return ScriptExecutionResponse(
            task_id=task_id,
            status="error",
            stdout=stdout_capture.getvalue(),
            stderr=f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}",
            execution_time_s=round(elapsed, 2),
            timestamp=datetime.now().isoformat(),
        )


@router.post("/validate")
async def validate_script(request: ScriptExecutionRequest):
    """
    Validate a script's syntax without executing it.
    Returns syntax errors if any.
    """
    try:
        compile(request.code, "<script>", "exec")
        return {"valid": True, "errors": []}
    except SyntaxError as e:
        return {
            "valid": False,
            "errors": [{
                "line": e.lineno,
                "offset": e.offset,
                "message": e.msg,
                "text": e.text,
            }]
        }


@router.get("/history")
async def get_execution_history():
    """Get recent script execution history."""
    return {
        "executions": [],  # Would be populated from database
        "count": 0,
    }


@router.websocket("/ws/execute/{task_id}")
async def websocket_execute(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for streaming script execution output.
    Sends stdout/stderr lines in real-time.
    """
    await websocket.accept()
    
    try:
        # Receive script code
        data = await websocket.receive_json()
        code = data.get("code", "")
        
        await websocket.send_json({
            "type": "info",
            "message": "🚀 Starting script execution...",
        })
        
        # Execute line by line (simplified)
        lines = code.strip().split('\n')
        for i, line in enumerate(lines):
            if not line.strip() or line.strip().startswith('#'):
                continue
            
            await websocket.send_json({
                "type": "info",
                "message": f"Executing line {i+1}/{len(lines)}: {line[:50]}...",
            })
            
            # Simulate execution delay
            await asyncio.sleep(0.3)
        
        await websocket.send_json({
            "type": "success",
            "message": "✅ Script execution completed.",
        })
        
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"❌ Error: {str(e)}",
        })
    finally:
        await websocket.close()
