from typing import Any, Dict, Union
import requests
import os
import json
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from google.generativeai.types import generation_types
from datetime import datetime
from .auth import absolute_path


# TODO: remove this since itll be stored in firestore
current_dir = os.path.dirname(os.path.abspath(__file__))
output_folder = os.path.join(current_dir, '..', 'gemini_outputs')
os.makedirs(output_folder, exist_ok=True)

# TODO: delete
def _write_to_file(prompt_type, prompt, response_json):
  filename = f"{prompt_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
  filepath = os.path.join(output_folder, filename)
  output_data = {
    "prompt": prompt,
    "response": response_json
  }

  # Write the dictionary to the file
  with open(filepath, 'w') as file:
      json.dump(output_data, file, indent=4)

  print(f"Output saved to {filepath}")

def _configure_gemini_api():
  # Gemini configurations
  config_path = os.path.join(absolute_path, 'config', 'gemini-api-key.json')
  with open(config_path) as f:
      config = json.load(f)
  API_KEY = config['gemini_api_key']

  genai.configure(api_key=API_KEY)


_configure_gemini_api()

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

# prompt = \
"""
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

# response = chat_session.send_message(prompt)
# print(response.text)
# write_to_file(prompt, response)

def _create_product_info_prompt(product_url):
    return \
f"""
{product_url}

Given the product link above, return a JSON object with the following defined
- `url` - the URL just given to you
- `product_name` - determine the name of the product in the link
- `description` - generate a paragraph describing the product, limit to 200 characters
- `est_price` - floating estimate the USD price the product is selling for

If it appears the user did not enter a link to an e-commerce product, return default values of "INVALID" for all of the fields.
"""
    
def _convert_to_json(response: generation_types.GenerateContentResponse):
    cleaned_response = response.text.strip("```json").strip("```").strip()

    # convert the cleaned response to a dictionary
    try:
        response_json = json.loads(cleaned_response)
    except json.JSONDecodeError:
      # TODO: consider what to do when response isnt JSON. this is a major halt
      # If the response isn't JSON, keep it as a string
      response_json = {"text": cleaned_response}

    return response_json

def generate_product_info(product_url: str):
    """
    Given a URL, infer the product name, price, and generate a short description.
    """
    prompt = _create_product_info_prompt(product_url)
    chat_session = model.start_chat(history=[])

    response = chat_session.send_message(prompt)
    response_json = _convert_to_json(response)

    _write_to_file("product_info", prompt, response_json)

    return response_json


def prompt_gemini_comment_gen(product_info, pollution_level, num_to_generate):
    pass

print(generate_product_info("https://store.hermanmiller.com/living-room-furniture-lounge-chairs-ottomans/eames-lounge-chair-and-ottoman/100198660.html"))