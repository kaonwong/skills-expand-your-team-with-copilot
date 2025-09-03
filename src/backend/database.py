"""
In-memory database configuration for Mergington High School API
All data is stored in memory and will be reset when the server restarts.
"""

from argon2 import PasswordHasher

# Use in-memory storage instead of MongoDB
activities_data = {}
teachers_data = {}
students_data = {}
password_reset_tokens = {}  # Store password reset tokens temporarily

# Simple in-memory collections simulation
class InMemoryCollection:
    def __init__(self, data_dict):
        self.data = data_dict
    
    def find(self, query=None):
        """Find documents matching query"""
        if not query:
            # Return all documents with _id as the key
            for key, value in self.data.items():
                doc = value.copy()
                doc['_id'] = key
                yield doc
        else:
            # Simple query implementation
            for key, value in self.data.items():
                if self._matches_query(value, query):
                    doc = value.copy()
                    doc['_id'] = key
                    yield doc
    
    def find_one(self, query):
        """Find one document matching query"""
        if isinstance(query, dict) and '_id' in query:
            # Direct lookup by _id
            key = query['_id']
            if key in self.data:
                doc = self.data[key].copy()
                doc['_id'] = key
                return doc
            return None
        
        # Search through documents
        for doc in self.find(query):
            return doc
        return None
    
    def update_one(self, query, update):
        """Update one document"""
        if isinstance(query, dict) and '_id' in query:
            key = query['_id']
            if key in self.data:
                if '$push' in update:
                    for field, value in update['$push'].items():
                        if field in self.data[key]:
                            self.data[key][field].append(value)
                        else:
                            self.data[key][field] = [value]
                elif '$pull' in update:
                    for field, value in update['$pull'].items():
                        if field in self.data[key] and value in self.data[key][field]:
                            self.data[key][field].remove(value)
                elif '$set' in update:
                    for field, value in update['$set'].items():
                        self.data[key][field] = value
                return type('UpdateResult', (), {'modified_count': 1})()
        return type('UpdateResult', (), {'modified_count': 0})()
    
    def insert_one(self, document):
        """Insert a new document"""
        if '_id' in document:
            key = document['_id']
            doc = document.copy()
            del doc['_id']
            self.data[key] = doc
            return type('InsertResult', (), {'inserted_id': key})()
        return None
    
    def aggregate(self, pipeline):
        """Simple aggregation pipeline"""
        # For getting unique days from schedule_details.days
        if len(pipeline) == 2 and '$unwind' in pipeline[0] and '$group' in pipeline[1]:
            days = set()
            for value in self.data.values():
                if 'schedule_details' in value and 'days' in value['schedule_details']:
                    days.update(value['schedule_details']['days'])
            return [{'_id': day} for day in sorted(days)]
        return []
    
    def _matches_query(self, doc, query):
        """Simple query matching"""
        for key, condition in query.items():
            if key.startswith('schedule_details.'):
                field_path = key.split('.')
                if len(field_path) == 2:
                    nested_field = field_path[1]
                    if 'schedule_details' not in doc or nested_field not in doc['schedule_details']:
                        return False
                    
                    value = doc['schedule_details'][nested_field]
                    if isinstance(condition, dict):
                        if '$in' in condition:
                            if value not in condition['$in']:
                                return False
                        elif '$gte' in condition:
                            if value < condition['$gte']:
                                return False
                        elif '$lte' in condition:
                            if value > condition['$lte']:
                                return False
                    elif value != condition:
                        return False
            elif key in doc:
                if doc[key] != condition:
                    return False
            else:
                return False
        return True

# Create in-memory collections
activities_collection = InMemoryCollection(activities_data)
teachers_collection = InMemoryCollection(teachers_data)
students_collection = InMemoryCollection(students_data)

# Methods
def hash_password(password):
    """Hash password using Argon2"""
    ph = PasswordHasher()
    return ph.hash(password)

def verify_password(password, hashed_password):
    """Verify password against hash"""
    ph = PasswordHasher()
    try:
        return ph.verify(hashed_password, password)
    except:
        return False

def generate_reset_token():
    """Generate a random reset token"""
    import secrets
    return secrets.token_urlsafe(32)

def store_reset_token(email, token):
    """Store password reset token with expiration"""
    import time
    password_reset_tokens[token] = {
        'email': email,
        'expires': time.time() + 3600  # 1 hour expiration
    }
    return token

def validate_reset_token(token):
    """Validate and return email for reset token"""
    import time
    if token in password_reset_tokens:
        token_data = password_reset_tokens[token]
        if time.time() < token_data['expires']:
            return token_data['email']
        else:
            # Token expired, remove it
            del password_reset_tokens[token]
    return None

def clear_reset_token(token):
    """Clear used reset token"""
    if token in password_reset_tokens:
        del password_reset_tokens[token]

def init_database():
    """Initialize database if empty"""
    if not activities_data:
        activities_data.update(initial_activities)
    
    if not teachers_data:
        for teacher in initial_teachers:
            username = teacher.pop('username')
            teachers_data[username] = teacher
    
    if not students_data:
        for student in initial_students:
            email = student.pop('email')
            students_data[email] = student

# Initial database data
initial_activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Mondays and Fridays, 3:15 PM - 4:45 PM",
        "schedule_details": {
            "days": ["Monday", "Friday"],
            "start_time": "15:15",
            "end_time": "16:45"
        },
        "max_participants": 12,
        "participants": ["alex@mergington.edu", "sarah@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 7:00 AM - 8:00 AM",
        "schedule_details": {
            "days": ["Tuesday", "Thursday"],
            "start_time": "07:00",
            "end_time": "08:00"
        },
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Morning Fitness": {
        "description": "Early morning physical training and exercises",
        "schedule": "Mondays, Wednesdays, Fridays, 6:30 AM - 7:45 AM",
        "schedule_details": {
            "days": ["Monday", "Wednesday", "Friday"],
            "start_time": "06:30",
            "end_time": "07:45"
        },
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 5:30 PM",
        "schedule_details": {
            "days": ["Tuesday", "Thursday"],
            "start_time": "15:30",
            "end_time": "17:30"
        },
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and compete in basketball tournaments",
        "schedule": "Wednesdays and Fridays, 3:15 PM - 5:00 PM",
        "schedule_details": {
            "days": ["Wednesday", "Friday"],
            "start_time": "15:15",
            "end_time": "17:00"
        },
        "max_participants": 15,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and prepare for math competitions",
        "schedule": "Tuesdays, 7:15 AM - 8:00 AM",
        "schedule_details": {
            "days": ["Tuesday"],
            "start_time": "07:15",
            "end_time": "08:00"
        },
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 3:30 PM - 5:30 PM",
        "schedule_details": {
            "days": ["Friday"],
            "start_time": "15:30",
            "end_time": "17:30"
        },
        "max_participants": 12,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore various art techniques and create masterpieces",
        "schedule": "Thursdays, 3:15 PM - 5:00 PM",
        "schedule_details": {
            "days": ["Thursday"],
            "start_time": "15:15",
            "end_time": "17:00"
        },
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 3:30 PM - 5:30 PM",
        "schedule_details": {
            "days": ["Monday", "Wednesday"],
            "start_time": "15:30",
            "end_time": "17:30"
        },
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Weekend Robotics Workshop": {
        "description": "Build and program robots in our state-of-the-art workshop",
        "schedule": "Saturdays, 10:00 AM - 2:00 PM",
        "schedule_details": {
            "days": ["Saturday"],
            "start_time": "10:00",
            "end_time": "14:00"
        },
        "max_participants": 15,
        "participants": ["ethan@mergington.edu", "oliver@mergington.edu"]
    },
    "Science Olympiad": {
        "description": "Weekend science competition preparation for regional and state events",
        "schedule": "Saturdays, 1:00 PM - 4:00 PM",
        "schedule_details": {
            "days": ["Saturday"],
            "start_time": "13:00",
            "end_time": "16:00"
        },
        "max_participants": 18,
        "participants": ["isabella@mergington.edu", "lucas@mergington.edu"]
    },
    "Sunday Chess Tournament": {
        "description": "Weekly tournament for serious chess players with rankings",
        "schedule": "Sundays, 2:00 PM - 5:00 PM",
        "schedule_details": {
            "days": ["Sunday"],
            "start_time": "14:00",
            "end_time": "17:00"
        },
        "max_participants": 16,
        "participants": ["william@mergington.edu", "jacob@mergington.edu"]
    },
    "Manga Maniacs": {
        "description": "Dive into epic adventures, supernatural powers, and unforgettable characters! Discover the incredible world of Japanese manga where every page bursts with stunning art and captivating storytelling. From shonen battles to slice-of-life moments, unleash your imagination and connect with fellow manga enthusiasts!",
        "schedule": "Tuesdays, 7:00 PM - 8:00 PM",
        "schedule_details": {
            "days": ["Tuesday"],
            "start_time": "19:00",
            "end_time": "20:00"
        },
        "max_participants": 15,
        "participants": []
    }
}

initial_teachers = [
    {
        "username": "mrodriguez",
        "display_name": "Ms. Rodriguez",
        "password": hash_password("art123"),
        "role": "teacher"
     },
    {
        "username": "mchen",
        "display_name": "Mr. Chen",
        "password": hash_password("chess456"),
        "role": "teacher"
    },
    {
        "username": "principal",
        "display_name": "Principal Martinez",
        "password": hash_password("admin789"),
        "role": "admin"
    }
]

initial_students = [
    {
        "email": "alex@mergington.edu",
        "first_name": "Alex",
        "last_name": "Smith",
        "password": hash_password("student123"),
        "grade": "10",
        "phone": "555-0101"
    },
    {
        "email": "sarah@mergington.edu",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "password": hash_password("student456"),
        "grade": "11",
        "phone": "555-0102"
    },
    {
        "email": "emma@mergington.edu",
        "first_name": "Emma",
        "last_name": "Williams",
        "password": hash_password("student789"),
        "grade": "12",
        "phone": "555-0103"
    }
]
