#!/usr/bin/env python3
"""
Unified Editing Studio - GUI Launcher
Easy installation and launch for non-technical users
"""

import os
import sys
import subprocess
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import json
import platform
import urllib.request
import tempfile
import shutil
from pathlib import Path

class StudioInstaller:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Unified Editing Studio - Launcher")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        
        # Configure styles
        self.setup_styles()
        
        # Create UI
        self.create_widgets()
        
        # Check requirements
        self.check_requirements()
        
    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configure colors
        style.configure('Title.TLabel', font=('Arial', 16, 'bold'), background='#2c3e50')
        style.configure('Header.TLabel', font=('Arial', 12, 'bold'), background='#34495e')
        style.configure('Info.TLabel', font=('Arial', 10))
        
    def create_widgets(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(main_frame, text="Unified Editing Studio", style='Title.TLabel')
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Status display
        self.status_frame = ttk.LabelFrame(main_frame, text="Status", padding="10")
        self.status_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        self.status_text = tk.Text(self.status_frame, height=15, width=60, wrap=tk.WORD)
        self.status_text.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Scrollbar for status
        scrollbar = ttk.Scrollbar(self.status_frame, orient=tk.VERTICAL, command=self.status_text.yview)
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.status_text.config(yscrollcommand=scrollbar.set)
        
        # Buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=2, column=0, columnspan=2, pady=(0, 20))
        
        self.install_button = ttk.Button(button_frame, text="Install/Update", command=self.install_and_launch)
        self.install_button.grid(row=0, column=0, padx=(0, 10))
        
        self.launch_button = ttk.Button(button_frame, text="Launch Studio", command=self.launch_studio, state=tk.DISABLED)
        self.launch_button.grid(row=0, column=1, padx=(0, 10))
        
        self.settings_button = ttk.Button(button_frame, text="Settings", command=self.open_settings)
        self.settings_button.grid(row=0, column=2)
        
        # Info frame
        info_frame = ttk.LabelFrame(main_frame, text="Information", padding="10")
        info_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E))
        
        info_text = tk.Text(info_frame, height=6, width=60, wrap=tk.WORD, state=tk.DISABLED)
        info_text.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        info_content = """Unified Editing Studio - Easy Launcher
This application helps you install and launch the Unified Editing Studio without technical knowledge.

Requirements:
• Internet connection for first-time installation
• 4GB+ RAM recommended
• 2GB+ free disk space
• Windows 10+ / macOS 10.14+ / Linux

Click 'Install/Update' to get started!"""
        
        info_text.config(state=tk.NORMAL)
        info_text.insert(1.0, info_content)
        info_text.config(state=tk.DISABLED)
        
    def log(self, message, level="INFO"):
        """Log messages to status display"""
        timestamp = subprocess.getoutput("echo %date% %time%").strip()
        self.status_text.insert(tk.END, f"[{timestamp}] {level}: {message}\n")
        self.status_text.see(tk.END)
        self.root.update()
        
    def check_requirements(self):
        """Check system requirements and dependencies"""
        self.log("Checking system requirements...")
        
        system = platform.system()
        self.log(f"Operating System: {system} {platform.release()}")
        
        # Check Python
        python_version = sys.version_info
        self.log(f"Python: {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 9):
            self.log("WARNING: Python 3.9+ required for best performance", "WARNING")
        
        # Check RAM
        try:
            import psutil
            ram_gb = psutil.virtual_memory().total / (1024**3)
            self.log(f"RAM: {ram_gb:.1f}GB")
            if ram_gb < 4:
                self.log("WARNING: Less than 4GB RAM may cause performance issues", "WARNING")
        except ImportError:
            self.log("psutil not available, cannot check RAM")
        
        # Check disk space
        try:
            free_space = shutil.disk_usage(Path.home()).free / (1024**3)
            self.log(f"Free disk space: {free_space:.1f}GB")
            if free_space < 2:
                self.log("WARNING: Less than 2GB free disk space", "WARNING")
        except Exception as e:
            self.log(f"Could not check disk space: {e}")
        
        self.log("Requirements check completed")
        
    def install_and_launch(self):
        """Run installation and launch"""
        def install_thread():
            try:
                self.install_button.config(state=tk.DISABLED)
                self.launch_button.config(state=tk.DISABLED)
                
                self.log("Starting installation process...")
                
                # Step 1: Set up virtual environment
                self.log("Setting up Python environment...")
                if not os.path.exists(".venv"):
                    subprocess.run([sys.executable, "-m", "venv", ".venv"], check=True)
                    self.log("Virtual environment created")
                
                # Step 2: Install dependencies
                self.log("Installing backend dependencies...")
                venv_python = os.path.join(".venv", "Scripts", "python.exe") if platform.system() == "Windows" else os.path.join(".venv", "bin", "python")
                subprocess.run([venv_python, "-m", "pip", "install", "--upgrade", "pip"], check=True)
                subprocess.run([venv_python, "-m", "pip", "install", "-r", "backend/release_requirements.txt"], check=True)
                self.log("Backend dependencies installed")
                
                # Step 3: Check frontend
                self.log("Checking frontend dependencies...")
                frontend_path = Path("frontend")
                if frontend_path.exists():
                    if not (frontend_path / "node_modules").exists():
                        self.log("Installing frontend dependencies...")
                        os.chdir(frontend_path)
                        subprocess.run(["npm", "install"], check=True)
                        os.chdir("..")
                    else:
                        self.log("Frontend dependencies already installed")
                    
                    # Build frontend
                    self.log("Building frontend...")
                    os.chdir(frontend_path)
                    subprocess.run(["npm", "run", "build"], check=True)
                    os.chdir("..")
                    self.log("Frontend built successfully")
                else:
                    self.log("Frontend directory not found", "ERROR")
                
                self.log("Installation completed successfully!")
                self.launch_button.config(state=tk.NORMAL)
                
            except subprocess.CalledProcessError as e:
                self.log(f"Installation failed: {e}", "ERROR")
                messagebox.showerror("Installation Failed", f"Installation failed: {e}")
            except Exception as e:
                self.log(f"Unexpected error: {e}", "ERROR")
                messagebox.showerror("Installation Error", f"An error occurred: {e}")
            finally:
                self.install_button.config(state=tk.NORMAL)
        
        threading.Thread(target=install_thread, daemon=True).start()
        
    def launch_studio(self):
        """Launch the Unified Editing Studio"""
        try:
            self.log("Launching Unified Editing Studio...")
            
            venv_python = os.path.join(".venv", "Scripts", "python.exe") if platform.system() == "Windows" else os.path.join(".venv", "bin", "python")
            
            # Start backend
            self.log("Starting backend server...")
            backend_process = subprocess.Popen([
                venv_python, "-m", "uvicorn", "studio.backend.app:app", 
                "--host", "127.0.0.1", "--port", "8000"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # Wait a bit for backend to start
            import time
            time.sleep(3)
            
            # Open browser
            import webbrowser
            webbrowser.open("http://127.0.0.1:8000")
            
            self.log("Studio launched successfully! Browser opened at http://127.0.0.1:8000")
            
        except Exception as e:
            self.log(f"Failed to launch studio: {e}", "ERROR")
            messagebox.showerror("Launch Failed", f"Failed to launch studio: {e}")
    
    def open_settings(self):
        """Open settings dialog"""
        settings_window = tk.Toplevel(self.root)
        settings_window.title("Settings")
        settings_window.geometry("400x300")
        
        # Port setting
        port_frame = ttk.Frame(settings_window, padding="10")
        port_frame.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        ttk.Label(port_frame, text="Server Port:").grid(row=0, column=0, sticky=tk.W)
        port_var = tk.StringVar(value="8000")
        port_entry = ttk.Entry(port_frame, textvariable=port_var)
        port_entry.grid(row=0, column=1, sticky=(tk.W, tk.E))
        
        # Auto-launch browser
        auto_launch_var = tk.BooleanVar(value=True)
        auto_launch_check = ttk.Checkbutton(port_frame, text="Auto-launch browser", variable=auto_launch_var)
        auto_launch_check.grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=(10, 0))
        
        # Buttons
        button_frame = ttk.Frame(settings_window)
        button_frame.grid(row=1, column=0, pady=(20, 0))
        
        ttk.Button(button_frame, text="Save", command=lambda: self.save_settings(port_var.get(), auto_launch_var.get(), settings_window)).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(button_frame, text="Cancel", command=settings_window.destroy).grid(row=0, column=1)
        
    def save_settings(self, port, auto_launch, window):
        """Save settings"""
        self.log(f"Settings saved - Port: {port}, Auto-launch: {auto_launch}")
        window.destroy()
        
    def run(self):
        """Start the GUI"""
        self.root.mainloop()

if __name__ == "__main__":
    app = StudioInstaller()
    app.run()