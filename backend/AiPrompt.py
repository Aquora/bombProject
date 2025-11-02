from google import genai
from google.genai import types
from pydantic import BaseModel
import pathlib
import json


client = genai.Client(api_key = "AIzaSyBnqRQCzHgJU9l7tDBBTB-fLbLU_1yPkuQ")

filepath = pathlib.Path('uploads/file.pdf')

prompt = """
Convert this into a json file with different modulus and lists with objects 
sort by module. each module has a name and a list of assignments, quiz assignments,materials subrooted, do not need to cite

1) Extract the course name, CRN, and room number for the ClassInfo object.
2) Organize the course schedule into a list of modules (e.g., by week or by topic).
3) Populate the assignments array with all homework and projects.
4) Populate the quiz_assignments array with all midterms, quizzes, and exams.
5) Populate the materials array with lecture topics, instructor information, and other resources."

This is a template that I want you to follow:
{
  "ClassInfo": {
    "courseName": "Course Name Here",
    "CRN": "CRN Here",
    "roomNumber": "Room Number Here"
  },
  "modules": [
    {
      "module_name": "Module 1 Name (e.g., 'Week 1' or 'Introduction')",
      "assignments": [
        {
          "name": "Assignment 1 Name",
          "description": "Description of the assignment.",
          "due_date": {
            "year": 2024,
            "month": 9,
            "day": 1
          }
        }
      ],
      "quiz_assignments": [
        {
          "name": "Quiz 1 Name",
          "description": "Description of the quiz or exam.",
          "due_date": {
            "year": 2024,
            "month": 9,
            "day": 5
          }
        }
      ],
      "materials": [
        {
          "name": "Material 1 Name (e.g., 'Lecture 1')",
          "description": "Description of the lecture, reading, or resource."
        },
        {
          "name": "Material 2 Name (e.g., 'Instructor Info')",
          "description": "Contact details, office hours, etc."
        }
      ]
    },
    {
      "module_name": "Module 2 Name (e.g., 'Week 2')",
      "assignments": [
        {
          "name": "Assignment 2 Name",
          "description": "Description of the assignment.",
          "due_date": {
            "year": 2024,
            "month": null,
            "day": null
          }
        }
      ],
      "quiz_assignments": [],
      "materials": [
        {
          "name": "Material 3 Name",
          "description": "Description of the resource."
        }
      ]
    }
  ]
}
"""

response = client.models.generate_content(
  model="gemini-2.5-pro",
  config={
        "response_mime_type": "application/json",
    },
  contents=[
      types.Part.from_bytes(
        data=filepath.read_bytes(),
        mime_type='application/pdf',
      ),
      prompt])

try:
    payload = json.loads(response.text or "")
except json.JSONDecodeError:
    # Fallback: wrap raw text so you still get a valid JSON file
    payload = {"raw": response.text}

out_path = pathlib.Path("uploads/Syllabus.json")
out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Saved to {out_path.resolve()}")