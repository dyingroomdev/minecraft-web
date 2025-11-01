import pytest
from unittest.mock import patch, MagicMock

from app.middleware.security import sanitize_markdown
from app.utils.file_validation import validate_image_file, sanitize_filename


def test_sanitize_markdown():
    """Test markdown sanitization."""
    # Safe content should pass through
    safe_content = "<p>Hello <strong>world</strong></p>"
    result = sanitize_markdown(safe_content)
    assert result == safe_content
    
    # Dangerous content should be stripped
    dangerous_content = '<script>alert("xss")</script><p>Safe content</p>'
    result = sanitize_markdown(dangerous_content)
    assert '<script>' not in result
    assert 'Safe content' in result
    
    # Links should be preserved with allowed attributes
    link_content = '<a href="https://example.com" onclick="evil()">Link</a>'
    result = sanitize_markdown(link_content)
    assert 'href="https://example.com"' in result
    assert 'onclick' not in result


def test_validate_image_file_valid():
    """Test valid image file validation."""
    mock_file = MagicMock()
    mock_file.filename = "test.jpg"
    mock_file.size = 1024 * 1024  # 1MB
    mock_file.file.read.return_value = b'\xff\xd8\xff'  # JPEG header
    
    with patch('magic.from_buffer', return_value='image/jpeg'):
        # Should not raise exception
        validate_image_file(mock_file)


def test_validate_image_file_too_large():
    """Test file size validation."""
    mock_file = MagicMock()
    mock_file.filename = "large.jpg"
    mock_file.size = 10 * 1024 * 1024  # 10MB
    
    with pytest.raises(Exception) as exc_info:
        validate_image_file(mock_file)
    
    assert "too large" in str(exc_info.value)


def test_validate_image_file_invalid_extension():
    """Test file extension validation."""
    mock_file = MagicMock()
    mock_file.filename = "test.exe"
    mock_file.size = 1024
    
    with pytest.raises(Exception) as exc_info:
        validate_image_file(mock_file)
    
    assert "Invalid file type" in str(exc_info.value)


def test_validate_image_file_mime_mismatch():
    """Test MIME type validation."""
    mock_file = MagicMock()
    mock_file.filename = "test.jpg"
    mock_file.size = 1024
    mock_file.file.read.return_value = b'fake content'
    
    with patch('magic.from_buffer', return_value='application/octet-stream'):
        with pytest.raises(Exception) as exc_info:
            validate_image_file(mock_file)
        
        assert "Invalid file type detected" in str(exc_info.value)


def test_sanitize_filename():
    """Test filename sanitization."""
    # Normal filename should be preserved
    assert sanitize_filename("test.jpg") == "test.jpg"
    
    # Path traversal should be prevented
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32") == "system32"
    
    # Dangerous characters should be replaced
    assert sanitize_filename("test<>:\"|?*.jpg") == "test_______.jpg"
    
    # Long filenames should be truncated
    long_name = "a" * 300 + ".jpg"
    result = sanitize_filename(long_name)
    assert len(result) <= 255
    assert result.endswith(".jpg")