import logging
import asyncio
import json
import os
import shutil
import time
import zipfile
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
from utils.base_service import BaseStudioService
from utils.telemetry import trace_performance
from config import settings

logger = logging.getLogger("studio.backend.backup_service")

class BackupService(BaseStudioService):
    def __init__(self):
        super().__init__("backup")
        self.backup_dir = Path(settings.STUDIO_ROOT) / "backups"
        self.max_backups = 30  # Keep last 30 backups
        self.backup_interval = 24 * 60 * 60  # 24 hours in seconds
        self.last_backup_time = 0
        
        # Create backup directory if it doesn't exist
        self.backup_dir.mkdir(exist_ok=True)
        
        # Load existing backup history
        self.backup_history = self._load_backup_history()

    def _load_backup_history(self) -> List[Dict[str, Any]]:
        """Load backup history from metadata file."""
        history_file = self.backup_dir / "backup_history.json"
        if history_file.exists():
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load backup history: {e}")
        
        return []

    def _save_backup_history(self):
        """Save backup history to metadata file."""
        history_file = self.backup_dir / "backup_history.json"
        try:
            with open(history_file, 'w', encoding='utf-8') as f:
                json.dump(self.backup_history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save backup history: {e}")

    def _get_backup_metadata(self, backup_path: Path) -> Dict[str, Any]:
        """Extract metadata from backup file."""
        metadata_path = backup_path.with_suffix('.json')
        if metadata_path.exists():
            try:
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read backup metadata: {e}")
        
        return {}

    @trace_performance("create_backup")
    async def create_backup(self, 
                          project_id: Optional[str] = None,
                          manual: bool = False,
                          description: str = "") -> Dict[str, Any]:
        """Create a new backup."""
        try:
            timestamp = time.time()
            backup_id = f"backup_{int(timestamp)}"
            backup_name = f"backup_{datetime.fromtimestamp(timestamp).strftime('%Y%m%d_%H%M%S')}"
            
            if project_id:
                # Create project-specific backup
                backup_path = self.backup_dir / f"{backup_name}_{project_id}.zip"
                backup_metadata = {
                    "backup_id": backup_id,
                    "backup_name": backup_name,
                    "project_id": project_id,
                    "type": "project",
                    "description": description or f"Backup for project {project_id}",
                    "timestamp": timestamp,
                    "created_at": datetime.fromtimestamp(timestamp).isoformat(),
                    "size": 0,
                    "files": []
                }
                
                # Create backup for specific project
                await self._backup_project(project_id, backup_path, backup_metadata)
            else:
                # Create full system backup
                backup_path = self.backup_dir / f"{backup_name}_full.zip"
                backup_metadata = {
                    "backup_id": backup_id,
                    "backup_name": backup_name,
                    "type": "full",
                    "description": description or "Full system backup",
                    "timestamp": timestamp,
                    "created_at": datetime.fromtimestamp(timestamp).isoformat(),
                    "size": 0,
                    "files": []
                }
                
                await self._backup_system(backup_path, backup_metadata)
            
            # Update backup history
            self.backup_history.append(backup_metadata)
            self._save_backup_history()
            
            # Clean old backups if needed
            await self._cleanup_old_backups()
            
            return {
                "success": True,
                "backup_id": backup_id,
                "backup_path": str(backup_path),
                "size": backup_metadata["size"],
                "timestamp": timestamp
            }
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def _backup_project(self, project_id: str, backup_path: Path, metadata: Dict[str, Any]):
        """Backup a specific project."""
        try:
            # Get project directory
            project_dir = Path(settings.STUDIO_ROOT) / "projects" / project_id
            if not project_dir.exists():
                raise FileNotFoundError(f"Project directory not found: {project_dir}")
            
            # Calculate project size
            total_size = 0
            file_list = []
            
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(project_dir):
                    for file in files:
                        file_path = Path(root) / file
                        arcname = file_path.relative_to(project_dir)
                        
                        # Add file to zip
                        zipf.write(file_path, arcname)
                        
                        # Update metadata
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        file_list.append({
                            "path": str(arcname),
                            "size": file_size,
                            "modified": file_path.stat().st_mtime
                        })
            
            # Update metadata with size and file list
            metadata["size"] = total_size
            metadata["files"] = file_list
            
            logger.info(f"Project backup created: {backup_path} ({total_size} bytes)")
            
        except Exception as e:
            logger.error(f"Failed to backup project {project_id}: {e}")
            raise

    async def _backup_system(self, backup_path: Path, metadata: Dict[str, Any]):
        """Create full system backup (excluding temporary and cache files)."""
        try:
            total_size = 0
            file_list = []
            exclude_patterns = [
                "__pycache__",
                "*.pyc",
                "*.log",
                "node_modules",
                ".git",
                "temp_*.tmp",
                "*.tmp"
            ]
            
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                studio_root = Path(settings.STUDIO_ROOT)
                
                # Backup key directories
                for directory in ["projects", "config", "resources", "studio_output"]:
                    dir_path = studio_root / directory
                    if dir_path.exists():
                        for root, dirs, files in os.walk(dir_path):
                            # Filter out excluded directories
                            dirs[:] = [d for d in dirs if not any(
                                d.startswith(pattern.replace("*", "")) for pattern in exclude_patterns
                            )]
                            
                            for file in files:
                                file_path = Path(root) / file
                                if not any(file_path.match(pattern) for pattern in exclude_patterns):
                                    arcname = file_path.relative_to(studio_root)
                                    zipf.write(file_path, arcname)
                                    
                                    # Update metadata
                                    file_size = file_path.stat().st_size
                                    total_size += file_size
                                    file_list.append({
                                        "path": str(arcname),
                                        "size": file_size,
                                        "modified": file_path.stat().st_mtime
                                    })
            
            # Also backup configuration
            config_files = [
                studio_root / "config" / "settings.json",
                studio_root / "backend" / "config.py",
                studio_root / "frontend" / "package.json"
            ]
            
            for config_file in config_files:
                if config_file.exists():
                    arcname = config_file.relative_to(studio_root)
                    zipf.write(config_file, arcname)
                    
                    file_size = config_file.stat().st_size
                    total_size += file_size
                    file_list.append({
                        "path": str(arcname),
                        "size": file_size,
                        "modified": config_file.stat().st_mtime
                    })
            
            # Update metadata with size and file list
            metadata["size"] = total_size
            metadata["files"] = file_list
            
            logger.info(f"System backup created: {backup_path} ({total_size} bytes)")
            
        except Exception as e:
            logger.error(f"Failed to create system backup: {e}")
            raise

    async def _cleanup_old_backups(self):
        """Remove old backups if exceeding maximum count."""
        try:
            # Get all backup files
            backup_files = list(self.backup_dir.glob("*.zip"))
            
            # Sort by modification time (newest first)
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # Remove old backups
            for backup_file in backup_files[self.max_backups:]:
                try:
                    backup_file.unlink()
                    # Also remove metadata file
                    metadata_file = backup_file.with_suffix('.json')
                    if metadata_file.exists():
                        metadata_file.unlink()
                    logger.info(f"Removed old backup: {backup_file}")
                except Exception as e:
                    logger.error(f"Failed to remove old backup {backup_file}: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to cleanup old backups: {e}")

    @trace_performance("restore_backup")
    async def restore_backup(self, backup_id: str, 
                          project_id: Optional[str] = None,
                          restore_path: Optional[str] = None) -> Dict[str, Any]:
        """Restore a backup."""
        try:
            # Find backup file
            backup_file = self._find_backup_file(backup_id)
            if not backup_file:
                return {
                    "success": False,
                    "error": f"Backup not found: {backup_id}"
                }
            
            metadata = self._get_backup_metadata(backup_file)
            if not metadata:
                return {
                    "success": False,
                    "error": f"Backup metadata not found: {backup_id}"
                }
            
            if project_id and metadata["type"] == "full":
                return {
                    "success": False,
                    "error": "Cannot restore full backup to specific project"
                }
            
            # Verify backup integrity
            if not await self._verify_backup_integrity(backup_file):
                return {
                    "success": False,
                    "error": "Backup integrity verification failed"
                }
            
            # Perform restore
            restore_result = await self._perform_restore(
                backup_file, metadata, project_id, restore_path
            )
            
            return {
                "success": True,
                "backup_id": backup_id,
                "restored_files": len(metadata.get("files", [])),
                **restore_result
            }
            
        except Exception as e:
            logger.error(f"Failed to restore backup {backup_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _find_backup_file(self, backup_id: str) -> Optional[Path]:
        """Find backup file by backup ID."""
        backup_files = list(self.backup_dir.glob("*.zip"))
        
        for backup_file in backup_files:
            metadata = self._get_backup_metadata(backup_file)
            if metadata and metadata.get("backup_id") == backup_id:
                return backup_file
        
        return None

    async def _verify_backup_integrity(self, backup_file: Path) -> bool:
        """Verify backup file integrity."""
        try:
            # Test if zip file is readable
            with zipfile.ZipFile(backup_file, 'r') as zipf:
                # Test each file
                bad_file = zipf.testzip()
                if bad_file:
                    logger.error(f"Corrupted file in backup: {bad_file}")
                    return False
                
                return True
        except Exception as e:
            logger.error(f"Backup integrity check failed: {e}")
            return False

    async def _perform_restore(self, backup_file: Path, metadata: Dict[str, Any],
                             project_id: Optional[str], restore_path: Optional[str]) -> Dict[str, Any]:
        """Perform the actual restore operation."""
        try:
            restore_target = Path(restore_path) if restore_path else Path(settings.STUDIO_ROOT)
            
            if metadata["type"] == "project":
                if not project_id:
                    project_id = f"restored_{int(time.time())}"
                
                project_dir = restore_target / "projects" / project_id
                project_dir.mkdir(parents=True, exist_ok=True)
                
                # Extract project files
                with zipfile.ZipFile(backup_file, 'r') as zipf:
                    zipf.extractall(project_dir)
                
                return {
                    "restored_type": "project",
                    "project_id": project_id,
                    "restore_path": str(project_dir)
                }
            
            else:  # full backup
                # Backup current state before restore
                await self._backup_system_state(restore_target)
                
                # Extract all files
                with zipfile.ZipFile(backup_file, 'r') as zipf:
                    zipf.extractall(restore_target)
                
                return {
                    "restored_type": "full",
                    "restore_path": str(restore_target)
                }
                
        except Exception as e:
            logger.error(f"Restore operation failed: {e}")
            raise

    async def _backup_system_state(self, restore_target: Path):
        """Backup current system state before full restore."""
        try:
            backup_dir = restore_target / "pre_restore_backup"
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Create backup of current projects
            projects_dir = restore_target / "projects"
            if projects_dir.exists():
                projects_backup = backup_dir / "projects"
                shutil.copytree(projects_dir, projects_backup, dirs_exist_ok=True)
            
            # Create backup of current config
            config_dir = restore_target / "config"
            if config_dir.exists():
                config_backup = backup_dir / "config"
                shutil.copytree(config_dir, config_backup, dirs_exist_ok=True)
            
            logger.info(f"Created pre-restore backup at {backup_dir}")
            
        except Exception as e:
            logger.error(f"Failed to create pre-restore backup: {e}")

    def get_backups(self) -> List[Dict[str, Any]]:
        """Get list of all available backups."""
        backups = []
        
        for backup_file in self.backup_dir.glob("*.zip"):
            metadata = self._get_backup_metadata(backup_file)
            if metadata:
                backups.append({
                    **metadata,
                    "backup_path": str(backup_file),
                    "exists": backup_file.exists(),
                    "file_size": backup_file.stat().st_size if backup_file.exists() else 0
                })
        
        # Sort by timestamp (newest first)
        backups.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        
        return backups

    def get_backup_info(self, backup_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific backup."""
        for backup in self.get_backups():
            if backup.get("backup_id") == backup_id:
                return backup
        return None

    async def delete_backup(self, backup_id: str) -> Dict[str, Any]:
        """Delete a backup."""
        try:
            backup_file = self._find_backup_file(backup_id)
            if not backup_file:
                return {
                    "success": False,
                    "error": f"Backup not found: {backup_id}"
                }
            
            # Remove backup file
            backup_file.unlink()
            
            # Remove metadata file
            metadata_file = backup_file.with_suffix('.json')
            if metadata_file.exists():
                metadata_file.unlink()
            
            # Update backup history
            self.backup_history = [b for b in self.backup_history if b.get("backup_id") != backup_id]
            self._save_backup_history()
            
            return {
                "success": True,
                "backup_id": backup_id
            }
            
        except Exception as e:
            logger.error(f"Failed to delete backup {backup_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def schedule_auto_backup(self) -> Dict[str, Any]:
        """Schedule automatic backup if needed."""
        current_time = time.time()
        
        if current_time - self.last_backup_time >= self.backup_interval:
            logger.info("Performing scheduled auto backup...")
            result = await self.create_backup(
                description="Automated scheduled backup"
            )
            if result.get("success"):
                self.last_backup_time = current_time
            return result
        
        return {
            "success": True,
            "message": "Auto backup not needed yet"
        }

    def is_auto_backup_enabled(self) -> bool:
        """Check if automatic backup is enabled."""
        return True

    def get_last_auto_backup_time(self) -> Optional[float]:
        """Get the timestamp of the last automatic backup."""
        if self.backup_history:
            # Find the most recent backup marked as auto backup
            auto_backups = [b for b in self.backup_history if b.get("description", "").startswith("Automated scheduled backup")]
            if auto_backups:
                return max(b["timestamp"] for b in auto_backups)
        return None

    def get_next_scheduled_backup_time(self) -> Optional[float]:
        """Get the timestamp of the next scheduled backup."""
        next_time = self.last_backup_time + self.backup_interval
        return next_time if next_time > time.time() else None

    def is_auto_backup_due(self) -> bool:
        """Check if an auto backup is currently due."""
        return time.time() - self.last_backup_time >= self.backup_interval

    def get_auto_backup_config(self) -> Dict[str, Any]:
        """Get automatic backup configuration."""
        return {
            "enabled": self.is_auto_backup_enabled(),
            "interval_hours": self.backup_interval / 3600,
            "max_backups": self.max_backups,
            "next_backup": self.get_next_scheduled_backup_time()
        }