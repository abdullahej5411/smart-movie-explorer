"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [animatedInsight, setAnimatedInsight] = useState("");
  const [playingTrailerId, setPlayingTrailerId] = useState(null);
  const [playingMovie, setPlayingMovie] = useState(null);
  const [popoutStyle, setPopoutStyle] = useState({});
  const [selectedMovie, setSelectedMovie] = useState(null);
  const hoverTimerRef = useRef(null);
  const rowRef = useRef(null);
  const [hoveredMovie, setHoveredMovie] = useState(null);

  // ── NEW: Autocomplete state ──
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // ── NEW: Debounced autocomplete fetch ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = message.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/movies/search?query=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        const results = (Array.isArray(data) ? data : [])
          .filter((m) => m.poster_path)
          .slice(0, 6);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [message]);

  // ── NEW: Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── NEW: Keyboard navigation handler ──
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === "Enter" && !loading) sendMessage();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        setShowSuggestions(false);
        sendMessage();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  // ── NEW: Select a suggestion and fire search ──
  const selectSuggestion = (movie) => {
    setShowSuggestions(false);
    setActiveIndex(-1);
    sendMessage(movie.title);
  };

  /* ─────────────────────────────────────────────────────────
     FIXED-POSITION POPOUT
  ───────────────────────────────────────────────────────── */
  const handleCardMouseEnter = (e, movie) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const PW = 460, PH = 310;
    let left = rect.left + rect.width / 2 - PW / 2;
    let top = rect.top + rect.height / 2 - PH / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - PW - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - PH - 12));
    setPopoutStyle({ top, left, width: PW, height: PH });

    clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setPlayingTrailerId(movie.tmdbId);
      setPlayingMovie(movie);
    }, 1000);
  };

  const handleCardMouseLeave = () => {
    clearTimeout(hoverTimerRef.current);
    setPlayingTrailerId(null);
    setPlayingMovie(null);
    setHoveredMovie(null);
  };

  /* ─── ROW SCROLL ─── */
  const scrollRow = (dir) => {
    if (!rowRef.current) return;
    const { scrollLeft, clientWidth } = rowRef.current;
    rowRef.current.scrollTo({
      left:
        dir === "left"
          ? scrollLeft - clientWidth * 0.75
          : scrollLeft + clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  /* ─── AUTO-SCROLL ROW ─── */
  useEffect(() => {
    if (isHovered || trending.length === 0) return;
    const id = setInterval(() => {
      if (!rowRef.current) return;
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10)
        rowRef.current.scrollTo({ left: 0, behavior: "smooth" });
      else scrollRow("right");
    }, 3400);
    return () => clearInterval(id);
  }, [isHovered, trending]);

  /* ─── SCROLL TO LATEST MSG ─── */
  useEffect(() => {
    const go = (id) => {
      const el = document.getElementById(id);
      if (el)
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - 130,
          behavior: "smooth",
        });
    };
    if (loading) go("typing-dots");
    if (!loading && messages.length > 0)
      setTimeout(() => go(`msg-${messages.length - 1}`), 160);
  }, [loading, messages.length]);

  /* ─── FETCH TRENDING ─── */
  useEffect(() => {
    fetch("http://localhost:5000/api/movies/trending")
      .then((r) => r.json())
      .then((d) => setTrending(d.movies || []))
      .catch(console.error);
  }, []);

  /* ─── TYPEWRITER ─── */
  const typeText = async (text, setter) => {
    setter("");
    let cur = "";
    for (const w of text.split(" ")) {
      cur += w + " ";
      setter(cur);
      await new Promise((r) => setTimeout(r, 28));
    }
  };

  /* ─── FETCH INSIGHT ─── */
  const fetchInsight = async (title) => {
    setInsight("");
    setAnimatedInsight("");
    setInsightLoading(true);
    try {
      const res = await fetch(
        "http://localhost:5000/api/chat/movie-insight",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );
      const data = await res.json();
      const txt = data.insight || data.message || "No AI insight available.";
      await typeText(txt, setAnimatedInsight);
      setInsight(txt);
    } catch {
      setInsight("Failed to generate insight.");
    } finally {
      setInsightLoading(false);
    }
  };

  /* ─── SEND MESSAGE — now accepts optional override text ─── */
  const sendMessage = async (overrideText) => {
    const cur = (overrideText !== undefined ? overrideText : message).trim();
    if (!cur || loading) return;
    setMessage("");
    setShowSuggestions(false);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: cur },
      { role: "typing" },
    ]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const res = await fetch(
        "http://localhost:5000/api/chat/movie-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ message: cur }),
        }
      );
      const data = await res.json();
      const reply =
        data.reply ||
        data.query?.reply ||
        data.message ||
        "Here are some recommendations!";
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "typing"),
        { role: "ai", text: "", movies: data.results || [] },
      ]);
      let built = "";
      for (const w of reply.split(" ")) {
        built += w + " ";
        setMessages((prev) => {
          const u = [...prev];
          u[u.length - 1] = { ...u[u.length - 1], text: built };
          return u;
        });
        await new Promise((r) => setTimeout(r, 28));
      }
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "typing"),
        {
          role: "ai",
          text: "Something went wrong. Please try again.",
          movies: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ─── BOLD RENDERER ─── */
  const renderBold = (text) =>
    text
      ?.split(/(\*\*.*?\*\*)/g)
      .map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ color: "#f5c842", fontWeight: 700 }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          p
        )
      ) ?? "";

  /* ─── REUSABLE MOVIE CARD ─── */
  const MovieCard = ({ movie, variant }) => {
    const isRow = variant === "row";
    return (
      <div
        onClick={() => {
          setSelectedMovie(movie);
          setAnimatedInsight("");
          fetchInsight(movie.title);
        }}
        className={isRow ? "trending-card" : "grid-card"}
        style={
          isRow
            ? {
                minWidth: 158,
                width: 158,
                flexShrink: 0,
                position: "relative",
                cursor: "pointer",
              }
            : { position: "relative", cursor: "pointer" }
        }
      >
        {isRow ? (
          <>
            <div className="card-poster-wrap row-poster">
              <img
                src={movie.poster}
                alt={movie.title}
                className="card-poster"
              />
              <div className="card-shine" />
              <div className="card-hover-overlay">
                <span className="card-play-btn">▶</span>
              </div>
            </div>
            <div className="card-meta">
              <p className="card-title">{movie.title}</p>
              <p className="card-rating-text">
                ★ {Number(movie.rating).toFixed(1)}
              </p>
            </div>
          </>
        ) : (
          <div className="grid-card-inner">
            <div className="card-poster-wrap grid-poster">
              <img
                src={movie.poster}
                alt={movie.title}
                className="card-poster"
              />
              <div className="card-shine" />
              <div className="card-hover-overlay">
                <span className="card-play-btn">▶</span>
              </div>
            </div>
            <div className="grid-card-body">
              <h3 className="grid-card-title">{movie.title}</h3>
              <div className="grid-card-foot">
                <span className="card-rating-text">
                  ★ {Number(movie.rating).toFixed(1)}
                </span>
                <span className="grid-card-year">
                  {movie.releaseDate?.slice(0, 4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="app-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold:         #c9a227;
          --gold-lt:      #f5c842;
          --gold-dk:      #8b6914;
          --bg:           #080808;
          --bg2:          #0d0d0d;
          --bg3:          #111111;
          --text:         rgba(255,255,255,0.85);
          --text-muted:   rgba(255,255,255,0.38);
          --border:       rgba(255,255,255,0.07);
          --gold-border:  rgba(201,162,39,0.25);
          --radius-card:  12px;
          --radius-modal: 22px;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--bg); color: var(--text);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0e0e0e; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(var(--gold), var(--gold-dk)); border-radius: 99px; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 9999;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 120px;
        }

        .app-root { min-height: 100vh; background: var(--bg); color: white; overflow-x: hidden; }

        /* ═══ HERO ═══ */
        .hero {
          position: relative;
          background: linear-gradient(180deg, #0e0900 0%, var(--bg) 100%);
          padding: 60px 0 0;
          border-bottom: 1px solid var(--border);
        }
        .hero-line {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent 0%, var(--gold) 28%, var(--gold-lt) 50%, var(--gold) 72%, transparent 100%);
        }
        .hero-inner { max-width: 1200px; margin: 0 auto; padding: 0 48px; }
        .hero-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
          opacity: 0.85; animation: fadeUp 0.65s ease both;
        }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 5.5vw, 70px);
          font-weight: 900; line-height: 1.04;
          letter-spacing: -0.025em; margin-bottom: 12px;
          background: linear-gradient(135deg, #fff 0%, #e8d58a 55%, var(--gold) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: fadeUp 0.65s 0.1s ease both;
        }
        .hero-sub {
          font-size: 15px; color: var(--text-muted); font-weight: 300;
          margin-bottom: 48px; letter-spacing: 0.01em;
          animation: fadeUp 0.65s 0.2s ease both;
        }

        /* ═══ STICKY SEARCH ═══ */
        .searchbar {
          position: sticky; top: 0; z-index: 200;
          background: rgba(8,8,8,0.92);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border-bottom: 1px solid var(--border);
          padding: 13px 0;
        }
        .searchbar-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 48px;
          display: flex; align-items: center; gap: 12px;
        }
        .search-wrap { position: relative; flex-grow: 1; max-width: 540px; }
        .search-icon {
          position: absolute; left: 16px; top: 50%;
          transform: translateY(-50%); opacity: 0.7;
          display: flex; align-items: center; pointer-events: none; z-index: 2;
        }
        .search-input {
          width: 100%; padding: 13px 16px 13px 46px;
          border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: white;
          font-size: 15px; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input:focus {
          outline: none;
          border-color: rgba(201,162,39,0.55);
          box-shadow: 0 0 0 3px rgba(201,162,39,0.07);
        }
        .send-btn {
          padding: 13px 30px; border-radius: 10px;
          border: 1px solid rgba(201,162,39,0.45);
          background: linear-gradient(135deg, var(--gold-lt) 0%, var(--gold) 100%);
          color: #0a0800; font-weight: 700; font-size: 13px;
          font-family: 'DM Sans', sans-serif; letter-spacing: 0.07em;
          text-transform: uppercase; cursor: pointer;
          transition: transform 0.22s ease, box-shadow 0.22s ease, opacity 0.2s ease;
          white-space: nowrap;
        }
        .send-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,162,39,0.38); }
        .send-btn:active:not(:disabled) { transform: translateY(0); }
        .send-btn:disabled { opacity: 0.52; cursor: not-allowed; }

        /* ════════════════════════════════
           NEW: AUTOCOMPLETE DROPDOWN
        ════════════════════════════════ */
        .autocomplete-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #0f0f0f;
          border: 1px solid rgba(201,162,39,0.22);
          border-radius: 14px;
          overflow: hidden;
          z-index: 999;
          box-shadow: 0 24px 60px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.03);
          animation: dropIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .auto-item {
          display: flex; align-items: center; gap: 13px;
          padding: 10px 15px; cursor: pointer;
          transition: background 0.15s ease;
          border-left: 2px solid transparent;
        }
        .auto-item:hover,
        .auto-item.active {
          background: rgba(201,162,39,0.07);
          border-left-color: var(--gold);
        }
        .auto-item + .auto-item { border-top: 1px solid rgba(255,255,255,0.04); }
        .auto-poster {
          width: 34px; height: 51px; border-radius: 5px;
          object-fit: cover; flex-shrink: 0;
          background: #1a1a1a;
        }
        .auto-poster-placeholder {
          width: 34px; height: 51px; border-radius: 5px;
          background: #1a1a1a; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #333;
        }
        .auto-title {
          font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.88);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .auto-meta { font-size: 12px; color: var(--gold); opacity: 0.8; }
        .auto-footer {
          padding: 7px 15px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex; gap: 14px;
        }
        .auto-hint {
          font-size: 11px; color: rgba(255,255,255,0.22);
          display: flex; align-items: center; gap: 5px;
        }
        .auto-hint-key {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px; padding: 1px 5px; font-size: 10px;
          color: rgba(255,255,255,0.35);
        }
        /* searching pulse on icon */
        .search-icon.searching { animation: iconPulse 0.8s ease infinite alternate; }
        @keyframes iconPulse {
          from { opacity: 0.7; }
          to   { opacity: 0.25; }
        }

        /* ═══ MAIN ═══ */
        .main { max-width: 1200px; margin: 0 auto; padding: 52px 48px 100px; }

        .section-label { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
        .section-bar {
          width: 4px; height: 24px; flex-shrink: 0;
          background: linear-gradient(180deg, var(--gold-lt), var(--gold-dk)); border-radius: 2px;
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 23px; font-weight: 700; color: #fff; letter-spacing: -0.01em;
        }

        /* ═══ TRENDING ═══ */
        .trending-wrap { margin-bottom: 66px; }
        .trending-row-container { position: relative; }
        .row-fade-left, .row-fade-right {
          position: absolute; top: 0; bottom: 0; width: 80px;
          z-index: 10; pointer-events: none;
        }
        .row-fade-left  { left: 0;  background: linear-gradient(to right, var(--bg) 15%, transparent); }
        .row-fade-right { right: 0; background: linear-gradient(to left,  var(--bg) 15%, transparent); }
        .row-arrow {
          position: absolute; top: 0; bottom: 20px; width: 56px; z-index: 11;
          border: none; background: transparent; color: rgba(255,255,255,0.4);
          font-size: 32px; cursor: pointer; display: flex; align-items: center;
          transition: color 0.2s ease; padding: 0;
        }
        .row-arrow:hover { color: var(--gold-lt); }
        .row-arrow-left  { left: 0;  justify-content: flex-start; padding-left: 4px; }
        .row-arrow-right { right: 0; justify-content: flex-end;   padding-right: 4px; }
        .movie-row {
          display: flex; gap: 16px;
          overflow-x: auto; scroll-behavior: smooth;
          scrollbar-width: none; -ms-overflow-style: none;
          padding: 14px 40px 22px;
        }
        .movie-row::-webkit-scrollbar { display: none; }

        /* ═══ CARD SHARED ═══ */
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
        .grid-card-inner {
          border-radius: var(--radius-card); overflow: hidden;
          background: var(--bg3); border: 1px solid var(--border);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          transition: border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .grid-card:hover .grid-card-inner {
          border-color: var(--gold-border);
          box-shadow: 0 22px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,162,39,0.18);
        }
        .card-hover-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center;
          transition: background 0.3s ease;
        }
        .grid-card:hover .card-hover-overlay,
        .trending-card:hover .card-hover-overlay { background: rgba(0,0,0,0.38); }
        .card-play-btn {
          width: 46px; height: 46px; border-radius: 50%;
          background: rgba(201,162,39,0.92);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #000; padding-left: 3px;
          transform: scale(0); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .grid-card:hover .card-play-btn,
        .trending-card:hover .card-play-btn { transform: scale(1); }
        .grid-card-body  { padding: 14px 14px 16px; }
        .grid-card-title { font-size: 14px; font-weight: 600; color: #fff; line-height: 1.35; margin-bottom: 8px; letter-spacing: 0.01em; }
        .grid-card-foot  { display: flex; justify-content: space-between; align-items: center; }
        .grid-card-year  { font-size: 11px; color: var(--text-muted); }

        /* ═══ GLOBAL POPOUT TRAILER ═══ */
        .trailer-popout {
          position: fixed; z-index: 9500; pointer-events: none;
          border-radius: 14px; overflow: hidden;
          background: var(--bg2); border: 1px solid rgba(201,162,39,0.18);
          box-shadow: 0 36px 76px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04);
          display: flex; flex-direction: column;
          animation: popoutIn 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes popoutIn {
          from { opacity: 0; transform: scale(0.84); }
          to   { opacity: 1; transform: scale(1); }
        }
        .trailer-meta {
          padding: 10px 14px; display: flex; justify-content: space-between;
          align-items: center; flex-shrink: 0;
        }
        .trailer-title {
          font-size: 13px; font-weight: 600; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 72%;
        }
        .rating-pill {
          background: linear-gradient(135deg, var(--gold), var(--gold-dk));
          padding: 3px 9px; border-radius: 6px;
          font-size: 12px; font-weight: 700; color: #fff;
          letter-spacing: 0.03em; flex-shrink: 0;
        }

        /* ═══ DIVIDER ═══ */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,162,39,0.18) 40%, rgba(201,162,39,0.18) 60%, transparent);
          margin-bottom: 52px;
        }

        /* ═══ MESSAGES ═══ */
        .msg-enter { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

        .user-row { text-align: right; margin-bottom: 20px; scroll-margin-top: 130px; }
        .user-bubble {
          display: inline-block;
          background: linear-gradient(135deg, #1a1200, #271d00);
          border: 1px solid rgba(201,162,39,0.28); color: var(--gold-lt);
          padding: 11px 18px; border-radius: 18px 18px 4px 18px;
          font-size: 15px; font-weight: 500; letter-spacing: 0.01em;
          box-shadow: 0 4px 18px rgba(201,162,39,0.1);
        }

        .typing-row { margin-bottom: 20px; scroll-margin-top: 130px; }
        .typing-bubble {
          display: inline-block;
          background: rgba(16,12,0,0.8); backdrop-filter: blur(12px);
          border: 1px solid rgba(201,162,39,0.1);
          padding: 16px 22px; border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .typing-dots { display: flex; gap: 6px; align-items: center; height: 14px; }
        .typing-dots span {
          width: 7px; height: 7px; background: var(--gold); border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        .typing-dots span:nth-child(3) { animation-delay: 0s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%           { transform: translateY(-5px); opacity: 1; }
        }

        .ai-box {
          background: linear-gradient(160deg, rgba(17,17,17,0.98), rgba(10,10,10,0.99));
          border: 1px solid var(--border); border-radius: 18px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          padding: 28px 30px; margin-bottom: 40px;
          scroll-margin-top: 130px;
        }
        .ai-label { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
        .ai-dot {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--gold), var(--gold-dk));
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: #000;
        }
        .ai-label-text {
          font-size: 11px; font-weight: 700; color: var(--gold);
          letter-spacing: 0.12em; text-transform: uppercase;
        }
        .ai-text {
          font-size: 15px; line-height: 1.78; color: rgba(255,255,255,0.66);
          font-weight: 300; margin-bottom: 24px;
        }
        .movies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(184px, 1fr));
          gap: 18px;
        }

        /* ═══ MODAL ═══ */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.9);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          animation: fadeIn 0.25s ease both;
          padding: 20px;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-content {
          position: relative;
          background: linear-gradient(160deg, #111008, #0a0a0a);
          border: 1px solid rgba(201,162,39,0.18); border-radius: var(--radius-modal);
          padding: 36px; max-width: 840px; width: 100%;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 52px 100px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.04);
          animation: modalIn 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.9) translateY(24px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        .modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.55); font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s, transform 0.3s ease;
        }
        .modal-close:hover { background: rgba(201,162,39,0.18); color: var(--gold-lt); transform: rotate(90deg) scale(1.1); }
        .modal-title {
          font-family: 'Playfair Display', serif;
          font-size: 30px; font-weight: 700; letter-spacing: -0.015em;
          margin-bottom: 8px; padding-right: 44px; color: #fff;
        }
        .modal-meta { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .modal-rating-text { color: var(--gold); font-weight: 700; font-size: 14px; }
        .modal-sep  { width: 1px; height: 14px; background: rgba(255,255,255,0.15); }
        .modal-year { color: var(--text-muted); font-size: 13px; }
        .modal-trailer {
          border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08); margin-bottom: 22px;
        }
        .modal-overview {
          font-size: 15px; line-height: 1.82; color: rgba(255,255,255,0.56);
          font-weight: 300; margin-bottom: 24px;
        }
        .insight-block {
          background: linear-gradient(135deg, rgba(201,162,39,0.055), rgba(139,105,20,0.03));
          border: 1px solid rgba(201,162,39,0.18);
          border-left: 3px solid var(--gold);
          padding: 20px 22px; border-radius: 0 12px 12px 0;
        }
        .insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .insight-label {
          font-size: 11px; font-weight: 700; color: var(--gold);
          letter-spacing: 0.13em; text-transform: uppercase;
        }
        .insight-loading { display: flex; align-items: center; gap: 12px; height: 24px; }
        .insight-loading-text { color: var(--text-muted); font-style: italic; font-size: 13px; }
        .insight-text {
          font-size: 14px; line-height: 1.78; color: rgba(255,255,255,0.62); font-weight: 300;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .hero-inner, .searchbar-inner, .main { padding-left: 20px; padding-right: 20px; }
          .modal-content { padding: 24px; }
          .movies-grid { grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); }
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

          {/* ── NEW: ref wrapper for outside-click detection ── */}
          <div className="search-wrap" ref={searchRef}>
            <span className={`search-icon${isSearching ? " searching" : ""}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Ask for movies, genres, moods…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />

            {/* ── NEW: AUTOCOMPLETE DROPDOWN ── */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="autocomplete-dropdown">
                {suggestions.map((movie, i) => (
                  <div
                    key={movie.id}
                    className={`auto-item${i === activeIndex ? " active" : ""}`}
                    onMouseDown={() => selectSuggestion(movie)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        className="auto-poster"
                      />
                    ) : (
                      <div className="auto-poster-placeholder">🎬</div>
                    )}
                    <div style={{ overflow: "hidden" }}>
                      <p className="auto-title">{movie.title}</p>
                      <p className="auto-meta">
                        ★ {Number(movie.vote_average).toFixed(1)}
                        {movie.release_date && ` · ${movie.release_date.slice(0, 4)}`}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="auto-footer">
                  <span className="auto-hint">
                    <span className="auto-hint-key">↑↓</span> navigate
                  </span>
                  <span className="auto-hint">
                    <span className="auto-hint-key">↵</span> select
                  </span>
                  <span className="auto-hint">
                    <span className="auto-hint-key">esc</span> close
                  </span>
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

        {/* ── TRENDING ROW ── */}
        {trending.length > 0 && (
          <div className="trending-wrap">
            <div className="section-label">
              <div className="section-bar" />
              <h2 className="section-title">Trending Now</h2>
            </div>
            <div
              className="trending-row-container"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className="row-fade-left" />
              <div className="row-fade-right" />
              <button className="row-arrow row-arrow-left" onClick={() => scrollRow("left")} aria-label="Scroll left">‹</button>
              <button className="row-arrow row-arrow-right" onClick={() => scrollRow("right")} aria-label="Scroll right">›</button>
              <div className="movie-row" ref={rowRef}>
                {trending.map((movie, i) => (
                  <MovieCard key={`tr-${i}`} movie={movie} variant="row" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DIVIDER ── */}
        {trending.length > 0 && messages.some((m) => m.role !== "typing") && (
          <div className="section-divider" />
        )}

        {/* ── MESSAGES ── */}
        {messages.map((msg, i) => {
          if (msg.role === "user")
            return (
              <div key={i} id={`msg-${i}`} className="user-row msg-enter">
                <span className="user-bubble">{msg.text}</span>
              </div>
            );

          if (msg.role === "typing")
            return (
              <div key={i} id="typing-dots" className="typing-row msg-enter">
                <div className="typing-bubble">
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            );

          if (msg.role === "ai")
            return (
              <div key={i} id={`msg-${i}`} className="ai-box msg-enter">
                <div className="ai-label">
                  <div className="ai-dot">✦</div>
                  <span className="ai-label-text">AI Recommendation</span>
                </div>
                {msg.text && <p className="ai-text">{renderBold(msg.text)}</p>}
                {msg.movies?.length > 0 && (
                  <div className="movies-grid">
                    {msg.movies.map((m, j) => (
                      <MovieCard key={`ai-${j}`} movie={m} variant="grid" />
                    ))}
                  </div>
                )}
              </div>
            );

          return null;
        })}
      </main>

      {/* ═══════════ MOVIE DETAIL MODAL ═══════════ */}
      {selectedMovie && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMovie(null);
              setInsight("");
            }
          }}
        >
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => { setSelectedMovie(null); setInsight(""); }}
              aria-label="Close"
            >✕</button>

            <h2 className="modal-title">{selectedMovie.title}</h2>
            <div className="modal-meta">
              <span className="modal-rating-text">★ {Number(selectedMovie.rating).toFixed(1)}</span>
              <span className="modal-sep" />
              <span className="modal-year">{selectedMovie.releaseDate}</span>
            </div>

            {selectedMovie.trailer && (
              <div className="modal-trailer">
                <iframe
                  width="100%" height="400"
                  src={`https://www.youtube.com/embed/${selectedMovie.trailer}`}
                  title="Trailer" frameBorder="0" allowFullScreen
                />
              </div>
            )}

            {selectedMovie.overview && (
              <p className="modal-overview">{selectedMovie.overview}</p>
            )}

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
    </div>
  );
}