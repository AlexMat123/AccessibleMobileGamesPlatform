import React, { useState } from "react";
import tetris from "../assets/tetris.jpg";
import pacman from "../assets/pacman.jpg";
import sudoku from "../assets/sudoku.jpg";

export default function Library() {
    {/*temp data*/}
    const Games = [
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
    
    const types = ["Favorite", "Wishlist"];
    const [active, setActive] = useState(types[0]);

    return (
        <div className="bg-sky-100 min-h-screen flex justify-center py-10 lg:pb-20">
            {/* Main container */}
            <div className="bg-gray-100 rounded-2xl shadow-lg p-8 w-full max-w-6xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Library</h2>
                {/* Tab buttons */}
                <div className="flex">
                    {types.map((type) => (
                    <button 
                        className="bg-gray-100 text-xl p-10 cursor-pointer opacity-60"
                        key={type} 
                        onClick={() => setActive(type)}
                    >
                            {type}
                    </button>
                    ))}
                </div>
                {/* games card */}
                <section className="mb-10">
                    {Games.map((g) => (
                    <div key={g.id} className="flex flex-col md:flex-row bg-white rounded-xl shadow p-6 gap-6">
                        {/* Image */}
                        <div className="flex flex-col items-center md:w-1/2 gap-4">
                            <div className="flex items-center justify-center gap-4 w-full">
                                <img
                                src={g.img}
                                alt={g.title}
                                className="rounded-lg shadow-md w-full max-w-md object-cover"
                                />
                            </div>
                        </div>

                        {/* Dynamic details */}
                        <div className="md:w-1/2 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <h3 className="text-2xl font-semibold">title</h3>
                                    <p className="text-sm text-gray-600">Release Date: <span className="font-semibold">{g.releaseDate}</span></p>
                                </div>
                                <p className="text-gray-700 mt-2">
                                <span className="font-semibold">Developer:</span> {g.developer} • {g.category}
                                </p>
                                {/* Rating */}
                                <div className="flex items-center mt-3">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <span key={i} className={i < Math.round(g.rating) ? "text-yellow-500" : "text-gray-300"}>★</span>
                                    ))}
                                    <span className="ml-2 text-gray-700">{g.rating.toFixed(1)} ({g.ratingCount})</span>
                                </div>
                                {/* Tags */}
                                <div className="flex gap-2 mt-4 flex-wrap">
                                    {g.tags.map((tag) => (
                                        <span key={tag} className="bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </section>
            </div>
        </div>
    );
}