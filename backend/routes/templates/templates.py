from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import time
import uuid
from pathlib import Path
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config.config import Settings
settings = Settings()

router = APIRouter(prefix="/templates", tags=["templates"])

# Request/Response Models
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
templates_db: Dict[str, TemplateResponse] = {}

@router.post("")
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
        
        # Save template to file
        templates_dir = Path(settings.CONFIGS_PATH) / "templates"
        templates_dir.mkdir(parents=True, exist_ok=True)
        
        template_file = templates_dir / f"{template_id}.json"
        with open(template_file, 'w') as f:
            import json
            json.dump(template.dict(), f, indent=2)
        
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
async def list_templates():
    """List all templates"""
    return {"templates": list(templates_db.values()), "total": len(templates_db)}

@router.get("/{template_id}")
async def get_template(template_id: str):
    """Get template details"""
    if template_id not in templates_db:
        # Try to load from file if not in memory
        templates_dir = Path(settings.CONFIGS_PATH) / "templates"
        template_file = templates_dir / f"{template_id}.json"
        
        if template_file.exists():
            with open(template_file, 'r') as f:
                import json
                template_data = json.load(f)
                templates_db[template_id] = TemplateResponse(**template_data)
                return templates_db[template_id]
        else:
            raise HTTPException(status_code=404, detail="Template not found")
    
    return templates_db[template_id]

@router.put("/{template_id}")
async def update_template(template_id: str, request: TemplateRequest):
    """Update template details"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    
    timestamp = time.time()
    template = templates_db[template_id]
    template.name = request.name
    template.description = request.description
    template.config = request.config
    template.created_at = timestamp
    
    # Save updated template to file
    templates_dir = Path(settings.CONFIGS_PATH) / "templates"
    templates_dir.mkdir(parents=True, exist_ok=True)
    
    template_file = templates_dir / f"{template_id}.json"
    with open(template_file, 'w') as f:
        import json
        json.dump(template.dict(), f, indent=2)
    
    return template

@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """Delete a template"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    
    del templates_db[template_id]
    
    # Remove template file
    templates_dir = Path(settings.CONFIGS_PATH) / "templates"
    template_file = templates_dir / f"{template_id}.json"
    
    if template_file.exists():
        template_file.unlink()
    
    return {"message": "Template deleted successfully"}

@router.post("/apply/{template_id}")
async def apply_template(template_id: str, project_id: str):
    """Apply template to a project"""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get project details (would normally get from project service)
    project_dir = Path(settings.PROJECTS_PATH) / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    template = templates_db[template_id]
    
    # Apply template configuration to project
    config_file = project_dir / "config.json"
    template_config = template.config
    
    # Save template configuration to project
    with open(config_file, 'w') as f:
        import json
        json.dump(template_config, f, indent=2)
    
    return {
        "message": "Template applied successfully",
        "template_id": template_id,
        "project_id": project_id,
        "config_applied": template_config
    }