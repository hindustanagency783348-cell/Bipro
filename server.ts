import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API Route for AI Inventory Analysis
  app.post("/api/analyze-inventory", async (req, res) => {
    try {
      const { fileData, mimeType, prompt } = req.body;
      
      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "Missing required file data or mime type." });
      }

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          { text: prompt },
          { inlineData: { mimeType, data: fileData } }
        ]
      });
      
      const text = response.text.replace(/```json|```/g, '').trim();
      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("[AI_FAULT]", error);
      res.status(500).json({ error: error.message || "Failed to process inventory data" });
    }
  });

  // API Route for WhatsApp Notifications (Placeholder logic)
  app.post("/api/notify-order", async (req, res) => {
    const { orderId, dealerPhone, customerName, total } = req.body;
    console.log(`[NOTIFY] Order ${orderId} placed for dealer ${dealerPhone}.`);
    console.log(`[NOTIFY] Customer: ${customerName}, Amount: ₹${total}`);
    
    // In a real app, you would integrate with Twilio or another WhatsApp API here.
    // e.g., client.messages.create({ body: `New Order! ${customerName} placed order ${orderId} for ₹${total}`, from: 'whatsapp:+14155238886', to: `whatsapp:+91${dealerPhone}` })

    res.json({ success: true, message: "Notification initiated" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
