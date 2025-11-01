"""CSV file validation utilities."""

from fastapi import UploadFile, HTTPException, status


def validate_csv_file(file: UploadFile) -> None:
    """Validate CSV file upload."""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )
    
    # Check file size (max 1MB for CSV)
    if hasattr(file, 'size') and file.size and file.size > 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="CSV file too large. Maximum size is 1MB"
        )