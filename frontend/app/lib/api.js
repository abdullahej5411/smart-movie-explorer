const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const chatMovie = async (message) => {
  const res = await fetch(`${API_URL}/api/chat/movie-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  return res.json();
};