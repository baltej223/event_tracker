"use client";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (username && password) {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: username, // or "email" depending on your backend
            password: password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(`✅ ${data.message}`);
        } else {
          setMessage(`❌ ${data.error || "Login failed"}`);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Network error");
      }
    } else {
      setMessage("❌ Please enter username and password");
    }
  };

  // ✅ Component JSX must be returned here, not inside handleSubmit
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-80">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 border rounded-lg"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border rounded-lg"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </form>
        {message && <p className="text-center mt-4 font-medium">{message}</p>}
      </div>
    </div>
  );
}
