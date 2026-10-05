/*
  utils/groqClient.js

  This file is the ONLY place in the whole project that talks to Groq's
  servers directly. Every other file (service/controller) calls the
  function exported from here — this keeps the third-party integration
  isolated in one place, the same pattern already used for Cloudinary
  in utils/cloudinary.js.

  Groq exposes an OpenAI-compatible "chat completions" endpoint. That
  means the request/response JSON shape is identical to OpenAI's API,
  even though the model running behind it (Llama 3, in our case) is
  open-source. This is why the request body below looks structured
  the same way you'd see in any OpenAI tutorial.

  We use Node's built-in `fetch` (available natively since Node 18),
  so no extra HTTP library dependency is required for this feature.
*/

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b"; // small + fast open-source model, ideal for short text generation

const callGroqChatCompletion = async (systemPrompt, userPrompt) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured on the server");
    }

    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Bearer token auth - the API key NEVER leaves this backend file
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7, // some creativity, but still predictable/professional
             max_completion_tokens: 300, // we only want a short description, not an essay
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Groq API request failed: ${response.status} ${errorBody}`,
        );
    }

    const data = await response.json();

    // OpenAI-compatible response shape: the generated text sits here
    const generatedText = data?.choices?.[0]?.message?.content?.trim();

    if (!generatedText) {
        throw new Error("Groq API returned an empty response");
    }

    return generatedText;
};

export { callGroqChatCompletion };
