from fastapi import APIRouter, HTTPException, Depends, Query, Path
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
from datetime import datetime
from backup_service import BackupService
from utils.monitoring import health_monitor
import time

# Create backup service instance
backup_service = BackupService()

router = APIRouter(prefix="/backup", tags=["backup"])

# Request/Response Models
class BackupRequest(BaseModel):
    project_id: Optional[str] = None
    description: Optional[str] = ""
    manual: bool = False

class RestoreRequest(BaseModel):
    project_id: Optional[str] = None
    restore_path: Optional[str] = None

class BackupResponse(BaseModel):
    backup_id: str
    backup_name: str
    type: str
    description: str
    timestamp: float
    created_at: str
    size: int
    files: List[Dict[str, Any]]
    backup_path: str
    success: bool
    error: Optional[str] = None

@router.post("/create", response_model=BackupResponse)
async def create_backup(request: BackupRequest):
    """Create a new backup."""
    try:
        backup_service = BackupService()
        result = await backup_service.create_backup(
            project_id=request.project_id,
            manual=request.manual,
            description=request.description or ""
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to create backup"))
        
        # Get backup info for response
        backup_info = backup_service.get_backup_info(result["backup_id"])
        if not backup_info:
            raise HTTPException(status_code=500, detail="Backup created but info not available")
        
        return BackupResponse(**backup_info)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[Dict[str, Any]])
async def get_backups():
    """Get list of all available backups."""
    try:
        backups = backup_service.get_backups()
        return backups
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/info/{backup_id}", response_model=Dict[str, Any])
async def get_backup_info(
    backup_id: str = Path(..., description="Backup ID")
):
    """Get detailed information about a specific backup."""
    try:
        backup_info = backup_service.get_backup_info(backup_id)
        if not backup_info:
            raise HTTPException(status_code=404, detail=f"Backup not found: {backup_id}")
        
        return backup_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore/{backup_id}", response_model=Dict[str, Any])
async def restore_backup(
    backup_id: str = Path(..., description="Backup ID"),
    request: RestoreRequest = Depends()
):
    """Restore a backup."""
    try:
        result = await backup_service.restore_backup(
            backup_id=backup_id,
            project_id=request.project_id,
            restore_path=request.restore_path
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to restore backup"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete/{backup_id}", response_model=Dict[str, Any])
async def delete_backup(
    backup_id: str = Path(..., description="Backup ID")
):
    """Delete a backup."""
    try:
        result = await backup_service.delete_backup(backup_id)
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to delete backup"))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/schedule-auto")
async def schedule_auto_backup():
    """Schedule automatic backup."""
    try:
        result = await backup_service.schedule_auto_backup()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics", response_model=Dict[str, Any])
async def get_backup_statistics():
    """Get backup statistics."""
    try:
        backups = backup_service.get_backups()
        
        total_size = sum(backup.get("file_size", 0) for backup in backups)
        total_backups = len(backups)
        
        # Group by type
        project_backups = [b for b in backups if b.get("type") == "project"]
        full_backups = [b for b in backups if b.get("type") == "full"]
        
        # Get oldest and newest backup
        oldest_backup = min(backups, key=lambda x: x.get("timestamp", 0)) if backups else None
        newest_backup = max(backups, key=lambda x: x.get("timestamp", 0)) if backups else None
        
        return {
            "total_backups": total_backups,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "project_backups": len(project_backups),
            "full_backups": len(full_backups),
            "oldest_backup": oldest_backup,
            "newest_backup": newest_backup,
            "backup_directory": backup_service.backup_dir,
            "max_backups": backup_service.max_backups,
            "backup_interval_hours": backup_service.backup_interval / 3600
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{backup_id}")
async def download_backup(
    backup_id: str = Path(..., description="Backup ID")
):
    """Download a backup file."""
    try:
        backup_info = backup_service.get_backup_info(backup_id)
        if not backup_info or not backup_info.get("backup_path"):
            raise HTTPException(status_code=404, detail=f"Backup not found: {backup_id}")
        
        backup_path = backup_info["backup_path"]
        if not os.path.exists(backup_path):
            raise HTTPException(status_code=404, detail=f"Backup file not found: {backup_path}")
        
        # Read the file content
        with open(backup_path, 'rb') as f:
            file_content = f.read()
        
        return {
            "content": file_content,
            "filename": os.path.basename(backup_path),
            "size": len(file_content),
            "content_type": "application/zip"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Additional endpoints for comprehensive backup management
@router.get("/health", response_model=Dict[str, Any])
async def get_backup_health():
    """Get backup service health status."""
    try:
        health_status = {
            "status": "healthy",
            "checks": {},
            "timestamp": time.time()
        }
        
        # Check backup directory
        backup_service = BackupService()
        try:
            if os.path.exists(backup_service.backup_dir):
                health_status["checks"]["backup_directory"] = "ok"
            else:
                health_status["checks"]["backup_directory"] = "directory_missing"
                health_status["status"] = "degraded"
        except Exception as e:
            health_status["checks"]["backup_directory"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Check disk space (Windows compatible)
        try:
            import shutil
            backup_dir = backup_service.backup_dir
            if os.path.exists(backup_dir):
                total, used, free = shutil.disk_usage(backup_dir)
                if free > 1024 * 1024 * 1024:  # At least 1GB free
                    health_status["checks"]["disk_space"] = "ok"
                else:
                    health_status["checks"]["disk_space"] = "low_space"
                    health_status["status"] = "degraded"
            else:
                health_status["checks"]["disk_space"] = "unknown"
        except Exception as e:
            health_status["checks"]["disk_space"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        # Check auto-backup status
        try:
            auto_backup_enabled = backup_service.is_auto_backup_enabled()
            if auto_backup_enabled:
                health_status["checks"]["auto_backup"] = "enabled"
            else:
                health_status["checks"]["auto_backup"] = "disabled"
        except Exception as e:
            health_status["checks"]["auto_backup"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auto-backup/status", response_model=Dict[str, Any])
async def get_auto_backup_status():
    """Get automatic backup status and schedule information."""
    try:
        result = {
            "auto_backup_enabled": backup_service.is_auto_backup_enabled(),
            "last_auto_backup": backup_service.get_last_auto_backup_time(),
            "next_scheduled_backup": backup_service.get_next_scheduled_backup_time(),
            "backup_interval_hours": backup_service.backup_interval / 3600,
            "is_due": backup_service.is_auto_backup_due(),
            "config": backup_service.get_auto_backup_config()
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-backup/enable", response_model=Dict[str, Any])
async def enable_auto_backup(
    interval_hours: int = Query(24, ge=1, le=168, description="Backup interval in hours (1-168)"),
    backup_type: str = Query("project", description="Backup type: project, full")
):
    """Enable automatic backup with specified interval."""
    try:
        result = await backup_service.enable_auto_backup(interval_hours, backup_type)
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Auto-backup configuration updated"),
            "config": {
                "enabled": True,
                "interval_hours": interval_hours,
                "backup_type": backup_type,
                "next_backup": backup_service.get_next_scheduled_backup_time()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-backup/disable", response_model=Dict[str, Any])
async def disable_auto_backup():
    """Disable automatic backup."""
    try:
        result = await backup_service.disable_auto_backup()
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Auto-backup disabled"),
            "config": {
                "enabled": False,
                "was_enabled": result.get("was_enabled", False)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export", response_model=Dict[str, Any])
async def export_backup_config():
    """Export backup configuration."""
    try:
        config = backup_service.get_backup_config()
        config["exported_at"] = datetime.now().isoformat()
        config["version"] = "1.0"
        
        return {
            "success": True,
            "config": config,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import", response_model=Dict[str, Any])
async def import_backup_config(request: Dict[str, Any]):
    """Import backup configuration."""
    try:
        # Validate configuration structure
        required_keys = ["backup_dir", "max_backups", "backup_interval", "auto_backup_enabled"]
        if not all(key in request for key in required_keys):
            raise HTTPException(status_code=400, detail="Invalid configuration format")
        
        result = await backup_service.import_backup_config(request)
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Configuration imported successfully"),
            "config_hash": hash(str(request)),
            "timestamp": time.time()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/validate/{backup_id}", response_model=Dict[str, Any])
async def validate_backup(
    backup_id: str = Path(..., description="Backup ID")
):
    """Validate a backup file."""
    try:
        result = await backup_service.validate_backup(backup_id)
        
        return {
            "success": result.get("success", False),
            "backup_id": backup_id,
            "valid": result.get("valid", False),
            "check_results": result.get("check_results", {}),
            "errors": result.get("errors", []),
            "warnings": result.get("warnings", []),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compare", response_model=Dict[str, Any])
async def compare_backups(
    backup_id1: str = Query(..., description="First backup ID"),
    backup_id2: str = Query(..., description="Second backup ID")
):
    """Compare two backups."""
    try:
        result = await backup_service.compare_backups(backup_id1, backup_id2)
        
        return {
            "success": result.get("success", False),
            "backup_id1": backup_id1,
            "backup_id2": backup_id2,
            "comparison": result.get("comparison", {}),
            "differences": result.get("differences", []),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=Dict[str, Any])
async def get_backup_history():
    """Get backup operation history."""
    try:
        history = backup_service.get_backup_history()
        
        return {
            "success": True,
            "history": history,
            "total_operations": len(history),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cleanup", response_model=Dict[str, Any])
async def cleanup_old_backups(
    keep_minimum: int = Query(5, ge=1, description="Minimum number of backups to keep"),
    keep_days: int = Query(30, ge=1, description="Keep backups from last N days"),
    force: bool = Query(False, description="Force cleanup without confirmation")
):
    """Clean up old backups."""
    try:
        result = await backup_service.cleanup_old_backups(keep_minimum, keep_days, force)
        
        return {
            "success": result.get("success", False),
            "message": result.get("message", "Cleanup completed"),
            "cleaned_backups": result.get("cleaned_backups", []),
            "freed_space_mb": result.get("freed_space_mb", 0),
            "remaining_backups": result.get("remaining_backups", 0),
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))