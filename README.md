
![https://cc-web-client-737754814579.us-central1.run.app/](https://i.imgur.com/3ckwLZ8.gif)


### https://cc-web-client-737754814579.us-central1.run.app/


# CommentCrafter

> ### Full-Stack LLM-Powered Training Data Generation Platform

The idea is to use an LLM to generate test/training data for comment filtering on e-commerce sites. Not only do customers wish to see relevant product reviews as part of a good user experience, but there is a present danger in unfiltered comment sections as bad actors can use the platform to communicate and cooperate on illicit activities (e.g. drug dealing, crime organizing). Using an LLM to score each comment is expensive and training data on a newfound website is absent. The purpose of this tool is to provide bulk LLM-generated training data necessary for classification models and other supervised machine learning methods — which are much cheaper for comment filtering than an LLM itself.

After providing the web client with a URL to an online product, the service will produce and provide the requested amount of mock User Generated Content (UGC) coupled with a relevancy and offensiveness scores. Users will also be able to view past queries and export the data for relevant use.


## Tech Stack

- Python
- Flask
- Firebase Firestore
- Firebase Authentication
- Next.js
- TypeScript
- HTML/CSS
- Docker
- Google Cloud Run
- Vertex AI (Gemini API)


![](https://i.imgur.com/rY4EfVb.png)

## Motivation

1. With information-rich sites like Reddit beginning to update their `robots.txt` files to block out AI crawlers and most search engines from accessing its content (unless they pay up), the data needed to train AI models is becoming more unavailable and less democratized. This leaves companies who already have scraped the data (OpenAI, Big Tech) with an even more monopolistic role in the AI market as young and small companies have less data to train on -- not a healthy thing for competition.

2. When browsing through the site for a Youtube channel's clothing line, I saw people using the product comment section to conduct what seemed to be a drug deal. Regardless, it was completely irrelevant to the item listed which isn't healthy for the the integrity of the site and their revenue rates. Without a comment filterer, the site is vulnerable to hosting illicit activities while also suffering worse purchase rates, as customers rely on insightful reviews. A week later, the site had no choice but to remove the comment sections.

Without an adequate comment filterer, small businesses that don't have access to large datasets either suffer the lower purchase rates that come with not having a user comment/review section or find themselves vulnerable to potentially offensive/irrelevant/illicit comments.

## Service

CommentCrafter aims to provide bulk training data needed for training comment filterers. Comment filteres are supervised classification models, which need detailed data for proper training. For the sake of simplicity, classification models run in an efficient `O(n)` time while putting each comment itself through an LLM resembles that of `O(n^2)` time.

Given an proper link input to an e-commerce product, amount of comments you want to generate, and the pollution level (proportion of "bad" data), CommentCrafter uses an LLM to understand the nature of the product being sold and then returns the synthetically generated training data accordingly. This data can then be exported into `json`, `csv`, or `xml` and is archived if the user account wishes to refer to it again.


## Home Page

> __Home Page__: Pre-login
![](https://i.imgur.com/ANqYS4O.png)

> Firebase Auth Login through Google Account
![](https://i.imgur.com/CscAM9B.png)

> __Home page__: logged in, input fields filled and ready for generation
![](https://i.imgur.com/2GdZwAc.png)

> __Generation Results Page__ - product information and generated comments
![](https://i.imgur.com/ZrckO2e.png)

> __Generation Results Page__ - export data feature
![](https://i.imgur.com/lxuVC70.png)

> __Generation History Page__ - list of all past products and their generations
![](https://i.imgur.com/JY2OWli.png)

> __Product Record Page__ - Export all past generated data feature
![](https://i.imgur.com/DBZhXOi.png)