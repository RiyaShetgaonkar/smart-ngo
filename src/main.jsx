
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { APIProvider } from "@vis.gl/react-google-maps"; // Import this here
import App from "./App";

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* By putting this here, the Geocoding library loads BEFORE your app starts */}
    <APIProvider apiKey={MAPS_KEY} libraries={['geocoding', 'places']}>
      <App />
    </APIProvider>
  </StrictMode>
);