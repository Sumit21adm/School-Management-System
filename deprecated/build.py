#!/usr/bin/env python3
"""
School Management System - Build & Deployment Script
Automates the build process and creates deployment packages
"""

import os
import sys
import shutil
import subprocess
import json
from datetime import datetime
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent
API_DIR = PROJECT_ROOT / "school-management-api"
FRONTEND_DIR = PROJECT_ROOT / "school-management-system"
BUILD_DIR = PROJECT_ROOT / "build"
DIST_DIR = PROJECT_ROOT / "dist"

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(message):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(message):
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")

def run_command(command, cwd=None, check=True):
    """Run shell command and return result"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=check,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return False, e.stdout, e.stderr

def clean_build_dirs():
    """Clean previous build directories"""
    print_info("Cleaning previous build directories...")
    
    dirs_to_clean = [BUILD_DIR, DIST_DIR]
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            shutil.rmtree(dir_path)
            print_success(f"Removed {dir_path.name}/")
    
    BUILD_DIR.mkdir(exist_ok=True)
    DIST_DIR.mkdir(exist_ok=True)
    print_success("Build directories ready")

def check_dependencies():
    """Check if required tools are installed"""
    print_info("Checking dependencies...")
    
    dependencies = {
        'node': 'node --version',
        'npm': 'npm --version',
        'docker': 'docker --version'
    }
    
    all_ok = True
    for tool, command in dependencies.items():
        success, stdout, _ = run_command(command, check=False)
        if success:
            version = stdout.strip()
            print_success(f"{tool}: {version}")
        else:
            print_error(f"{tool} not found")
            all_ok = False
    
    return all_ok

def install_dependencies():
    """Install npm dependencies"""
    print_info("Installing dependencies...")
    
    # Backend dependencies
    print_info("Installing backend dependencies...")
    success, _, stderr = run_command("npm ci", cwd=API_DIR)
    if not success:
        print_error(f"Backend dependency installation failed: {stderr}")
        return False
    print_success("Backend dependencies installed")
    
    # Frontend dependencies
    print_info("Installing frontend dependencies...")
    success, _, stderr = run_command("npm ci", cwd=FRONTEND_DIR)
    if not success:
        print_error(f"Frontend dependency installation failed: {stderr}")
        return False
    print_success("Frontend dependencies installed")
    
    return True

def build_backend():
    """Build backend application"""
    print_info("Building backend...")
    
    # Generate Prisma client
    print_info("Generating Prisma client...")
    success, _, stderr = run_command("npx prisma generate", cwd=API_DIR)
    if not success:
        print_error(f"Prisma generation failed: {stderr}")
        return False
    print_success("Prisma client generated")
    
    # Build NestJS application
    print_info("Building NestJS application...")
    success, _, stderr = run_command("npm run build", cwd=API_DIR)
    if not success:
        print_error(f"Backend build failed: {stderr}")
        return False
    print_success("Backend built successfully")
    
    return True

def build_frontend():
    """Build frontend application"""
    print_info("Building frontend...")
    
    success, _, stderr = run_command("npm run build", cwd=FRONTEND_DIR)
    if not success:
        print_error(f"Frontend build failed: {stderr}")
        return False
    print_success("Frontend built successfully")
    
    return True

def create_deployment_package():
    """Create deployment package"""
    print_info("Creating deployment package...")
    
    # Create package structure
    package_dir = BUILD_DIR / "school-management-system"
    package_dir.mkdir(exist_ok=True)
    
    # Copy backend build
    backend_dist = package_dir / "api"
    shutil.copytree(API_DIR / "dist", backend_dist / "dist")
    shutil.copytree(API_DIR / "node_modules", backend_dist / "node_modules")
    shutil.copytree(API_DIR / "prisma", backend_dist / "prisma")
    shutil.copy(API_DIR / "package.json", backend_dist / "package.json")
    shutil.copy(API_DIR / ".env.example", backend_dist / ".env.example")
    print_success("Backend files copied")
    
    # Copy frontend build
    frontend_dist = package_dir / "frontend"
    shutil.copytree(FRONTEND_DIR / "dist", frontend_dist)
    print_success("Frontend files copied")
    
    # Copy documentation
    docs_dist = package_dir / "docs"
    shutil.copytree(PROJECT_ROOT / "docs", docs_dist)
    print_success("Documentation copied")
    
    # Copy deployment scripts
    scripts_dist = package_dir / "scripts"
    scripts_dist.mkdir(exist_ok=True)
    
    # Create deployment README
    create_deployment_readme(package_dir)
    
    # Create version info
    create_version_info(package_dir)
    
    return package_dir

def create_deployment_readme(package_dir):
    """Create deployment README"""
    readme_content = """# School Management System - Deployment Package

## Package Contents

- `api/` - Backend NestJS application
- `frontend/` - Frontend React application (built)
- `docs/` - Documentation
- `VERSION.json` - Version information

## Deployment Steps

### 1. Prerequisites

- Node.js 20+
- MySQL 8.0+
- Docker (optional, for MySQL)

### 2. Database Setup

```bash
# Using Docker
docker run -d \\
  --name school-mysql \\
  -e MYSQL_ROOT_PASSWORD=root \\
  -e MYSQL_DATABASE=school_management \\
  -e MYSQL_USER=school_user \\
  -e MYSQL_PASSWORD=school_pass \\
  -p 3306:3306 \\
  mysql:8.0

# Or install MySQL manually
```

### 3. Backend Setup

```bash
cd api

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma migrate deploy

# Seed database (first time only)
npx prisma db seed

# Start backend
npm run start:prod
# Backend runs on http://localhost:3001
```

### 4. Frontend Setup

```bash
# Serve frontend using any static file server
# Option 1: Using serve
npx serve -s frontend -p 5173

# Option 2: Using nginx
# Copy frontend/ to /var/www/html/
# Configure nginx to serve static files

# Option 3: Using Apache
# Copy frontend/ to /var/www/html/
# Configure Apache virtual host
```

### 5. Environment Configuration

**Backend (.env):**
```env
DATABASE_URL="mysql://school_user:school_pass@localhost:3306/school_management"
JWT_SECRET="your-secure-secret-key"
PORT=3001
NODE_ENV=production
```

**Frontend:**
Update API URL in built files if needed (usually set during build)

### 6. Access Application

- Frontend: http://your-domain:5173
- Backend API: http://your-domain:3001
- Default Login: superadmin / admin123

### 7. Post-Deployment

- Change default admin password
- Configure backup strategy
- Set up SSL/HTTPS
- Configure firewall rules
- Set up monitoring

## Support

See `docs/` directory for detailed documentation.
"""
    
    with open(package_dir / "README.md", "w") as f:
        f.write(readme_content)
    
    print_success("Deployment README created")

def create_version_info(package_dir):
    """Create version information file"""
    version_info = {
        "version": "1.0.0",
        "build_date": datetime.now().isoformat(),
        "build_type": "production",
        "components": {
            "backend": "NestJS",
            "frontend": "React + TypeScript",
            "database": "MySQL 8.0"
        }
    }
    
    with open(package_dir / "VERSION.json", "w") as f:
        json.dump(version_info, f, indent=2)
    
    print_success("Version info created")

def create_archive(package_dir):
    """Create compressed archive"""
    print_info("Creating archive...")
    
    archive_name = f"school-management-system-v1.0.0-{datetime.now().strftime('%Y%m%d')}"
    archive_path = DIST_DIR / archive_name
    
    # Create tar.gz archive
    shutil.make_archive(str(archive_path), 'gztar', BUILD_DIR)
    
    archive_file = f"{archive_path}.tar.gz"
    size_mb = os.path.getsize(archive_file) / (1024 * 1024)
    
    print_success(f"Archive created: {archive_file}")
    print_info(f"Archive size: {size_mb:.2f} MB")
    
    return archive_file

def main():
    """Main build process"""
    print_header("School Management System - Build Script")
    
    try:
        # Step 1: Check dependencies
        print_header("Step 1: Checking Dependencies")
        if not check_dependencies():
            print_error("Missing dependencies. Please install required tools.")
            sys.exit(1)
        
        # Step 2: Clean build directories
        print_header("Step 2: Cleaning Build Directories")
        clean_build_dirs()
        
        # Step 3: Install dependencies
        print_header("Step 3: Installing Dependencies")
        if not install_dependencies():
            print_error("Dependency installation failed")
            sys.exit(1)
        
        # Step 4: Build backend
        print_header("Step 4: Building Backend")
        if not build_backend():
            print_error("Backend build failed")
            sys.exit(1)
        
        # Step 5: Build frontend
        print_header("Step 5: Building Frontend")
        if not build_frontend():
            print_error("Frontend build failed")
            sys.exit(1)
        
        # Step 6: Create deployment package
        print_header("Step 6: Creating Deployment Package")
        package_dir = create_deployment_package()
        
        # Step 7: Create archive
        print_header("Step 7: Creating Archive")
        archive_file = create_archive(package_dir)
        
        # Success!
        print_header("Build Completed Successfully!")
        print_success(f"Deployment package: {archive_file}")
        print_info("Ready for deployment!")
        
    except KeyboardInterrupt:
        print_error("\nBuild cancelled by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Build failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
