const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// HTML for the frontend
const HTML_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Web App</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
        body { background-color: #f3f4f6; font-family: Arial, sans-serif; }
        .loader {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="min-h-screen flex flex-col justify-center items-center">
        <div class="bg-white shadow-md rounded p-6 w-full max-w-md">
            <h1 class="text-2xl font-bold mb-4 text-center text-blue-600">AI Web App</h1>
            <div class="mb-4">
                <label for="feature" class="block font-medium">Choose Feature:</label>
                <select id="feature" class="w-full border rounded p-2">
                    <option value="chat">Chat AI</option>
                    <option value="image">Image Generator</option>
                </select>
            </div>
            <div id="chat-section" class="mb-4">
                <label for="chat-input" class="block font-medium">Your Message:</label>
                <input id="chat-input" type="text" class="w-full border rounded p-2 mb-2" placeholder="Type a message...">
                <button id="chat-button" class="bg-blue-500 text-white px-4 py-2 rounded w-full">Send</button>
                <div id="chat-output" class="mt-4 text-sm"></div>
            </div>
            <div id="image-section" class="mb-4 hidden">
                <label for="image-prompt" class="block font-medium">Describe an Image:</label>
                <input id="image-prompt" type="text" class="w-full border rounded p-2 mb-2" placeholder="Type an image prompt...">
                <button id="image-button" class="bg-blue-500 text-white px-4 py-2 rounded w-full">Generate</button>
                <div id="image-output" class="mt-4 text-sm text-center"></div>
            </div>
        </div>
    </div>
    <script>
        document.getElementById("feature").addEventListener("change", (e) => {
            const chatSection = document.getElementById("chat-section");
            const imageSection = document.getElementById("image-section");
            if (e.target.value === "chat") {
                chatSection.classList.remove("hidden");
                imageSection.classList.add("hidden");
            } else {
                chatSection.classList.add("hidden");
                imageSection.classList.remove("hidden");
            }
        });

        document.getElementById("chat-button").addEventListener("click", async () => {
            const input = document.getElementById("chat-input").value.trim();
            const output = document.getElementById("chat-output");
            if (!input) return;

            output.innerHTML = '<div class="loader mx-auto mt-4"></div>';
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });
            const data = await response.json();
            output.innerHTML = data.reply || "Error generating response.";
        });

        document.getElementById("image-button").addEventListener("click", async () => {
            const prompt = document.getElementById("image-prompt").value.trim();
            const output = document.getElementById("image-output");
            if (!prompt) return;

            output.innerHTML = '<div class="loader mx-auto mt-4"></div>';
            const response = await fetch("/api/image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await response.json();
            output.innerHTML = data.url
                ? \`<img src="\${data.url}" alt="Generated Image" class="rounded mx-auto">\`
                : "Error generating image.";
        });
    </script>
</body>
</html>
`;

// Serve HTML
app.get("/", (req, res) => {
    res.send(HTML_PAGE);
});

// Replace with your OpenAI API key
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

// Chat API Endpoint
app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: message }],
                max_tokens: 150,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Chat Error:", error.response?.data || error.message);
        res.status(500).json({ reply: "Error communicating with OpenAI API." });
    }
});

// Image API Endpoint
app.post("/api/image", async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                prompt,
                n: 1,
                size: "256x256",
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        res.json({ url: response.data.data[0].url });
    } catch (error) {
        console.error("Image Error:", error.response?.data || error.message);
        res.status(500).json({ url: null });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
