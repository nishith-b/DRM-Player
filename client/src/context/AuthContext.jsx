import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session when app loads (calls backend)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/me`,
          { withCredentials: true } // important for cookies
        );
        
        setUser(res.data.user);
      } catch (err) {
        setUser(null); // not logged in
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Login (backend sets the cookie)
  const login = async (email, password) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/user/login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(res.data.user);
  };

  // Signup (backend sets the cookie)
  // Updated to accept form data and call backend internally
  const signup = async (form) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/user/signup`,
      form,
      { withCredentials: true }
    );
    setUser(res.data.user);
  };

  // Logout (clear cookie on server)
  const logout = async () => {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/user/logout`,
      {},
      { withCredentials: true }
    );
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
