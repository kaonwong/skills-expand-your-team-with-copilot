# Mergington High School Activities

A comprehensive web application built with FastAPI and MongoDB that allows students to view and sign up for extracurricular activities at Mergington High School.

## Technology Stack

- **Backend**: FastAPI (Python web framework)
- **Database**: MongoDB with collections for activities and teacher accounts
- **Frontend**: HTML, CSS, and JavaScript (served as static files)
- **Authentication**: Secure teacher/admin login with Argon2 password hashing

## Features

### Student Features
- Browse all available extracurricular activities with detailed information
- Advanced search functionality by activity name
- Multi-level filtering system:
  - **Category filters**: Sports, Arts, Academic, Community, Technology
  - **Day filters**: Monday through Sunday, or view all days
  - **Time filters**: Before School, After School, Weekend activities
- Real-time capacity tracking showing available spots
- Simple email-based registration for activities
- Responsive design for mobile and desktop

### Teacher/Admin Features
- Secure authentication system with role-based access
- Session management for teachers and administrators
- Student registration oversight and management

### Activity Management
- Comprehensive activity database with 13+ diverse programs including:
  - **Sports**: Soccer Team, Basketball Team, Morning Fitness
  - **Academic**: Chess Club, Math Club, Programming Class, Debate Team
  - **Arts**: Art Club, Drama Club
  - **Special Programs**: Weekend Robotics Workshop, Science Olympiad, Manga Maniacs
- Detailed scheduling with day/time specifications
- Participant capacity limits and enrollment tracking
- Rich activity descriptions and requirements

## API Endpoints

The application provides a RESTful API for frontend-backend communication:

### Activities Endpoints
- `GET /activities` - Retrieve all activities with optional filtering
  - Query parameters: `day`, `start_time`, `end_time`
- `GET /activities/days` - Get list of available activity days
- `POST /activities/{activity_name}/signup` - Register student for an activity

### Authentication Endpoints  
- `POST /auth/login` - Teacher/admin login with username and password
- `GET /auth/check-session` - Validate existing session

### Interactive API Documentation
- Available at `/docs` when running the server
- Comprehensive testing interface for all endpoints

## For Teachers: Requesting Changes

Teachers can easily request changes to the system using our structured issue templates. No technical knowledge required!

**[📝 Request Changes Here](../../issues/new/choose)** - Choose from:
- 🚀 **Feature Request** - Add new functionality
- 🎨 **UI/UX Enhancement** - Visual design changes  
- 🐛 **Bug Report** - Fix broken functionality
- 🏫 **Activity Management** - Add/modify/remove activities
- 📝 **Content Update** - Update text and descriptions

📚 **[Issue Templates Guide](../docs/issue-templates-guide.md)** - Learn how to use the templates effectively

## Development Guide

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).

### Quick Start
1. **Prerequisites**: The application requires MongoDB to be running locally
2. **Installation**: `pip install -r requirements.txt`
3. **Running**: `uvicorn src.app:app --reload` (from project root)
4. **Access**: Visit `http://localhost:8000` for the application
5. **API Docs**: Visit `http://localhost:8000/docs` for interactive API documentation

### Database Structure
- **Activities Collection**: Stores activity details, schedules, and participant lists
- **Teachers Collection**: Manages teacher accounts with secure password hashing
- **Sample Data**: Automatically populated on first run for development

### Teacher Login Credentials (Development)
- **Ms. Rodriguez**: `mrodriguez` / `art123` (Teacher)
- **Mr. Chen**: `mchen` / `chess456` (Teacher)  
- **Principal Martinez**: `principal` / `admin789` (Administrator)
