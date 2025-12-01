import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGame, createReviewForGame, getReviewsForGame, followGame, unfollowGame, getFollowedGames } from '../api';
import { fetchCurrentUser } from '../api';
import { pushToast } from '../components/ToastHost.jsx';

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

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFollowed, setIsFollowed] = useState(false);
    const [followBusy, setFollowBusy] = useState(false);
    const followBtnRef = useRef(null);
    const reviewBtnRef = useRef(null);
    const reviewRatingRef = useRef(null);
    const reviewCommentRef = useRef(null);
    const reviewSubmitRef = useRef(null);
    const heroRef = useRef(null);
    const addCarouselRef = useRef(null);

    // Light flash style for voice feedback
    const flashClass = 'voice-flash';
    useEffect(() => {
        const styleId = 'voice-flash-style';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .${flashClass} {
            outline: 3px solid #a5f3fc;
            outline-offset: 3px;
            transition: outline-color 0.4s ease;
          }
        `;
        document.head.appendChild(style);
    }, []);

    const focusAndFlash = (el) => {
        if (!el) return;
        if (typeof el.focus === 'function') el.focus({ preventScroll: true });
        el.classList.add(flashClass);
        setTimeout(() => el.classList.remove(flashClass), 1000);
    };

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const [gameData, reviews] = await Promise.all([
                    getGame(id),
                    getReviewsForGame(id),
                ]);

                if (cancelled) return;

                // attach reviews to game so existing code using `game.reviews` still works
                setGame({ ...gameData, reviews });
            } catch (e) {
                if (cancelled) return;
                setError(e.message || String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => { fetchCurrentUser().then(setCurrentUser).catch(() => {}); }, []);

    // checking follow state once it has user and game
    useEffect(() => {
        let cancelled = false;
        async function checkFollow() {
            if (!currentUser || !game) return;
            try {
                const list = await getFollowedGames(currentUser.id);
                if (!cancelled) setIsFollowed(list.some(g => g.id === game.id));
            } catch { /* ignore */ }
        }
        checkFollow();
        return () => { cancelled = true; };
    }, [currentUser, game]);

    useEffect(() => {
        const onVoice = (e) => {
            const detail = e.detail || {};
            if (detail.type !== 'game') return;
            switch (detail.action) {
                case 'follow':
                case 'unfollow':
                    if (followBtnRef.current) {
                        followBtnRef.current.click();
                        focusAndFlash(followBtnRef.current);
                    }
                    break;
                case 'write-review':
                    e.preventDefault();
                    openReviewModal();
                    setTimeout(() => {
                        focusAndFlash(document.querySelector('textarea'));
                    }, 50);
                    break;
                case 'download':
                    pushToast('Download action not implemented yet');
                    break;
                case 'wishlist':
                    pushToast('Wishlist action not implemented yet');
                    break;
                case 'report':
                    pushToast('Report action not implemented yet');
                    break;
                case 'set-review-rating':
                    if (!showReviewModal) openReviewModal();
                    setReviewRating(detail.value || 5);
                    focusAndFlash(reviewRatingRef.current);
                    break;
                case 'focus-review-comment':
                    if (!showReviewModal) openReviewModal();
                    setTimeout(() => focusAndFlash(reviewCommentRef.current), 30);
                    break;
                case 'set-review-comment':
                    if (!showReviewModal) openReviewModal();
                    setReviewComment(detail.value || '');
                    setTimeout(() => focusAndFlash(reviewCommentRef.current), 30);
                    break;
                case 'submit-review':
                    if (!showReviewModal) openReviewModal();
                    setTimeout(() => {
                        if (reviewSubmitRef.current && !submittingReview) {
                            reviewSubmitRef.current.click();
                            focusAndFlash(reviewSubmitRef.current);
                        }
                    }, 80);
                    break;
                case 'cancel-review':
                    if (showReviewModal) closeReviewModal();
                    break;
                case 'next-image':
                    nextHero();
                    focusAndFlash(heroRef.current);
                    break;
                case 'prev-image':
                    prevHero();
                    focusAndFlash(heroRef.current);
                    break;
                case 'next-additional':
                    nextAdditional();
                    focusAndFlash(addCarouselRef.current);
                    break;
                case 'prev-additional':
                    prevAdditional();
                    focusAndFlash(addCarouselRef.current);
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('voiceCommand', onVoice);
        return () => window.removeEventListener('voiceCommand', onVoice);
    }, []);

    const openReviewModal = () => {
        setReviewRating(5);
        setReviewComment('');
        setSubmitError(null);
        setShowReviewModal(true);
    }

    const closeReviewModal = () => {
        if (submittingReview) return; // prevent closing while submitting
        setShowReviewModal(false);
    }

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewComment.trim()) {
            setSubmitError('Please provide a comment');
            return;
        }
        try {
            setSubmittingReview(true);
            setSubmitError(null);

            await createReviewForGame(id, {
                rating: Number(reviewRating),
                comment: reviewComment.trim(),
            });

            const [updatedGame, updatedReviews] = await Promise.all([
                getGame(id),
                getReviewsForGame(id),
            ]);

            setGame({ ...updatedGame, reviews: updatedReviews });
            setShowReviewModal(false);

        } catch (err) {
            console.error(err);
            setSubmitError("Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    }

    //Reviews
    const reviews = game?.reviews || [];

    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) {
            ratingCounts[r.rating - 1]++;
        }
    });
    const ratingDist = ratingCounts.reverse();

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


    return (
        <div style={{ background: '#d7edf9', minHeight: '100vh', padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Top section */}
                <div style={{ display: 'flex', gap: '1rem', background: '#f2f2f2', padding: '1rem', borderRadius: 6 }} ref={heroRef}>
                    {/* Hero image */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={prevHero} style={sideBtn} aria-label="Previous image">&lt;</button>
                            <img
                                src={currentHero}
                                alt={`${game.name} screenshot`}
                                style={{ width: 320, height: 200, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                                
                            />
                            <button onClick={nextHero} style={sideBtn} aria-label="Next image">&gt;</button>
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
                            <button style={secBtn} ref={followBtnRef} disabled={followBusy} onClick={async () => {
                                if (!currentUser) { pushToast('Please log in to follow'); return; }
                                setFollowBusy(true);
                                try {
                                    if (isFollowed) {
                                        await unfollowGame(currentUser.id, game.id);
                                        setIsFollowed(false);
                                        pushToast('Game unfollowed');
                                    } else {
                                        await followGame(currentUser.id, game.id);
                                        setIsFollowed(true);
                                        pushToast('Game followed');
                                    }
                                } catch (e) {
                                    pushToast(e.message || 'Follow action failed');
                                } finally {
                                    setFollowBusy(false);
                                }
                            }}>{followBusy ? (isFollowed ? 'Unfollowing…' : 'Following…') : (isFollowed ? 'Unfollow Game' : 'Follow Game')}</button>
                            <button style={secBtn}>Add to Wishlist</button>
                            {/*<button style={secBtn} aria-label="Favourite">❤</button>*/}
                            <button style={dangerBtn}>Report Game</button>
                        </div>
                        <div style={{ fontSize: 10, marginTop: 12, color: '#555' }}>Release Date: {date}</div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} ref={addCarouselRef}>
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
                        <button style={primaryBtn} ref={reviewBtnRef} onClick={openReviewModal}>Write a Review</button>
                    </div>

                    {/* Review modal */}
                    {showReviewModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                                <div className="flex justify-between items-center border-b px-4 py-3">
                                    <h3 className="text-lg font-semibold">Write a review</h3>
                                    <button
                                        onClick={closeReviewModal}
                                        className="text-gray-500 hover:text-gray-700"
                                        disabled={submittingReview}
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    onSubmit={handleSubmitReview}
                                    className="px-4 py-4 space-y-4"
                                >
                                    {submitError && (
                                        <p className="text-red-600 text-sm">{submitError}</p>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Rating (1-5)
                                        </label>
                                        <select
                                            value={reviewRating}
                                            ref={reviewRatingRef}
                                            onChange={(e) => setReviewRating(e.target.value)}
                                            className="border rounded px-2 py-1 w-full"
                                            required
                                        >
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <option key={n} value={n}>
                                                    {n}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Comment
                                        </label>
                                        <textarea
                                            value={reviewComment}
                                            ref={reviewCommentRef}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            className="border rounded px-2 py-1 w-full min-h-[100px]"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            className="px-3 py-1 rounded border"
                                            onClick={closeReviewModal}
                                            disabled={submittingReview}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            ref={reviewSubmitRef}
                                            className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                                            disabled={submittingReview}
                                        >
                                            {submittingReview ? "Submitting..." : "Submit review"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

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




