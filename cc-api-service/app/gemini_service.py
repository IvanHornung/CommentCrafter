from math import ceil
from typing import Any, Dict, Union
import os
import json
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from google.generativeai.types import generation_types
from datetime import datetime


# TODO: remove this since itll be stored in firestore
absolute_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
current_dir = os.path.dirname(os.path.abspath(__file__))
output_folder = os.path.join(current_dir, '..', 'gemini_outputs')
os.makedirs(output_folder, exist_ok=True)

# TODO: delete before deployment
def _log_response_to_file(prompt_type, prompt, response_json):
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

print("Configuring API...")
_configure_gemini_api()

# Create the model
generation_config = {
  "temperature": 2,
  "top_p": 0.95,
  "top_k": 128,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

print("Instantiating model...")
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


def _create_comment_generation_prompt(
    pollution_level: str,
    num_comments_requested: int, 
    product_info_dict,
):
    pollution_map = {
      "LOW": 0.2,
      "MODERATE": 0.4,
      "HIGH": 0.8
    }
    
    # map str.upper to percentage
    percent_polluted = pollution_map[pollution_level.upper()]

    # apply percentage to comments requested
    num_polluted = ceil(num_comments_requested * percent_polluted)
    sub_pollution_distr = num_polluted/3

    num_clean = num_comments_requested - num_polluted


    # TODO: provide a few example comments if needs more fine-tuning
    return \
f"""
Given the following product information
{json.dumps(product_info_dict, indent=4)}

Generate {num_clean} "good" comments that are relevant and unproblematic

Then, generate {num_polluted} "bad" comments simulating real users would be saying for this product on this site -- but ones we want to filter out.
- {int(ceil(sub_pollution_distr))} comments that are irrelevant to the product
- {int(sub_pollution_distr)} comments that may be relevant to the product but are very offensive 
- {int(sub_pollution_distr)} comments that are both irrelevant and offensive to the product

Ensure comments appear as if written by different users with varied styles, tones, and levels of knowledge. Include minor grammar and spelling errors here and there. 
Limit the use of exclamation marks and other emphasis characters, and keep in mind only some 40% of comments end with periods online. 

For the offensive comments, make them very offensive (e.g. harassment, hate speech, sexually explicit, dangerous)

Return a JSON object with:
- `comment`: The string text of the comment.
- `relevancy_score`: A floating point score between [0,10] for how relevant the comment is given the product data.
- `offensivity_score`: A floating point score between [0,10] for how offensive the comment is.
"""


def _convert_to_json(response: generation_types.GenerateContentResponse):
    # Start by cleaning the response text to remove any potential Markdown code blocks
    cleaned_response = response.text.strip()
    
    # Handle multiple potential JSON outputs
    if cleaned_response.startswith("```json"):
        # Remove the leading and trailing Markdown code block
        cleaned_response = cleaned_response.strip("```json").strip("```").strip()

    try:
        response_json = json.loads(cleaned_response)
    except json.JSONDecodeError as e:
        # If the response isn't JSON, print the error and keep it as a string
        print(f"\t\tAlert: JSON object not found - {e}")
        return [cleaned_response]

    return response_json


def generate_product_info(product_url: str):
    """
    Given a URL, infer the product name, price, and generate a short description.
    """
    prompt = _create_product_info_prompt(product_url)
    chat_session = model.start_chat(history=[])

    response = chat_session.send_message(prompt)
    response_json = _convert_to_json(response)

    _log_response_to_file("product_info", prompt, response_json)

    return response_json


def generate_mock_comments(product_info_dict, pollution_level, num_to_generate):
    """
    Given the product info previously genererated, the requested pollution level, and the number of comments
    the user wishes to generated, return the list of mock UGC comments with relevancy and offensivity scores.
    """
    prompt = _create_comment_generation_prompt(
      pollution_level=pollution_level,
      product_info_dict=product_info_dict,
      num_comments_requested=num_to_generate
    )

    chat_session = model.start_chat(history=[])

    response = chat_session.send_message(prompt)
    response_json = _convert_to_json(response)

    _log_response_to_file("mock_comments", prompt, response_json)

    return response_json
