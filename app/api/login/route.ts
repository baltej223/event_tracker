// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Read JSON body
    const body = await request.json();
    const { email, password } = body;

    console.log("Email:", email);
    console.log("Password:", password);
    if (email==="baltej963@gmail.com" && password==="baltej"){
    // Example: predefined cookie
    const response = NextResponse.json({ message: "Login successful" });

    // Set cookie: name, value, options
    response.cookies.set({
      name: "login",
      value: "487623915gb43hu5i72trfb2i4u5yt843tv_48754rt872398237fg",
      httpOnly: true, // can't be read by JS
      path: "/",       // cookie available on all pages
      maxAge: 10 * 24 * 60 * 60, // 1 day
    });

    return response;
    }
        else 
            {return NextResponse.json({ error: "Not allowed" }, { status: 401 });}
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
