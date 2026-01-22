import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Page/Home";
import ScanResult from "./Page/ScanResult";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scanResult" element={<ScanResult />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
