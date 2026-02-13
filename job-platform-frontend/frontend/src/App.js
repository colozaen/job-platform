import { useEffect, useState } from "react";
import API from "./services/api";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    API.get("/")
      .then((response) => {
        console.log("Backend response:", response.data);
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Backend not connected:", error);
        setMessage("Error connecting to backend");
      });
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#dbeafe",
        textAlign: "center"
      }}
    >
      <div>
        <h1>Welcome to My Job Platform</h1>
        <h1 style={{ fontWeight: "bold", fontSize: "30px", color: "#1e3a8a" }}>
          {message}
        </h1>
      </div>
    </div>
  );
}

export default App;