from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json
import time
import zipfile
import io
from pathlib import Path
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.config import Settings
settings = Settings()

router = APIRouter(prefix="/exports", tags=["exports"])

# Request/Response Models
class ExportRequest(BaseModel):
    format: str  # png, jpeg, gif, svg, webp, zip
    quality: Optional[int] = 85
    scale: Optional[int] = 1
    background: Optional[str] = "transparent"
    layers: Optional[List[str]] = []
    animation_frames: Optional[int] = 1

class ExportResponse(BaseModel):
    format: str
    files: List[dict]
    count: int
    download_url: str
    size: Optional[int] = None
    metadata: Optional[dict] = None

@router.post("/{project_id}/{format}")
async def export_project(
    project_id: str,
    export_request: ExportRequest
):
    """Export project in various formats"""
    try:
        # Verify project exists
        project_dir = Path(settings.PROJECTS_PATH) / project_id
        if not project_dir.exists():
            raise HTTPException(status_code=404, detail="Project not found")
        
        timestamp = int(time.time())
        export_path = Path(settings.OUTPUT_PATH) / "exports" / f"{project_id}_export_{timestamp}"
        export_path.mkdir(parents=True, exist_ok=True)
        
        if export_request.format.lower() == "zip":
            # Create ZIP archive
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for file_path in project_dir.rglob('*'):
                    if file_path.is_file():
                        zip_file.write(file_path, file_path.relative_to(project_dir))
                
                # Add metadata
                metadata = {
                    "project_id": project_id,
                    "export_config": export_request.dict(),
                    "timestamp": timestamp,
                    "format": "zip",
                    "total_files": len(list(project_dir.rglob('*')))
                }
                zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
            
            zip_buffer.seek(0)
            return ExportResponse(
                format="zip",
                files=[{"name": f"{project_id}_export_{timestamp}.zip", "size": len(zip_buffer.getvalue())}],
                count=1,
                download_url=f"/api/exports/download/{project_id}_{timestamp}",
                size=len(zip_buffer.getvalue()),
                metadata=metadata
            )
        
        else:
            # For single format exports, filter files by format
            files = []
            supported_formats = export_request.format.lower().split(',')
            
            for file_path in project_dir.rglob('*'):
                if file_path.is_file():
                    file_ext = file_path.suffix.lower().lstrip('.')
                    if file_ext in supported_formats:
                        files.append({
                            "name": file_path.name,
                            "size": file_path.stat().st_size,
                            "path": str(file_path.relative_to(project_dir)),
                            "format": file_ext
                        })
            
            return ExportResponse(
                format=export_request.format,
                files=files,
                count=len(files),
                download_url=f"/api/exports/download/{project_id}_{timestamp}"
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{project_id}_{timestamp}")
async def download_export(project_id: str, timestamp: str):
    """Download export files"""
    try:
        export_path = Path(settings.OUTPUT_PATH) / "exports" / f"{project_id}_export_{timestamp}"
        
        if not export_path.exists():
            raise HTTPException(status_code=404, detail="Export not found")
        
        # For ZIP files, return the ZIP
        zip_file = export_path / f"{project_id}_export_{timestamp}.zip"
        if zip_file.exists():
            return FileResponse(
                path=str(zip_file),
                filename=f"{project_id}_export_{timestamp}.zip",
                media_type="application/zip"
            )
        
        # For other formats, create a temporary ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in export_path.rglob('*'):
                if file_path.is_file():
                    zip_file.write(file_path, file_path.relative_to(export_path))
        
        zip_buffer.seek(0)
        return {
            "content": zip_buffer.getvalue(),
            "filename": f"{project_id}_export_{timestamp}.zip",
            "media_type": "application/zip"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def list_exports():
    """List all exports"""
    exports_dir = Path(settings.OUTPUT_PATH) / "exports"
    if not exports_dir.exists():
        return {"exports": [], "total": 0}
    
    exports = []
    for export_dir in exports_dir.iterdir():
        if export_dir.is_dir():
            exports.append({
                "name": export_dir.name,
                "path": str(export_dir),
                "created_at": export_dir.stat().st_ctime,
                "files": len(list(export_dir.rglob('*')))
            })
    
    return {"exports": exports, "total": len(exports)}