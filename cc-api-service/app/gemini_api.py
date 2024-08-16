import requests
import os
import json
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from datetime import datetime

def write_to_file(prompt, response):
  cleaned_response = response.text.strip("```json").strip("```").strip()

  # Convert the cleaned response to a dictionary
  try:
      response_json = json.loads(cleaned_response)
  except json.JSONDecodeError:
      # If the response isn't JSON, you can keep it as a string
      response_json = {"text": cleaned_response}


  current_dir = os.path.dirname(os.path.abspath(__file__))
  output_folder = os.path.join(current_dir, '..', 'gemini_outputs')
  os.makedirs(output_folder, exist_ok=True)
  
  filename = f"output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
  filepath = os.path.join(output_folder, filename)
  output_data = {
    "prompt": prompt,
    "response": response_json
  }

  # Write the dictionary to the file
  with open(filepath, 'w') as file:
      json.dump(output_data, file, indent=4)

  print(f"Output saved to {filepath}")


# Gemini configurations
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Create the model
generation_config = {
  "temperature": 2,
  "top_p": 0.95,
  "top_k": 128,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-flash",
  generation_config=generation_config,
  safety_settings= {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
  } # See https://ai.google.dev/gemini-api/docs/safety-settings
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


Your task is to generate 25 "bad" comments simulating what real users would be saying for this product on this site -- but ones we'd want to filter.

Given the data provided, generate:
- 15 comments that are irrelevant to the product.
- 10 comments that may be relevant but are very offensive (e.g. harassment, hate speech, sexually explicit, dangerous)
- 5 comments that are both offensive and irrelevant to the product

In the name of generating UGC data for classification models, them as realistic as possible — misspelling and imperfect punctuation is not common but still present

Return a JSON object with the following defined
- `comment` - the string text of the comment you generated
- `relevancy_score` - a floating point mock score in range [0,10] for how relevant the comment seems to be given the product data above
- `offensivity_score`- a floating point mock score in the range [0,10] for how offensive is
"""

response = chat_session.send_message(prompt)
print(response.text)
write_to_file(prompt, response)