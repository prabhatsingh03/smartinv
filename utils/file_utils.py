"""
File management utilities for organizing uploaded files by department and date.
Handles file validation, path generation, and storage organization.
"""

import os
import shutil
from datetime import datetime
from typing import Optional
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

class FileUtils:
    """Utility class for file management operations."""
    
    ALLOWED_EXTENSIONS = {'pdf'}
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
    
    def __init__(self, upload_folder: str):
        self.upload_folder = upload_folder
        self._ensure_upload_folder()
    
    def _ensure_upload_folder(self):
        """Ensure upload folder exists."""
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder, exist_ok=True)
    
    def is_allowed_file(self, filename: str) -> bool:
        """
        Check if file extension is allowed.
        
        Args:
            filename: Name of the file
            
        Returns:
            True if file extension is allowed
        """
        if not filename:
            return False
        
        return ('.' in filename and 
                filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS)
    
    def is_valid_file_size(self, file: FileStorage) -> bool:
        """
        Check if file size is within limits.
        
        Args:
            file: FileStorage object
            
        Returns:
            True if file size is valid
        """
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        return file_size <= self.MAX_FILE_SIZE
    
    def generate_file_path(self, filename: str, department_id: int, user_id: int) -> str:
        """
        Generate organized file path based on department and date.
        
        Args:
            filename: Original filename
            department_id: Department ID
            user_id: User ID who uploaded
            
        Returns:
            Organized file path
        """
        # Get current date
        now = datetime.now()
        year = now.year
        month = now.month
        
        # Create directory structure: uploads/department_id/year/month/
        dir_path = os.path.join(
            self.upload_folder,
            str(department_id),
            str(year),
            f"{month:02d}"
        )
        
        # Ensure directory exists
        os.makedirs(dir_path, exist_ok=True)
        
        # Generate unique filename with timestamp
        name, ext = os.path.splitext(secure_filename(filename))
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{name}_{timestamp}_{user_id}{ext}"
        
        return os.path.join(dir_path, unique_filename)
    
    def organize_file_storage(
        self, 
        file: FileStorage, 
        filename: str, 
        department_id: int, 
        user_id: int
    ) -> str:
        """
        Save file to organized storage location.
        
        Args:
            file: FileStorage object
            filename: Original filename
            department_id: Department ID
            user_id: User ID
            
        Returns:
            Path where file was saved
        """
        # Generate organized file path
        file_path = self.generate_file_path(filename, department_id, user_id)
        
        # Save file
        file.save(file_path)
        
        return file_path
    
    def save_to_temp_storage(
        self, 
        file: FileStorage, 
        filename: str, 
        user_id: int
    ) -> str:
        """
        Save file to temporary storage location for processing.
        Files in temp storage will be moved to permanent storage only when saved as draft or above.
        
        Args:
            file: FileStorage object
            filename: Original filename
            user_id: User ID who uploaded
            
        Returns:
            Path where file was saved temporarily
        """
        # Create temp directory structure: uploads/temp/user_id/
        temp_dir = os.path.join(self.upload_folder, 'temp', str(user_id))
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename with timestamp
        name, ext = os.path.splitext(secure_filename(filename))
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        unique_filename = f"{name}_{timestamp}{ext}"
        
        temp_file_path = os.path.join(temp_dir, unique_filename)
        
        # Save file to temp location
        file.save(temp_file_path)
        
        return temp_file_path
    
    def move_to_permanent_storage(
        self, 
        temp_file_path: str, 
        filename: str, 
        department_id: int, 
        user_id: int
    ) -> str:
        """
        Move file from temporary storage to permanent organized storage.
        
        Args:
            temp_file_path: Path to temporary file
            filename: Original filename
            department_id: Department ID
            user_id: User ID who uploaded
            
        Returns:
            Path where file was moved to
        """
        if not os.path.exists(temp_file_path):
            raise FileNotFoundError(f"Temporary file not found: {temp_file_path}")
        
        # Generate permanent file path
        permanent_path = self.generate_file_path(filename, department_id, user_id)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(permanent_path), exist_ok=True)
        
        # Move file from temp to permanent location
        import shutil
        shutil.move(temp_file_path, permanent_path)
        
        # Clean up temp directory if empty
        temp_dir = os.path.dirname(temp_file_path)
        try:
            if not os.listdir(temp_dir):
                os.rmdir(temp_dir)
        except OSError:
            pass  # Directory not empty or permission error
        
        return permanent_path
    
    def cleanup_temp_file(self, temp_file_path: str) -> bool:
        """
        Clean up temporary file and directory if empty.
        
        Args:
            temp_file_path: Path to temporary file
            
        Returns:
            True if cleanup was successful
        """
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
                # Clean up temp directory if empty
                temp_dir = os.path.dirname(temp_file_path)
                try:
                    if not os.listdir(temp_dir):
                        os.rmdir(temp_dir)
                except OSError:
                    pass  # Directory not empty or permission error
                
                return True
            else:
                # File doesn't exist, which means it's already cleaned up
                return True
        except Exception:
            return False
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get file information.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with file information or None if file doesn't exist
        """
        if not os.path.exists(file_path):
            return None
        
        stat = os.stat(file_path)
        return {
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime),
            'modified': datetime.fromtimestamp(stat.st_mtime),
            'exists': True
        }
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file from storage.
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False
    
    def cleanup_empty_directories(self, base_path: str = None):
        """
        Clean up empty directories in the upload folder.
        
        Args:
            base_path: Base path to clean up (defaults to upload_folder)
        """
        if base_path is None:
            base_path = self.upload_folder
        
        try:
            for root, dirs, files in os.walk(base_path, topdown=False):
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                    try:
                        if not os.listdir(dir_path):  # Directory is empty
                            os.rmdir(dir_path)
                    except OSError:
                        pass  # Directory not empty or permission error
        except Exception:
            pass  # Ignore cleanup errors
    
    def get_storage_stats(self) -> dict:
        """
        Get storage statistics for the upload folder.
        
        Returns:
            Dict with storage statistics
        """
        total_size = 0
        file_count = 0
        directory_count = 0
        
        try:
            for root, dirs, files in os.walk(self.upload_folder):
                directory_count += len(dirs)
                for file in files:
                    file_path = os.path.join(root, file)
                    try:
                        total_size += os.path.getsize(file_path)
                        file_count += 1
                    except OSError:
                        pass  # File might be deleted or inaccessible
        except Exception:
            pass  # Ignore errors
        
        return {
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'file_count': file_count,
            'directory_count': directory_count,
            'upload_folder': self.upload_folder
        }
    
    def validate_file_integrity(self, file_path: str) -> bool:
        """
        Validate file integrity (basic checks).
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if file appears to be valid
        """
        try:
            if not os.path.exists(file_path):
                return False
            
            # Check file size
            if os.path.getsize(file_path) == 0:
                return False
            
            # For PDF files, check if it starts with PDF header
            if file_path.lower().endswith('.pdf'):
                with open(file_path, 'rb') as f:
                    header = f.read(4)
                    return header == b'%PDF'
            
            return True
            
        except Exception:
            return False
