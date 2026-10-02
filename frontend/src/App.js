import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import Overview from "@/pages/Overview";
import Articles from "@/pages/Articles";
import Newspaper from "@/pages/Newspaper";
import LayoutPanel from "@/pages/LayoutPanel";
import EPaper from "@/pages/EPaper";
import Categories from "@/pages/Categories";
import Authors from "@/pages/Authors";
import Media from "@/pages/Media";
import Comments from "@/pages/Comments";
import Analytics from "@/pages/Analytics";

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/newspaper" element={<Newspaper />} />
            <Route path="/layout" element={<LayoutPanel />} />
            <Route path="/epaper" element={<EPaper />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/authors" element={<Authors />} />
            <Route path="/media" element={<Media />} />
            <Route path="/comments" element={<Comments />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
