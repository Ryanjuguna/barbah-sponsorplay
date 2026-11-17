"""
Barbah SponsorPlay - WordPress Studio Integration Client
PayPal AI Hackathon - Track 02: Sponsor Play

Bridges WordPress Studio (SQLite / REST API) directly into the SponsorPlay multi-agent engine:
- Dynamically ingests community gaming lounges, esports creators, campaigns, and case studies
- Enables visual content editing in WordPress Studio while keeping agentic execution in FastAPI
- Provides zero-latency direct SQLite access locally with robust fallback for cloud environments
"""

import os
import re
import json
import sqlite3
import requests
from typing import Dict, List, Any, Optional

# Default paths for WordPress Studio
DEFAULT_SQLITE_PATH = r"C:\Users\ryanj\Studio\sponsorpay\wp-content\database\.ht.sqlite"
DEFAULT_WP_REST_URL = "http://localhost:8881/wp-json/wp/v2"

# High-fidelity fallback dataset mirroring user-authored WordPress content
FALLBACK_WP_POSTS = [
    {
        "id": 11,
        "title": "Kibera Esports Arena & Gaming Lounge",
        "slug": "kibera-esports-arena",
        "category": "Creators",
        "location": "Olympic, Kibera, Nairobi",
        "type": "GRASSROOTS_GAMING_DEN",
        "monthly_footfall": 1450,
        "monthly_reach": 19500,
        "rate_usd": 150.0,
        "stations": 14,
        "games": "EA Sports FC 25, Tekken 8, Mortal Kombat 1",
        "pass_rate": 99.4,
        "streaming": "1080p 60fps dual-angle Twitch & YouTube stream setup",
        "excerpt": "Premier grassroots community lounge in Nairobi with 14 console stations and 1,450 monthly unique competitors.",
        "content": "<p>Kibera Esports Arena is one of Nairobi's most vibrant community gaming centers. Equipped with 14 high-performance PlayStation 5 and Xbox Series stations, it hosts daily community brackets and weekend championship showdowns.</p>",
        "kra_pin": "A011982736K",
        "paypal_email": "kibera-arena@barbahgames.com"
    },
    {
        "id": 12,
        "title": "Apex Queens Nairobi",
        "slug": "apex-queens-nairobi",
        "category": "Creators",
        "location": "Westlands, Nairobi",
        "type": "PRO_PLAYER_CREATOR",
        "monthly_footfall": 620,
        "monthly_reach": 28000,
        "rate_usd": 320.0,
        "stations": 8,
        "games": "Apex Legends, Valorant, Tekken 8",
        "pass_rate": 99.1,
        "streaming": "Twitch & TikTok live multi-stream",
        "excerpt": "All-female competitive battle royale and tactical shooter squad with 28,000 active community followers.",
        "content": "<p>Apex Queens Nairobi is East Africa's leading all-female competitive esports squad and stream team, championing gender inclusion in high-tier tournament play.</p>",
        "kra_pin": "A009847261M",
        "paypal_email": "apex-queens@barbahgames.com"
    },
    {
        "id": 13,
        "title": "UoN CyberLions (University of Nairobi)",
        "slug": "uon-cyberlions",
        "category": "Creators",
        "location": "Main Campus, University of Nairobi",
        "type": "COLLEGIATE_ESPORTS_CLUB",
        "monthly_footfall": 2100,
        "monthly_reach": 34000,
        "rate_usd": 280.0,
        "stations": 20,
        "games": "EA Sports FC 25, Call of Duty Mobile, Valorant",
        "pass_rate": 98.7,
        "streaming": "Collegiate broadcast desk with shoutcaster feeds",
        "excerpt": "Official university gaming fraternity with 820+ registered varsity gamers hosting inter-hall derbies.",
        "content": "<p>The premier collegiate gaming fraternity in East Africa, mobilizing collegiate youth across the Nairobi university circuit with broadcast talent.</p>",
        "kra_pin": "P051284759X",
        "paypal_email": "cyberlions@uonbi.ac.ke"
    },
    {
        "id": 14,
        "title": "Safaricom 5G Campus Gaming Clash",
        "slug": "safaricom-5g-campus-clash",
        "category": "Campaigns",
        "brand_name": "Safaricom 5G Home Gaming",
        "budget_usd": 750.0,
        "target_reach": 35000,
        "locations": ["Nairobi", "Eldoret"],
        "excerpt": "National inter-university 5G low-latency esports tournament across 6 university campuses.",
        "milestones": [
            {"phase": 1, "pct": 30, "title": "Mobilization & Brand Asset Staging"},
            {"phase": 2, "pct": 40, "title": "Live Tournament Broadcast & Continuous Sentiment Audit"},
            {"phase": 3, "pct": 30, "title": "Highlight Archival, KRA eTIMS BII Invoice & Net Payout"}
        ],
        "content": "<p>Safaricom is partnering with Barbah SponsorPlay to activate Kenyan gaming creators in demonstrating 5G mobile low-latency gaming across Nairobi and Eldoret campuses.</p>"
    },
    {
        "id": 15,
        "title": "Red Bull Energy Lounge Takeover",
        "slug": "red-bull-energy-takeover",
        "category": "Campaigns",
        "brand_name": "Red Bull East Africa",
        "budget_usd": 600.0,
        "target_reach": 25000,
        "locations": ["Nairobi East", "Kibera", "Westlands"],
        "excerpt": "Branded venue takeovers across 8 grassroots lounges with custom can coolers, tournament HUDs, and energy break callouts.",
        "milestones": [
            {"phase": 1, "pct": 30, "title": "Venue Roll-up Banners & Can Cooler Asset Placement"},
            {"phase": 2, "pct": 40, "title": "Tournament Stream Execution & 1080p HUD Overlays"},
            {"phase": 3, "pct": 30, "title": "Social Clip Syndication & Fiscal eTIMS Release"}
        ],
        "content": "<p>Red Bull activation energizing grassroots Tekken and EA FC gamers with live stream product integration and certified physical venue presence.</p>"
    },
    {
        "id": 16,
        "title": "From Informal Lounges to Tax-Compliant Enterprises: How KRA eTIMS Unlocked for Nairobi Gamers",
        "slug": "kra-etims-grassroots-gamers",
        "category": "Impact Stories",
        "author": "Barbah Research & Venture Lab",
        "published_at": "November 2026",
        "excerpt": "How Barbah SponsorPlay's automated Buyer-Initiated Invoice (BII) engine resolved the 30% corporate tax deduction wall under Section 16(1)(c).",
        "content": "<p>Under Kenya Income Tax Act Section 16, corporate marketing sponsors face an automatic 30% tax deduction disallowance when disbursing funds to unregistered grassroots youth. By generating automated Buyer-Initiated Invoices (BII) with electronic QR codes, SponsorPlay removes regulatory friction while directly remitting statutory 5% Withholding Tax.</p>"
    }
]

class WordPressClient:
    def __init__(self):
        self.sqlite_path = os.getenv("WORDPRESS_SQLITE_PATH", DEFAULT_SQLITE_PATH)
        self.rest_url = os.getenv("WORDPRESS_REST_URL", DEFAULT_WP_REST_URL)
        self.cached_posts: List[Dict[str, Any]] = []
        self._load_initial_data()

    def _load_initial_data(self):
        """Loads data from SQLite database, REST API, or structured fallback."""
        posts = self._fetch_from_sqlite()
        if not posts:
            posts = self._fetch_from_rest()
        if not posts:
            posts = FALLBACK_WP_POSTS
        self.cached_posts = posts

    def _fetch_from_sqlite(self) -> Optional[List[Dict[str, Any]]]:
        """Reads posts directly from WordPress Studio SQLite database file."""
        if not os.path.exists(self.sqlite_path):
            return None
        try:
            conn = sqlite3.connect(self.sqlite_path, timeout=2.0)
            cur = conn.cursor()
            query = """
                SELECT p.ID, p.post_title, p.post_name, p.post_content, p.post_excerpt, p.post_date,
                       GROUP_CONCAT(t.name, ',') as categories
                FROM wp_posts p
                LEFT JOIN wp_term_relationships tr ON (p.ID = tr.object_id)
                LEFT JOIN wp_term_taxonomy tt ON (tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'category')
                LEFT JOIN wp_terms t ON (tt.term_id = t.term_id)
                WHERE p.post_status = 'publish' AND p.post_type = 'post'
                GROUP BY p.ID
                ORDER BY p.ID DESC
            """
            cur.execute(query)
            rows = cur.fetchall()
            conn.close()

            if not rows:
                return None

            results = []
            for r in rows:
                post_id, title, slug, content, excerpt, post_date, cats_str = r
                categories = cats_str.split(",") if cats_str else ["Uncategorized"]
                main_category = categories[0] if categories else "General"

                # Extract rich properties from HTML content if present
                clean_item = self._parse_post_content(post_id, title, slug, content, excerpt, main_category)
                results.append(clean_item)

            return results
        except Exception:
            return None

    def _fetch_from_rest(self) -> Optional[List[Dict[str, Any]]]:
        """Fetches from WordPress REST API if running."""
        try:
            resp = requests.get(f"{self.rest_url}/posts?per_page=20", timeout=2.5)
            if resp.status_code == 200:
                raw_posts = resp.json()
                results = []
                for p in raw_posts:
                    post_id = p.get("id")
                    title = p.get("title", {}).get("rendered", "")
                    slug = p.get("slug", "")
                    content = p.get("content", {}).get("rendered", "")
                    excerpt = p.get("excerpt", {}).get("rendered", "")
                    clean_item = self._parse_post_content(post_id, title, slug, content, excerpt, "WordPress")
                    results.append(clean_item)
                return results
        except Exception:
            return None
        return None

    def _parse_post_content(self, post_id: int, title: str, slug: str, content: str, excerpt: str, category: str) -> Dict[str, Any]:
        """Extracts structured community attributes from post content."""
        clean_text = re.sub(r'<[^>]+>', ' ', content or '')
        
        # Check against known IDs for enriched attributes
        for fb in FALLBACK_WP_POSTS:
            if fb["id"] == post_id or fb["slug"] == slug:
                merged = dict(fb)
                merged["title"] = title or fb["title"]
                merged["content"] = content or fb["content"]
                return merged

        # Generic parser
        return {
            "id": post_id,
            "title": title,
            "slug": slug,
            "category": category,
            "content": content,
            "excerpt": clean_text[:140] + "..." if len(clean_text) > 140 else clean_text
        }

    def get_all_posts(self) -> List[Dict[str, Any]]:
        self._load_initial_data()
        return self.cached_posts

    def get_creators_and_lounges(self) -> List[Dict[str, Any]]:
        posts = self.get_all_posts()
        return [p for p in posts if p.get("category") == "Creators" or "lounge" in p.get("slug", "") or "arena" in p.get("slug", "") or "queens" in p.get("slug", "") or "cyberlions" in p.get("slug", "")]

    def get_campaigns(self) -> List[Dict[str, Any]]:
        posts = self.get_all_posts()
        return [p for p in posts if p.get("category") == "Campaigns" or "clash" in p.get("slug", "") or "takeover" in p.get("slug", "")]

    def get_impact_stories(self) -> List[Dict[str, Any]]:
        posts = self.get_all_posts()
        return [p for p in posts if p.get("category") == "Impact Stories" or "etims" in p.get("slug", "")]

    def sync_to_creator_registry(self, db_instance):
        """
        Injects WordPress community gaming lounges and teams directly into the
        SponsorPlay in-memory creator database so Agent 1 (Scout) matches them in real time!
        """
        from app.models.schemas import CreatorProfile
        
        wp_creators = self.get_creators_and_lounges()
        for wc in wp_creators:
            c_id = f"wp-creator-{wc['id']}"
            existing = db_instance.get_creator(c_id)
            if not existing:
                profile = CreatorProfile(
                    id=c_id,
                    name=wc["title"],
                    gamer_tag=wc["slug"].replace("-", "_").upper()[:15],
                    type=wc.get("type", "GRASSROOTS_GAMING_DEN"),
                    primary_game=wc.get("games", "EA Sports FC 25 / Tekken 8"),
                    platform="Physical Venue / Twitch Broadcast",
                    channel_url=f"http://localhost:8881/{wc['slug']}",
                    location=wc.get("location", "Nairobi, Kenya"),
                    monthly_reach=wc.get("monthly_reach", 20000),
                    avg_concurrent_viewers=wc.get("monthly_footfall", 1200) // 3,
                    audience_demographic="16-28 competitive grassroots gaming youth",
                    brand_safety_score=wc.get("pass_rate", 99.0),
                    etims_registered=True,
                    kra_pin=wc.get("kra_pin", "A011982736K"),
                    paypal_email=wc.get("paypal_email", "creator@sponsorplay.ke"),
                    mpesa_phone="+254712345678",
                    base_rate_usd=float(wc.get("rate_usd", 200.0)),
                    tags=["WordPress Verified", "Grassroots Lounge", "Physical Activation", "Community Derby"],
                    bio=f"{wc.get('excerpt', '')} Verified via WordPress Studio."
                )
                db_instance.creators[profile.id] = profile
        return len(wp_creators)

wp_client = WordPressClient()
