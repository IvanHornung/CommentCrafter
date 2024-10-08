import config from "@/app/config";


export interface UserSummary {
    total_comment_generations: number;
    total_gen_requests: number;
}

export interface ProductItem {
    product_id: string;
    product_name: string;
    total_comments: number;
    total_gen_requests: number;
}

export async function fetchUserRequestSummary(
    userId: string,
    setUserSummary: (newUserSummary: UserSummary) => void
): Promise<void>{
    try {
        const url = new URL(`${config.api_url}/history/retrieve-user-summary`);
        url.searchParams.append("user_id", userId);

        const response = await fetch(url.toString())   

        if (!response.ok) {
            throw new Error(`Retrieval failed with status: ${response.status}`);
        }

        const userSummary: UserSummary = await response.json();
        setUserSummary(userSummary);
    } catch (error) {
        console.error("Error while retrieving user generation history summary:", error);//, attempts);
    }
}


export async function fetchProductRequests(
    userId: string,
    setProductRequests: (newProductRequests: ProductItem[]) => void
): Promise<void> {
    try {
        const url = new URL(`${config.api_url}/history/retrieve-user-product-request`);
        url.searchParams.append("user_id", userId);

        const response = await fetch(url.toString())   

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const products: ProductItem[] = await response.json();

        setProductRequests(products);

    } catch (error) {
        console.error("Error while retrieving user past product generations:", error);//, attempts);
    }
}