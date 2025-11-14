import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGame } from '../api';

function RatingStars({ value }) {
    const v = Math.round(value || 0);
    return (
        <span aria-label={`Rating ${v} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ color: i < v ? '#f5c518' : '#ccc' }}>★</span>
      ))}
    </span>
    );
}

export default function Game() {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [addIndex, setAddIndex] = useState(0); // additional images window start

    useEffect(() => {
        setLoading(true);
        getGame(id)
            .then(g => setGame(g))
            .catch(e => setError(e.message || String(e)))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div style={{ padding: '1rem' }}>Loading...</div>;
    if (error) return <div style={{ padding: '1rem', color: 'red' }}>Error: {error}</div>;
    if (!game) return <div style={{ padding: '1rem' }}>Not found</div>;

    const date = game.releaseDate ? new Date(game.releaseDate).toLocaleDateString() : 'N/A';
    const images = Array.isArray(game.images) && game.images.length
        ? game.images
        : ['/placeholder1.png', '/placeholder2.png', '/placeholder3.png'];
    const currentHero = images[heroIndex];

    // Additional images carousel logic (show 3)
    const ADD_VISIBLE = 3;
    const addWindow = images.slice(addIndex, addIndex + ADD_VISIBLE).length === ADD_VISIBLE
        ? images.slice(addIndex, addIndex + ADD_VISIBLE)
        : [...images.slice(addIndex), ...images.slice(0, (addIndex + ADD_VISIBLE) % images.length)];

    const prevHero = () => setHeroIndex((i) => (i - 1 + images.length) % images.length);
    const nextHero = () => setHeroIndex((i) => (i + 1) % images.length);
    const prevAdditional = () => setAddIndex(i => (i - 1 + images.length) % images.length);
    const nextAdditional = () => setAddIndex(i => (i + 1) % images.length);

    // Stub accessibility features (replace later)
    const accessibility = [
        { group: 'Visual Accessibility', items: ['High Contrast', 'Text Resize'] },
        { group: 'Auditory Accessibility', items: ['Subtitles', 'Mono Audio'] },
        { group: 'Motor Accessibility', items: ['Remappable Controls', 'Controller Support'] },
        { group: 'Cognitive Accessibility', items: ['Simplified UI', 'Tutorial Tips'] }
    ];

    //Reviews
    const reviews = game.reviews || [];

    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            ratingCounts[r.rating - 1]++;
        }
    });
    const ratingDist = ratingCounts.reverse();


    return (
        <div style={{ background: '#d7edf9', minHeight: '100vh', padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Top section */}
                <div style={{ display: 'flex', gap: '1rem', background: '#f2f2f2', padding: '1rem', borderRadius: 6 }}>
                    {/* Hero image */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={prevHero} style={sideBtn} aria-label="Previous image">‹</button>
                            <img
                                src={currentHero}
                                alt={`${game.name} screenshot`}
                                style={{ width: 320, height: 200, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                            />
                            <button onClick={nextHero} style={sideBtn} aria-label="Next image">›</button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 4 }}>
                            {images.map((_, i) => (
                                <span
                                    key={i}
                                    onClick={() => setHeroIndex(i)}
                                    style={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: i === heroIndex ? '#555' : '#ccc',
                                        margin: 3,
                                        cursor: 'pointer'
                                    }}
                                    aria-label={`Go to image ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0 }}>{game.name}</h1>
                        <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{game.developer || 'Developer'} • {game.category || 'Category'}</div>
                        <div style={{ marginTop: 8 }}>
                            {(() => {
                                const reviews = game.reviews || [];
                                const ratingCounts = [0, 0, 0, 0, 0];
                                reviews.forEach(r => {
                                    if (r.rating >= 1 && r.rating <= 5) {
                                        ratingCounts[r.rating - 1]++;
                                    }
                                });
                                const avgRating = reviews.length > 0
                                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                                    : 0;
                                return (
                                    <>
                                        <RatingStars value={avgRating} />
                                        <span style={{ fontSize: 12, color: '#555' }}>
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
                                    </>
                                );
                            })()}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(game.tags || []).map(t => (
                                <span key={t.id} style={{ background: '#e0e0e0', padding: '2px 6px', fontSize: 11, borderRadius: 12 }}>{t.name}</span>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button style={primaryBtn}>Download Game</button>
                            <button style={secBtn}>Follow Game</button>
                            <button style={secBtn}>Add to Wishlist</button>
                            <button style={secBtn} aria-label="Favourite">❤</button>
                        </div>
                        <div style={{ fontSize: 10, marginTop: 12, color: '#555' }}>Release Date: {date}</div>

                        {/* Report */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                            <button style={dangerBtn}>Report Game</button>
                        </div>

                    </div>

                    {/* Accessibility card */}
                    <div style={{ width: 200, background: '#e9e9e9', padding: '0.5rem', borderRadius: 6 }}>
                        <h4 style={{ marginTop: 0, fontSize: 13 }}>Accessibility Features</h4>
                        {accessibility.map(a => (
                            <div key={a.group} style={{ marginBottom: 6 }}>
                                <strong style={{ fontSize: 11 }}>{a.group}</strong>
                                <ul style={{ paddingLeft: 14, margin: '2px 0', listStyle: 'disc' }}>
                                    {a.items.map(i => <li key={i} style={{ fontSize: 10 }}>{i}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* About */}
                <section style={sectionStyle}>
                    <h3 style={sectionTitle}>About this game</h3>
                    <p style={{ fontSize: 12, lineHeight: 1.4 }}>
                        {game.description || 'No description available.'}
                    </p>
                </section>

                {/* Additional Images */}
                <section style={sectionStyle}>
                    <h3 style={sectionTitle}>Additional Images</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={prevAdditional} style={secBtn} aria-label="Previous additional images">‹</button>
                        {addWindow.map((url, i) => (
                            <div key={i} style={{ width: 140, height: 90, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                <img src={url} alt={`Additional ${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: 4 }} />
                            </div>
                        ))}
                        <button onClick={nextAdditional} style={secBtn} aria-label="Next additional images">›</button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 6 }}>
                        {images.map((_, i) => (
                            <span key={i} style={{
                                display: 'inline-block',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: i === addIndex ? '#555' : '#bbb',
                                margin: 3
                            }} />
                        ))}
                    </div>
                </section>

                {/* Reviews */}
                <section style={sectionStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={sectionTitle}>User Reviews</h3>
                        <button style={primaryBtn}>Write a Review</button>
                    </div>

                    <div style={{ fontSize: 11, marginBottom: 12 }}>
                        {ratingDist.map((count, idx) => {
                            const star = 5 - idx;
                            return (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>{'★'.repeat(star)}{'☆'.repeat(5 - star)}</span>
                                    <div style={{ flex: 1, background: '#ccc', height: 6, borderRadius: 3 }}>
                                        <div style={{
                                            width: Math.min(100, (count / ratingDist[0]) * 100) + '%',
                                            height: '100%',
                                            background: '#4aa3df',
                                            borderRadius: 3
                                        }} />
                                    </div>
                                    <span>{count}</span>
                                </div>
                            );
                        })}
                    </div>

                    {reviews.map(r => (
                        <div key={r.id} style={{ background: '#fff', padding: '8px 10px', borderRadius: 4, marginBottom: 8, fontSize: 12, border: '1px solid #ddd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{r.user?.username || 'Anonymous'}</strong>
                                <span style={{ color: '#777' }}>
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div><RatingStars value={r.rating} /></div>
                            <p style={{ margin: '4px 0' }}>{r.comment || 'No comment provided.'}</p>
                        </div>
                    ))}

                </section>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link to="/" style={{ fontSize: 12 }}>← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

// Styles
const sideBtn = {
    background: '#e0e0e0',
    border: 'none',
    cursor: 'pointer',
    width: 32,
    height: 32,
    borderRadius: 16,
    fontSize: 18,
    lineHeight: '32px',
    textAlign: 'center'
};

const primaryBtn = {
    background: '#4aa3df',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer'
};
const secBtn = {
    background: '#e0e0e0',
    color: '#222',
    border: 'none',
    padding: '6px 10px',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer'
};
const dangerBtn = {
    ...primaryBtn,
    background: '#ff6b6b'
};
const sectionStyle = {
    background: '#f2f2f2',
    padding: '0.8rem',
    borderRadius: 6,
    marginTop: 16
};
const sectionTitle = {
    margin: '0 0 6px',
    fontSize: 14
};
