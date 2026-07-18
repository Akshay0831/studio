from fastapi import APIRouter, HTTPException, Depends, File, UploadFile
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
import time
from pathlib import Path
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.config import Settings
settings = Settings()
try:
    from project_service import project_service
except ImportError:
    project_service = None
import uuid

router = APIRouter(prefix="/projects", tags=["projects"])

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

# In-memory storage for demo purposes
projects_db: Dict[str, ProjectResponse] = {}

@router.post("", response_model=ProjectResponse)
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
        project_dir = Path(settings.PROJECTS_PATH) / project_id
        project_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize project config
        config_file = project_dir / "config.json"
        with open(config_file, 'w') as f:
            import json
            json.dump(request.config, f, indent=2)
        
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get project details"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

@router.put("/{project_id}", response_model=ProjectResponse)
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
    
    # Update project config
    config_file = project_dir / "config.json"
    with open(config_file, 'w') as f:
        import json
        json.dump(request.config, f, indent=2)
    
    return project

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    
    del projects_db[project_id]
    
    # Remove project directory
    project_dir = Path(settings.PROJECTS_PATH) / project_id
    if project_dir.exists():
        import shutil
        shutil.rmtree(project_dir)
    
    return {"message": "Project deleted successfully"}

@router.get("")
async def list_projects():
    """List all projects"""
    return {"projects": list(projects_db.values()), "total": len(projects_db)}

@router.post("/batch")
async def submit_batch_operations(request: BatchRequest):
    """Submit batch operations for processing"""
    try:
        batch_id = str(uuid.uuid4())
        timestamp = time.time()
        
        # Process batch operations
        results = []
        for operation in request.operations:
            operation_type = operation.get("type")
            params = operation.get("params", {})
            
            try:
                if operation_type == "create":
                    project = await create_project(ProjectRequest(**params))
                    results.append({"status": "success", "result": project.dict()})
                elif operation_type == "update":
                    project_id = params.get("project_id")
                    if project_id and project_id in projects_db:
                        project = await update_project(project_id, ProjectRequest(**params))
                        results.append({"status": "success", "result": project.dict()})
                    else:
                        results.append({"status": "error", "error": "Project not found"})
                else:
                    results.append({"status": "error", "error": f"Unknown operation type: {operation_type}"})
            except Exception as e:
                results.append({"status": "error", "error": str(e)})
        
        return {
            "batch_id": batch_id,
            "status": "completed",
            "total_operations": len(request.operations),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))