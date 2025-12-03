import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGame, createReviewForGame, getReviewsForGame, followGame, unfollowGame, getFollowedGames, reportGame } from '../api.js';
import { fetchCurrentUser } from '../api.js';
import { pushToast } from '../components/ToastHost.jsx';
import { getAccessibilityPreferences } from '../api.js';
import { loadSettings } from '../settings.js';

function RatingStars({ value }) {
    const v = Math.round(value || 0);
    return (
        <span aria-label={`Rating ${v} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ color: i < v ? 'var(--accent)' : 'var(--text-muted)' }}>★</span>
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
    const [captionsEnabled, setCaptionsEnabled] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [reportError, setReportError] = useState(null);
    const [reportSubmitError, setReportSubmitError] = useState(null);
    const heroVideoRef = useRef(null);
    const heroTrackRef = useRef(null);
    const followBtnRef = useRef(null);
    const reviewBtnRef = useRef(null);
    const reviewRatingRef = useRef(null);
    const reviewCommentRef = useRef(null);
    const reviewSubmitRef = useRef(null);
    const reportTextareaRef = useRef(null);
    const reportSubmitRef = useRef(null);
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
    }, [showReviewModal, reviewComment, submittingReview]);

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

    // initialising captions from the local Settings
    useEffect(() => {
        try {
            const s = loadSettings();
            setCaptionsEnabled(Boolean(s?.captionsAlways));
        } catch { /* ignore */ }
    }, []);

    // loading accessibility preferences
    useEffect(() => {
        let cancelled = false;
        async function loadPrefs() {
            if (!currentUser) return;
            try {
                const prefs = await getAccessibilityPreferences(currentUser.id);
                if (!cancelled) {
                    const local = loadSettings();
                    const fromSettings = Boolean(local?.captionsAlways);
                    const fromBackend = !!prefs?.hearing;
                    setCaptionsEnabled(fromSettings || fromBackend);
                }
            } catch (e) {
                // in case backend fails, applying local settings
                try {
                    const local = loadSettings();
                    setCaptionsEnabled(Boolean(local?.captionsAlways));
                } catch { /* ignore */ }
            }
        }
        loadPrefs();
        return () => { cancelled = true; };
    }, [currentUser]);

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

    // this makes sure that the captions are automatically activated when enabled in settings
    useEffect(() => {
        const vid = heroVideoRef.current;
        const trackEl = heroTrackRef.current;
        if (!vid) return;

        const setTrackModes = () => {
            try {
                const list = vid.textTracks;
                if (!list || list.length === 0) return;
                let chosen = null;
                for (let i = 0; i < list.length; i++) {
                    const t = list[i];
                    const isCaptionLike = t.kind === 'captions' || t.kind === 'subtitles';
                    if (!isCaptionLike) { t.mode = 'disabled'; continue; }
                    const isEn = (t.language || '').toLowerCase() === 'en';
                    if (!chosen && isCaptionLike) chosen = t;
                    if (isEn) chosen = t;
                }
                for (let i = 0; i < list.length; i++) {
                    const t = list[i];
                    const isCaptionLike = t.kind === 'captions' || t.kind === 'subtitles';
                    t.mode = captionsEnabled && isCaptionLike && t === chosen ? 'showing' : 'disabled';
                }
            } catch { /* ignore */ }
        };

        setTrackModes();
        const onMeta = () => setTrackModes();
        const onData = () => setTrackModes();
        const onAdd = () => setTimeout(setTrackModes, 0);
        const onTrackLoad = () => setTrackModes();

        vid.addEventListener('loadedmetadata', onMeta);
        vid.addEventListener('loadeddata', onData);
        if (vid.textTracks && typeof vid.textTracks.addEventListener === 'function') {
            vid.textTracks.addEventListener('addtrack', onAdd);
        }
        if (trackEl && typeof trackEl.addEventListener === 'function') {
            trackEl.addEventListener('load', onTrackLoad);
        }

        return () => {
            vid.removeEventListener('loadedmetadata', onMeta);
            vid.removeEventListener('loadeddata', onData);
            if (vid.textTracks && typeof vid.textTracks.removeEventListener === 'function') {
                vid.textTracks.removeEventListener('addtrack', onAdd);
            }
            if (trackEl && typeof trackEl.removeEventListener === 'function') {
                trackEl.removeEventListener('load', onTrackLoad);
            }
        };
    }, [captionsEnabled, heroIndex]);

    useEffect(() => {
        const onSettings = (e) => {
            const s = (e && e.detail) || loadSettings();
            if (typeof s?.captionsAlways === 'boolean') {
                setCaptionsEnabled(Boolean(s.captionsAlways));
            }
        };
        window.addEventListener('settings:changed', onSettings);
        return () => window.removeEventListener('settings:changed', onSettings);
    }, []);

    // this makes sure that the captions are automatically activated when enabled in settings
    useEffect(() => {
        const vid = heroVideoRef.current;
        const trackEl = heroTrackRef.current;
        if (!vid) return;

        const setTrackModes = () => {
            try {
                const list = vid.textTracks;
                if (!list || list.length === 0) return;
                let chosen = null;
                for (let i = 0; i < list.length; i++) {
                    const t = list[i];
                    const isCaptionLike = t.kind === 'captions' || t.kind === 'subtitles';
                    if (!isCaptionLike) { t.mode = 'disabled'; continue; }
                    const isEn = (t.language || '').toLowerCase() === 'en';
                    if (!chosen && isCaptionLike) chosen = t;
                    if (isEn) chosen = t;
                }
                for (let i = 0; i < list.length; i++) {
                    const t = list[i];
                    const isCaptionLike = t.kind === 'captions' || t.kind === 'subtitles';
                    t.mode = captionsEnabled && isCaptionLike && t === chosen ? 'showing' : 'disabled';
                }
            } catch { /* ignore */ }
        };

        setTrackModes();
        const onMeta = () => setTrackModes();
        const onData = () => setTrackModes();
        const onAdd = () => setTimeout(setTrackModes, 0);
        const onTrackLoad = () => setTrackModes();

        vid.addEventListener('loadedmetadata', onMeta);
        vid.addEventListener('loadeddata', onData);
        if (vid.textTracks && typeof vid.textTracks.addEventListener === 'function') {
            vid.textTracks.addEventListener('addtrack', onAdd);
        }
        if (trackEl && typeof trackEl.addEventListener === 'function') {
            trackEl.addEventListener('load', onTrackLoad);
        }

        return () => {
            vid.removeEventListener('loadedmetadata', onMeta);
            vid.removeEventListener('loadeddata', onData);
            if (vid.textTracks && typeof vid.textTracks.removeEventListener === 'function') {
                vid.textTracks.removeEventListener('addtrack', onAdd);
            }
            if (trackEl && typeof trackEl.removeEventListener === 'function') {
                trackEl.removeEventListener('load', onTrackLoad);
            }
        };
    }, [captionsEnabled, heroIndex]);

    useEffect(() => {
        const onSettings = (e) => {
            const s = (e && e.detail) || loadSettings();
            if (typeof s?.captionsAlways === 'boolean') {
                setCaptionsEnabled(Boolean(s.captionsAlways));
            }
        };
        window.addEventListener('settings:changed', onSettings);
        return () => window.removeEventListener('settings:changed', onSettings);
    }, []);

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
                case 'open-reviews':
                    e.preventDefault();
                    openReviewModal();
                    setTimeout(() => focusAndFlash(reviewRatingRef.current), 50);
                    break;
                case 'download':
                    pushToast('Download action not implemented yet');
                    break;
                case 'wishlist':
                    // Add current game to wishlist
                    e.preventDefault?.();
                    try {
                        const me = currentUser;
                        if (!me || !game) { pushToast('Sign in to use wishlist'); break; }
                        const key = `wishlist:${me.id}`;
                        const raw = localStorage.getItem(key);
                        const ids = raw ? JSON.parse(raw) : [];
                        const exists = ids.some((i) => (i.id ?? i) === game.id);
                        const idItem = game.id;
                        const next = exists ? ids : [...ids, idItem];
                        localStorage.setItem(key, JSON.stringify(next));
                        window.dispatchEvent(new CustomEvent('library:updated', { detail: { type: 'wishlist', gameId: game.id } }));
                        pushToast(exists ? 'Already in wishlist' : 'Added to wishlist');
                        focusAndFlash(document.body);
                    } catch { /* ignore */ }
                    break;
                case 'favourites':
                    // Add current game to favourites
                    e.preventDefault?.();
                    try {
                        const me = currentUser;
                        if (!me || !game) { pushToast('Sign in to use favourites'); break; }
                        const key = `favourites:${me.id}`;
                        const raw = localStorage.getItem(key);
                        const ids = raw ? JSON.parse(raw) : [];
                        const exists = ids.some((i) => (i.id ?? i) === game.id);
                        const idItem = game.id;
                        const next = exists ? ids : [...ids, idItem];
                        localStorage.setItem(key, JSON.stringify(next));
                        window.dispatchEvent(new CustomEvent('library:updated', { detail: { type: 'favourites', gameId: game.id } }));
                        pushToast(exists ? 'Already in favourites' : 'Added to favourites');
                        focusAndFlash(document.body);
                    } catch { /* ignore */ }
                    break;
                case 'report':
                    if (!currentUser) {
                        pushToast('Please log in to report this game');
                        break;
                    }
                    if (!showReportModal) openReportModal();
                    setTimeout(() => {
                        focusAndFlash(reportTextareaRef.current || document.querySelector('[data-voice-report-textarea]'));
                    }, 50);
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
                    if (!showReviewModal) openReviewModal({ preserve: true });
                    // Wait for modal to mount and refs to attach before clicking submit
                    const clickSubmit = () => {
                        const btn = reviewSubmitRef.current || document.querySelector('[data-voice-review-submit]');
                        if (btn && !submittingReview) {
                            btn.click();
                            focusAndFlash(btn);
                            return true;
                        }
                        return false;
                    };
                    // Retry briefly in case render is delayed
                    setTimeout(() => {
                        if (clickSubmit()) return;
                        setTimeout(() => {
                            if (clickSubmit()) return;
                            setTimeout(clickSubmit, 120);
                        }, 80);
                    }, 120);
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
    }, [currentUser, game]);

    const openReviewModal = (opts = {}) => {
        const preserve = opts.preserve === true;
        if (!preserve) {
            setReviewRating(5);
            setReviewComment('');
            setSubmitError(null);
        }
        setShowReviewModal(true);
    };

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

    const openReportModal = (opts = {}) => {
        const preserve = opts.preserve === true;
        if (!currentUser) {
            pushToast('Please log in to report this game');
            return;
        }
        if (!preserve) {
            setReportMessage('');
            setReportError(null);
            setReportSubmitError(null);
        }
        setShowReportModal(true);
        setTimeout(() => {
            if (reportTextareaRef.current) {
                reportTextareaRef.current.focus({ preventScroll: true });
            }
        }, 0);
    };

    const closeReportModal = () => {
        if (submittingReport) return;
        setShowReportModal(false);
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        const msg = (reportMessage || '').trim();
        if (!msg) {
            setReportError('Please describe why you are reporting this game');
            if (reportTextareaRef.current) {
                focusAndFlash(reportTextareaRef.current);
            }
            return;
        }
        try {
            setSubmittingReport(true);
            setReportError(null);
            setReportSubmitError(null);
            await reportGame(id, msg);
            pushToast('Report submitted. Thank you for your feedback.');
            setShowReportModal(false);
            setReportMessage('');
        } catch (err) {
            console.error(err);
            setReportSubmitError(err.message || 'Failed to submit report');
        } finally {
            setSubmittingReport(false);
        }
    };

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
    // Trailer being displayed
    const trailerUrl = (game.name === 'Aurora Quest') ? '/AuroraQuestTrailer.mp4' : null;
    const media = trailerUrl ? [trailerUrl, ...images] : images;
    const currentHero = media[heroIndex];

    // Additional images carousel logic
    const ADD_VISIBLE = 3;
    const addWindow = media.slice(addIndex, addIndex + ADD_VISIBLE).length === ADD_VISIBLE
        ? media.slice(addIndex, addIndex + ADD_VISIBLE)
        : [...media.slice(addIndex), ...media.slice(0, (addIndex + ADD_VISIBLE) % media.length)];

    const prevHero = () => setHeroIndex((i) => (i - 1 + media.length) % media.length);
    const nextHero = () => setHeroIndex((i) => (i + 1) % media.length);
    const prevAdditional = () => setAddIndex(i => (i - 1 + media.length) % media.length);
    const nextAdditional = () => setAddIndex(i => (i + 1) % media.length);

    // //Reviews
    // const reviews = game.reviews || [];

    // const ratingCounts = [0, 0, 0, 0, 0];
    // reviews.forEach(r => {
    //     if (r.rating >= 1 && r.rating <= 5) {
    //         ratingCounts[r.rating - 1]++;
    //     }
    // });
    // const ratingDist = ratingCounts.reverse();


    return (
        <div style={{ background: 'var(--bg-page)', color: 'var(--text-primary)', minHeight: '100vh', padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                {/* Top section */}
                <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 6 }} ref={heroRef}>
                    {/* Hero image */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={prevHero} style={sideBtn} aria-label="Previous image">&lt;</button>
                            {String(currentHero).toLowerCase().endsWith('.mp4') ? (
                                <video
                                    key={currentHero}
                                    ref={heroVideoRef}
                                    src={currentHero}
                                    controls
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    style={{ width: 320, height: 200, objectFit: 'cover', borderRadius: 4, display: 'block', background: '#000' }}
                                >
                                    {/* Subtitles track shown automatically when captions are enabled and track exists */}
                                    {currentHero === '/AuroraQuestTrailer.mp4' ? (
                                        <track
                                            key={`captions-${captionsEnabled}`}
                                            ref={heroTrackRef}
                                            kind="subtitles"
                                            src="/AuroraQuestTrailer.vtt"
                                            srclang="en"
                                            label="English"
                                            default={captionsEnabled}
                                        />
                                    ) : null}
                                </video>
                            ) : (
                                <img
                                    src={currentHero}
                                    alt={`${game.name} media`}
                                    style={{ width: 320, height: 200, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                                    
                            />
                            )}
                            <button onClick={nextHero} style={sideBtn} aria-label="Next image">&gt;</button>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: 4 }}>
                            {media.map((_, i) => (
                                <span
                                    key={i}
                                    onClick={() => setHeroIndex(i)}
                                    style={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: i === heroIndex ? 'var(--accent)' : 'var(--border)',
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
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{game.developer || 'Developer'} • {game.category || 'Category'}</div>
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
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {avgRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
                                    </>
                                );
                            })()}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {(game.tags || []).map(t => (
                                <span key={t.id} style={{ background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '2px 6px', fontSize: 11, borderRadius: 12 }}>{t.name}</span>
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
                            <button style={secBtn} onClick={async () => {
                                try {
                                    if (!currentUser) { pushToast('Log in to add to wishlist'); return; }
                                    const key = `wishlist:${currentUser.id}`;
                                    const raw = localStorage.getItem(key);
                                    const list = raw ? JSON.parse(raw) : [];
                                    const item = { id: game.id, title: game.name, imageUrl: (Array.isArray(game.images)&&game.images[0])||'/placeholder1.png', rating: game.rating, tags: (game.tags||[]).map(t=>t.name) };
                                    if (!list.find(g => g.id === item.id)) {
                                        localStorage.setItem(key, JSON.stringify([...list, item]));
                                        window.dispatchEvent(new CustomEvent('library:updated', { detail: { type: 'wishlist', gameId: game.id } }));
                                        pushToast('Added to wishlist');
                                    } else {
                                        pushToast('Already in wishlist');
                                    }
                                } catch (e) { pushToast('Wishlist error'); }
                            }}>❤ Wishlist</button>
                            <button style={secBtn} onClick={async () => {
                                try {
                                    if (!currentUser) { pushToast('Log in to add favourites'); return; }
                                    const key = `favourites:${currentUser.id}`;
                                    const raw = localStorage.getItem(key);
                                    const list = raw ? JSON.parse(raw) : [];
                                    const item = { id: game.id, title: game.name, imageUrl: (Array.isArray(game.images)&&game.images[0])||'/placeholder1.png', rating: game.rating, tags: (game.tags||[]).map(t=>t.name) };
                                    if (!list.find(g => g.id === item.id)) {
                                        localStorage.setItem(key, JSON.stringify([...list, item]));
                                        window.dispatchEvent(new CustomEvent('library:updated', { detail: { type: 'favourites', gameId: game.id } }));
                                        pushToast('Added to favourites');
                                    } else {
                                        pushToast('Already a favourite');
                                    }
                                } catch (e) { pushToast('Favourites error'); }
                            }}>★ Favourites</button>
                            <button style={dangerBtn}>Report Game</button>
                        </div>
                        <div style={{ fontSize: 10, marginTop: 12, color: 'var(--text-muted)' }}>Release Date: {date}</div>
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
                        {addWindow.map((url, i) => {
                            const isVideo = String(url).toLowerCase().endsWith('.mp4');
                            return (
                                <div key={i} style={{ width: 140, height: 90, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                    {isVideo ? (
                                        <video key={url} src={url} muted loop playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: 4 }}>
                                            {url === '/AuroraQuestTrailer.mp4' ? (
                                                <track kind="subtitles" src="/AuroraQuestTrailer.vtt" srclang="en" label="English" default={captionsEnabled} />
                                            ) : null}
                                        </video>
                                    ) : (
                                        <img src={url} alt={`Additional ${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                    )}
                                </div>
                            );
                        })}
                        <button onClick={nextAdditional} style={secBtn} aria-label="Next additional images">›</button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 6 }}>
                        {media.map((_, i) => (
                            <span key={i} style={{
                                display: 'inline-block',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: i === addIndex ? 'var(--accent)' : 'var(--border)',
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
                            <div className="theme-surface border theme-border rounded-lg shadow-lg w-full max-w-md mx-4">
                                <div className="flex justify-between items-center border-b theme-border px-4 py-3">
                                    <h3 className="text-lg font-semibold">Write a review</h3>
                                    <button
                                        onClick={closeReviewModal}
                                        className="theme-muted hover:opacity-80"
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
                                            className="theme-input rounded px-2 py-1 w-full"
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
                                            className="theme-input rounded px-2 py-1 w-full min-h-[100px]"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            className="px-3 py-1 rounded border theme-border theme-subtle"
                                            onClick={closeReviewModal}
                                            disabled={submittingReview}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            ref={reviewSubmitRef}
                                            data-voice-review-submit
                                            className="px-4 py-1 rounded theme-btn-strong hover:opacity-90 disabled:opacity-50"
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
                                    <div style={{ flex: 1, background: 'var(--border)', height: 6, borderRadius: 3 }}>
                                        <div style={{
                                            width: Math.min(100, (ratingDist[0] ? (count / ratingDist[0]) * 100 : 0)) + '%',
                                            height: '100%',
                                            background: 'var(--accent)',
                                            borderRadius: 3
                                        }} />
                                    </div>
                                    <span>{count}</span>
                                </div>
                            );
                        })}
                    </div>

                    {reviews.map(r => (
                        <div key={r.id} style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 4, marginBottom: 8, fontSize: 12, border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{r.user?.username || 'Anonymous'}</strong>
                                <span style={{ color: 'var(--text-muted)' }}>
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

            {/* Report modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" role="dialog" aria-modal="true">
                    <div className="theme-surface border theme-border rounded-lg shadow-lg w-full max-w-md mx-4">
                        <div className="flex justify-between items-center border-b theme-border px-4 py-3">
                            <h3 className="text-lg font-semibold">Report this game</h3>
                            <button
                                onClick={closeReportModal}
                                className="theme-muted hover:opacity-80"
                                disabled={submittingReport}
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmitReport} className="px-4 py-4 space-y-4">
                            {reportSubmitError && (
                                <p className="text-red-600 text-sm">{reportSubmitError}</p>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1" htmlFor="report-message">
                                    Why are you reporting this game?
                                </label>
                                <textarea
                                    id="report-message"
                                    ref={reportTextareaRef}
                                    className="theme-input rounded px-2 py-1 w-full min-h-[100px]"
                                    value={reportMessage}
                                    onChange={(e) => setReportMessage(e.target.value)}
                                    aria-invalid={!!reportError}
                                    data-voice-report-textarea
                                />
                                {reportError && (
                                    <p className="text-red-600 text-xs mt-1">{reportError}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    className="px-3 py-1 rounded border theme-border theme-subtle"
                                    onClick={closeReportModal}
                                    disabled={submittingReport}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    ref={reportSubmitRef}
                                    data-voice-report-submit
                                    className="px-4 py-1 rounded theme-btn-strong hover:opacity-90 disabled:opacity-50"
                                    disabled={submittingReport}
                                >
                                    {submittingReport ? 'Submitting...' : 'Submit report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles
const sideBtn = {
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    width: 32,
    height: 32,
    borderRadius: 16,
    fontSize: 18,
    lineHeight: '32px',
    textAlign: 'center'
};

const primaryBtn = {
    background: 'var(--accent)',
    color: 'var(--accent-contrast)',
    border: '1px solid var(--accent)',
    padding: '6px 12px',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer'
};
const secBtn = {
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    padding: '6px 10px',
    fontSize: 12,
    borderRadius: 4,
    cursor: 'pointer'
};
const dangerBtn = {
    ...primaryBtn,
    background: '#ff6b6b',
    borderColor: '#ff6b6b'
};
const sectionStyle = {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    padding: '0.8rem',
    borderRadius: 6,
    marginTop: 16
};
const sectionTitle = {
    margin: '0 0 6px',
    fontSize: 14
};

