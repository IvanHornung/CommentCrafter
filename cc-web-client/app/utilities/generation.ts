import config from "@/app/config";


export async function generateComments(link: string, commentCount: number, pollutionLevel: string): Promise<string[]> {
  try {
    const response = await fetch(`${config.api_url}/gen/generate-comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        link,
        commentCount,
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
