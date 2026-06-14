import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Diaries from "@/pages/Diaries";
import Trends from "@/pages/Trends";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diaries" element={<Diaries />} />
          <Route path="/trends" element={<Trends />} />
        </Routes>
      </Layout>
    </Router>
  );
}
