import { ApiError } from "../utils/ApiError.js";
import { callGroqChatCompletion } from "../utils/groqClient.js";

/*
  generateDescriptionService

  This is where we decide WHAT to ask the model, not HOW to call it
  (that part is groqClient.js's job). Keeping the prompt here, in the
  service layer, matches this project's existing convention: services
  hold business logic, utils hold raw third-party plumbing.
*/
const generateDescriptionService = async ({ name, type }) => {
    if (!name?.trim()) {
        throw new ApiError(400, "Name is required to generate a description");
    }

    if (!["category", "product"].includes(type)) {
        throw new ApiError(400, "type must be either 'category' or 'product'");
    }

    const systemPrompt =
        "You are an assistant that writes short descriptions for a store inventory system. " +
        "Write exactly 1-2 sentences. Do not use markdown, quotes, or emojis. " +
        "Keep the tone plain, professional, and factual.";

    const userPrompt =
        type === "category"
            ? `Write a short description for a product category named "${name}".`
            : `Write a short description for a product named "${name}".`;

    const description = await callGroqChatCompletion(systemPrompt, userPrompt);

    return description;
};

export { generateDescriptionService };
