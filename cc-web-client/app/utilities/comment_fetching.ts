import config from "@/app/config";

type FetchCommentsProps = {
  user_id: string | null;
  link: string | null;
  numCommentsFirstPage: number;
  pollutionLevel: string | null;
}

//update later:  * @returns {Promise<{ comments: [string, number, number][], jobId: string | null }>}
// [string,number,number]


/**
 * Fetch the first page of comments from the API and obtain job ID.
 * @param {strnig} user_id - firestore UID of active user
 * @param {string} productLink - The link to the product.
 * @param {number} numCommentsFirstPage - The number of comments per page.
 * @param {string} pollutionLevel - The pollution level.
 */
export async function fetchInitialComments({ user_id, link, numCommentsFirstPage, pollutionLevel }:
   FetchCommentsProps) : Promise<{ comments: string[], productID: string | null }> {
  console.log(`Reached pollForRemainingComments with ${user_id}, ${link}, ${numCommentsFirstPage}, and ${pollutionLevel}`);
    // TODO: handle product ID logic
  try {
    const response = await fetch(`${config.api_url}/gen/generate-comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id,
        link,
        numCommentsFirstPage,
        pollutionLevel,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate comments");
    }

    return await response.json();
    
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function pollForRemainingComments(productID: string, setComments: (comments: string[]) => void) {
  console.log(`Reached pollForRemainingComments ${productID}`);
}

// export async function pollForRemainingComments(productID: string, setComments: (comments: string[]) => void) {
//   const interval = setInterval(async () => {
//     try {
//       const response = await fetch(`${config.api_url}/gen/poll-comments?jobId=${jobId}`);

//       if (!response.ok) {
//         throw new Error('Polling request failed');
//       }

//       const { new_comments: newComments, generation_status: done } = await response.json() as { new_comments: string[], generation_status: string };

//       if (newComments && newComments.length > 0) {
//         setComments(prevComments => [...prevComments, ...newComments]);
//       }

//       if (done === 'complete') {
//         clearInterval(interval); // Stop polling once all comments are received
//       }
//     } catch (error) {
//       console.error('Polling failed:', error);
//       clearInterval(interval);
//     }
//   }, 3000); // Poll every 3 seconds
// }
