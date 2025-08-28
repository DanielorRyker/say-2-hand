<<<<<<< HEAD
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/home");
  return null;
=======
"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    // chạy ở client sau khi render
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <main style={{ height: "700px", background: "#F4F4F4" }}>
      <div style={{ paddingTop: "150px" }}>
        {user ? (
          <>
            <p>{user._id}</p>
            <p>{user.email}</p>
          </>
        ) : (
          <p>Chưa có user</p>
        )}
      </div>
    </main>
  );
>>>>>>> e3a9c8bc2d8a1b35902c7500e2b40edbfeef2cbb
}
