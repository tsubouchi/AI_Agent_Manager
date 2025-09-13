import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const form = await req.formData()
    const file = form.get("image") as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: "Missing image file" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const b64 = buffer.toString("base64")
    const mime = file.type || "image/png"

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are an OCR assistant. Extract all legible text from the image. Return clean plain text, preserving reading order and line breaks where helpful. Do not add explanations.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract text from this image and return plain UTF-8 text." },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${b64}` },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("OCR OpenAI error:", response.status, err)
      return new Response(JSON.stringify({ error: "OpenAI OCR request failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await response.json()
    const text: string = data.choices?.[0]?.message?.content || ""

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("OCR API error:", error)
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

