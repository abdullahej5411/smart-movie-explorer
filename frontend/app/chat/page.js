"use client";

import { useState, useEffect, useRef } from "react";
import {
  CloudRain, Zap, Droplets, Brain,
  Heart, Sun, Gem, Compass, MessageCircle, X, Send, Trash2
} from "lucide-react";

const MOODS = [
  { label: "Rainy Night In",    icon: CloudRain, description: "Cozy, slow, atmospheric",     query: "cozy atmospheric movies for a rainy night at home",         gradient: "linear-gradient(135deg, #1a2a4a 0%, #0d1b2e 100%)", glow: "rgba(80,120,200,0.22)",  border: "rgba(80,140,220,0.2)"   },
  { label: "Hype & Adrenaline", icon: Zap,       description: "Fast, loud, electric",         query: "high energy action packed adrenaline rush movies",          gradient: "linear-gradient(135deg, #2d1200 0%, #1a0800 100%)", glow: "rgba(220,100,20,0.22)",  border: "rgba(240,120,30,0.25)"  },
  { label: "Cry It Out",        icon: Droplets,  description: "Emotional, raw, cathartic",    query: "deeply emotional movies that will make me cry",             gradient: "linear-gradient(135deg, #0e1e2e 0%, #071018 100%)", glow: "rgba(60,160,200,0.2)",   border: "rgba(80,170,210,0.2)"   },
  { label: "Mind-Bending",      icon: Brain,     description: "Twisted, cerebral, surreal",   query: "mind bending cerebral movies that mess with your head",     gradient: "linear-gradient(135deg, #1a0d2e 0%, #0d0618 100%)", glow: "rgba(140,60,220,0.22)",  border: "rgba(160,80,240,0.22)"  },
  { label: "Date Night",        icon: Heart,     description: "Charming, warm, romantic",     query: "romantic charming movies perfect for a date night",         gradient: "linear-gradient(135deg, #2e1020 0%, #1a0810 100%)", glow: "rgba(220,80,120,0.2)",   border: "rgba(230,100,140,0.22)" },
  { label: "Feel-Good Friday",  icon: Sun,       description: "Fun, uplifting, joyful",       query: "feel good uplifting movies to watch on a Friday night",     gradient: "linear-gradient(135deg, #1e1800 0%, #120f00 100%)", glow: "rgba(220,180,30,0.2)",   border: "rgba(230,190,40,0.22)"  },
  { label: "Hidden Gems",       icon: Gem,       description: "Underrated, surprising, fresh",query: "underrated hidden gem movies most people haven't seen",     gradient: "linear-gradient(135deg, #001e1a 0%, #00100e 100%)", glow: "rgba(30,200,170,0.2)",   border: "rgba(40,210,180,0.2)"   },
  { label: "Epic Adventure",    icon: Compass,   description: "Grand, sweeping, legendary",   query: "epic adventure movies with grand sweeping storytelling",    gradient: "linear-gradient(135deg, #1a1200 0%, #0e0a00 100%)", glow: "rgba(180,140,40,0.2)",   border: "rgba(200,160,50,0.2)"   },
];

export default function ChatPage() {
  const [message, setMessage]               = useState("");
  const [messages, setMessages]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [isHovered, setIsHovered]           = useState(false);
  const [insight, setInsight]               = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [trending, setTrending]             = useState([]);
  const [animatedInsight, setAnimatedInsight] = useState("");
  const [selectedMovie, setSelectedMovie]   = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const rowRef = useRef(null);

  // ── Autocomplete ──
  const [suggestions, setSuggestions]       = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex]       = useState(-1);
  const [isSearching, setIsSearching]       = useState(false);
  const searchRef   = useRef(null);
  const debounceRef = useRef(null);

  // ── Cinema ──
  const [cinemaMode, setCinemaMode]         = useState(false);
  const [ambientColor, setAmbientColor]     = useState("201,162,39");

  // ── Mood board ──
  const showMoodBoard   = messages.length === 0 && !loading;
  const [activeMoodIdx, setActiveMoodIdx]   = useState(null);

  // ── Double Feature ──
  const [dfMovieA, setDfMovieA]             = useState("");
  const [dfMovieB, setDfMovieB]             = useState("");
  const [dfSuggestionsA, setDfSuggestionsA] = useState([]);
  const [dfSuggestionsB, setDfSuggestionsB] = useState([]);
  const [dfShowA, setDfShowA]               = useState(false);
  const [dfShowB, setDfShowB]               = useState(false);
  const [dfActiveA, setDfActiveA]           = useState(-1);
  const [dfActiveB, setDfActiveB]           = useState(-1);
  const [dfLoading, setDfLoading]           = useState(false);
  const [dfResult, setDfResult]             = useState(null);
  const [dfError, setDfError]               = useState("");
  const dfDebounceA = useRef(null);
  const dfDebounceB = useRef(null);
  const dfWrapA     = useRef(null);
  const dfWrapB     = useRef(null);

  /* ══════════════════════════════════════════════════════════
     NEW: FLOATING AI CHAT STATE
  ══════════════════════════════════════════════════════════ */
  const [floatOpen, setFloatOpen]           = useState(false);
  const [floatMessages, setFloatMessages]   = useState([]);
  const [floatInput, setFloatInput]         = useState("");
  const [floatLoading, setFloatLoading]     = useState(false);
  const floatRef      = useRef(null);
  const floatInputRef = useRef(null);
  const floatBodyRef  = useRef(null);

  /* ── NEW: Pre-fill context when a movie modal is open ── */
  useEffect(() => {
    if (floatOpen && selectedMovie) {
      setFloatInput(`Tell me more about ${selectedMovie.title}`);
      setTimeout(() => floatInputRef.current?.focus(), 80);
    }
  }, [floatOpen, selectedMovie]);

  /* ── NEW: Auto-scroll float drawer to bottom ── */
  useEffect(() => {
    if (floatBodyRef.current) {
      floatBodyRef.current.scrollTop = floatBodyRef.current.scrollHeight;
    }
  }, [floatMessages]);

  /* ── NEW: Close float on outside click + Escape ── */
  useEffect(() => {
    const clickHandler = (e) => {
      if (floatRef.current && !floatRef.current.contains(e.target)) setFloatOpen(false);
    };
    const keyHandler = (e) => { if (e.key === "Escape") setFloatOpen(false); };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  /* ── NEW: Focus input when drawer opens ── */
  useEffect(() => {
    if (floatOpen) setTimeout(() => floatInputRef.current?.focus(), 120);
  }, [floatOpen]);

  /* ── NEW: Send message in float drawer ── */
  const sendFloatMessage = async (overrideText) => {
    const cur = (overrideText !== undefined ? overrideText : floatInput).trim();
    if (!cur || floatLoading) return;
    setFloatInput("");
    setFloatMessages(prev => [...prev, { role: "user", text: cur }, { role: "typing" }]);
    setFloatLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/chat/movie-chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ message: cur }),
      });
      const data = await res.json();
      const reply = data.reply || data.query?.reply || data.message || "Here are some recommendations!";
      setFloatMessages(prev => [
        ...prev.filter(m => m.role !== "typing"),
        { role: "ai", text: "", movies: data.results || [] },
      ]);
      let built = "";
      for (const w of reply.split(" ")) {
        built += w + " ";
        setFloatMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { ...u[u.length - 1], text: built };
          return u;
        });
        await new Promise(r => setTimeout(r, 28));
      }
    } catch {
      setFloatMessages(prev => [
        ...prev.filter(m => m.role !== "typing"),
        { role: "ai", text: "Something went wrong. Please try again.", movies: [] },
      ]);
    } finally { setFloatLoading(false); }
  };

  // ── Double Feature helpers ──
  const makeDfDebounce = (value, setter, showSetter, activeSetter, debounceTimer) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim().length < 2) { setter([]); showSetter(false); return; }
    debounceTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`http://localhost:5000/api/movies/search?query=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        const results = (Array.isArray(data) ? data : []).filter(m => m.poster_path).slice(0, 5);
        setter(results); showSetter(results.length > 0); activeSetter(-1);
      } catch { setter([]); showSetter(false); }
    }, 350);
  };

  useEffect(() => { makeDfDebounce(dfMovieA, setDfSuggestionsA, setDfShowA, setDfActiveA, dfDebounceA); return () => clearTimeout(dfDebounceA.current); }, [dfMovieA]);
  useEffect(() => { makeDfDebounce(dfMovieB, setDfSuggestionsB, setDfShowB, setDfActiveB, dfDebounceB); return () => clearTimeout(dfDebounceB.current); }, [dfMovieB]);

  useEffect(() => {
    const handler = (e) => {
      if (dfWrapA.current && !dfWrapA.current.contains(e.target)) { setDfShowA(false); setDfActiveA(-1); }
      if (dfWrapB.current && !dfWrapB.current.contains(e.target)) { setDfShowB(false); setDfActiveB(-1); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runDoubleFeature = async () => {
    if (!dfMovieA.trim() || !dfMovieB.trim() || dfLoading) return;
    setDfLoading(true); setDfResult(null); setDfError("");
    try {
      const res  = await fetch("http://localhost:5000/api/chat/double-feature", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieA: dfMovieA.trim(), movieB: dfMovieB.trim() }),
      });
      const data = await res.json();
      if (data.error) { setDfError(data.error); return; }
      setDfResult(data);
    } catch { setDfError("Something went wrong. Please try again."); }
    finally { setDfLoading(false); }
  };

  const resetDf = () => { setDfMovieA(""); setDfMovieB(""); setDfResult(null); setDfError(""); };

  const dfKeyDown = (e, suggestions, activeIdx, setActive, showSetter, valueSetter, showState) => {
    if (!showState) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) { valueSetter(suggestions[activeIdx].title); showSetter(false); setActive(-1); }
    } else if (e.key === "Escape") { showSetter(false); setActive(-1); }
  };

  // ── Cinema ──
  const extractDominantColor = (imageUrl) => new Promise((resolve) => {
    if (!imageUrl) { resolve("201,162,39"); return; }
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas"); const SIZE = 80;
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(SIZE * 0.2, SIZE * 0.3, SIZE * 0.6, SIZE * 0.5).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          const pr = data[i], pg = data[i+1], pb = data[i+2];
          const brightness = (pr+pg+pb)/3, max = Math.max(pr,pg,pb), min = Math.min(pr,pg,pb);
          const sat = max === 0 ? 0 : (max-min)/max;
          if (brightness > 20 && brightness < 240 && sat > 0.15) { r+=pr; g+=pg; b+=pb; count++; }
        }
        if (count === 0) { resolve("201,162,39"); return; }
        r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
        const boost=1.35, avg=(r+g+b)/3;
        r=Math.min(255,Math.round(avg+(r-avg)*boost)); g=Math.min(255,Math.round(avg+(g-avg)*boost)); b=Math.min(255,Math.round(avg+(b-avg)*boost));
        resolve(`${r},${g},${b}`);
      } catch { resolve("201,162,39"); }
    };
    img.onerror = () => resolve("201,162,39");
    img.src = imageUrl;
  });

  const enterCinema = async () => {
    if (selectedMovie?.poster) { const color = await extractDominantColor(selectedMovie.poster); setAmbientColor(color); }
    setCinemaMode(true); document.body.style.overflow = "hidden";
  };
  const exitCinema = () => { setCinemaMode(false); document.body.style.overflow = ""; };
  const closeModal = () => { exitCinema(); setSelectedMovie(null); setInsight(""); };

  // ── Main autocomplete ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = message.trim();
    if (trimmed.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res  = await fetch(`http://localhost:5000/api/movies/search?query=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        const results = (Array.isArray(data) ? data : []).filter(m => m.poster_path).slice(0, 6);
        setSuggestions(results); setShowSuggestions(results.length > 0); setActiveIndex(-1);
      } catch { setSuggestions([]); setShowSuggestions(false); }
      finally { setIsSearching(false); }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [message]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setShowSuggestions(false); setActiveIndex(-1); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e) => {
    if (!showSuggestions) { if (e.key === "Enter" && !loading) sendMessage(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i+1, suggestions.length-1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i-1, -1)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) selectSuggestion(suggestions[activeIndex]);
      else { setShowSuggestions(false); sendMessage(); }
    } else if (e.key === "Escape") { setShowSuggestions(false); setActiveIndex(-1); }
  };

  const selectSuggestion = (movie) => { setShowSuggestions(false); setActiveIndex(-1); sendMessage(movie.title); };

  const fireMood = async (mood, idx) => {
    setActiveMoodIdx(idx);
    await new Promise(r => setTimeout(r, 180));
    setActiveMoodIdx(null);
    sendMessage(mood.query);
  };

  const scrollRow = (dir) => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    rowRef.current.scrollTo({ left: dir === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75, behavior: "smooth" });
  };

  useEffect(() => {
    if (isHovered || trending.length === 0) return;
    const id = setInterval(() => {
      if (!rowRef.current) return;
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) rowRef.current.scrollTo({ left: 0, behavior: "smooth" });
      else scrollRow("right");
    }, 3400);
    return () => clearInterval(id);
  }, [isHovered, trending]);

  useEffect(() => {
    const go = (id) => { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: "smooth" }); };
    if (loading) go("typing-dots");
    if (!loading && messages.length > 0) setTimeout(() => go(`msg-${messages.length - 1}`), 160);
  }, [loading, messages.length]);

  useEffect(() => {
    fetch("http://localhost:5000/api/movies/trending")
      .then(r => r.json())
      .then(d => { setTrending(d.movies || []); setTrendingLoading(false); })
      .catch(() => setTrendingLoading(false));
  }, []);

  const typeText = async (text, setter) => {
    setter(""); let cur = "";
    for (const w of text.split(" ")) { cur += w + " "; setter(cur); await new Promise(r => setTimeout(r, 28)); }
  };

  const fetchInsight = async (title) => {
    setInsight(""); setAnimatedInsight(""); setInsightLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/chat/movie-insight", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
      const data = await res.json();
      const txt  = data.insight || data.message || "No AI insight available.";
      await typeText(txt, setAnimatedInsight); setInsight(txt);
    } catch { setInsight("Failed to generate insight."); }
    finally { setInsightLoading(false); }
  };

  const sendMessage = async (overrideText) => {
    const cur = (overrideText !== undefined ? overrideText : message).trim();
    if (!cur || loading) return;
    setMessage(""); setShowSuggestions(false);
    setMessages(prev => [...prev, { role: "user", text: cur }, { role: "typing" }]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 50));
    try {
      const res  = await fetch("http://localhost:5000/api/chat/movie-chat", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ message: cur }) });
      const data = await res.json();
      const reply = data.reply || data.query?.reply || data.message || "Here are some recommendations!";
      setMessages(prev => [...prev.filter(m => m.role !== "typing"), { role: "ai", text: "", movies: data.results || [] }]);
      let built = "";
      for (const w of reply.split(" ")) {
        built += w + " ";
        setMessages(prev => { const u = [...prev]; u[u.length-1] = { ...u[u.length-1], text: built }; return u; });
        await new Promise(r => setTimeout(r, 28));
      }
    } catch {
      setMessages(prev => [...prev.filter(m => m.role !== "typing"), { role: "ai", text: "Something went wrong. Please try again.", movies: [] }]);
    } finally { setLoading(false); }
  };

  const renderBold = (text) =>
    text?.split(/(\*\*.*?\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} style={{ color: "#f5c842", fontWeight: 700 }}>{p.slice(2, -2)}</strong>
        : p
    ) ?? "";

  const SkeletonCard = ({ variant }) => {
    const isRow = variant === "row";
    return isRow ? (
      <div style={{ minWidth: 158, width: 158, flexShrink: 0 }}>
        <div className="skeleton" style={{ width: 158, height: 238, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }} />
        <div className="skeleton" style={{ marginTop: 10, height: 13, borderRadius: 6, width: "80%" }} />
        <div className="skeleton" style={{ marginTop: 6,  height: 11, borderRadius: 6, width: "40%" }} />
      </div>
    ) : (
      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "#111" }}>
        <div className="skeleton" style={{ height: 260, width: "100%" }} />
        <div style={{ padding: "14px 14px 16px" }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 6, width: "85%", marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, borderRadius: 6, width: "55%", marginBottom: 12 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="skeleton" style={{ height: 11, borderRadius: 6, width: "30%" }} />
            <div className="skeleton" style={{ height: 11, borderRadius: 6, width: "20%" }} />
          </div>
        </div>
      </div>
    );
  };

  const MovieCard = ({ movie, variant }) => {
    const isRow = variant === "row";
    return (
      <div
        onClick={() => { setSelectedMovie(movie); setAnimatedInsight(""); setCinemaMode(false); fetchInsight(movie.title); }}
        className={isRow ? "trending-card" : "grid-card"}
        style={isRow ? { minWidth: 158, width: 158, flexShrink: 0, position: "relative", cursor: "pointer" } : { position: "relative", cursor: "pointer" }}
      >
        {isRow ? (
          <>
            <div className="card-poster-wrap row-poster">
              <img src={movie.poster} alt={movie.title} className="card-poster" />
              <div className="card-shine" />
              <div className="card-hover-overlay"><span className="card-play-btn">▶</span></div>
            </div>
            <div className="card-meta">
              <p className="card-title">{movie.title}</p>
              <p className="card-rating-text">★ {Number(movie.rating).toFixed(1)}</p>
            </div>
          </>
        ) : (
          <div className="grid-card-inner">
            <div className="card-poster-wrap grid-poster">
              <img src={movie.poster} alt={movie.title} className="card-poster" />
              <div className="card-shine" />
              <div className="card-hover-overlay"><span className="card-play-btn">▶</span></div>
            </div>
            <div className="grid-card-body">
              <h3 className="grid-card-title">{movie.title}</h3>
              <div className="grid-card-foot">
                <span className="card-rating-text">★ {Number(movie.rating).toFixed(1)}</span>
                <span className="grid-card-year">{movie.releaseDate?.slice(0, 4)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── NEW: Mini movie card for float drawer ── */
  const FloatMovieCard = ({ movie }) => (
    <div
      className="float-movie-card"
      onClick={() => { setFloatOpen(false); setSelectedMovie(movie); setAnimatedInsight(""); setCinemaMode(false); fetchInsight(movie.title); }}
    >
      {movie.poster && <img src={movie.poster} alt={movie.title} className="float-movie-poster" />}
      <div className="float-movie-info">
        <p className="float-movie-title">{movie.title}</p>
        <p className="float-movie-rating">★ {Number(movie.rating).toFixed(1)}</p>
      </div>
    </div>
  );

  const DfDropdown = ({ suggestions, activeIdx, onSelect, onHover }) => (
    <div className="df-dropdown">
      {suggestions.map((movie, i) => (
        <div key={movie.id} className={`df-drop-item${i === activeIdx ? " active" : ""}`}
          onMouseDown={() => onSelect(movie)} onMouseEnter={() => onHover(i)}>
          <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="df-drop-poster" />
          <div style={{ overflow: "hidden" }}>
            <p className="df-drop-title">{movie.title}</p>
            <p className="df-drop-meta">★ {Number(movie.vote_average).toFixed(1)}{movie.release_date && ` · ${movie.release_date.slice(0, 4)}`}</p>
          </div>
        </div>
      ))}
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="app-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #c9a227; --gold-lt: #f5c842; --gold-dk: #8b6914;
          --bg: #080808; --bg2: #0d0d0d; --bg3: #111111;
          --text: rgba(255,255,255,0.85); --text-muted: rgba(255,255,255,0.38);
          --border: rgba(255,255,255,0.07); --gold-border: rgba(201,162,39,0.25);
          --radius-card: 12px; --radius-modal: 22px;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0e0e0e; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(var(--gold), var(--gold-dk)); border-radius: 99px; }
        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.03; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 120px; }
        .app-root { min-height: 100vh; background: var(--bg); color: white; overflow-x: hidden; }

        /* ═══ SKELETON ═══ */
        .skeleton { background: linear-gradient(90deg, #1c1c1c 0%, #2a2a2a 40%, #1c1c1c 80%); background-size: 600px 100%; animation: shimmer 1.6s infinite linear; }
        @keyframes shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        .skeleton-row-wrap > div:nth-child(2) .skeleton { animation-delay: 0.1s; }
        .skeleton-row-wrap > div:nth-child(3) .skeleton { animation-delay: 0.2s; }
        .skeleton-row-wrap > div:nth-child(4) .skeleton { animation-delay: 0.3s; }
        .skeleton-row-wrap > div:nth-child(5) .skeleton { animation-delay: 0.4s; }
        .skeleton-row-wrap > div:nth-child(6) .skeleton { animation-delay: 0.5s; }
        .skeleton-row-wrap > div:nth-child(7) .skeleton { animation-delay: 0.6s; }
        .skeleton-row-wrap > div:nth-child(8) .skeleton { animation-delay: 0.7s; }
        .skeleton-grid-wrap > div:nth-child(2) .skeleton { animation-delay: 0.12s; }
        .skeleton-grid-wrap > div:nth-child(3) .skeleton { animation-delay: 0.24s; }
        .skeleton-grid-wrap > div:nth-child(4) .skeleton { animation-delay: 0.36s; }
        .skeleton-section-title { height: 23px; width: 160px; border-radius: 6px; margin-bottom: 26px; }
        .typing-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(184px, 1fr)); gap: 18px; margin-top: 18px; opacity: 0.6; }

        /* ═══ HERO ═══ */
        .hero { position: relative; background: linear-gradient(180deg, #0e0900 0%, var(--bg) 100%); padding: 60px 0 0; border-bottom: 1px solid var(--border); }
        .hero-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent 0%, var(--gold) 28%, var(--gold-lt) 50%, var(--gold) 72%, transparent 100%); }
        .hero-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .hero-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; opacity: 0.85; animation: fadeUp 0.65s ease both; }
        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(42px, 5.5vw, 70px); font-weight: 900; line-height: 1.04; letter-spacing: -0.025em; margin-bottom: 12px; background: linear-gradient(135deg, #fff 0%, #e8d58a 55%, var(--gold) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: fadeUp 0.65s 0.1s ease both; }
        .hero-sub { font-size: 15px; color: var(--text-muted); font-weight: 300; margin-bottom: 48px; animation: fadeUp 0.65s 0.2s ease both; }

        /* ═══ SEARCH ═══ */
        .searchbar { position: sticky; top: 0; z-index: 200; background: rgba(8,8,8,0.92); backdrop-filter: blur(28px) saturate(160%); -webkit-backdrop-filter: blur(28px) saturate(160%); border-bottom: 1px solid var(--border); padding: 13px 0; }
        .searchbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; display: flex; align-items: center; gap: 12px; }
        .search-wrap { position: relative; flex-grow: 1; max-width: 540px; }
        .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); opacity: 0.7; display: flex; align-items: center; pointer-events: none; z-index: 2; }
        .search-input { width: 100%; padding: 13px 16px 13px 46px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: white; font-size: 15px; font-family: 'DM Sans', sans-serif; transition: border-color 0.25s, box-shadow 0.25s; }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input:focus { outline: none; border-color: rgba(201,162,39,0.55); box-shadow: 0 0 0 3px rgba(201,162,39,0.07); }
        .send-btn { padding: 13px 30px; border-radius: 10px; border: 1px solid rgba(201,162,39,0.45); background: linear-gradient(135deg, var(--gold-lt) 0%, var(--gold) 100%); color: #0a0800; font-weight: 700; font-size: 13px; font-family: 'DM Sans', sans-serif; letter-spacing: 0.07em; text-transform: uppercase; cursor: pointer; transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.2s ease; white-space: nowrap; }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,162,39,0.38); }
        .send-btn:active:not(:disabled) { transform: translateY(0); }
        .send-btn:disabled { opacity: 0.52; cursor: not-allowed; }

        /* ═══ AUTOCOMPLETE ═══ */
        .autocomplete-dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #0f0f0f; border: 1px solid rgba(201,162,39,0.22); border-radius: 14px; overflow: hidden; z-index: 999; box-shadow: 0 24px 60px rgba(0,0,0,0.88); animation: dropIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .auto-item { display: flex; align-items: center; gap: 13px; padding: 10px 15px; cursor: pointer; transition: background 0.15s; border-left: 2px solid transparent; }
        .auto-item:hover, .auto-item.active { background: rgba(201,162,39,0.07); border-left-color: var(--gold); }
        .auto-item + .auto-item { border-top: 1px solid rgba(255,255,255,0.04); }
        .auto-poster { width: 34px; height: 51px; border-radius: 5px; object-fit: cover; flex-shrink: 0; background: #1a1a1a; }
        .auto-poster-placeholder { width: 34px; height: 51px; border-radius: 5px; background: #1a1a1a; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #333; }
        .auto-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.88); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
        .auto-meta { font-size: 12px; color: var(--gold); opacity: 0.8; }
        .auto-footer { padding: 7px 15px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 14px; }
        .auto-hint { font-size: 11px; color: rgba(255,255,255,0.22); display: flex; align-items: center; gap: 5px; }
        .auto-hint-key { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 1px 5px; font-size: 10px; color: rgba(255,255,255,0.35); }
        .search-icon.searching { animation: iconPulse 0.8s ease infinite alternate; }
        @keyframes iconPulse { from { opacity: 0.7; } to { opacity: 0.25; } }

        /* ═══ MAIN ═══ */
        .main { max-width: 1200px; margin: 0 auto; padding: 52px 48px 100px; }
        .section-label { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
        .section-bar { width: 4px; height: 24px; flex-shrink: 0; background: linear-gradient(180deg, var(--gold-lt), var(--gold-dk)); border-radius: 2px; }
        .section-title { font-family: 'Playfair Display', serif; font-size: 23px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }

        /* ═══ MOOD BOARD ═══ */
        .moodboard-wrap { margin-bottom: 60px; animation: fadeUp 0.55s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .moodboard-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); opacity: 0.7; margin-bottom: 10px; }
        .moodboard-heading { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.75); margin-bottom: 24px; }
        .mood-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .mood-tile { position: relative; overflow: hidden; border-radius: 16px; padding: 22px 20px 20px; cursor: pointer; border: 1px solid; transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s ease; display: flex; flex-direction: column; gap: 8px; min-height: 120px; }
        .mood-tile:hover { transform: translateY(-6px) scale(1.02); }
        .mood-tile.pressed { transform: scale(0.95); transition: transform 0.12s ease; }
        .mood-tile::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%); opacity: 0; transition: opacity 0.3s ease; pointer-events: none; border-radius: 16px; }
        .mood-tile:hover::after { opacity: 1; }
        .mood-icon { font-size: 26px; line-height: 1; }
        .mood-label { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.9); }
        .mood-desc { font-size: 11px; color: rgba(255,255,255,0.38); }
        .mood-arrow { position: absolute; bottom: 14px; right: 16px; font-size: 16px; color: rgba(255,255,255,0.25); transform: translateX(-4px); transition: transform 0.28s ease, color 0.28s ease, opacity 0.28s ease; opacity: 0; }
        .mood-tile:hover .mood-arrow { transform: translateX(0); color: rgba(255,255,255,0.55); opacity: 1; }

        /* ═══ DOUBLE FEATURE ═══ */
        .df-wrap { margin-bottom: 60px; background: linear-gradient(160deg, #0e0b00, #080808); border: 1px solid rgba(201,162,39,0.14); border-radius: 20px; padding: 32px 32px 28px; animation: fadeUp 0.55s 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; position: relative; overflow: hidden; }
        .df-wrap::before { content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,162,39,0.35), transparent); }
        .df-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); opacity: 0.7; margin-bottom: 8px; }
        .df-heading { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.82); margin-bottom: 6px; }
        .df-subhead { font-size: 13px; color: var(--text-muted); font-weight: 300; margin-bottom: 26px; }
        .df-inputs { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 14px; margin-bottom: 20px; }
        .df-input-wrap { position: relative; }
        .df-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.3); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
        .df-input { width: 100%; padding: 13px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; transition: border-color 0.25s, box-shadow 0.25s; }
        .df-input::placeholder { color: rgba(255,255,255,0.2); }
        .df-input:focus { outline: none; border-color: rgba(201,162,39,0.45); box-shadow: 0 0 0 3px rgba(201,162,39,0.06); }
        .df-connector { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 22px; }
        .df-connector-text { font-size: 10px; font-weight: 700; color: var(--gold); letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.6; }
        .df-connector-icon { font-size: 20px; color: rgba(201,162,39,0.4); }
        .df-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #0f0f0f; border: 1px solid rgba(201,162,39,0.2); border-radius: 12px; overflow: hidden; z-index: 500; box-shadow: 0 20px 50px rgba(0,0,0,0.9); animation: dropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .df-drop-item { display: flex; align-items: center; gap: 10px; padding: 9px 13px; cursor: pointer; transition: background 0.15s; border-left: 2px solid transparent; }
        .df-drop-item:hover, .df-drop-item.active { background: rgba(201,162,39,0.07); border-left-color: var(--gold); }
        .df-drop-item + .df-drop-item { border-top: 1px solid rgba(255,255,255,0.04); }
        .df-drop-poster { width: 28px; height: 42px; border-radius: 4px; object-fit: cover; flex-shrink: 0; }
        .df-drop-title { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .df-drop-meta { font-size: 11px; color: var(--gold); opacity: 0.75; }
        .df-actions { display: flex; align-items: center; gap: 12px; }
        .df-btn { padding: 12px 28px; border-radius: 10px; border: 1px solid rgba(201,162,39,0.45); background: linear-gradient(135deg, var(--gold-lt) 0%, var(--gold) 100%); color: #0a0800; font-weight: 700; font-size: 13px; font-family: 'DM Sans', sans-serif; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.2s; white-space: nowrap; }
        .df-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,162,39,0.38); }
        .df-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .df-reset-btn { padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: rgba(255,255,255,0.4); font-size: 12px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: color 0.2s, border-color 0.2s; }
        .df-reset-btn:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2); }
        .df-loading { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
        .df-loading-text { font-size: 13px; color: var(--text-muted); font-style: italic; }
        .df-result { margin-top: 24px; background: rgba(255,255,255,0.025); border: 1px solid rgba(201,162,39,0.18); border-radius: 16px; overflow: hidden; display: grid; grid-template-columns: auto 1fr; animation: fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .df-result-poster { width: 240px; flex-shrink: 0; cursor: pointer; position: relative; overflow: hidden; }
        .df-result-poster img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
        .df-result-poster:hover img { transform: scale(1.05); }
        .df-result-body { padding: 24px 26px; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
        .df-result-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); opacity: 0.7; }
        .df-result-title { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #fff; line-height: 1.2; cursor: pointer; }
        .df-result-title:hover { color: var(--gold-lt); }
        .df-result-meta { display: flex; align-items: center; gap: 12px; }
        .df-result-rating { color: var(--gold); font-weight: 700; font-size: 13px; }
        .df-result-year { color: var(--text-muted); font-size: 12px; }
        .df-result-reason { font-size: 14px; line-height: 1.75; color: rgba(255,255,255,0.58); font-weight: 300; font-style: italic; border-left: 2px solid rgba(201,162,39,0.3); padding-left: 14px; }
        .df-error { padding: 12px 16px; background: rgba(220,60,60,0.08); border: 1px solid rgba(220,60,60,0.18); border-radius: 10px; color: rgba(255,100,100,0.8); font-size: 13px; margin-top: 16px; }

        /* ═══ TRENDING ═══ */
        .trending-wrap { margin-bottom: 66px; }
        .trending-row-container { position: relative; }
        .row-fade-left, .row-fade-right { position: absolute; top: 0; bottom: 0; width: 80px; z-index: 10; pointer-events: none; }
        .row-fade-left  { left: 0;  background: linear-gradient(to right, var(--bg) 15%, transparent); }
        .row-fade-right { right: 0; background: linear-gradient(to left,  var(--bg) 15%, transparent); }
        .row-arrow { position: absolute; top: 0; bottom: 20px; width: 56px; z-index: 11; border: none; background: transparent; color: rgba(255,255,255,0.4); font-size: 32px; cursor: pointer; display: flex; align-items: center; transition: color 0.2s ease; padding: 0; }
        .row-arrow:hover { color: var(--gold-lt); }
        .row-arrow-left  { left: 0;  justify-content: flex-start; padding-left: 4px; }
        .row-arrow-right { right: 0; justify-content: flex-end;   padding-right: 4px; }
        .movie-row { display: flex; gap: 16px; overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none; -ms-overflow-style: none; padding: 14px 40px 22px; }
        .movie-row::-webkit-scrollbar { display: none; }

        /* ═══ CARDS ═══ */
        .card-poster-wrap { position: relative; overflow: hidden; background: #1a1a1a; }
        .row-poster  { width: 158px; height: 238px; border-radius: var(--radius-card); border: 1px solid rgba(255,255,255,0.08); }
        .grid-poster { height: 260px; }
        .card-poster { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .card-shine  { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 55%); pointer-events: none; }
        .card-meta   { margin-top: 10px; padding: 0 2px; }
        .card-title  { font-size: 13px; font-weight: 500; color: var(--text); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-rating-text { font-size: 12px; color: var(--gold); margin-top: 4px; font-weight: 600; }
        .trending-card { transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1); }
        .trending-card:hover { transform: translateY(-8px) scale(1.03); }
        .trending-card:hover .card-poster { transform: scale(1.07); }
        .trending-card:hover .row-poster  { box-shadow: 0 18px 40px rgba(0,0,0,0.8), 0 0 0 1px var(--gold-border); }
        .grid-card { transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1); }
        .grid-card:hover { transform: translateY(-7px); }
        .grid-card:hover .card-poster { transform: scale(1.06); }
        .grid-card-inner { border-radius: var(--radius-card); overflow: hidden; background: var(--bg3); border: 1px solid var(--border); box-shadow: 0 8px 32px rgba(0,0,0,0.5); transition: border-color 0.35s ease, box-shadow 0.35s ease; }
        .grid-card:hover .grid-card-inner { border-color: var(--gold-border); box-shadow: 0 22px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,162,39,0.18); }
        .card-hover-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.3s ease; }
        .grid-card:hover .card-hover-overlay, .trending-card:hover .card-hover-overlay { background: rgba(0,0,0,0.38); }
        .card-play-btn { width: 46px; height: 46px; border-radius: 50%; background: rgba(201,162,39,0.92); display: flex; align-items: center; justify-content: center; font-size: 16px; color: #000; padding-left: 3px; transform: scale(0); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .grid-card:hover .card-play-btn, .trending-card:hover .card-play-btn { transform: scale(1); }
        .grid-card-body  { padding: 14px 14px 16px; }
        .grid-card-title { font-size: 14px; font-weight: 600; color: #fff; line-height: 1.35; margin-bottom: 8px; letter-spacing: 0.01em; }
        .grid-card-foot  { display: flex; justify-content: space-between; align-items: center; }
        .grid-card-year  { font-size: 11px; color: var(--text-muted); }

        /* ═══ DIVIDER ═══ */
        .section-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(201,162,39,0.18) 40%, rgba(201,162,39,0.18) 60%, transparent); margin-bottom: 52px; }

        /* ═══ MESSAGES ═══ */
        .msg-enter { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .user-row { text-align: right; margin-bottom: 20px; scroll-margin-top: 130px; }
        .user-bubble { display: inline-block; background: linear-gradient(135deg, #1a1200, #271d00); border: 1px solid rgba(201,162,39,0.28); color: var(--gold-lt); padding: 11px 18px; border-radius: 18px 18px 4px 18px; font-size: 15px; font-weight: 500; box-shadow: 0 4px 18px rgba(201,162,39,0.1); }
        .typing-row { margin-bottom: 20px; scroll-margin-top: 130px; }
        .typing-bubble { display: inline-block; background: rgba(16,12,0,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(201,162,39,0.1); padding: 16px 22px; border-radius: 14px; }
        .typing-dots { display: flex; gap: 6px; align-items: center; height: 14px; }
        .typing-dots span { width: 7px; height: 7px; background: var(--gold); border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-5px); opacity: 1; } }
        .ai-box { background: linear-gradient(160deg, rgba(17,17,17,0.98), rgba(10,10,10,0.99)); border: 1px solid var(--border); border-radius: 18px; box-shadow: 0 8px 40px rgba(0,0,0,0.5); padding: 28px 30px; margin-bottom: 40px; scroll-margin-top: 130px; }
        .ai-label { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
        .ai-dot { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--gold), var(--gold-dk)); display: flex; align-items: center; justify-content: center; font-size: 12px; color: #000; }
        .ai-label-text { font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 0.12em; text-transform: uppercase; }
        .ai-text { font-size: 15px; line-height: 1.78; color: rgba(255,255,255,0.66); font-weight: 300; margin-bottom: 24px; }
        .movies-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(184px, 1fr)); gap: 18px; }

        /* ═══ MODAL + CINEMA ═══ */
        .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); animation: fadeIn 0.25s ease both; padding: 20px; transition: background 0.6s ease; }
        .modal-overlay.cinema-active { background: rgba(0,0,0,0.97); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ambient-glow { position: absolute; width: 900px; height: 900px; border-radius: 50%; pointer-events: none; opacity: 0; transform: scale(0.6); transition: opacity 0.9s ease, transform 0.9s ease; filter: blur(120px); z-index: 0; }
        .modal-overlay.cinema-active .ambient-glow { opacity: 0.22; transform: scale(1); }
        .modal-content { position: relative; z-index: 1; background: linear-gradient(160deg, #111008, #0a0a0a); border: 1px solid rgba(201,162,39,0.18); border-radius: var(--radius-modal); padding: 36px; max-width: 840px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 52px 100px rgba(0,0,0,0.88); animation: modalIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; transition: max-width 0.55s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.55s ease, border-color 0.55s ease; }
        .modal-overlay.cinema-active .modal-content { max-width: 1060px; border-color: rgba(var(--ambient-rgb), 0.3); box-shadow: 0 0 0 1px rgba(var(--ambient-rgb), 0.15), 0 60px 120px rgba(0,0,0,0.95), 0 0 80px rgba(var(--ambient-rgb), 0.08); }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(24px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.55); font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s, transform 0.3s ease; }
        .modal-close:hover { background: rgba(201,162,39,0.18); color: var(--gold-lt); transform: rotate(90deg) scale(1.1); }
        .cinema-btn { position: absolute; top: 16px; right: 60px; height: 34px; padding: 0 14px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); font-size: 11px; font-weight: 700; font-family: 'DM Sans', sans-serif; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: background 0.25s, color 0.25s, border-color 0.25s, box-shadow 0.25s; white-space: nowrap; }
        .cinema-btn:hover { background: rgba(201,162,39,0.12); border-color: rgba(201,162,39,0.4); color: var(--gold-lt); }
        .cinema-btn.active { background: rgba(var(--ambient-rgb), 0.15); border-color: rgba(var(--ambient-rgb), 0.5); color: rgb(var(--ambient-rgb)); box-shadow: 0 0 16px rgba(var(--ambient-rgb), 0.2); }
        .cinema-btn-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; transition: transform 0.3s ease; }
        .cinema-btn.active .cinema-btn-dot { transform: scale(1.4); }
        .modal-trailer { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 22px; transition: border-color 0.55s ease, box-shadow 0.55s ease; }
        .modal-overlay.cinema-active .modal-trailer { border-color: rgba(var(--ambient-rgb), 0.2); box-shadow: 0 0 40px rgba(var(--ambient-rgb), 0.12); }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; letter-spacing: -0.015em; margin-bottom: 8px; padding-right: 44px; color: #fff; }
        .modal-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .modal-rating-text { color: var(--gold); font-weight: 700; font-size: 14px; }
        .modal-sep  { width: 1px; height: 14px; background: rgba(255,255,255,0.15); }
        .modal-year { color: var(--text-muted); font-size: 13px; }
        .modal-overview { font-size: 15px; line-height: 1.82; color: rgba(255,255,255,0.56); font-weight: 300; margin-bottom: 24px; transition: opacity 0.4s ease; }
        .modal-overlay.cinema-active .modal-overview { opacity: 0.7; }
        .insight-block { background: linear-gradient(135deg, rgba(201,162,39,0.055), rgba(139,105,20,0.03)); border: 1px solid rgba(201,162,39,0.18); border-left: 3px solid var(--gold); padding: 20px 22px; border-radius: 0 12px 12px 0; }
        .insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .insight-label { font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 0.13em; text-transform: uppercase; }
        .insight-loading { display: flex; align-items: center; gap: 12px; height: 24px; }
        .insight-loading-text { color: var(--text-muted); font-style: italic; font-size: 13px; }
        .insight-text { font-size: 14px; line-height: 1.78; color: rgba(255,255,255,0.62); font-weight: 300; }

        /* ═══════════════════════════════════════════════════
           NEW: FLOATING AI BUTTON + DRAWER
        ═══════════════════════════════════════════════════ */

        /* ── Floating button ── */
        .float-btn {
          position: fixed; bottom: 32px; right: 32px; z-index: 800;
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, var(--gold-lt), var(--gold));
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 32px rgba(201,162,39,0.45), 0 0 0 0 rgba(201,162,39,0.3);
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
          animation: floatPulse 3s ease-in-out infinite;
        }
        .float-btn:hover {
          transform: scale(1.1) translateY(-3px);
          box-shadow: 0 16px 44px rgba(201,162,39,0.55), 0 0 0 8px rgba(201,162,39,0.08);
          animation: none;
        }
        .float-btn.open {
          transform: scale(0.92);
          animation: none;
          box-shadow: 0 4px 16px rgba(201,162,39,0.3);
        }
        @keyframes floatPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(201,162,39,0.45), 0 0 0 0 rgba(201,162,39,0.3); }
          50%       { box-shadow: 0 8px 32px rgba(201,162,39,0.45), 0 0 0 10px rgba(201,162,39,0); }
        }

        /* context badge — shows when a movie is open */
        .float-badge {
          position: absolute; top: -4px; right: -4px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #f5c842; border: 2px solid #080808;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800; color: #0a0800;
          animation: badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes badgePop { from { transform: scale(0); } to { transform: scale(1); } }

        /* ── Drawer ── */
        .float-drawer {
          position: fixed; bottom: 104px; right: 32px; z-index: 800;
          width: 380px;
          background: linear-gradient(160deg, #0f0e0a, #0a0a0a);
          border: 1px solid rgba(201,162,39,0.2);
          border-radius: 20px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.92), 0 0 0 1px rgba(255,255,255,0.03);
          display: flex; flex-direction: column;
          overflow: hidden;
          transform-origin: bottom right;
          animation: drawerIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both;
          max-height: 520px;
        }
        @keyframes drawerIn {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .float-drawer-exit {
          animation: drawerOut 0.22s cubic-bezier(0.4, 0, 1, 1) both;
        }
        @keyframes drawerOut {
          to { opacity: 0; transform: scale(0.9) translateY(12px); }
        }

        /* drawer header */
        .float-header {
          padding: 16px 18px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .float-header-left { display: flex; align-items: center; gap: 10px; }
        .float-header-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--gold);
          box-shadow: 0 0 8px rgba(201,162,39,0.6);
          animation: dotBlink 2s ease-in-out infinite;
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .float-header-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.85); letter-spacing: 0.02em; }
        .float-header-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
        .float-header-actions { display: flex; align-items: center; gap: 6px; }
        .float-icon-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .float-icon-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
        .float-icon-btn.danger:hover { background: rgba(220,60,60,0.12); color: rgba(255,100,100,0.8); border-color: rgba(220,60,60,0.2); }

        /* drawer body — scrollable message area */
        .float-body {
          flex: 1; overflow-y: auto; padding: 16px 16px 8px;
          display: flex; flex-direction: column; gap: 12px;
          scrollbar-width: thin; scrollbar-color: rgba(201,162,39,0.2) transparent;
        }
        .float-body::-webkit-scrollbar { width: 3px; }
        .float-body::-webkit-scrollbar-thumb { background: rgba(201,162,39,0.2); border-radius: 99px; }

        /* empty state inside drawer */
        .float-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 10px; padding: 32px 16px; text-align: center;
        }
        .float-empty-icon { color: rgba(201,162,39,0.25); }
        .float-empty-text { font-size: 13px; color: var(--text-muted); line-height: 1.6; }
        .float-empty-hint {
          font-size: 11px; color: rgba(201,162,39,0.4);
          background: rgba(201,162,39,0.05); border: 1px solid rgba(201,162,39,0.1);
          border-radius: 8px; padding: 6px 12px; margin-top: 4px;
        }

        /* individual drawer messages */
        .float-msg-user {
          align-self: flex-end;
          background: linear-gradient(135deg, #1a1200, #271d00);
          border: 1px solid rgba(201,162,39,0.22);
          color: var(--gold-lt); padding: 9px 14px;
          border-radius: 14px 14px 3px 14px;
          font-size: 13px; font-weight: 500; max-width: 84%;
          line-height: 1.5;
          animation: fadeUp 0.3s ease both;
        }
        .float-msg-ai {
          align-self: flex-start; max-width: 92%;
          animation: fadeUp 0.3s ease both;
        }
        .float-msg-ai-bubble {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 3px 14px 14px 14px;
          padding: 10px 14px; font-size: 13px;
          color: rgba(255,255,255,0.72); line-height: 1.65;
          margin-bottom: 8px;
        }

        /* mini movie grid inside drawer */
        .float-movies-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
        }
        .float-movie-card {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px; padding: 8px; cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .float-movie-card:hover { background: rgba(201,162,39,0.06); border-color: rgba(201,162,39,0.2); }
        .float-movie-poster { width: 32px; height: 48px; border-radius: 5px; object-fit: cover; flex-shrink: 0; background: #1a1a1a; }
        .float-movie-info { overflow: hidden; }
        .float-movie-title { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .float-movie-rating { font-size: 10px; color: var(--gold); }

        /* drawer typing indicator */
        .float-typing {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 2px;
        }
        .float-typing-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--gold);
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .float-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .float-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        .float-typing-dot:nth-child(3) { animation-delay: 0s; }

        /* drawer input row */
        .float-input-row {
          padding: 12px 14px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 8px;
          flex-shrink: 0;
        }
        .float-input {
          flex: 1; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 10px 14px;
          color: white; font-size: 13px; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .float-input::placeholder { color: rgba(255,255,255,0.2); }
        .float-input:focus { outline: none; border-color: rgba(201,162,39,0.4); box-shadow: 0 0 0 3px rgba(201,162,39,0.06); }
        .float-send-btn {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--gold-lt), var(--gold));
          border: none; cursor: pointer; color: #0a0800;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s ease, opacity 0.2s;
        }
        .float-send-btn:hover:not(:disabled) { transform: scale(1.08); }
        .float-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .mood-grid { grid-template-columns: repeat(2, 1fr); }
          .df-inputs { grid-template-columns: 1fr; }
          .df-connector { flex-direction: row; padding-top: 0; }
        }
        @media (max-width: 768px) {
          .hero-inner, .searchbar-inner, .main { padding-left: 20px; padding-right: 20px; }
          .modal-content { padding: 24px; }
          .movies-grid { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); }
          .typing-skeleton-grid { grid-template-columns: repeat(2, 1fr); }
          .cinema-btn { display: none; }
          .mood-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .df-wrap { padding: 22px 18px; }
          .df-result { grid-template-columns: 1fr; }
          .df-result-poster { width: 100%; height: 180px; }
          .float-drawer { width: calc(100vw - 40px); right: 20px; bottom: 96px; }
          .float-btn { bottom: 24px; right: 20px; }
        }
      `}</style>

      <div className="grain" />

      {/* ═══════════ HERO ═══════════ */}
      <header className="hero">
        <div className="hero-line" />
        <div className="hero-inner">
          <p className="hero-eyebrow">◈ AI-Powered Discovery</p>
          <h1 className="hero-title">Smart Movie<br />Explorer</h1>
          <p className="hero-sub">Discover, explore, and uncover cinematic gems with AI</p>
        </div>
      </header>

      {/* ═══════════ STICKY SEARCH ═══════════ */}
      <div className="searchbar">
        <div className="searchbar-inner">
          <div className="search-wrap" ref={searchRef}>
            <span className={`search-icon${isSearching ? " searching" : ""}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input type="text" className="search-input" placeholder="Ask for movies, genres, moods…"
              value={message} onChange={e => setMessage(e.target.value)} onKeyDown={handleKeyDown} autoComplete="off" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {suggestions.map((movie, i) => (
                  <div key={movie.id} className={`auto-item${i === activeIndex ? " active" : ""}`}
                    onMouseDown={() => selectSuggestion(movie)} onMouseEnter={() => setActiveIndex(i)}>
                    {movie.poster_path
                      ? <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="auto-poster" />
                      : <div className="auto-poster-placeholder">🎬</div>}
                    <div style={{ overflow: "hidden" }}>
                      <p className="auto-title">{movie.title}</p>
                      <p className="auto-meta">★ {Number(movie.vote_average).toFixed(1)}{movie.release_date && ` · ${movie.release_date.slice(0,4)}`}</p>
                    </div>
                  </div>
                ))}
                <div className="auto-footer">
                  <span className="auto-hint"><span className="auto-hint-key">↑↓</span> navigate</span>
                  <span className="auto-hint"><span className="auto-hint-key">↵</span> select</span>
                  <span className="auto-hint"><span className="auto-hint-key">esc</span> close</span>
                </div>
              </div>
            )}
          </div>
          <button className="send-btn" onClick={() => sendMessage()} disabled={loading}>
            {loading ? "…" : "Search"}
          </button>
        </div>
      </div>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="main">

        {/* ── MOOD BOARD ── */}
        {showMoodBoard && (
          <div className="moodboard-wrap">
            <p className="moodboard-eyebrow">◈ Pick a vibe</p>
            <p className="moodboard-heading">What are you in the mood for?</p>
            <div className="mood-grid">
              {MOODS.map((mood, idx) => {
                const Icon = mood.icon;
                return (
                  <div key={idx} className={`mood-tile${activeMoodIdx === idx ? " pressed" : ""}`}
                    style={{ background: mood.gradient, borderColor: mood.border, boxShadow: `0 8px 32px ${mood.glow}` }}
                    onClick={() => fireMood(mood, idx)}>
                    <span className="mood-icon"><Icon size={28} strokeWidth={1.5} color="white" /></span>
                    <span className="mood-label">{mood.label}</span>
                    <span className="mood-desc">{mood.description}</span>
                    <span className="mood-arrow">→</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DOUBLE FEATURE ── */}
        {showMoodBoard && (
          <div className="df-wrap">
            <p className="df-eyebrow">◈ AI matchmaking</p>
            <p className="df-heading">Find your perfect bridge film</p>
            <p className="df-subhead">Love two movies? Tell us — we'll find the one film that sits at the intersection of both.</p>
            <div className="df-inputs">
              <div className="df-input-wrap" ref={dfWrapA}>
                <p className="df-label">First film you love</p>
                <input className="df-input" placeholder="e.g. The Dark Knight" value={dfMovieA}
                  onChange={e => setDfMovieA(e.target.value)}
                  onKeyDown={e => dfKeyDown(e, dfSuggestionsA, dfActiveA, setDfActiveA, setDfShowA, setDfMovieA, dfShowA)}
                  autoComplete="off" />
                {dfShowA && dfSuggestionsA.length > 0 && (
                  <DfDropdown suggestions={dfSuggestionsA} activeIdx={dfActiveA}
                    onSelect={m => { setDfMovieA(m.title); setDfShowA(false); setDfActiveA(-1); }}
                    onHover={setDfActiveA} />
                )}
              </div>
              <div className="df-connector">
                <span className="df-connector-icon">✦</span>
                <span className="df-connector-text">and</span>
              </div>
              <div className="df-input-wrap" ref={dfWrapB}>
                <p className="df-label">Second film you love</p>
                <input className="df-input" placeholder="e.g. Parasite" value={dfMovieB}
                  onChange={e => setDfMovieB(e.target.value)}
                  onKeyDown={e => dfKeyDown(e, dfSuggestionsB, dfActiveB, setDfActiveB, setDfShowB, setDfMovieB, dfShowB)}
                  autoComplete="off" />
                {dfShowB && dfSuggestionsB.length > 0 && (
                  <DfDropdown suggestions={dfSuggestionsB} activeIdx={dfActiveB}
                    onSelect={m => { setDfMovieB(m.title); setDfShowB(false); setDfActiveB(-1); }}
                    onHover={setDfActiveB} />
                )}
              </div>
            </div>
            <div className="df-actions">
              <button className="df-btn" disabled={!dfMovieA.trim() || !dfMovieB.trim() || dfLoading} onClick={runDoubleFeature}>
                {dfLoading ? "Finding…" : "Find My Bridge Film →"}
              </button>
              {(dfResult || dfError || dfMovieA || dfMovieB) && (
                <button className="df-reset-btn" onClick={resetDf}>Reset</button>
              )}
            </div>
            {dfLoading && (
              <div className="df-loading" style={{ marginTop: 20 }}>
                <div className="typing-dots"><span /><span /><span /></div>
                <span className="df-loading-text">Analyzing the DNA of both films…</span>
              </div>
            )}
            {dfError && <div className="df-error">⚠ {dfError}</div>}
            {dfResult && !dfLoading && (
              <div className="df-result">
                <div className="df-result-poster"
                  onClick={() => { setSelectedMovie(dfResult.movie); setAnimatedInsight(""); setCinemaMode(false); fetchInsight(dfResult.movie.title); }}>
                  <img src={dfResult.movie.poster} alt={dfResult.movie.title} />
                </div>
                <div className="df-result-body">
                  <p className="df-result-eyebrow">✦ Your bridge film</p>
                  <p className="df-result-title"
                    onClick={() => { setSelectedMovie(dfResult.movie); setAnimatedInsight(""); setCinemaMode(false); fetchInsight(dfResult.movie.title); }}>
                    {dfResult.movie.title}
                  </p>
                  <div className="df-result-meta">
                    <span className="df-result-rating">★ {Number(dfResult.movie.rating).toFixed(1)}</span>
                    <span className="df-result-year">{dfResult.movie.releaseDate?.slice(0, 4)}</span>
                  </div>
                  <p className="df-result-reason">{dfResult.reason}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRENDING ── */}
        <div className="trending-wrap">
          <div className="section-label">
            <div className="section-bar" />
            {trendingLoading ? <div className="skeleton skeleton-section-title" /> : <h2 className="section-title">Trending Now</h2>}
          </div>
          {trendingLoading ? (
            <div className="movie-row skeleton-row-wrap" style={{ paddingTop: 14, paddingBottom: 22 }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={`sk-row-${i}`} variant="row" />)}
            </div>
          ) : trending.length > 0 ? (
            <div className="trending-row-container" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              <div className="row-fade-left" /><div className="row-fade-right" />
              <button className="row-arrow row-arrow-left" onClick={() => scrollRow("left")} aria-label="Scroll left">‹</button>
              <button className="row-arrow row-arrow-right" onClick={() => scrollRow("right")} aria-label="Scroll right">›</button>
              <div className="movie-row" ref={rowRef}>
                {trending.map((movie, i) => <MovieCard key={`tr-${i}`} movie={movie} variant="row" />)}
              </div>
            </div>
          ) : null}
        </div>

        {/* ── DIVIDER ── */}
        {!trendingLoading && messages.some(m => m.role !== "typing") && <div className="section-divider" />}

        {/* ── MESSAGES ── */}
        {messages.map((msg, i) => {
          if (msg.role === "user") return (
            <div key={i} id={`msg-${i}`} className="user-row msg-enter">
              <span className="user-bubble">{msg.text}</span>
            </div>
          );
          if (msg.role === "typing") return (
            <div key={i} id="typing-dots" className="typing-row msg-enter">
              <div className="typing-bubble"><div className="typing-dots"><span /><span /><span /></div></div>
              <div className="typing-skeleton-grid skeleton-grid-wrap">
                {Array.from({ length: 4 }).map((_, j) => <SkeletonCard key={`sk-grid-${j}`} variant="grid" />)}
              </div>
            </div>
          );
          if (msg.role === "ai") return (
            <div key={i} id={`msg-${i}`} className="ai-box msg-enter">
              <div className="ai-label">
                <div className="ai-dot">✦</div>
                <span className="ai-label-text">AI Recommendation</span>
              </div>
              {msg.text && <p className="ai-text">{renderBold(msg.text)}</p>}
              {msg.movies?.length > 0 && (
                <div className="movies-grid">
                  {msg.movies.map((m, j) => <MovieCard key={`ai-${j}`} movie={m} variant="grid" />)}
                </div>
              )}
            </div>
          );
          return null;
        })}
      </main>

      {/* ═══════════ MODAL ═══════════ */}
      {selectedMovie && (
        <div className={`modal-overlay${cinemaMode ? " cinema-active" : ""}`}
          style={{ "--ambient-rgb": ambientColor }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="ambient-glow" style={{ background: `rgb(${ambientColor})` }} />
          <div className="modal-content" style={{ "--ambient-rgb": ambientColor }}>
            {selectedMovie.trailer && (
              <button className={`cinema-btn${cinemaMode ? " active" : ""}`} style={{ "--ambient-rgb": ambientColor }}
                onClick={cinemaMode ? exitCinema : enterCinema}>
                <span className="cinema-btn-dot" />
                {cinemaMode ? "Exit Cinema" : "Cinema Mode"}
              </button>
            )}
            <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            <h2 className="modal-title">{selectedMovie.title}</h2>
            <div className="modal-meta">
              <span className="modal-rating-text">★ {Number(selectedMovie.rating).toFixed(1)}</span>
              <span className="modal-sep" />
              <span className="modal-year">{selectedMovie.releaseDate}</span>
            </div>
            {selectedMovie.trailer && (
              <div className="modal-trailer">
                <iframe width="100%" height={cinemaMode ? 540 : 400}
                  src={`https://www.youtube.com/embed/${selectedMovie.trailer}`}
                  title="Trailer" frameBorder="0" allowFullScreen
                  style={{ transition: "height 0.55s cubic-bezier(0.16, 1, 0.3, 1)", display: "block" }} />
              </div>
            )}
            {selectedMovie.overview && <p className="modal-overview">{selectedMovie.overview}</p>}
            {(insightLoading || insight) && (
              <div className="insight-block">
                <div className="insight-header">
                  <span style={{ fontSize: 14, color: "var(--gold)" }}>✦</span>
                  <h3 className="insight-label">AI Insight</h3>
                </div>
                {insightLoading ? (
                  <div className="insight-loading">
                    <div className="typing-dots"><span /><span /><span /></div>
                    <span className="insight-loading-text">Analyzing cinematic data…</span>
                  </div>
                ) : (
                  <p className="insight-text">{renderBold(animatedInsight || insight)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          NEW: FLOATING AI BUTTON + DRAWER
      ══════════════════════════════════════════════════════════ */}
      <div ref={floatRef}>

        {/* ── Drawer (rendered above button) ── */}
        {floatOpen && (
          <div className="float-drawer">

            {/* Header */}
            <div className="float-header">
              <div className="float-header-left">
                <div className="float-header-dot" />
                <div>
                  <p className="float-header-title">Ask Anything</p>
                  <p className="float-header-sub">
                    {selectedMovie ? `Chatting about ${selectedMovie.title}` : "Your AI movie companion"}
                  </p>
                </div>
              </div>
              <div className="float-header-actions">
                {floatMessages.length > 0 && (
                  <button className="float-icon-btn danger" title="Clear chat"
                    onClick={() => setFloatMessages([])}>
                    <Trash2 size={13} />
                  </button>
                )}
                <button className="float-icon-btn" title="Close" onClick={() => setFloatOpen(false)}>
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Messages body */}
            <div className="float-body" ref={floatBodyRef}>
              {floatMessages.length === 0 ? (
                <div className="float-empty">
                  <MessageCircle size={32} className="float-empty-icon" strokeWidth={1.5} color="rgba(201,162,39,0.25)" />
                  <p className="float-empty-text">
                    {selectedMovie
                      ? `Ask me anything about ${selectedMovie.title} — cast, director, themes, similar films.`
                      : "Ask me about any movie, director, genre, or get a personalized recommendation."}
                  </p>
                  {selectedMovie && (
                    <p className="float-empty-hint">Try: "What makes this film special?"</p>
                  )}
                </div>
              ) : (
                floatMessages.map((msg, i) => {
                  if (msg.role === "user") return (
                    <div key={i} className="float-msg-user">{msg.text}</div>
                  );
                  if (msg.role === "typing") return (
                    <div key={i} className="float-typing">
                      <div className="float-typing-dot" />
                      <div className="float-typing-dot" />
                      <div className="float-typing-dot" />
                    </div>
                  );
                  if (msg.role === "ai") return (
                    <div key={i} className="float-msg-ai">
                      {msg.text && (
                        <div className="float-msg-ai-bubble">{renderBold(msg.text)}</div>
                      )}
                      {msg.movies?.length > 0 && (
                        <div className="float-movies-grid">
                          {msg.movies.slice(0, 4).map((m, j) => (
                            <FloatMovieCard key={j} movie={m} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                  return null;
                })
              )}
            </div>

            {/* Input row */}
            <div className="float-input-row">
              <input
                ref={floatInputRef}
                className="float-input"
                placeholder={selectedMovie ? `Ask about ${selectedMovie.title}…` : "Ask about any movie…"}
                value={floatInput}
                onChange={e => setFloatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !floatLoading) sendFloatMessage(); }}
                autoComplete="off"
              />
              <button className="float-send-btn" onClick={() => sendFloatMessage()} disabled={floatLoading || !floatInput.trim()}>
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Floating button ── */}
        <button
          className={`float-btn${floatOpen ? " open" : ""}`}
          onClick={() => setFloatOpen(o => !o)}
          title="Ask AI anything"
          aria-label="Open AI chat"
        >
          {floatOpen
            ? <X size={22} color="#0a0800" strokeWidth={2.5} />
            : <MessageCircle size={22} color="#0a0800" strokeWidth={2.5} />
          }
          {/* context badge when a movie is open */}
          {!floatOpen && selectedMovie && (
            <span className="float-badge">✦</span>
          )}
        </button>
      </div>

    </div>
  );
}