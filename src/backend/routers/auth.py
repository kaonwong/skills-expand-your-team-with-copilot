"""
Authentication endpoints for the High School Management System API
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import hashlib
from pydantic import BaseModel

from ..database import teachers_collection, students_collection, hash_password, verify_password, generate_reset_token, store_reset_token, validate_reset_token, clear_reset_token

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# Pydantic models for request bodies
class StudentRegistration(BaseModel):
    email: str
    first_name: str
    last_name: str
    password: str
    grade: str
    phone: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str

class StudentLogin(BaseModel):
    email: str
    password: str

def hash_password_legacy(password):
    """Hash password using SHA-256 (for legacy teacher accounts)"""
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/login")
def login(username: str, password: str) -> Dict[str, Any]:
    """Login a teacher account"""
    # Hash the provided password
    hashed_password = hash_password_legacy(password)
    
    # Find the teacher in the database
    teacher = teachers_collection.find_one({"_id": username})
    
    if not teacher or teacher["password"] != hashed_password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Return teacher information (excluding password)
    return {
        "username": teacher["username"],
        "display_name": teacher["display_name"],
        "role": teacher["role"],
        "user_type": "teacher"
    }

@router.post("/student-login")
def student_login(login_data: StudentLogin) -> Dict[str, Any]:
    """Login a student account"""
    # Find the student in the database
    student = students_collection.find_one({"_id": login_data.email})
    
    if not student:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, student["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Return student information (excluding password)
    return {
        "email": login_data.email,
        "first_name": student["first_name"],
        "last_name": student["last_name"],
        "grade": student["grade"],
        "phone": student["phone"],
        "user_type": "student"
    }

@router.post("/register")
def register_student(student_data: StudentRegistration) -> Dict[str, Any]:
    """Register a new student account"""
    # Check if student already exists
    existing_student = students_collection.find_one({"_id": student_data.email})
    if existing_student:
        raise HTTPException(status_code=400, detail="Student with this email already exists")
    
    # Validate email domain
    if not student_data.email.endswith("@mergington.edu"):
        raise HTTPException(status_code=400, detail="Email must be from mergington.edu domain")
    
    # Hash password
    hashed_password = hash_password(student_data.password)
    
    # Create student document
    student_doc = {
        "_id": student_data.email,
        "first_name": student_data.first_name,
        "last_name": student_data.last_name,
        "password": hashed_password,
        "grade": student_data.grade,
        "phone": student_data.phone
    }
    
    # Insert student
    students_collection.insert_one(student_doc)
    
    # Return success response
    return {
        "message": "Student registered successfully",
        "email": student_data.email,
        "first_name": student_data.first_name,
        "last_name": student_data.last_name
    }

@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest) -> Dict[str, Any]:
    """Request password reset token"""
    # Check if student exists
    student = students_collection.find_one({"_id": request.email})
    if not student:
        # Don't reveal whether email exists or not for security
        return {"message": "If the email exists, a reset token will be sent"}
    
    # Generate reset token
    token = generate_reset_token()
    store_reset_token(request.email, token)
    
    # In a real application, you would send this token via email
    # For demo purposes, we'll return it in the response
    return {
        "message": "Password reset token generated",
        "token": token,  # In production, don't return this - send via email
        "note": "In production, this token would be sent to your email"
    }

@router.post("/reset-password")
def reset_password(reset_data: PasswordReset) -> Dict[str, Any]:
    """Reset password using token"""
    # Validate token
    email = validate_reset_token(reset_data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Hash new password
    hashed_password = hash_password(reset_data.new_password)
    
    # Update student password
    result = students_collection.update_one(
        {"_id": email},
        {"$set": {"password": hashed_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    # Clear the used token
    clear_reset_token(reset_data.token)
    
    return {"message": "Password reset successfully"}

@router.get("/check-session")
def check_session(username: str) -> Dict[str, Any]:
    """Check if a session is valid by username"""
    teacher = teachers_collection.find_one({"_id": username})
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return {
        "username": teacher["username"],
        "display_name": teacher["display_name"],
        "role": teacher["role"],
        "user_type": "teacher"
    }

@router.get("/check-student-session")
def check_student_session(email: str) -> Dict[str, Any]:
    """Check if a student session is valid by email"""
    student = students_collection.find_one({"_id": email})
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return {
        "email": email,
        "first_name": student["first_name"],
        "last_name": student["last_name"],
        "grade": student["grade"],
        "phone": student["phone"],
        "user_type": "student"
    }