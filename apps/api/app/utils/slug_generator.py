"""Slug generation utilities."""

import re
import unicodedata
from typing import Optional


def generate_slug(title: str, max_length: int = 140) -> str:
    """Generate URL-friendly slug from title."""
    # Convert to lowercase and normalize unicode
    slug = unicodedata.normalize('NFKD', title.lower())
    
    # Remove non-ascii characters
    slug = slug.encode('ascii', 'ignore').decode('ascii')
    
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    
    # Remove leading/trailing hyphens and limit length
    slug = slug.strip('-')[:max_length]
    
    # Ensure it doesn't end with hyphen after truncation
    slug = slug.rstrip('-')
    
    return slug or 'untitled'


def ensure_unique_slug(base_slug: str, existing_slugs: set[str]) -> str:
    """Ensure slug is unique by appending number if needed."""
    if base_slug not in existing_slugs:
        return base_slug
    
    counter = 1
    while f"{base_slug}-{counter}" in existing_slugs:
        counter += 1
    
    return f"{base_slug}-{counter}"