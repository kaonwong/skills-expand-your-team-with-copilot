"""
Mock database for development/testing when MongoDB is not available
"""
from typing import Dict, Any, List, Optional
from argon2 import PasswordHasher

# In-memory storage
activities_data = {}
teachers_data = {}

class MockCollection:
    def __init__(self, data_store):
        self.data_store = data_store
    
    def find(self, query=None):
        """Mock find method"""
        if not query:
            return [{"_id": k, **v} for k, v in self.data_store.items()]
        
        results = []
        for key, value in self.data_store.items():
            match = True
            if query:
                # Handle basic queries for day filtering
                if "schedule_details.days" in query:
                    if "$in" in query["schedule_details.days"]:
                        day_filter = query["schedule_details.days"]["$in"][0]
                        if day_filter not in value.get("schedule_details", {}).get("days", []):
                            match = False
                
                # Handle time filtering
                if "schedule_details.start_time" in query:
                    if "$gte" in query["schedule_details.start_time"]:
                        start_filter = query["schedule_details.start_time"]["$gte"]
                        if start_filter and value.get("schedule_details", {}).get("start_time", "") < start_filter:
                            match = False
                
                if "schedule_details.end_time" in query:
                    if "$lte" in query["schedule_details.end_time"]:
                        end_filter = query["schedule_details.end_time"]["$lte"]
                        if end_filter and value.get("schedule_details", {}).get("end_time", "") > end_filter:
                            match = False
                
                # Handle difficulty filtering
                if "difficulty" in query:
                    activity_difficulty = value.get("difficulty")
                    if "$eq" in query["difficulty"]:
                        if activity_difficulty != query["difficulty"]["$eq"]:
                            match = False
                    elif "$exists" in query["difficulty"]:
                        exists = query["difficulty"]["$exists"]
                        if exists and activity_difficulty is None:
                            match = False
                        elif not exists and activity_difficulty is not None:
                            match = False
                    else:
                        # Direct comparison for simple queries
                        if activity_difficulty != query["difficulty"]:
                            match = False
            
            if match:
                results.append({"_id": key, **value})
        
        return results
    
    def find_one(self, query):
        """Mock find_one method"""
        if "_id" in query:
            key = query["_id"]
            if key in self.data_store:
                return {"_id": key, **self.data_store[key]}
        return None
    
    def update_one(self, filter_query, update_query):
        """Mock update_one method"""
        if "_id" in filter_query:
            key = filter_query["_id"]
            if key in self.data_store:
                if "$push" in update_query:
                    for field, value in update_query["$push"].items():
                        if field not in self.data_store[key]:
                            self.data_store[key][field] = []
                        self.data_store[key][field].append(value)
                        return type('MockResult', (), {'modified_count': 1})()
                elif "$pull" in update_query:
                    for field, value in update_query["$pull"].items():
                        if field in self.data_store[key] and value in self.data_store[key][field]:
                            self.data_store[key][field].remove(value)
                            return type('MockResult', (), {'modified_count': 1})()
        return type('MockResult', (), {'modified_count': 0})()
    
    def insert_one(self, document):
        """Mock insert_one method"""
        doc_id = document.get("_id")
        if doc_id:
            doc_copy = {k: v for k, v in document.items() if k != "_id"}
            self.data_store[doc_id] = doc_copy
        return type('MockResult', (), {'inserted_id': doc_id})()
    
    def count_documents(self, query):
        """Mock count_documents method"""
        return len(self.data_store)
    
    def aggregate(self, pipeline):
        """Mock aggregate method for day filtering"""
        # This is a simplified implementation for the days aggregation
        days = set()
        for activity in self.data_store.values():
            schedule_days = activity.get("schedule_details", {}).get("days", [])
            days.update(schedule_days)
        
        return [{"_id": day} for day in sorted(days)]

# Create mock collections
activities_collection = MockCollection(activities_data)
teachers_collection = MockCollection(teachers_data)

def hash_password(password):
    """Hash password using Argon2"""
    ph = PasswordHasher()
    return ph.hash(password)

def init_database():
    """Initialize database if empty"""
    
    # Initialize activities if empty
    if activities_collection.count_documents({}) == 0:
        for name, details in initial_activities.items():
            activities_collection.insert_one({"_id": name, **details})
            
    # Initialize teacher accounts if empty
    if teachers_collection.count_documents({}) == 0:
        for teacher in initial_teachers:
            teachers_collection.insert_one({"_id": teacher["username"], **teacher})

# Sample activities with some having difficulty levels
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
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
        # No difficulty field - for all levels
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
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        "difficulty": "Beginner"
    },
    "Advanced Programming": {
        "description": "Advanced programming concepts including algorithms and data structures",
        "schedule": "Wednesdays and Fridays, 7:00 AM - 8:00 AM",
        "schedule_details": {
            "days": ["Wednesday", "Friday"],
            "start_time": "07:00",
            "end_time": "08:00"
        },
        "max_participants": 15,
        "participants": ["james@mergington.edu"],
        "difficulty": "Advanced"
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
        # No difficulty field - for all levels
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
        "participants": ["liam@mergington.edu", "noah@mergington.edu"],
        "difficulty": "Intermediate"
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
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
        # No difficulty field - for all levels
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
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"],
        "difficulty": "Beginner"
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
        # No difficulty field - for all levels
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
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"],
        "difficulty": "Advanced"
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
        "participants": ["charlotte@mergington.edu", "amelia@mergington.edu"],
        "difficulty": "Intermediate"
    },
    "Weekend Robotics Workshop": {
        "description": "Build and program robots in weekend workshops",
        "schedule": "Sundays, 2:00 PM - 5:00 PM",
        "schedule_details": {
            "days": ["Sunday"],
            "start_time": "14:00",
            "end_time": "17:00"
        },
        "max_participants": 16,
        "participants": ["william@mergington.edu", "jacob@mergington.edu"],
        "difficulty": "Advanced"
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
        # No difficulty field - for all levels
    }
}

initial_teachers = [
    {
        "username": "jsmith",
        "display_name": "Mr. Smith",
        "password": hash_password("teacher123"),
        "role": "teacher"
    },
    {
        "username": "ajohnson",
        "display_name": "Ms. Johnson",
        "password": hash_password("science456"),
        "role": "teacher"
    },
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