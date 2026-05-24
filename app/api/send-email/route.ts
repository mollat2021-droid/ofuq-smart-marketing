import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { to, subject, content, productLink } = await req.json();

    if (!to || !subject || !content) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields",
      });
    }

    const htmlContent = `
      <div style="direction:rtl;font-family:Arial,sans-serif;line-height:1.8;color:#111827">
        <h2>${subject}</h2>
        <p>${content}</p>
        ${
          productLink
            ? `<p><a href="${productLink}" style="display:inline-block;background:#111827;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">عرض المنتج</a></p>`
            : ""
        }
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
        <p style="font-size:12px;color:#6b7280">Ofuq Smart Marketing</p>
      </div>
    `;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: {
          email: "mollat2021@gmail.com",
          name: "Ofuq Smart Marketing",
        },
        to: [{ email: to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json({
        success: false,
        error: errorText,
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json({
      success: false,
      error: "Server error",
    });
  }
}