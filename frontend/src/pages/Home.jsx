import React, { useState } from "react";
import adventure1 from "../assets/adventure1.jpg";
import adventure2 from "../assets/adventure2.jpg";
import adventure3 from "../assets/adventure3.jpg";
import adventure4 from "../assets/adventure4.jpg";
import adventure5 from "../assets/adventure5.jpg";
import tetris from "../assets/tetris.jpg";
import pacman from "../assets/pacman.jpg";
import sudoku from "../assets/sudoku.jpg";

export default function Home() {
  // Carousel data
  const adventureGames = [
    { id: 1, title: "Adventure 1", developer: "Dev A", category: "Action", rating: 4.3, ratingCount: 210, tags: ["Action","Exploration"], img: adventure1 },
    { id: 2, title: "Adventure 2", developer: "Dev B", category: "RPG", rating: 4.7, ratingCount: 980, tags: ["RPG","Story"], img: adventure2 },
    { id: 3, title: "Adventure 3", developer: "Dev C", category: "Puzzle", rating: 3.9, ratingCount: 150, tags: ["Puzzle","Indie"], img: adventure3 },
    { id: 4, title: "Adventure 4", developer: "Dev D", category: "Survival", rating: 4.1, ratingCount: 340, tags: ["Survival","Craft"], img: adventure4 },
    { id: 5, title: "Adventure 5", developer: "Dev E", category: "Platformer", rating: 4.5, ratingCount: 605, tags: ["Platform","Retro"], img: adventure5 },
  ];

  const blindGames = [
    { id: 1, title: "Blind 1", developer: "Access Dev", category: "Audio", rating: 4.6, ratingCount: 430, tags: ["Audio","Accessible"], img: adventure1 },
    { id: 2, title: "Blind 2", developer: "Access Dev", category: "Narrative", rating: 4.2, ratingCount: 210, tags: ["Story","Accessible"], img: adventure2 },
    { id: 3, title: "Blind 3", developer: "Access Dev", category: "Puzzle", rating: 4.0, ratingCount: 120, tags: ["Puzzle","Audio"], img: adventure3 },
    { id: 4, title: "Blind 4", developer: "Access Dev", category: "Adventure", rating: 4.4, ratingCount: 300, tags: ["Exploration","Accessible"], img: adventure4 },
    { id: 5, title: "Blind 5", developer: "Access Dev", category: "Learning", rating: 3.8, ratingCount: 90, tags: ["Education","Audio"], img: adventure5 },
  ];

  // New featured games carousel data
  const featuredGames = [
    {
      id: 1,
      title: "Tetris",
      releaseDate: "06/06/1984",
      developer: "Alexey Pajitnov",
      category: "Puzzle",
      rating: 4.5,
      ratingCount: 1000,
      tags: ["Classic", "Puzzle", "Retro"],
      img: tetris,
    },
    {
      id: 2,
      title: "Pac-Man",
      releaseDate: "05/22/1980",
      developer: "Namco",
      category: "Arcade",
      rating: 4.7,
      ratingCount: 2500,
      tags: ["Arcade", "Maze", "Classic"],
      img: pacman,
    },
    {
      id: 3,
      title: "Sudoku Master",
      releaseDate: "01/10/2005",
      developer: "NumberWorks",
      category: "Logic",
      rating: 4.2,
      ratingCount: 540,
      tags: ["Brain", "Logic", "Numbers"],
      img: sudoku,
    },
  ];

  // Carousel state
  const [advIndex, setAdvIndex] = useState(0);
  const [blindIndex, setBlindIndex] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [hoveredAdv, setHoveredAdv] = useState(null);
  const [hoveredBlind, setHoveredBlind] = useState(null);

  const prevAdv = () => setAdvIndex((i) => (i - 1 + adventureGames.length) % adventureGames.length);
  const nextAdv = () => setAdvIndex((i) => (i + 1) % adventureGames.length);
  const prevBlind = () => setBlindIndex((i) => (i - 1 + blindGames.length) % blindGames.length);
  const nextBlind = () => setBlindIndex((i) => (i + 1) % blindGames.length);
  const prevFeatured = () => setFeaturedIndex((i) => (i - 1 + featuredGames.length) % featuredGames.length);
  const nextFeatured = () => setFeaturedIndex((i) => (i + 1) % featuredGames.length);

  const VISIBLE = 5;
  const getWindow = (arr, start, size) =>
    Array.from({ length: Math.min(size, arr.length) }, (_, k) => arr[(start + k) % arr.length]);

  const fg = featuredGames[featuredIndex];

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.round(rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
  ));

  return (
    <div className="bg-sky-100 min-h-screen flex justify-center py-10">
      {/* Main container */}
      <div className="bg-gray-100 rounded-2xl shadow-lg p-8 w-full max-w-6xl">
        {/* Featured / Newest Games (carousel) */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Featured / Newest Games</h2>
          <div className="flex flex-col md:flex-row bg-white rounded-xl shadow p-6 gap-6">
            {/* Image + arrows */}
            <div className="flex items-center justify-center md:w-1/2 gap-4">
              <button
                aria-label="Previous featured game"
                onClick={prevFeatured}
                className="w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center"
              >
                ←
              </button>
              <img
                src={fg.img}
                alt={fg.title}
                className="rounded-lg shadow-md w-full max-w-md object-cover"
              />
              <button
                aria-label="Next featured game"
                onClick={nextFeatured}
                className="w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center"
              >
                →
              </button>
            </div>

            {/* Dynamic details */}
            <div className="md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <h3 className="text-2xl font-semibold">{fg.title}</h3>
                  <p className="text-sm text-gray-600">Release Date: <span className="font-semibold">{fg.releaseDate}</span></p>
                </div>
                <p className="text-gray-700 mt-2">
                  <span className="font-semibold">Developer:</span> {fg.developer} • {fg.category}
                </p>
                {/* Rating */}
                <div className="flex items-center mt-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < Math.round(fg.rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
                  ))}
                  <span className="ml-2 text-gray-700">{fg.rating.toFixed(1)} ({fg.ratingCount})</span>
                </div>
                {/* Tags */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {fg.tags.map((tag) => (
                    <span key={tag} className="bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">{tag}</span>
                  ))}
                </div>
              </div>
              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-lg font-medium transition">View More</button>
                <button className="bg-orange-400 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium transition"> Add to Wishlist</button>
                <button className="bg-pink-400 hover:bg-pink-600 text-white px-5 py-2 rounded-lg font-medium transition"> Add to Favourites</button>
              </div>
            </div>
          </div>
        </section>

        {/* Adventure Games */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Adventure Games</h2>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button aria-label="Previous adventure game" onClick={prevAdv} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">←</button>
            <div className="flex gap-4">
              {getWindow(adventureGames, advIndex, VISIBLE).map((g) => (
                <div
                  key={g.id}
                  className="relative flex-none w-48 rounded-md shadow-md bg-white overflow-visible hover:shadow-lg transition"
                  onMouseEnter={() => setHoveredAdv(g.id)}
                  onMouseLeave={() => setHoveredAdv(null)}
                >
                  <div className="overflow-hidden rounded-t-md">
                    <img
                      src={g.img}
                      alt={g.title}
                      className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  {hoveredAdv === g.id && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white/95 backdrop-blur-sm shadow-lg rounded-md p-3 space-y-1 text-xs z-20 pointer-events-none">
                      <h4 className="text-sm font-semibold text-gray-800 truncate" title={g.title}>{g.title}</h4>
                      <p className="text-gray-600 truncate" title={`${g.developer} • ${g.category}`}>{g.developer} • {g.category}</p>
                      <div className="flex items-center text-[10px]">{renderStars(g.rating)}<span className="ml-1 text-gray-700 text-[11px]">{g.rating.toFixed(1)}</span><span className="ml-1 text-gray-500">({g.ratingCount})</span></div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {g.tags.slice(0,3).map(t => (
                          <span key={t} className="bg-gray-200 text-gray-700 px-2 py-[2px] rounded-full text-[10px] leading-none">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button aria-label="Next adventure game" onClick={nextAdv} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">→</button>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Blind-friendly Games</h2>
          <div className="flex items-center justify-center gap-4">
            <button aria-label="Previous blind-friendly game" onClick={prevBlind} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">←</button>
            <div className="flex gap-4">
              {getWindow(blindGames, blindIndex, VISIBLE).map((g) => (
                <div
                  key={g.id}
                  className="relative flex-none w-48 rounded-md shadow-md bg-white overflow-visible hover:shadow-lg transition"
                  onMouseEnter={() => setHoveredBlind(g.id)}
                  onMouseLeave={() => setHoveredBlind(null)}
                >
                  <div className="overflow-hidden rounded-t-md">
                    <img
                      src={g.img}
                      alt={g.title}
                      className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  {hoveredBlind === g.id && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white/95 backdrop-blur-sm shadow-lg rounded-md p-3 space-y-1 text-xs z-20 pointer-events-none">
                      <h4 className="text-sm font-semibold text-gray-800 truncate" title={g.title}>{g.title}</h4>
                      <p className="text-gray-600 truncate" title={`${g.developer} • ${g.category}`}>{g.developer} • {g.category}</p>
                      <div className="flex items-center text-[10px]">{renderStars(g.rating)}<span className="ml-1 text-gray-700 text-[11px]">{g.rating.toFixed(1)}</span><span className="ml-1 text-gray-500">({g.ratingCount})</span></div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {g.tags.slice(0,3).map(t => (
                          <span key={t} className="bg-gray-200 text-gray-700 px-2 py-[2px] rounded-full text-[10px] leading-none">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button aria-label="Next blind-friendly game" onClick={nextBlind} className="shrink-0 w-10 h-10 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 flex items-center justify-center">→</button>
          </div>
        </section>
      </div>
    </div>
  );
}
