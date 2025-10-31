"use client";
import { useState } from "react";

export default function ContactForm({ nctId }: { nctId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setStatus("sending");

    try {
      // 🧩 Load Firebase only when actually sending
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      await addDoc(collection(db, "contacts"), {
        nctId,
        name,
        email,
        message,
        createdAt: serverTimestamp(),
        reviewed: false,
      });

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Contact form error:", err);
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-blue-50 border border-blue-200 p-4 rounded-xl mt-6"
    >
      <h3 className="text-lg font-semibold text-blue-700 mb-3">
        Contact Study Sponsor
      </h3>

      <div className="grid gap-3">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
        />
        <textarea
          placeholder="Your Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border border-blue-300 rounded-lg px-3 py-2 min-h-[100px]"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>
      </div>

      {status === "sent" && (
        <p className="text-green-600 mt-3">Message sent successfully!</p>
      )}
      {status === "error" && (
        <p className="text-red-600 mt-3">
          Error sending message. Try again.
        </p>
      )}
    </form>
  );
}