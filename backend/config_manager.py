import json
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from enum import Enum

logger = logging.getLogger("studio.backend.config_manager")

class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class ConfigManager:
    def __init__(self, environments_root: Path = None):
        self.environments_root = environments_root or Path("config/environments")
        self.current_environment = Environment.DEVELOPMENT
        self.config_cache = {}
        
        # Create environments directory if it doesn't exist
        self.environments_root.mkdir(parents=True, exist_ok=True)
        
        # Load environment configurations
        self._load_all_environments()

    def _load_all_environments(self):
        """Load all environment configurations."""
        self.config_cache = {}
        
        for env in Environment:
            config_file = self.environments_root / f"{env.value}.json"
            if config_file.exists():
                try:
                    with open(config_file, 'r', encoding='utf-8') as f:
                        self.config_cache[env] = json.load(f)
                    logger.info(f"Loaded {env.value} configuration")
                except Exception as e:
                    logger.error(f"Failed to load {env.value} config: {e}")
                    self.config_cache[env] = {}
            else:
                # Create default configuration
                self.config_cache[env] = self._get_default_config(env)
                self._save_environment_config(env)

    def _get_default_config(self, env: Environment) -> Dict[str, Any]:
        """Get default configuration for environment."""
        base_config = {
            "server": {
                "host": "0.0.0.0",
                "port": 8000,
                "debug": True,
                "reload": True,
                "workers": 1
            },
            "database": {
                "url": "sqlite:///studio.db",
                "pool_size": 5,
                "timeout": 30
            },
            "ai": {
                "model_path": "models",
                "cache_dir": "cache",
                "max_concurrent_requests": 4,
                "request_timeout": 300,
                "batch_size": 1,
                "precision": "float16"
            },
            "monitoring": {
                "enabled": True,
                "metrics_port": 8080,
                "log_level": "INFO",
                "health_check_interval": 30
            },
            "security": {
                "rate_limit": {
                    "enabled": True,
                    "requests_per_minute": 100,
                    "burst_size": 10
                },
                "cors": {
                    "enabled": True,
                    "allow_origins": ["*"],
                    "allow_methods": ["*"],
                    "allow_headers": ["*"]
                }
            },
            "storage": {
                "max_file_size": 100 * 1024 * 1024,  # 100MB
                "allowed_extensions": [".png", ".jpg", ".jpeg", ".gif", ".mp3", ".wav", ".json"],
                "temp_dir": "temp",
                "cleanup_interval": 3600  # 1 hour
            }
        }
        
        # Environment-specific overrides
        if env == Environment.DEVELOPMENT:
            base_config["server"]["debug"] = True
            base_config["server"]["reload"] = True
            base_config["monitoring"]["log_level"] = "DEBUG"
            base_config["security"]["rate_limit"]["enabled"] = False
            
        elif env == Environment.STAGING:
            base_config["server"]["debug"] = False
            base_config["server"]["reload"] = False
            base_config["server"]["workers"] = 2
            base_config["monitoring"]["log_level"] = "INFO"
            base_config["security"]["rate_limit"]["requests_per_minute"] = 200
            
        elif env == Environment.PRODUCTION:
            base_config["server"]["debug"] = False
            base_config["server"]["reload"] = False
            base_config["server"]["workers"] = 4
            base_config["monitoring"]["log_level"] = "WARNING"
            base_config["security"]["rate_limit"]["requests_per_minute"] = 60
            base_config["ai"]["max_concurrent_requests"] = 8
        
        return base_config

    def _save_environment_config(self, env: Environment):
        """Save environment configuration to file."""
        config_file = self.environments_root / f"{env.value}.json"
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config_cache[env], f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {env.value} configuration")
        except Exception as e:
            logger.error(f"Failed to save {env.value} config: {e}")

    def set_environment(self, env: Environment):
        """Set current environment."""
        if env in self.config_cache:
            self.current_environment = env
            logger.info(f"Switched to {env.value} environment")
            return True
        else:
            logger.error(f"Environment {env.value} not found")
            return False

    def get_current_environment(self) -> Environment:
        """Get current environment."""
        return self.current_environment

    def get_config(self, env: Environment = None, path: str = None) -> Any:
        """Get configuration value for environment."""
        if env is None:
            env = self.current_environment
        
        if env not in self.config_cache:
            return None
        
        config = self.config_cache[env]
        
        if path is None:
            return config
        
        # Navigate nested path (e.g., "server.port")
        keys = path.split('.')
        for key in keys:
            if isinstance(config, dict) and key in config:
                config = config[key]
            else:
                return None
        
        return config

    def set_config(self, env: Environment, path: str, value: Any):
        """Set configuration value for environment."""
        if env not in self.config_cache:
            self.config_cache[env] = self._get_default_config(env)
        
        config = self.config_cache[env]
        
        # Navigate and create nested path (e.g., "server.port")
        keys = path.split('.')
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        config[keys[-1]] = value
        self._save_environment_config(env)

    def get_database_url(self, env: Environment = None) -> str:
        """Get database URL for environment."""
        return self.get_config(env or self.current_environment, "database.url")

    def get_server_config(self, env: Environment = None) -> Dict[str, Any]:
        """Get server configuration for environment."""
        return self.get_config(env or self.current_environment, "server")

    def get_ai_config(self, env: Environment = None) -> Dict[str, Any]:
        """Get AI configuration for environment."""
        return self.get_config(env or self.current_environment, "ai")

    def get_monitoring_config(self, env: Environment = None) -> Dict[str, Any]:
        """Get monitoring configuration for environment."""
        return self.get_config(env or self.current_environment, "monitoring")

    def get_security_config(self, env: Environment = None) -> Dict[str, Any]:
        """Get security configuration for environment."""
        return self.get_config(env or self.current_environment, "security")

    def get_storage_config(self, env: Environment = None) -> Dict[str, Any]:
        """Get storage configuration for environment."""
        return self.get_config(env or self.current_environment, "storage")

    def validate_environment(self, env: Environment) -> Dict[str, Any]:
        """Validate environment configuration."""
        config = self.config_cache.get(env, {})
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "environment": env.value
        }
        
        # Validate server config
        server_config = config.get("server", {})
        if not isinstance(server_config.get("port"), int):
            validation_result["valid"] = False
            validation_result["errors"].append("Server port must be an integer")
        
        # Validate AI config
        ai_config = config.get("ai", {})
        if ai_config.get("max_concurrent_requests", 0) < 1:
            validation_result["warnings"].append("AI max_concurrent_requests should be at least 1")
        
        # Validate storage config
        storage_config = config.get("storage", {})
        if storage_config.get("max_file_size", 0) < 1024 * 1024:  # 1MB minimum
            validation_result["warnings"].append("Storage max_file_size should be at least 1MB")
        
        return validation_result

    def list_environments(self) -> List[str]:
        """List all available environments."""
        return [env.value for env in Environment]

    def create_custom_environment(self, name: str, base_env: Environment = Environment.DEVELOPMENT):
        """Create a custom environment based on an existing one."""
        try:
            custom_env = Environment(name.lower())
            if custom_env in self.config_cache:
                return {"success": False, "error": f"Environment {name} already exists"}
            
            # Copy base environment config
            self.config_cache[custom_env] = self.config_cache.get(base_env, self._get_default_config(base_env))
            
            # Save custom environment
            self._save_environment_config(custom_env)
            
            return {
                "success": True,
                "environment": name,
                "base_environment": base_env.value
            }
            
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid environment name: {name}"
            }

    def delete_custom_environment(self, name: str):
        """Delete a custom environment."""
        try:
            custom_env = Environment(name.lower())
            if custom_env in Environment:
                return {"success": False, "error": "Cannot delete built-in environment"}
            
            if custom_env in self.config_cache:
                del self.config_cache[custom_env]
                
                # Remove config file
                config_file = self.environments_root / f"{name.lower()}.json"
                if config_file.exists():
                    config_file.unlink()
                
                return {"success": True, "message": f"Environment {name} deleted"}
            else:
                return {"success": False, "error": f"Environment {name} not found"}
                
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid environment name: {name}"
            }

    def export_configuration(self, env: Environment) -> Dict[str, Any]:
        """Export environment configuration as JSON."""
        if env not in self.config_cache:
            return {"success": False, "error": f"Environment {env.value} not found"}
        
        return {
            "success": True,
            "environment": env.value,
            "config": self.config_cache[env],
            "exported_at": datetime.now().isoformat()
        }

    def import_configuration(self, env: Environment, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """Import environment configuration from JSON."""
        try:
            # Validate configuration
            if not isinstance(config_data, dict):
                return {"success": False, "error": "Configuration must be a dictionary"}
            
            # Validate configuration structure
            validation = self.validate_environment(env)
            if not validation["valid"]:
                return {"success": False, "error": f"Configuration validation failed: {validation['errors']}"}
            
            # Import configuration
            self.config_cache[env] = config_data
            self._save_environment_config(env)
            
            return {
                "success": True,
                "environment": env.value,
                "imported_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to import configuration: {str(e)}"}

# Global configuration manager instance
config_manager = ConfigManager()

# Utility functions for easy access
def set_environment(env: str):
    """Set current environment by name."""
    try:
        env_enum = Environment(env.lower())
        return config_manager.set_environment(env_enum)
    except ValueError:
        return False

def get_current_environment() -> str:
    """Get current environment name."""
    return config_manager.get_current_environment().value

def get_config(path: str, env: str = None) -> Any:
    """Get configuration value by path and optional environment."""
    env_enum = None
    if env:
        try:
            env_enum = Environment(env.lower())
        except ValueError:
            pass
    
    return config_manager.get_config(env_enum, path)