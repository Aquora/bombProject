from google import genai
from google.genai import types
from pydantic import BaseModel
import pathlib
import json



client = genai.Client(api_key = "AIzaSyBnqRQCzHgJU9l7tDBBTB-fLbLU_1yPkuQ")

filepath = pathlib.Path('uploads/file.pdf')

prompt = """Create a google classroom shell with the information from the given syallbus. 
In this classroom should be
1) assignments: name, description, due date
2) exams: name, description, due date
3) lecture: name, description
4) external material: contact information, course expectations, grading scale

I will ask to modify the information"""

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