# 🤝 Contribution Guide

Thank you for your interest in contributing to the School Management System!

## Development Workflow

1. **Fork & Clone**
   ```bash
   git clone <repo_url>
   ```

2. **Branching Strategy**
   - `main`: Production-ready code.
   - `develop`: Integration branch for next release.
   - `feature/feature-name`: For new features.
   - `fix/bug-name`: For bug fixes.

3. **Install Dependencies**
   Run the setup script or manually install packages in both `api` and `system` folders.

4. **Code Standards**
   - **Frontend**: Clean Functional Components, custom hooks for logic.
   - **Backend**: NestJS conventions (Controller-Service-Module pattern).
   - **Linting**: Ensure `eslint` passes before pushing.

## Submitting a Pull Request
1. Push your branch to origin.
2. Open a PR against `develop`.
3. Provide a clear description of changes.
4. Attach screenshots for UI changes.

## Reporting Issues
Please use the GitHub Issues tab to report bugs. Include:
- Steps to reproduce
- Expected vs Actual behavior
- Screenshots/Logs if applicable
