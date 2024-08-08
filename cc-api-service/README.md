# Firestore Data Schema

```
users (collection)
├── user_id (document)
│   ├── email: <email>
│   ├── pfp: <profile_picture>
│   └── products (subcollection)
│       ├── product_id (document)
│       │   ├── url: <url>
│       │   └── generated_comments (subcollection)
│       │       ├── comment_id (document)
│       │       │   ├── comment: <comment>
│       │       │   ├── rel_score: <relevance_score>
│       │       │   ├── off_score: <offensiveness_score>
│       │       │   └── timestamp: <timestamp>
```

_commend_id_ stored as document because lists are generally inefficient with scaling in a key-value DB.

## Preliminary JSON Representation of DB Schema

```json
{
  "users": {
    "userID1": {
      "email": "user1@example.com",
      "pfp": "profile_picture_url_1",
      "products": {
        "productID1": {
          "url": "product_url_1",
          "generated_comments": {
            "commentID1": {
              "comment": "Great product!",
              "rel_score": 9.5,
              "off_score": 0.0,
              "timestamp": "2024-08-07T12:34:56Z"
            },
            "commentID2": {
              "comment": "Not satisfied with the quality.",
              "rel_score": 5.0,
              "off_score": 0.1,
              "timestamp": "2024-08-07T13:45:12Z"
            }
          }
        }
      }
    }
  }
}
```

# Current Data Model

### **Users**
- `user_id` : string - Firebase-generated unique identifier of same value as document. Storing it within the document improves consistency, redundancy, and paves an easier path for querying.
- `username` : string - represents readable identifier of the user account, which is the user's **email address** with Google auth.
    - named username in case I add any other authentication providers which don't represent the user's email
- `pfp` : string - link to the image source URL of the user's profile picture (if any)
- `total_generations` : int - indicates how many total comments the user generated
    - can be verified with SUM(products.num_comments)
- `created_at` : Timestamp - indicated date and time when the use registered the account onto the CommentCrafter site
- `last_login` : Timestamp - track when the user last visited the site for potential analytics purposes.
- **`products`** : Subcollection - set of product documents the user produced

### **Products**
- `url` : string - link to the user-inputted product
- `product_name` : string - LLM-generated assumption of the product name 
- `description` : string - short LLM-generated paragraph describing the product
- `total_comments` : int - number of comments the user has generated for this specific product
    - can verify this by running COUNT(generated_comments)
- `est_price` : int - estimated price the product is selling for, to be utilized for comment generation
- **`generated_comments`** - Subcollection - set of LLM-generated comments by this user for this product/link


### **Generated_Comments**
- `comment` : string - LLM-generated comment text
- `relevancy_score` : double - [0,10] rating of how relevant the LLM finds this comment in relation to the product in question
- `offensivity_score` : double - [0,10] rating of how offensive the LLM finds this comment in relation to the product in question
- `timestamp` - Timestamp : date and time of the comment's generation

# Future Expansion to Data Store

Since its easy to add fields in Firebase given its schemaless nature, I will refrain from adding the below fields until I find the need to do so.

**Users**
- `preferences`
    - `req_comments`
    - `export_format`
    - `pollution_level`

**Generated_Comments**
- `generated_by` - gemini + project_version (keep in mind training is going to be added later to make it better)
