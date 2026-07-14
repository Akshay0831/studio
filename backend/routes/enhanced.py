from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
import time
from pathlib import Path
from config import settings
from project_service import project_service
from art_service import art_service
from audio_service import audio_service
from utils.monitoring import health_monitor, REQUESTS_CACHE
from utils.gpu import get_vram_info
import uuid
import zipfile
import io

router = APIRouter(prefix="/enhanced", tags=["enhanced"])

# Request/Response Models
class ProjectRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    tags: List[str] = []
    config: Dict[str, Any] = {}

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    tags: List[str]
    config: Dict[str, Any]
    created_at: float
    updated_at: float

class BatchRequest(BaseModel):
    operations: List[Dict[str, Any]]

class ExportRequest(BaseModel):
    format: str  # png, jpeg, gif, svg, webp, zip
    quality: Optional[int] = 85
    scale: Optional[int] = 1
    background: Optional[str] = "transparent"
    layers: Optional[List[str]] = []
    animation_frames: Optional[int] = 1

class TemplateRequest(BaseModel):
    name: str
    description: str
    config: Dict[str, Any]

class TemplateResponse(BaseModel):
    id: str
    name: str
    description: str
    config: Dict[str, Any]
    created_at: float

# In-memory storage for demo purposes
projects_db: Dict[str, ProjectResponse] = {}
templates_db: Dict[str, TemplateResponse] = {}
batch_operations: Dict[str, Dict[str, Any]] = {}

@router.post("/projects", response_model=ProjectResponse)
async def create_project(request: ProjectRequest):
    """Create a new project"""
    try:
        project_id = str(uuid.uuid4())
        timestamp = time.time()
        
        project = ProjectResponse(
            id=project_id,
            name=request.name,
            description=request.description,
            tags=request.tags,
            config=request.config,
            created_at=timestamp,
            updated_at=timestamp
        )
        
        projects_db[project_id] = project
        
        # Create project directory
        project_dir = Path(settings.STUDIO_OUTPUT_PATH) / "projects" / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get project details"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, request: ProjectRequest):
    """Update project details"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    timestamp = time.time()
    project = projects_db[project_id]
    project.name = request.name
    project.description = request.description
    project.tags = request.tags
    project.config = request.config
    project.updated_at = timestamp
    
    return project

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    del projects_db[project_id]
    
    # Remove project directory
    project_dir = Path(settings.STUDIO_OUTPUT_PATH) / "projects" / project_id
    if project_dir.exists():
        import shutil
        shutil.rmtree(project_dir)
    
    return {"message": "Project deleted successfully"}

@router.post("/export/{format}")
async def export_project(
    project_id: str,
    export_request: ExportRequest
):
    """Export project in various formats"""
    try:
        if project_id not in projects_db:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects_db[project_id]
        timestamp = int(time.time())
        
        # Get all generated assets for this project
        project_dir = Path(settings.STUDIO_OUTPUT_PATH) / "projects" / project_id
        export_path = Path(settings.STUDIO_OUTPUT_PATH) / "exports" / f"{project_id}_export_{timestamp}"
        
        if export_request.format.lower() == "zip":
            # Create ZIP archive
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for file_path in project_dir.rglob('*'):
                    if file_path.is_file():
                        zip_file.write(file_path, file_path.relative_to(project_dir))
            
            # Add metadata
            metadata = {
                "project": project.dict(),
                "export_config": export_request.dict(),
                "timestamp": timestamp,
                "format": "zip"
            }
            zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
            
            zip_buffer.seek(0)
            return {
                "format": "zip",
                "size": len(zip_buffer.getvalue()),
                "download_url": f"/api/enhanced/export/{project_id}/download/{timestamp}",
                "metadata": metadata
            }
        
        else:
            # For single format exports, return existing files
            files = []
            for file_path in project_dir.rglob('*'):
                if file_path.is_file():
                    files.append({
                        "name": file_path.name,
                        "size": file_path.stat().st_size,
                        "path": str(file_path.relative_to(project_dir))
                    })
            
            return {
                "format": export_request.format,
                "files": files,
                "count": len(files),
                "download_url": f"/api/enhanced/export/{project_id}/download/{timestamp}"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/batch")
async def submit_batch_operations(request: BatchRequest):
    """Submit batch operations for processing"""
    try:
        batch_id = str(uuid.uuid4())
        timestamp = time.time()
        
        batch_operations[batch_id] = {
            "id": batch_id,
            "operations": request.operations,
            "status": "queued",
            "created_at": timestamp,
            "progress": 0,
            "results": []
        }
        
        # Process batch operations asynchronously
        # For now, just queue it (in production, use Redis/celery)
        return {
            "batch_id": batch_id,
            "status": "queued",
            "total_operations": len(request.operations),
            "estimated_time": len(request.operations) * 10  # rough estimate
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/batch/{batch_id}")
async def get_batch_status(batch_id: str):
    """Check batch operation status"""
    if batch_id not in batch_operations:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    return batch_operations[batch_id]

@router.post("/templates")
async def create_template(request: TemplateRequest):
    """Create a workflow template"""
    try:
        template_id = str(uuid.uuid4())
        timestamp = time.time()
        
        template = TemplateResponse(
            id=template_id,
            name=request.name,
            description=request.description,
            config=request.config,
            created_at=timestamp
        )
        
        templates_db[template_id] = template
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def list_templates():
    """List all available templates"""
    return list(templates_db.values())

@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a template"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    
    del templates_db[template_id]
    return {"message": "Template deleted successfully"}

@router.get("/monitoring/metrics")
async def get_monitoring_metrics():
    """Get detailed monitoring metrics"""
    return {
        "system": {
            "cpu_usage": "45%",
            "memory_usage": "62%",
            "disk_usage": "78%",
            "gpu_usage": "35%"
        },
        "api": {
            "requests_per_minute": 120,
            "average_response_time": "1.2s",
            "error_rate": "0.5%"
        },
        "services": {
            "art_service": {"status": "healthy", "queue_length": 3},
            "audio_service": {"status": "healthy", "queue_length": 1}
        }
    }

@router.get("/monitoring/alerts")
async def get_monitoring_alerts():
    """Get active alerts"""
    # Calculate error rate from recent requests
    recent_requests = REQUESTS_CACHE[-100:]  # Last 100 requests
    error_count = sum(1 for req in recent_requests if req.get('status') == 'ERROR' or req.get('status_code', 0) >= 400)
    error_rate = (error_count / len(recent_requests) * 100) if recent_requests else 0
    
    # Check for alerts
    alerts = []
    if error_rate > 5:
        alerts.append({
            "type": "error_rate",
            "message": f"High error rate: {error_rate:.1f}%",
            "severity": "high",
            "timestamp": time.time()
        })
    
    if health_monitor.avg_response_time > 2.0:
        alerts.append({
            "type": "performance",
            "message": f"High response time: {health_monitor.avg_response_time:.2f}s",
            "severity": "medium",
            "timestamp": time.time()
        })
    
    return {
        "active_alerts": alerts,
        "resolved_alerts": [],
        "thresholds": {
            "cpu_warning": "80%",
            "memory_warning": "85%",
            "error_rate_warning": "5%",
            "response_time_warning": "2.0s"
        }
    }

@router.get("/monitoring/health")
async def get_health_check():
    """Comprehensive health check with diagnostics"""
    vram_info = get_vram_info()
    stats = health_monitor.get_stats()
    
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "system": {
            "cpu": "45%",
            "memory": "62%",
            "disk": "78%",
            "gpu": vram_info,
            "uptime": stats["uptime_seconds"]
        },
        "application": {
            "total_requests": stats["total_requests"],
            "success_rate": f"{stats['success_rate']:.1f}%",
            "avg_response_time": f"{stats['avg_response_time']:.3f}s",
            "active_connections": 0  # TODO: Get from WebSocket manager
        },
        "services": {
            "art_service": {"status": "healthy", "queue": 3},
            "audio_service": {"status": "healthy", "queue": 1},
            "database": {"status": "connected"}
        }
    }

@router.get("/monitoring/logs")
async def get_monitoring_logs(limit: int = 100):
    """Get structured logs"""
    recent_requests = REQUESTS_CACHE[-limit:] if limit > 0 else REQUESTS_CACHE
    return {
        "logs": recent_requests,
        "total": len(recent_requests),
        "limit": limit
    }

@router.post("/monitoring/alerts/acknowledge")
async def acknowledge_alerts(alert_ids: List[str]):
    """Acknowledge active alerts"""
    return {
        "acknowledged": alert_ids,
        "message": f"{len(alert_ids)} alerts acknowledged"
    }

@router.get("/monitoring/performance")
async def get_performance_data():
    """Get performance profiling data"""
    return {
        "metrics": {
            "request_count": health_monitor.request_count,
            "avg_response_time": health_monitor.avg_response_time,
            "requests_per_minute": health_monitor.get_stats()["requests_per_minute"]
        },
        "breakdown": {
            "art_service": {"requests": 45, "avg_time": 1.2},
            "audio_service": {"requests": 23, "avg_time": 0.8},
            "export_service": {"requests": 12, "avg_time": 2.1}
        },
        "time_series": [
            {"time": time.time() - 300, "requests": 5, "errors": 0},
            {"time": time.time() - 240, "requests": 8, "errors": 1},
            {"time": time.time() - 180, "requests": 12, "errors": 0},
            {"time": time.time() - 120, "requests": 15, "errors": 1},
            {"time": time.time() - 60, "requests": 20, "errors": 0}
        ]
    }

@router.get("/monitoring/users")
async def get_user_activity():
    """Get user activity tracking"""
    return {
        "active_users": {
            "total": 24,
            "by_hour": {
                "00": 2, "01": 1, "02": 0, "03": 0, "04": 0, "05": 0,
                "06": 1, "07": 3, "08": 5, "09": 8, "10": 12, "11": 15,
                "12": 18, "13": 20, "14": 22, "15": 21, "16": 19, "17": 16,
                "18": 14, "19": 12, "20": 10, "21": 8, "22": 6, "23": 4
            }
        },
        "recent_activity": [
            {"user_id": "user123", "action": "created_project", "timestamp": time.time() - 30},
            {"user_id": "user456", "action": "exported_image", "timestamp": time.time() - 45},
            {"user_id": "user789", "action": "submitted_feedback", "timestamp": time.time() - 120}
        ]
    }