# CineSearch (Film Find Forge)

> *"My sister and I always had trouble deciding what to watch on movie nights. We'd scroll for hours, argue about genres, and eventually just give up or watch the same thing we always do. So, we thought: let's do this. Let's build something that actually helps you decide."* — *Tejas Govind*

CineSearch is a modern, AI-powered movie discovery platform designed to eliminate the endless scroll and help you find exactly what you're in the mood for.

## 🍿 Features

- **Netflix-Style Live Grid Search**: No clunky suggestion dropdowns. Just start typing, and the entire page instantly transforms into a live grid of movie posters matching your query.
- **AI-Powered Suggestions Quiz**: Don't know what you want to watch? Take the Suggestions Quiz! Answer a few quick questions about your mood, preferred pacing, era, and genres, and our Groq-powered AI will generate 3 highly specific, hand-picked recommendations just for you.
- **Localized Trending Movies**: The "Trending Now" home page isn't just a static list. The app detects your location dynamically via IP and asks the AI to curate a custom list of 10 movies currently trending in *your* specific country's cinema market.
- **Rich Movie Details**: Powered by the OMDB API, every movie card includes high-quality posters, IMDb ratings, runtime, plot summaries, and cast information.
- **Watch Trailers Instantly**: Hooked up to the YouTube API, you can watch the trailer for any movie without ever leaving the page.
- **Personal Watchlist**: Save movies to your personalized "My List" to watch later.

## 💻 Tech Stack

- **Frontend Framework**: React + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Data Fetching**: `@tanstack/react-query`
- **APIs Used**:
  - **OMDB API**: Movie metadata and posters
  - **Groq API (`llama-3.3-70b-versatile`)**: Lightning-fast AI movie recommendations and localized trending logic
  - **GeoJS**: IP-based location detection
  - **YouTube Data API**: Trailer fetching

## 🚀 Getting Started

### Prerequisites
You will need Node.js & npm installed.

### Installation

1. Clone the repository:
   ```sh
   git clone <YOUR_GIT_URL>
   cd film-find-forge
   ```

2. Install the dependencies:
   ```sh
   npm install
   ```

3. Set up your environment variables. Create a `.env` file or configure `src/lib/config.ts` with your API keys:
   - `OMDB_API_KEY`
   - `YOUTUBE_API_KEY`
   - `GROQ_API_KEY`

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080/`.

## 🛠️ How to Contribute
Want to help make movie nights even better? Feel free to fork the repository and submit a pull request!
