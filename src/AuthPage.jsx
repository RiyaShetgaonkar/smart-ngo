import { useState } from "react";
import { auth } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

const LIGHT_CREAM = "#FDFBF7";
const GLOBAL_FONT = "serif";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#f8fafc", 
      fontFamily: GLOBAL_FONT 
    }}>
      <div className="fade-in-entry" style={{ 
        width: 400, 
        padding: 40, 
        background: LIGHT_CREAM, 
        borderRadius: 24, 
        boxShadow: "var(--shadow)", 
        border: "6px solid #ef4444", // Thick Orange Border
        textAlign: "center" 
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
          <h1 style={{ fontSize: 28, margin: 0, color: "#1e293b", fontFamily: GLOBAL_FONT }}>NGO Relief</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginTop: 8 }}>Secure Dispatcher Access</p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          style={{ 
            width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0", 
            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
            gap: 10, cursor: "pointer", fontFamily: GLOBAL_FONT, fontSize: 15, color: "#1e293b", marginBottom: 20 
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="G" />
          Continue with Google
        </button>

        <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input 
            type="email" placeholder="Email Address" value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, fontFamily: GLOBAL_FONT }}
            required
          />
          <input 
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, fontFamily: GLOBAL_FONT }}
            required
          />
          <button type="submit" style={{ 
            background: "#ef4444", color: "#fff", border: "none", padding: "14px", 
            borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", 
            fontFamily: GLOBAL_FONT, boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)" 
          }}>
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div style={{ marginTop: 24, fontSize: 14, color: "#64748b" }}>
          {isLogin ? "Need an account?" : "Already have an account?"}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: "#9b2dfc", cursor: "pointer", marginLeft: 6, fontWeight: 600 }}>
            {isLogin ? "Register" : "Login"}
          </span>
        </div>
      </div>
    </div>
  );
}