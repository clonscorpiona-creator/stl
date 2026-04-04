"""
Utility functions for managing blocked works storage.

Files are stored in: MEDIA_ROOT/blocked_works/<username>.txt
File format: <work_id>\\t<blocked_at>\\t<block_reason> (one per line)
"""

import os
from datetime import datetime
from django.conf import settings


BLOCKED_WORKS_DIR = os.path.join(settings.MEDIA_ROOT, 'blocked_works')


def ensure_blocked_works_dir():
    """Ensure the blocked_works directory exists."""
    os.makedirs(BLOCKED_WORKS_DIR, exist_ok=True)


def get_user_blocked_file_path(user):
    """
    Get the path to a user's blocked works file.

    Args:
        user: Django User object

    Returns:
        str: Absolute path to user's blocked works file
    """
    ensure_blocked_works_dir()
    return os.path.join(BLOCKED_WORKS_DIR, f'{user.username}.txt')


def add_blocked_work(user, work, reason=''):
    """
    Add a work ID to user's blocked file.

    Args:
        user: Django User object (the one who blocked)
        work: Work object being blocked
        reason: Block reason string

    Returns:
        bool: True if successfully added
    """
    file_path = get_user_blocked_file_path(user)
    blocked_at = datetime.now().isoformat()
    line = f'{work.id}\t{blocked_at}\t{reason}\n'

    # Check if already exists
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            for existing_line in f:
                if existing_line.startswith(f'{work.id}\t'):
                    return False  # Already blocked

    # Append to file
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(line)

    return True


def remove_blocked_work(user, work_id):
    """
    Remove a work ID from user's blocked file.

    Args:
        user: Django User object
        work_id: ID of work to remove

    Returns:
        bool: True if successfully removed
    """
    file_path = get_user_blocked_file_path(user)

    if not os.path.exists(file_path):
        return False

    # Read all lines except the one to remove
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Filter out the line with matching work_id
    new_lines = [line for line in lines if not line.startswith(f'{work_id}\t')]

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    return True


def get_blocked_works_count(user):
    """
    Count the number of blocked works for a user.

    Args:
        user: Django User object

    Returns:
        int: Number of lines in user's blocked file
    """
    file_path = get_user_blocked_file_path(user)

    if not os.path.exists(file_path):
        return 0

    with open(file_path, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)


def get_user_blocked_works(user):
    """
    Get list of blocked work IDs for a user.

    Args:
        user: Django User object

    Returns:
        list: List of (work_id, blocked_at, reason) tuples
    """
    file_path = get_user_blocked_file_path(user)

    if not os.path.exists(file_path):
        return []

    result = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                parts = line.split('\t')
                if len(parts) >= 1:
                    work_id = int(parts[0])
                    blocked_at = parts[1] if len(parts) > 1 else ''
                    reason = parts[2] if len(parts) > 2 else ''
                    result.append((work_id, blocked_at, reason))

    return result
