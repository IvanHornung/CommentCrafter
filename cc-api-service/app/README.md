# `gemini_api.py` 

## Parameters

### `top_k`

Changes how the model selects tokens for output. A `top_k` of 1 means the next selected token is the most probable among all the tokens in the model's vocabulary (also called greedy encoding), while a top-K of 3 means that the next token is selected from the three most probable tokens by using temperature

- For each token selection step, the top-K tokens with the highest probabilities are sampled
- Then, tokens are further filtered based on top-P with the final token selected using temperature sampling

_Specifiy a lower value for less random responses and a higher value for more random responses_

### `top_p` (nucleus sampling)

Changes how the model selects tokens for output. Tokens are selected from the most (see top-K) to least probable until the sum of their probabilities equals the `top_p` value.
- Example: If tokens A, B, and C have a probability of 0.3, 0.2, and 0.1 and the top-P value is 0.5, then the model will select either A or B as the next token by using temperature and excludes C as a candidate

_Specify a lower value for less random responses and a higher value for more random responses_

