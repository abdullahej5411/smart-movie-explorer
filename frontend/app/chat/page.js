"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // 👈 ADD THIS
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false); // 👈 ADD THIS LINE
  const [trending, setTrending] = useState([]);

  const rowRef = useRef(null);

  const scrollRow = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  // 👈 ADD THIS ENTIRE AUTO-SCROLL EFFECT
  useEffect(() => {
    // Stop the timer if the user is hovering or if there are no movies
    if (isHovered || trending.length === 0) return;

    const interval = setInterval(() => {
      if (rowRef.current) {
        const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;

        // If we hit the very end of the row, scroll back to the beginning
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          rowRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Otherwise, just click the "right" arrow automatically
          scrollRow("right");
        }
      }
    }, 3100); // 👈 4000 = slides every 4 seconds. Change this number to make it faster/slower!

    // Cleanup the timer when unmounting or hovering
    return () => clearInterval(interval);
  }, [isHovered, trending]);


  // 👈 The ULTIMATE sticky-header scroll fix
  // 👈 The PERFECT dual-trigger scroll fix
  useEffect(() => {
    const scrollToId = (id) => {
      const element = document.getElementById(id);
      if (element) {
        // Find the element and subtract 120px so the sticky header doesn't block it
        const y = element.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    if (loading) {
      scrollToId("typing-dots"); // 👈 This now uses the 120px offset!
    }

    if (!loading && messages.length > 0) {
      const lastIndex = messages.length - 1;
      setTimeout(() => {
        scrollToId(`msg-${lastIndex}`);
      }, 150); // Slightly longer timeout for slower browsers
    }
  }, [loading, messages.length]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/movies/trending")
        const data = await res.json();
        setTrending(data.movies || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTrending();
  }, []);

  const fetchInsight = async (title) => {

    setInsight("");
    setInsightLoading(true);

    // 👇 allow UI to render loader
    await new Promise(resolve => setTimeout(resolve, 60));

    try {

      const res = await fetch("http://localhost:5000/api/chat/movie-insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title })
      });

      const data = await res.json();

      setInsight(data.insight);

    } catch (err) {

      console.error(err);
      setInsight("Failed to generate insight.");

    } finally {

      setInsightLoading(false);

    }
  };

  const sendMessage = async () => {
    if (!message) return;

    const currentMessage = message;

    setMessage("");

    const userMessage = {
      role: "user",
      text: currentMessage
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "typing" }
    ]);

    setLoading(true);

    // 👇 allow React to render the loading dots first
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {

      const res = await fetch("http://localhost:5000/api/chat/movie-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ message: currentMessage }),
      });

      const data = await res.json();

      const aiMessage = {
        role: "ai",
        text:
          data.reply ||
          data.query?.reply ||
          data.message ||
          "Here are some recommendations for you!",
        movies: data.results || []
      };

      setMessages((prev) => {
        const withoutTyping = prev.filter(m => m.role !== "typing");
        return [...withoutTyping, aiMessage];
      });

    } catch (error) {

      console.error(error);

      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong. Please try again.", movies: [] }
      ]);

    } finally {

      setLoading(false);

    }
  };

  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "Arial",
        background: "#0f0f0f",
        minHeight: "100vh",
        color: "white"
      }}
    >
      <style jsx global>{`
      

      .movieRow {
        display: flex;
        gap: 20px;
        overflow-x: auto;
        scroll-behavior: smooth;

        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE */
      }

      .movieRow::-webkit-scrollbar {
        height: 6px;
      }

      .movieRow::-webkit-scrollbar-track {
        background: transparent;
      }

      .movieRow::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg,#e50914,#b20710);
        border-radius: 20px;
      }

      .movieRow::-webkit-scrollbar-thumb:hover {
        background: #ff1e1e;
      }

      /* MODAL SCROLLBAR */

      ::-webkit-scrollbar {
        width: 10px;
      }

      ::-webkit-scrollbar-track {
        background: #111;
        border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(#e50914,#b20710);
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(229,9,20,.6);
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #ff1e1e;
      }

      .typing {
        display: flex;
        flex-direction: row; /* 👈 Forces them into a horizontal line */
        gap: 6px;
        align-items: center;
        justify-content: center;
        height: 14px;
      }

      .typing span {
        width: 8px;
        height: 8px;
        background: #aaa;
        border-radius: 50%;
        display: inline-block; /* 👈 Guarantees they sit side-by-side! */
        animation: bounce 1.4s infinite ease-in-out both;
      }

      .typing span:nth-child(1) {
        animation-delay: -0.32s;
      }

      .typing span:nth-child(2) {
        animation-delay: -0.16s;
      }

      .typing span:nth-child(3) {
        animation-delay: 0s;
      }

      @keyframes bounce {
        0%, 80%, 100% { 
          transform: translateY(0); 
          opacity: 0.4; 
        }
        40% { 
          transform: translateY(-5px); 
          opacity: 1; 
        }
      }

      .messageEnter {
        animation: fadeUp .5s ease;
      }

      @keyframes fadeUp {
        from{
          opacity:0;
          transform:translateY(20px);
        }
        to{
          opacity:1;
          transform:translateY(0);
        }
      }
      `}</style>



      <h1
        style={{
          fontSize: "36px",
          fontWeight: "bold",
          marginBottom: "30px",
          color: "#e50914"
        }}
      >
        🎬 Smart Movie Explorer
      </h1>

      <div
        style={{
          position: "sticky",
          top: 0,
          backdropFilter: "blur(12px)",
          padding: "20px 0",
          zIndex: 50
        }}
      >
        <input
          type="text"
          placeholder="Ask for movies..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              sendMessage();
            }
          }}
          style={{
            padding: "12px",
            width: "320px",
            marginRight: "10px",
            borderRadius: "6px",
            border: "none",
            outline: "none",
            background: "#1a1a1a",
            color: "white",
            border: "1px solid rgba(255,255,255,.1)"
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "12px 20px",
            cursor: "pointer",
            borderRadius: "6px",
            border: "none",
            color: "white",
            fontWeight: "bold",
            background: "linear-gradient(135deg,#e50914,#b20710)"
          }}
        >
          Search
        </button>
      </div>

      {trending.length > 0 && (
        <div style={{ marginTop: "40px", marginBottom: "40px" }}>

          {/* 1. Title is now safely OUTSIDE the relative wrapper */}
          <h2 style={{ marginBottom: "20px" }}>🔥 Trending Movies</h2>

          {/* 2. Wrapper ONLY for the posters and arrows */}
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => setIsHovered(true)}  /* 👈 ADD THIS: Pauses timer */
            onMouseLeave={() => setIsHovered(false)} /* 👈 ADD THIS: Resumes timer */
          >

            {/* LEFT ARROW */}
            <button
              onClick={() => scrollRow("left")}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "300px", // Locks exactly to poster height
                width: "70px",
                zIndex: 10,
                background: "linear-gradient(to right, #0f0f0f 10%, transparent 100%)", // Perfect fade
                color: "white",
                border: "none",
                fontSize: "45px",
                cursor: "pointer",
                borderTopLeftRadius: "0px", // Matches your poster's rounded corners!
                borderBottomLeftRadius: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                paddingLeft: "5px",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e50914"}
              onMouseLeave={(e) => e.currentTarget.style.color = "white"}
            >
              ❮
            </button>

            {/* MOVIE ROW */}
            <style>{`
              .movieRow::-webkit-scrollbar {
                display: none !important;
              }
            `}</style>

            <div
              className="movieRow"
              ref={rowRef}
              style={{
                display: "flex",
                gap: "20px",
                overflowX: "auto",
                scrollBehavior: "smooth",
                scrollbarWidth: "none", /* Hides for Firefox */
                msOverflowStyle: "none" /* Hides for Edge */
              }}
            >
              {trending.map((movie, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedMovie(movie);
                    fetchInsight(movie.title);
                  }}
                  style={{
                    minWidth: "200px",
                    cursor: "pointer"
                  }}
                >
                  <img
                    src={movie.poster}
                    style={{
                      width: "200px",
                      height: "300px",
                      objectFit: "cover",
                      borderRadius: "10px"
                    }}
                  />
                  <p style={{ marginTop: "10px" }}>{movie.title}</p>
                </div>
              ))}
            </div>

            {/* RIGHT ARROW */}
            <button
              onClick={() => scrollRow("right")}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "300px", // Locks exactly to poster height
                width: "70px",
                zIndex: 10,
                background: "linear-gradient(to left, #0f0f0f 10%, transparent 100%)", // Perfect fade
                color: "white",
                border: "none",
                fontSize: "45px",
                cursor: "pointer",
                borderTopRightRadius: "0px", // Matches your poster's rounded corners!
                borderBottomRightRadius: "0px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: "5px",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#e50914"}
              onMouseLeave={(e) => e.currentTarget.style.color = "white"}
            >
              ❯
            </button>

          </div>
        </div>
      )}


      <div style={{ marginTop: "30px" }}>
        {messages.map((msg, index) => {

          if (msg.role === "user") {
            return (
              <div
                key={index}
                id={`msg-${index}`} /* 👈 ADDED ID */
                className="messageEnter"
                style={{
                  textAlign: "right",
                  marginBottom: "20px",
                  scrollMarginTop: "120px" /* 👈 ADDED INVISIBLE BUMPER */
                }}
              >
                <span
                  style={{
                    background: "#e50914",
                    color: "white",
                    padding: "10px 15px",
                    borderRadius: "15px",
                    display: "inline-block"
                  }}
                >
                  {msg.text}
                </span>
              </div>
            );
          }


          if (msg.role === "typing") {
            return (
              <div
                key={index}
                id="typing-dots"
                className="messageEnter" /* 👈 Makes it fade in smoothly */
                style={{
                  marginBottom: "20px",
                  display: "inline-block",
                  background: "rgba(30,30,30,0.6)", /* 👈 Beautiful glass background */
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: "16px 24px",
                  borderRadius: "15px",
                  scrollMarginTop: "120px" /* 👈 Keeps the scroll perfectly aligned! */
                }}
              >
                <div className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            );
          }

          if (msg.role === "ai") {
            return (
              <div
                key={index}
                id={`msg-${index}`} /* 👈 ADDED ID */
                className="messageEnter"
                style={{
                  marginBottom: "40px",
                  background: "rgba(30,30,30,0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  padding: "20px",
                  borderRadius: "10px",
                  scrollMarginTop: "120px" /* 👈 ADDED INVISIBLE BUMPER */
                }}>

                {/* 👇 ADD THIS NEW BLOCK TO SHOW THE AI's TEXT 👇 */}
                {msg.text && (
                  <p style={{ marginBottom: "20px", fontSize: "16px", lineHeight: "1.5" }}>
                    {msg.text}
                  </p>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "20px"
                  }}
                >



                  {msg.movies.map((movie, i) => (
                    <div
                      key={`${movie.tmdbId}-${i}`}
                      onClick={() => {
                        setSelectedMovie(movie);
                        fetchInsight(movie.title); // 👈 Passes the exact string, ignoring the state delay!
                      }}
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        background: "#1a1a1a",
                        cursor: "pointer",
                        boxShadow: "0 10px 30px rgba(0,0,0,.6)",
                        transition: "all .35s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-8px) scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,.9)";
                      }}

                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,.6)";
                      }}
                    >
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "cover"
                        }}
                      />

                      <div style={{ padding: "10px" }}>
                        <h3 style={{ fontSize: "16px", margin: "0 0 10px 0" }}>
                          {movie.title}
                        </h3>

                        <p style={{ margin: "0 0 5px 0" }}>
                          ⭐ {Number(movie.rating).toFixed(1)}
                        </p>

                        <p style={{ fontSize: "12px", color: "#555", margin: 0 }}>
                          {movie.releaseDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

        })}
      </div>


      {
        selectedMovie && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000
            }}
          >
            <div
              style={{
                backgroundImage: selectedMovie.backdrop_path
                  ? `url(https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path})`
                  : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: "rgba(0,0,0,0.9)",
                backgroundBlendMode: "darken",
                backdropFilter: "blur(8px)",
                padding: "30px",
                borderRadius: "15px",
                maxWidth: "800px",
                width: "90%",
                color: "white",
                position: "relative",
                maxHeight: "85vh",
                overflowY: "auto",
                scrollBehavior: "smooth",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            >
              <button
                onClick={() => {
                  setSelectedMovie(null);
                  setInsight("");
                }}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  fontSize: "18px",
                  cursor: "pointer",
                  background: "transparent",
                  color: "white",
                  border: "none"
                }}
              >
                ✕
              </button>

              <h2>{selectedMovie.title}</h2>

              {selectedMovie.trailer && (
                <iframe
                  width="100%"
                  height="400"
                  src={`https://www.youtube.com/embed/${selectedMovie.trailer}`}
                  title="Trailer"
                  frameBorder="0"
                  allowFullScreen
                  style={{ marginTop: "15px", borderRadius: "10px" }}
                ></iframe>
              )}

              <p style={{ marginTop: "15px" }}>
                {selectedMovie.overview}
              </p>

              {(insightLoading || insight) && (
                <div style={{
                  marginTop: "20px",
                  background: "rgba(229, 9, 20, 0.1)", // Subtle Netflix red background
                  borderLeft: "4px solid #e50914", // Red accent line
                  padding: "15px",
                  borderRadius: "0 8px 8px 0"
                }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "10px", color: "#e50914", display: "flex", alignItems: "center", gap: "8px" }}>
                    AI Insight:
                  </h3>

                  {/* If loading is true, show the animation. If false, show the text! */}
                  {insightLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", height: "24px" }}>
                      <div className="typing">
                        <span></span><span></span><span></span>
                      </div>
                      <span style={{ color: "#aaa", fontStyle: "italic", fontSize: "14px" }}>
                        Analyzing cinematic data
                      </span>
                    </div>
                  ) : (
                    <p style={{ lineHeight: "1.6", margin: 0 }}>{insight}</p>
                  )}
                </div>
              )}

              <p style={{ marginTop: "15px" }}>
                ⭐ Rating: {Number(selectedMovie.rating).toFixed(1)}
              </p>

              <p>
                Release: {selectedMovie.releaseDate}
              </p>
            </div>
          </div>
        )
      }

    </div>
  );
}