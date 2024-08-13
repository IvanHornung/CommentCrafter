import config from "@/app/config";

type FetchCommentsProps = {
  user_id: string | null;
  link: string | null;
  numRequestedComments: number;
  pollutionLevel: string | null;
}

export interface CommentData {
  comment: string;
  relevancy_score: number;
  offensivity_score: number;
  timestamp: string;
}

export interface PollResponse {
  status: string;
  new_comments: CommentData[];
  total_comments: number;
}


/**
 * Fetch the first page of comments from the API and obtain job ID.
 * @param {strnig} user_id - firestore UID of active user
 * @param {string} productLink - The link to the product.
 * @param {number} numCommentsFirstPage - The number of comments per page.
 * @param {string} pollutionLevel - The pollution level.
 */
export async function fetchInitialComments({
  user_id,
  link,
  numRequestedComments,
  pollutionLevel,
}: FetchCommentsProps): Promise<{ comments: CommentData[]; productID: string | null }> {
  console.log(`Fetching ${numRequestedComments} comments for user ${user_id} for link ${link} at pollution level ${pollutionLevel}...`);

  try {
    const response = await fetch(`${config.api_url}/gen/generate-comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        link,
        numRequestedComments,
        pollutionLevel,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate comments");
    }

    const result = await response.json();

    // Assuming the backend returns a structure like:
    // {
    //   status: "success",
    //   product_id: "some-product-id",
    //   initial_comments: ["Comment 1", "Comment 2", ...]
    // }
    const comments = result.initial_comments || [];
    const productID = result.product_id || null;

    console.log(`Successfully fetched initial ${Math.min(numRequestedComments, 50)} for product ${productID}: ${comments}`);
    return { comments, productID };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function pollForRemainingComments(
  userId: string,
  productId: string,
  lastCommentTimestamp: string | null,
  interval: number = 5000, // Polling interval in milliseconds
  maxAttempts: number = 20 // Maximum number of polling attempts
): Promise<CommentData[]> {
  
  console.log(`Polling for product ${productId}...`);
  let allComments: CommentData[] = [];
  let attempts = 0;
  let shouldContinue = true;

  while (shouldContinue && attempts < maxAttempts) {
    try {
      const url = new URL(`${config.api_url}/gen/poll-comments`);
      url.searchParams.append("user_id", userId);
      url.searchParams.append("product_id", productId);
      if (lastCommentTimestamp)
        url.searchParams.append("last_comment_timestamp", lastCommentTimestamp)

      const response = await fetch(url.toString())   

      if (!response.ok) {
          throw new Error(`Polling failed with status: ${response.status}`);
      }

      const data: PollResponse = await response.json();

      if (data.status === "success" && data.new_comments.length > 0) {
          allComments = allComments.concat(data.new_comments);

          // Update the last comment timestamp to the latest one
          lastCommentTimestamp = data.new_comments[data.new_comments.length - 1].timestamp;
          console.log(`Successfully polled and retrieved ${data.new_comments.length} more comments from backend!`);
      } else {
          // If no new comments are found, stop polling
          shouldContinue = false;
          console.log(`Retrieved no new comments from polling, polling stopped.`);
      }
    } catch (error) {
        console.error("Error while polling for comments:", error, attempts);
        shouldContinue = false;
    }

    attempts += 1;

    if (shouldContinue) {
        // Wait for the specified interval before polling again
        await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  return allComments;
}

