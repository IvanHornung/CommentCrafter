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

export interface ProductData {
  product_name: string;
  description: string;
  product_price: string;
  canonicalized_url: string;
}

export interface ProductRecordData {
  product_name: string;
  description: string;
  product_price: string;
  canonicalized_url: string;
  total_comments: number;
  total_gen_requests: number;
  gen_req_list: GenReq[];
}

export interface PollResponseCommentGen {
  status: string;
  new_comments: CommentData[];
  total_comments: number;
}

export interface GenReq {
  num_comments_generated: number;
  pollution_level: string;
  request_timestamp: string;
}


/**
 * Fetch the first page of comments from the API and obtain job ID.
 * @param {string} user_id - firestore UID of active user
 * @param {string} productLink - The link to the product.
 * @param {number} numCommentsFirstPage - The number of comments per page.
 * @param {string} pollutionLevel - The pollution level.
 */
export async function triggerCommentsGen({
  user_id,
  link,
  numRequestedComments,
  pollutionLevel,
}: FetchCommentsProps): Promise<{ comments: CommentData[]; productID: string | null; genRequestID: string | null}> {
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

    const comments = result.initial_comments || [];
    const productID = result.product_id || null;
    const genRequestID = result.gen_request_id || null;

    // console.log(`Successfully fetched initial ${Math.min(numRequestedComments, 50)} for product ${productID}: ${comments}`);
    return { comments, productID, genRequestID};
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function pollForGeneratedComments(
  userId: string,
  productId: string,
  genRequestId: string,
  lastCommentTimestamp: string | null,
  interval: number = 5000, // Polling interval in milliseconds
  maxAttempts: number = 20, // Maximum number of polling attempts
  updateComments: (newComments: CommentData[]) => void // Callback to update comments
): Promise<CommentData[]> {
  
  console.log(`Polling for product ${productId} Req #${genRequestId}...`);
  let allComments: CommentData[] = [];
  // let attempts = 0;
  let shouldContinue = true;

  while (shouldContinue) {// && attempts < maxAttempts) {
    try {
      const url = new URL(`${config.api_url}/gen/poll-comments`);
      url.searchParams.append("user_id", userId);
      url.searchParams.append("product_id", productId);
      url.searchParams.append("gen_request_id", genRequestId);
      if (lastCommentTimestamp)
        url.searchParams.append("last_comment_timestamp", lastCommentTimestamp)

      const response = await fetch(url.toString())   

      if (!response.ok) {
          throw new Error(`Polling failed with status: ${response.status}`);
      }

      const data: PollResponseCommentGen = await response.json();

      if (data.new_comments.length > 0) {
        // Update the last comment timestamp to the latest one
        lastCommentTimestamp = data.new_comments[data.new_comments.length - 1].timestamp;
        console.log(`Successfully polled and retrieved ${data.new_comments.length} more comments from backend!`);

        // Immediately update the state with new comments
        updateComments(data.new_comments);
      } 
      if(data.status === "PRELIM_SUCCESS") { 
        // Stop polling if process finished
        shouldContinue = false;
        console.log(`Process has reached preliminary success, polling stopped.`);
      }

    } catch (error) {
        console.error("Error while polling for comments:", error);//, attempts);
        shouldContinue = false;
    }

    // attempts += 1;

    if (shouldContinue) {
        // Wait for the specified interval before polling again
        await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  // TODO: implement post-prelim success logic
  return allComments;
}


export async function pollForProductInformation(
  userId: string,
  productId: string,
  interval: number = 5000, // Polling interval in milliseconds
  maxAttempts: number = 20,
  setProductData: (newProductData: ProductData) => void ): Promise<void> {
    console.log(`Polling for product ${productId} information...`);
    let productData: ProductData;
    // let attempts = 0;
    let shouldContinue = true;
  
    while (shouldContinue) {// && attempts < maxAttempts) {
      try {
        const url = new URL(`${config.api_url}/gen/poll-product-info`);
        url.searchParams.append("user_id", userId);
        url.searchParams.append("product_id", productId);
  
        const response = await fetch(url.toString())   
  
        if (!response.ok) {
            throw new Error(`Polling failed with status: ${response.status}`);
        }
  
        const data: ProductData = await response.json();
  
        if (data.product_name) {
          // Update the last comment timestamp to the latest one
          console.log(`Successfully polled and retrieved information for "${data.product_name} with description ${data.description}"!`);
  
          // Immediately update the state with new comments
          setProductData(data);
          shouldContinue = false;
        } 
      } catch (error) {
          console.error("Error while polling for product_info:", error);
          shouldContinue = false;
      }
  
      // attempts += 1;
  
      if (shouldContinue) {
          // Wait for the specified interval before polling again
          await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
}


export async function fetchProductInformation(
  userId: string,
  productId: string,
  setProductData: (newProductData: ProductRecordData) => void ): Promise<void> {
    console.log(`Fetching for product ${productId} information...`);
    // let attempts = 0;  
    try {
      const url = new URL(`${config.api_url}/gen/poll-product-info`);
      url.searchParams.append("user_id", userId);
      url.searchParams.append("product_id", productId);

      const response = await fetch(url.toString())   

      if (!response.ok) {
          throw new Error(`Polling failed with status: ${response.status}`);
      }

      const data: ProductRecordData = await response.json();

      if (data.product_name) {
        // Update the last comment timestamp to the latest one
        console.log(`Successfully polled and retrieved information for "${data.product_name} with description ${data.description}"!`);

        // Immediately update the state with new comments
        setProductData(data);
      } 
    } catch (error) {
        console.error("Error while polling for product_info:", error);
    }
}


export async function fetchAggregateCommentsForProduct(
  userID: string, 
  productID: string,
  setAggregateComments: (commentsFetched: CommentData[]) => void
): Promise<void> {
  console.log(`Fetching for aggregate comments for product ${productID} information...`);
  // let attempts = 0;  
  try {
    const url = new URL(`${config.api_url}/history/retrieve-aggregate-comments-for-product`);
    url.searchParams.append("user_id", userID);
    url.searchParams.append("product_id", productID);

    const response = await fetch(url.toString())   

    if (!response.ok) {
        throw new Error(`Polling failed with status: ${response.status}`);
    }

    const comments: CommentData[] = await response.json();

    if (comments) {
      // Immediately update the state with new comments
      setAggregateComments(comments);
    } 
  } catch (error) {
      console.error("Error while polling for product_info:", error);
  }
}