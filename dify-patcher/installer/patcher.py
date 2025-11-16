#!/usr/bin/env python3
"""
Dify Patcher - Apply minimal patches to Dify core for custom nodes support

This script applies git patches to Dify source code to enable custom node loading.
Only 5 files are patched with minimal changes.
"""

import argparse
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple


class Colors:
    """ANSI color codes"""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


def print_colored(message: str, color: str = Colors.NC):
    """Print colored message"""
    print(f"{color}{message}{Colors.NC}")


def check_git_available() -> bool:
    """Check if git is available"""
    try:
        subprocess.run(['git', '--version'], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def is_patch_applied(target_dir: Path, patch_file: Path) -> Tuple[bool, str]:
    """
    Check if a patch is already applied

    Returns:
        (is_applied, message)
    """
    try:
        # Use git apply --check with --reverse to see if already applied
        result = subprocess.run(
            ['git', 'apply', '--reverse', '--check', str(patch_file)],
            cwd=target_dir,
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            return True, "Already applied"
        else:
            # Check if can be applied normally
            check_result = subprocess.run(
                ['git', 'apply', '--check', str(patch_file)],
                cwd=target_dir,
                capture_output=True,
                text=True
            )

            if check_result.returncode == 0:
                return False, "Ready to apply"
            else:
                return False, f"Conflicts detected: {check_result.stderr.strip()}"

    except Exception as e:
        return False, f"Error checking patch: {str(e)}"


def apply_patch(target_dir: Path, patch_file: Path, dry_run: bool = False) -> Tuple[bool, str]:
    """
    Apply a git patch to target directory

    Returns:
        (success, message)
    """
    patch_name = patch_file.name

    # Check if already applied
    is_applied, check_msg = is_patch_applied(target_dir, patch_file)

    if is_applied:
        return True, f"{patch_name}: {check_msg}"

    if "Conflicts" in check_msg:
        return False, f"{patch_name}: {check_msg}"

    if dry_run:
        return True, f"{patch_name}: Would be applied (dry-run)"

    # Apply the patch
    try:
        result = subprocess.run(
            ['git', 'apply', str(patch_file)],
            cwd=target_dir,
            capture_output=True,
            text=True,
            check=True
        )

        return True, f"{patch_name}: Applied successfully"

    except subprocess.CalledProcessError as e:
        return False, f"{patch_name}: Failed to apply\n{e.stderr.strip()}"


def apply_patches(
    target_dir: Path,
    patches_dir: Path,
    dry_run: bool = False,
    force: bool = False
) -> bool:
    """
    Apply all patches from patches directory

    Returns:
        True if all patches applied successfully, False otherwise
    """
    if not patches_dir.exists():
        print_colored(f"❌ Patches directory not found: {patches_dir}", Colors.RED)
        return False

    # Find all .patch files
    patch_files = sorted(patches_dir.glob('*.patch'))

    if not patch_files:
        print_colored(f"⚠️  No patch files found in {patches_dir}", Colors.YELLOW)
        return True

    print_colored(f"Found {len(patch_files)} patch file(s)", Colors.BLUE)
    print()

    success_count = 0
    skip_count = 0
    fail_count = 0

    for patch_file in patch_files:
        success, message = apply_patch(target_dir, patch_file, dry_run)

        if success:
            if "Already applied" in message:
                print_colored(f"  ⏭️  {message}", Colors.YELLOW)
                skip_count += 1
            else:
                print_colored(f"  ✅ {message}", Colors.GREEN)
                success_count += 1
        else:
            print_colored(f"  ❌ {message}", Colors.RED)
            fail_count += 1

            if not force:
                print()
                print_colored("❌ Stopping due to patch failure", Colors.RED)
                print_colored("   Use --force to continue despite failures", Colors.YELLOW)
                return False

    print()
    print_colored("═" * 60, Colors.BLUE)
    print_colored(f"Summary: {success_count} applied, {skip_count} skipped, {fail_count} failed", Colors.BLUE)
    print_colored("═" * 60, Colors.BLUE)

    return fail_count == 0


def create_backup(target_dir: Path) -> bool:
    """Create a git stash backup before applying patches"""
    try:
        # Check if there are uncommitted changes
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            cwd=target_dir,
            capture_output=True,
            text=True,
            check=True
        )

        if result.stdout.strip():
            print_colored("📦 Creating backup of uncommitted changes...", Colors.BLUE)
            subprocess.run(
                ['git', 'stash', 'push', '-m', 'Backup before applying custom nodes patches'],
                cwd=target_dir,
                check=True
            )
            print_colored("✅ Backup created (git stash)", Colors.GREEN)
            return True

        return True

    except Exception as e:
        print_colored(f"⚠️  Could not create backup: {e}", Colors.YELLOW)
        return True  # Continue anyway


def main():
    parser = argparse.ArgumentParser(
        description='Apply patches to Dify for custom nodes support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s --target ../dify --patches ./patches
  %(prog)s --target ../dify --patches ./patches --dry-run
  %(prog)s --target ../dify --patches ./patches --force
        '''
    )

    parser.add_argument(
        '--target',
        required=True,
        type=Path,
        help='Target Dify directory'
    )

    parser.add_argument(
        '--patches',
        required=True,
        type=Path,
        help='Directory containing patch files'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Check patches without applying them'
    )

    parser.add_argument(
        '--force',
        action='store_true',
        help='Continue even if some patches fail'
    )

    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Skip creating git stash backup'
    )

    args = parser.parse_args()

    # Resolve paths
    target_dir = args.target.resolve()
    patches_dir = args.patches.resolve()

    # Validate target directory
    if not target_dir.exists():
        print_colored(f"❌ Target directory not found: {target_dir}", Colors.RED)
        return 1

    if not (target_dir / 'api').exists() or not (target_dir / 'web').exists():
        print_colored(f"❌ Invalid Dify directory: {target_dir}", Colors.RED)
        print_colored("   Expected to find 'api' and 'web' subdirectories", Colors.RED)
        return 1

    # Check git availability
    if not check_git_available():
        print_colored("❌ Git is not available. Please install git first.", Colors.RED)
        return 1

    # Create backup
    if not args.no_backup and not args.dry_run:
        create_backup(target_dir)
        print()

    # Apply patches
    mode_str = "DRY RUN" if args.dry_run else "APPLY"
    print_colored(f"🔧 {mode_str}: Patching Dify at {target_dir}", Colors.GREEN)
    print()

    success = apply_patches(target_dir, patches_dir, args.dry_run, args.force)

    if success:
        print()
        if args.dry_run:
            print_colored("✅ All patches can be applied successfully!", Colors.GREEN)
        else:
            print_colored("✅ All patches applied successfully!", Colors.GREEN)
        return 0
    else:
        print()
        print_colored("❌ Some patches failed to apply", Colors.RED)
        return 1


if __name__ == '__main__':
    sys.exit(main())
