import requests
import os
import json
import google.generativeai as genai

# Gemini configurations
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Create the model
generation_config = {
  "temperature": 2,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-flash",
  generation_config=generation_config,
  # TODO: adjust safety settings for generating offensive content
  # safety_settings = Adjust safety settings
  # See https://ai.google.dev/gemini-api/docs/safety-settings
)

chat_session = model.start_chat(
  history=[]
)

prompt = """
Given the following product information:
{
  "link":	"https://store.hermanmiller.com/living-room-furniture-lounge-chairs-ottomans/eames-lounge-chair-and-ottoman/100198660.html",
  "product_name": "Eames Lounge Chair and Ottoman",
  "description": "The Eames Lounge Chair and Ottoman is an iconic piece of mid-century modern furniture known for its comfort and design.  It features luxurious leather upholstery, a contoured seat and back, and a swivel base. The ottoman complements the chair perfectly.",
  "est_price": 8000
}

Generate 15 comments that are relevant and unproblematic, 3 that are offensive but still relevant, 5 that are irrelevant but not that offensive, and 2 that are offensive and irrelevant.

Make them as realistic as possible — misspelling and imperfect punctuation is not common but not impossible

Return a JSON object with the following defined
- `comment` - the string text of the comment you generated
- `relevancy_score` - a floating point mock score in range [0,10] for how relevant the comment seems to be given the product data above
- `offensivity_score`- a floating point mock score in the range [0,10] for how offensive is
"""

response = chat_session.send_message(prompt)
print(response.text)

# print(generate_content_with_gemini(prompt))


'''Test
/home/ivan/projects/CommentCrafter/.venv/bin/python /home/ivan/projects/CommentCrafter/cc-api-service/app/gemini_api.py

curl \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Explain how AI works"}]}]}' \
  -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=INSERT_KEY_HERE'
'''