import { useState } from "react";

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("من فضلك اكتب اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);

      console.log("LOGIN DATA:", {
        username: cleanUsername,
        password: password,
      });

      const response = await fetch(
        "http://localhost:5000/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: cleanUsername,
            password: password,
          }),
        }
      );

      console.log("LOGIN STATUS:", response.status);

      const text = await response.text();

      console.log("SERVER RESPONSE:", text);

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        setError(
          "السيرفر رجع رد غير مفهوم"
        );
        return;
      }

      if (!response.ok) {
        setError(
          data.message ||
            "اسم المستخدم أو كلمة المرور غير صحيحة"
        );
        return;
      }

      if (!data.success) {
        setError(
          data.message ||
            "فشل تسجيل الدخول"
        );
        return;
      }

      if (!data.token) {
        setError(
          "السيرفر لم يرجع Token"
        );
        return;
      }

      console.log(
        "LOGIN SUCCESS"
      );

      localStorage.setItem(
        "adminToken",
        data.token
      );

      onLogin();

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "مش قادر أوصل للسيرفر. تأكد إن Backend شغال."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      dir="rtl"
    >

      <div className="login-card">

        <div className="login-logo">
          ✚
        </div>

        <h1>
          مبرة الفلكي
        </h1>

        <p className="login-subtitle">
          تسجيل دخول لوحة التحكم
        </p>

        <form onSubmit={handleLogin}>

          <div className="login-group">

            <label>
              اسم المستخدم
            </label>

            <input
              type="text"
              placeholder="اكتب اسم المستخدم"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              autoComplete="username"
            />

          </div>

          <div className="login-group">

            <label>
              كلمة المرور
            </label>

            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              autoComplete="current-password"
            />

          </div>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "دخول لوحة التحكم"}
          </button>

        </form>

        <p className="login-footer">
          لوحة إدارة مبرة الفلكي التخصصي
        </p>

      </div>

    </div>
  );
}

export default AdminLogin;