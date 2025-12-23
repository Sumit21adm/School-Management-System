# Build & Deployment

This directory contains build and deployment resources.

## Quick Start

### Build Deployment Package
```bash
python3 build.py
```

This creates a ready-to-deploy package in `dist/` directory.

## Files

- **[build.py](../build.py)** - Automated build script
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide

## Build Output

After running `build.py`:
- `build/school-management-system/` - Uncompressed package
- `dist/school-management-system-v1.0.0-YYYYMMDD.tar.gz` - Compressed archive

## Package Contents

```
school-management-system/
├── api/                    # Backend (built)
│   ├── dist/              # Compiled NestJS
│   ├── node_modules/      # Dependencies
│   ├── prisma/            # Database schema & migrations
│   └── package.json
├── frontend/              # Frontend (built)
│   └── (static files)
├── docs/                  # Documentation
├── README.md             # Deployment instructions
└── VERSION.json          # Build information
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide including:
- Server setup
- Database configuration
- SSL/HTTPS setup
- Monitoring
- Backup strategies

## CI/CD

Future GitHub Actions workflow will automate:
- Building on push to main
- Running tests
- Creating releases
- Deploying to staging/production

---

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
