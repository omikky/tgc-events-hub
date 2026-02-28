import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Play, ExternalLink, Instagram, Heart, MessageCircle,
    Share2, Volume2, VolumeX, ChevronLeft, ChevronRight, Pause,
    Youtube
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// TikTok Icon (not in lucide)
const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
);

export type SocialPost = {
    id: string;
    platform: "instagram" | "tiktok";
    type: "image" | "video" | "reel" | "carousel";
    thumbnail: string;
    mediaUrl?: string;
    caption: string;
    likes: number;
    comments: number;
    postUrl: string;
    tags?: string[];
    date?: string;
};

// ─── Demo posts ──────────────────────────────────────────────────────────────
// Replace these with real embed URLs / media from your accounts
export const DEMO_POSTS: SocialPost[] = [
    {
        id: "1",
        platform: "instagram",
        type: "image",
        thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
        caption: "✨ Magical wedding setup at Victoria Island — every detail crafted with love. Swipe to see more! #TGCEventsHub #WeddingDecor #LagosWedding",
        likes: 1204,
        comments: 87,
        postUrl: "https://instagram.com",
        tags: ["Wedding", "Decor"],
        date: "2 days ago"
    },
    {
        id: "2",
        platform: "tiktok",
        type: "video",
        thumbnail: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80",
        mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        caption: "🎉 Behind the scenes of our biggest event yet! 500+ guests, full decoration & catering. Watch the magic happen 🪄 #EventPlanning #TikTokNigeria",
        likes: 8900,
        comments: 312,
        postUrl: "https://tiktok.com",
        tags: ["BTS", "Event"],
        date: "5 days ago"
    },
    {
        id: "3",
        platform: "instagram",
        type: "reel",
        thumbnail: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80",
        mediaUrl: "https://www.w3schools.com/html/movie.mp4",
        caption: "🌸 Our floral arrangements are speaking volumes. Book your event with TGC Events Hub today! Link in bio 💐 #FloralDesign #Lagos",
        likes: 3450,
        comments: 145,
        postUrl: "https://instagram.com",
        tags: ["Floral", "Reel"],
        date: "1 week ago"
    },
    {
        id: "4",
        platform: "tiktok",
        type: "video",
        thumbnail: "https://images.unsplash.com/photo-1478146059778-26ce70e5eff5?w=600&q=80",
        caption: "🎂 Birthday set-up transformation in 60 seconds! From empty hall to pure elegance ✨ #TGCEventsHub #Birthday #Transform",
        likes: 15600,
        comments: 890,
        postUrl: "https://tiktok.com",
        tags: ["Birthday", "Transformation"],
        date: "2 weeks ago"
    },
    {
        id: "5",
        platform: "instagram",
        type: "image",
        thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
        caption: "💼 Corporate dinner done right. TGC delivers luxury event experiences for brands and companies across Lagos. DM to inquire! #CorporateEvents",
        likes: 2100,
        comments: 67,
        postUrl: "https://instagram.com",
        tags: ["Corporate", "Dinner"],
        date: "3 weeks ago"
    },
    {
        id: "6",
        platform: "instagram",
        type: "carousel",
        thumbnail: "https://images.unsplash.com/photo-1561912774-79769a0a0a7a?w=600&q=80",
        caption: "🎊 Traditional wedding meets modern luxury 🤍 Full decor & rental package available. Slide to see all the details! #TraditionalWedding #NigerianWedding",
        likes: 4780,
        comments: 203,
        postUrl: "https://instagram.com",
        tags: ["Traditional", "Wedding"],
        date: "1 month ago"
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

const PlatformBadge = ({ platform }: { platform: "instagram" | "tiktok" }) =>
    platform === "instagram" ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-pink-500">
            <Instagram className="w-3.5 h-3.5" /> Instagram
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-800">
            <TikTokIcon /> TikTok
        </span>
    );

// ─── Modal ───────────────────────────────────────────────────────────────────
const PostModal = ({ post, onClose, onPrev, onNext }: {
    post: SocialPost; onClose: () => void; onPrev: () => void; onNext: () => void;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);

    const isVideo = post.type === "video" || post.type === "reel";

    useEffect(() => {
        setPlaying(false);
        if (videoRef.current) videoRef.current.pause();
    }, [post.id]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (playing) { videoRef.current.pause(); setPlaying(false); }
        else { videoRef.current.play(); setPlaying(true); }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !muted;
        setMuted(!muted);
    };

    // Close on backdrop click
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <motion.div
                    className="relative z-10 bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row"
                    initial={{ scale: 0.92, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    {/* Media Side */}
                    <div className="relative bg-black md:w-1/2 aspect-[9/16] md:h-auto flex items-center justify-center overflow-hidden shrink-0">
                        {isVideo && post.mediaUrl ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={post.mediaUrl}
                                    className="w-full h-full object-cover"
                                    loop
                                    playsInline
                                    onEnded={() => setPlaying(false)}
                                />
                                <button
                                    onClick={togglePlay}
                                    className="absolute inset-0 flex items-center justify-center group"
                                >
                                    <span className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
                                        {playing ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white fill-white ml-1" />}
                                    </span>
                                </button>
                                <button
                                    onClick={toggleMute}
                                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
                                >
                                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                            </>
                        ) : (
                            <img src={post.thumbnail} alt={post.caption} className="w-full h-full object-cover" />
                        )}

                        {/* Platform watermark */}
                        <div className="absolute top-3 left-3">
                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md ${post.platform === "instagram" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white" : "bg-white text-black"}`}>
                                {post.platform === "instagram" ? <Instagram className="w-3 h-3" /> : <TikTokIcon />}
                                {post.platform === "instagram" ? "Instagram" : "TikTok"}
                            </div>
                        </div>

                        {/* Type badge */}
                        {(post.type === "reel" || post.type === "video") && (
                            <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                                {post.type}
                            </div>
                        )}
                    </div>

                    {/* Info Side */}
                    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">TGC</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold leading-none">TGC Events Hub</p>
                                    <PlatformBadge platform={post.platform} />
                                </div>
                            </div>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tags */}
                        {post.tags && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {post.tags.map(t => (
                                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                ))}
                            </div>
                        )}

                        {/* Caption */}
                        <p className="text-sm text-slate-700 leading-relaxed flex-1 mb-5">{post.caption}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-5 text-sm text-muted-foreground mb-5 border-y py-3">
                            <span className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> <strong className="text-foreground">{formatCount(post.likes)}</strong></span>
                            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-blue-500" /> <strong className="text-foreground">{formatCount(post.comments)}</strong></span>
                            {post.date && <span className="ml-auto text-xs">{post.date}</span>}
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2">
                            <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button className="w-full gap-2" size="sm">
                                    <ExternalLink className="w-4 h-4" />
                                    View on {post.platform === "instagram" ? "Instagram" : "TikTok"}
                                </Button>
                            </a>
                            <Button variant="outline" className="w-full gap-2" size="sm" onClick={() => {
                                if (navigator.share) navigator.share({ url: post.postUrl, title: "TGC Events Hub" });
                                else { navigator.clipboard.writeText(post.postUrl); }
                            }}>
                                <Share2 className="w-4 h-4" /> Share
                            </Button>
                        </div>
                    </div>

                    {/* Prev/Next Arrows */}
                    <button
                        onClick={onPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors z-20 hidden md:flex"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors z-20 hidden md:flex"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Card ─────────────────────────────────────────────────────────────────────
const PostCard = ({ post, onClick }: { post: SocialPost; onClick: () => void }) => {
    const isVideo = post.type === "video" || post.type === "reel";

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative rounded-2xl overflow-hidden cursor-pointer bg-black h-full shadow-md"
            onClick={onClick}
        >
            <img
                src={post.thumbnail}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90"
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />

            {/* Platform chip */}
            <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${post.platform === "instagram" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white" : "bg-white text-black"}`}>
                {post.platform === "instagram" ? <Instagram className="w-3 h-3" /> : <TikTokIcon />}
                {post.platform === "instagram" ? "IG" : "TT"}
            </div>

            {/* Video play badge */}
            {isVideo && (
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
            )}

            {/* Hover play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-xs line-clamp-2 opacity-90 mb-2 leading-snug">{post.caption}</p>
                <div className="flex items-center gap-3 text-[11px] opacity-70">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-white" /> {formatCount(post.likes)}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {formatCount(post.comments)}</span>
                    {post.date && <span className="ml-auto">{post.date}</span>}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Carousel Section ─────────────────────────────────────────────────────
export const SocialCarousel = ({ posts = DEMO_POSTS }: { posts?: SocialPost[] }) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handlePrev = () => {
        setSelectedIndex(i => (i !== null ? (i - 1 + posts.length) % posts.length : null));
    };
    const handleNext = () => {
        setSelectedIndex(i => (i !== null ? (i + 1) % posts.length : null));
    };

    return (
        <section className="py-16 px-4 bg-background">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-pink-500 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                            <Instagram className="w-3.5 h-3.5" /> @tgc_events_1
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <TikTokIcon /> @tgc_events1
                        </span>
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <Youtube /> @tgc_events1
                        </span>
                    </div>
                    <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">We're All Over Your Feed</h2>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                        Real events. Real magic. Follow us on Instagram & TikTok to see what we've been creating.
                    </p>
                </motion.div>

                {/* Grid */}
                // Replace the grid section inside SocialCarousel with this:

                <div className="flex flex-col gap-3">
                    {Array.from({ length: Math.ceil(posts.length / 3) }).map((_, groupIdx) => {
                        const groupPosts = posts.slice(groupIdx * 3, groupIdx * 3 + 3);
                        const [wide, ...stacked] = groupPosts;

                        // Alternate: even groups = wide LEFT, odd groups = wide RIGHT
                        const isFlipped = groupIdx % 2 !== 0;

                        return (
                            <motion.div
                                key={groupIdx}
                                className="grid grid-cols-3 gap-3"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-60px" }}
                                transition={{ duration: 0.4, delay: groupIdx * 0.08 }}
                            >
                                {/* Wide card */}
                                {!isFlipped && wide && (
                                    <div className="col-span-2">
                                        <PostCard
                                            post={wide}
                                            onClick={() => setSelectedIndex(groupIdx * 3)}
                                        />
                                    </div>
                                )}

                                {/* 2 stacked cards */}
                                {stacked.length > 0 && (
                                    <div className="col-span-1 flex flex-col gap-3">
                                        {stacked.map((post, stackIdx) => {
                                            const realIdx = groupIdx * 3 + stackIdx + 1;
                                            return (
                                                <div key={post.id} className="flex-1">
                                                    <PostCard
                                                        post={post}
                                                        onClick={() => setSelectedIndex(realIdx)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Wide card on right when flipped */}
                                {isFlipped && wide && (
                                    <div className="col-span-2">
                                        <PostCard
                                            post={wide}
                                            onClick={() => setSelectedIndex(groupIdx * 3)}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Follow CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <a href="https://www.instagram.com/tgc_events_1" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2 shadow-sm">
                            <Instagram className="w-4 h-4 text-pink-500" /> Follow on Instagram
                        </Button>
                    </a>
                    <a href="https://www.tiktok.com/@tgc_events1?_r=1&_t=ZS-946ST4WqapA" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2 shadow-sm">
                            <TikTokIcon /> Follow on TikTok
                        </Button>
                    </a>
                    <a href="https://youtube.com/@tgceventz?si=gs1DmU0MCopmUjB3" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2 shadow-sm">
                            <Youtube /> Follow on Youtube
                        </Button>
                    </a>
                </motion.div>
            </div>

            {/* Modal */}
            {selectedIndex !== null && (
                <PostModal
                    post={posts[selectedIndex]}
                    onClose={() => setSelectedIndex(null)}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />
            )}
        </section>
    );
};

export default SocialCarousel;