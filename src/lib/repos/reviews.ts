import clientApi from "./axios";
import { Review, ApiResponse } from "@/lib/types";

export const fetchProductReviews = async (productId: string | number): Promise<Review[]> => {
  try {
    const response = await clientApi.get<ApiResponse<Review[]>>(`/api/reviews/product/${productId}`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return [];
  }
};

export const fetchUserReviews = async (): Promise<Review[]> => {
  try {
    const response = await clientApi.get<ApiResponse<Review[]>>(`/api/reviews/user`);
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
};

export const addReview = async (reviewData: {
  productId: number;
  rating: number;
  comment: string;
}): Promise<ApiResponse<Review>> => {
  try {
    const response = await clientApi.post<ApiResponse<Review>>(`/api/reviews`, reviewData);
    return response.data;
  } catch (error: any) {
    console.error("Error adding review:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to add review",
    };
  }
};

export const updateReview = async (
  id: number,
  reviewData: { rating?: number; comment?: string }
): Promise<ApiResponse<Review>> => {
  try {
    const response = await clientApi.put<ApiResponse<Review>>(`/api/reviews/${id}`, reviewData);
    return response.data;
  } catch (error: any) {
    console.error("Error updating review:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update review",
    };
  }
};

export const deleteReview = async (id: number): Promise<ApiResponse<void>> => {
  try {
    const response = await clientApi.delete<ApiResponse<void>>(`/api/reviews/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete review",
    };
  }
};
