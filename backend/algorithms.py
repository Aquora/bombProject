import os.path
import json
import datetime
from pathlib import Path
import google.auth
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


SCOPES = ["https://www.googleapis.com/auth/classroom.courses",
          "https://www.googleapis.com/auth/classroom.coursework.me",
          "https://www.googleapis.com/auth/classroom.topics",
          "https://www.googleapis.com/auth/classroom.courseworkmaterials",
          "https://www.googleapis.com/auth/classroom.coursework.students"]

TOKEN_FILE = "token.json"
CLIENT_SECRETS_FILE = "credentials.json"

BASE_DIR = Path(__file__).resolve().parent          # .../bombProject/backend
json_path = BASE_DIR / "uploads/Syllabus.json"

#json_path = BASE_DIR / "sampleResponse.json" #testing

llmResponse = None

with open(json_path, "r", encoding="utf-8") as f:
    llmResponse = json.load(f)

courseID = None


def get_credentials():
    """
    This is how your app "remembers" you.
    It reads token.json and validates it.
    If it fails, it will trigger a new login flow.
    Returns credentials object or None if login fails.
    """
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                print("Refreshing expired token...")
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                creds = None
        else:
            creds = None

        if not creds:
            try:
                print("No valid credentials found. Starting new login flow...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    CLIENT_SECRETS_FILE, SCOPES
                )
                # --- FIX: Ask for offline access and consent ---
                # This ensures you get a refresh_token every time.
                creds = flow.run_local_server(
                    port=8000,
                    access_type='offline',
                    prompt='consent'
                )
            except Exception as e:
                print(f"An error occurred during login: {e}")
                return None

        print("Saving credentials to token.json...")
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())
            
    return creds

def createCourse(creds, llmResponse):
    """
    Creates the main course from the ClassInfo block.
    """
    try:
        service = build("classroom", "v1", credentials=creds)
        sub = llmResponse["ClassInfo"]
        course = {
            "name": sub["courseName"],
            "section": sub["CRN"],
            "room": sub["roomNumber"],
            "ownerId": "me",
            "courseState": "PROVISIONED",
        }
        course = service.courses().create(body=course).execute()
        print(f"Course created: {(course.get('name'), course.get('id'))}")
        return course
    except HttpError as error:
        print(f"An error occurred in createCourse: {error}")
        return None

def buildModule(creds, course, llmResponse, i):
    """
    Creates a "Topic" (your 'module') in a specific course.
    """
    try:
        service = build("classroom", "v1", credentials=creds)
        course_id = course.get('id')
        sub = llmResponse["modules"][i]
        topic_details = {
            "name": sub["module_name"]
        }
        new_topic = service.courses().topics().create(
            courseId=course_id,
            body=topic_details
        ).execute()
        print(f"  > Topic '{new_topic.get('name')}' created.")
        return new_topic
    except HttpError as error:
        print(f"An error occurred in buildModule: {error}")
        return None    

def createAssignment(creds, course, llmResponse, type, i, j, topic):
    """
    Creates one assignment or quiz under its topic.
    Uses corrected logic and arguments.
    """
    try:
        service = build("classroom", "v1", credentials=creds)
        course_id = course.get('id')
        sub = llmResponse["modules"][i][type][j]
        
        # 1. Build the main coursework body
        coursework = {
            "title": sub["name"],
            "description": sub["description"],
            "workType": "ASSIGNMENT",
            "topicId": topic.get('topicId'),  # This links it to the Topic
            "state": "DRAFT"
        }
        
        # 2. Safely check for and add the due date
        
        due_date = sub["due_date"]
        if due_date and due_date.get("year") and due_date.get("month") and due_date.get("day"):

            due_date_obj = datetime.date(
                    due_date["year"],
                    due_date["month"],
                    due_date["day"]
                )
            
            if due_date_obj < datetime.date.today():
                print(f"Due Date Found in Syllabus Has Passed for {sub["name"]}. Creating Assignment Without Due Date")
            else:
                coursework["dueDate"] = {
                    "year": due_date["year"],
                    "month": due_date["month"],
                    "day": due_date["day"]
                }
                # Add a default due time (11:59 PM UTC)
                coursework["dueTime"] = {"hours": 23, "minutes": 59, "seconds": 0}
        
        # 3. Create the assignment
        new_assignment = (
            service.courses()
            .courseWork()
            .create(courseId=course_id, body=coursework)
            .execute()
        )
        print(f"    - Assignment/Quiz created: {new_assignment.get('title')}")
        return new_assignment

    except HttpError as error:
        print(f"An error occurred in createAssignment: {error}")
        return None
    except KeyError as e:
        # In case 'name' or 'description' is missing
        print(f"KeyError in createAssignment: {e}")
        return None
    
def createMaterial(creds, course, llmResponse, i, j, topic):
    try:
        service = build("classroom", "v1", credentials=creds)
        course_id = course.get('id')
        sub = llmResponse["modules"][i]["materials"][j]
        
        material_post = {
            "title": sub["name"],
            "description": sub["description"],
            "topicId": topic.get('topicId'),
            "state": "DRAFT"
        }
        new_material = (
            service.courses()
            .courseWorkMaterials()
            .create(courseId=course_id, body=material_post)
            .execute()
        )
    except HttpError as error:
        print(f"An error occurred in createMaterial: {error}")
        return None
    

    
def buildAll(creds, llmResponse, course):
    for i in range(len(llmResponse["modules"]) - 1, -1, -1):
        currTopic = buildModule(creds, course, llmResponse, i)
        for j,temp in enumerate(llmResponse["modules"][i]["assignments"]):
            createAssignment(creds, course, llmResponse, "assignments", i, j, currTopic)
        '''for k,temp in enumerate(llmResponse["modules"][i]["quiz_assignments"]):
            createAssignment(creds, course, llmResponse, "quiz_assignments", i, k, currTopic)'''
        for L,temp in enumerate(llmResponse["modules"][i]["materials"]):
            createMaterial(creds, course, llmResponse, i, L, currTopic)
    print("Class Created Sucessfully! Hopefully :)")