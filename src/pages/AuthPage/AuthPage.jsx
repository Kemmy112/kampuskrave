import { useState } from "react";
import { ChefHat, UserRound, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import "./AuthPage.css";

export default function AuthPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const needsNameField = mode === "signup" && role === "customer";

  function enterAs(selectedRole) {
    navigate(selectedRole === "chef" ? "/chef" : "/customer");
  }

  async function handleSignUp() {
    const fullName = role === "chef" ? "ADMIN" : name;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    });

    if (signUpError) throw signUpError;

    if (data.session) {
      enterAs(role);
    } else {
      setInfoMessage("Account created! Check your email to confirm before signing in.");
    }
  }

  async function handleSignIn() {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError) throw profileError;

    enterAs(profile.role);
  }

  async function handleSubmit() {
    setError("");
    setInfoMessage("");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (needsNameField && !name.trim()) {
      setError("Enter your full name.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authpage">
      {/* Left panel — bright */}
      <div className="authpage__hero">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ChefHat size={20} />
          <span className="font-mono" style={{ fontSize: 12, letterSpacing: 0.5 }}>
            KampusKrave Food App
          </span>
        </div>

        <div>
          <h1
            className="font-display"
            style={{ fontSize: 42, lineHeight: 1.15, fontWeight: 700, margin: 0 }}
          >
            Fresh as always, today's menu is ready.
          </h1>
          <p
            style={{
              marginTop: 18,
              color: "#FFE9DC",
              maxWidth: 400,
              fontSize: 15.5,
              lineHeight: 1.65,
              fontWeight: 500,
            }}
          >
            Sign in to see what's cooking today — first-time orders come with 30% off.
          </p>
        </div>

        <div className="font-mono" style={{ fontSize: 11, color: "#FFD9C4", fontWeight: 500 }}>
          Delivery window: ORDER CONFIRMED → READY IN 90 MIN
        </div>
      </div>

      {/* Right panel — form */}
      <div className="authpage__form-panel">
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h2
            className="font-display"
            style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, color: "#1A1310" }}
          >
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>
          <p style={{ color: "#5C4E44", fontSize: 14, fontWeight: 500, marginBottom: 22 }}>
            Choose how you're using the app.
          </p>

          <div
            style={{
              display: "flex",
              border: "1px solid rgba(26, 19, 16, 0.14)",
              borderRadius: 6,
              padding: 3,
              marginBottom: 20,
            }}
          >
            {[
              { key: "customer", label: "Customer", icon: UserRound },
              { key: "chef", label: "Chef / Admin", icon: ChefHat },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                style={{
                  flex: 1,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 5,
                  padding: "9px 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: role === key ? "#1A1310" : "transparent",
                  color: role === key ? "#fff" : "#1A1310",
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {needsNameField && (
              <input
                style={inputStyle}
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              style={inputStyle}
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="authpage__password-wrap">
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="authpage__password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: "#B3261E", fontSize: 13.5, fontWeight: 600, marginTop: 12, marginBottom: 0 }}>
              {error}
            </p>
          )}
          {infoMessage && (
            <p style={{ color: "#1E8A4C", fontSize: 13.5, fontWeight: 600, marginTop: 12, marginBottom: 0 }}>
              {infoMessage}
            </p>
          )}

          <button
            style={{
              width: "100%",
              marginTop: 18,
              padding: "13px 18px",
              border: "none",
              cursor: loading ? "default" : "pointer",
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 5,
              background: "linear-gradient(135deg, #FF6B35, #C1440E)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : `${mode === "signin" ? "Sign in" : "Create account"} as ${role === "customer" ? "customer" : "chef"}`}
          </button>

          <p style={{ fontSize: 13.5, color: "#5C4E44", fontWeight: 500, marginTop: 16, textAlign: "center" }}>
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <span
              style={{ color: "#C1440E", cursor: "pointer", fontWeight: 700 }}
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
                setInfoMessage("");
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  fontSize: 14.5,
  fontWeight: 500,
  padding: "11px 12px",
  border: "1px solid rgba(26, 19, 16, 0.14)",
  borderRadius: 5,
  background: "#fff",
  color: "#1A1310",
  outline: "none",
  boxSizing: "border-box",
};