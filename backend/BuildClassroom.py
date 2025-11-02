from algorithms import *

credentials = get_credentials()

course = createCourse(credentials,llmResponse)

buildAll(credentials,llmResponse,course)