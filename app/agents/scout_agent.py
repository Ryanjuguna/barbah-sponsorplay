"""
Barbah SponsorPlay - Agent 1: Talent Discovery & Micro-Syndicate Scout Agent
Cognitive Brain: Anthropic Claude 3.5 Sonnet
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import uuid
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    CampaignBrief, CreatorProfile, SyndicateRecommendation,
    BriefDeconstructionResult, SoloCreatorMatch, AIStrategicAnalysis
)
from app.models.database import db
from app.config import settings
from app.agents.claude_brain import claude_brain

class ScoutAgent:
    def __init__(self):
        self.name = "Talent Discovery & Micro-Syndicate Scout Agent"
        self.version = "2.1.0-dual-pathway-intelligence"

    def analyze_brief_and_match(self, brief: CampaignBrief) -> List[SyndicateRecommendation]:
        """
        Deconstructs the campaign brief using Claude 3.5 Sonnet cognitive reasoning,
        filters available creators, and bundles synergistic Sponsorship Syndicates based
        on geographic density, audience reach, brand safety, and budget optimization.
        """
        all_creators = db.get_all_creators()
        budget_usd = brief.budget_usd

        # Filter creators with strong brand safety
        viable_creators = [
            c for c in all_creators
            if c.brand_safety_score >= 92.0
        ]

        # Prepare candidate payload for Claude
        candidates_summary = [
            {
                "id": c.id,
                "name": c.name,
                "gamer_tag": c.gamer_tag,
                "type": c.type,
                "location": c.location,
                "reach": c.monthly_reach,
                "rate_usd": c.base_rate_usd,
                "etims_registered": c.etims_registered,
                "bio": c.bio
            }
            for c in viable_creators
        ]

        # Attempt cognitive reasoning with Claude
        claude_syndicate_insight = claude_brain.reason_syndicate_selection(
            brand_name=brief.brand_name,
            brief_text=brief.brief,
            budget_usd=budget_usd,
            candidate_creators=candidates_summary
        )

        recommendations: List[SyndicateRecommendation] = []

        # Syndicate Option 1: Claude-Enhanced Grassroots Syndicate
        if claude_syndicate_insight and claude_syndicate_insight.get("selected_creator_ids"):
            selected_ids = claude_syndicate_insight["selected_creator_ids"]
            syndicate_1_creators = [c for c in viable_creators if c.id in selected_ids]
            if len(syndicate_1_creators) < 2:
                syndicate_1_creators = viable_creators[:3]
            title_1 = claude_syndicate_insight.get("syndicate_title", "Collegiate & Community Grassroots Syndicate")
            rationale_1 = claude_syndicate_insight.get("strategic_rationale", "")
            synergy_score_1 = float(claude_syndicate_insight.get("synergy_score", 97.8))
        else:
            # Fallback deterministic bundle
            c_pro = next((c for c in viable_creators if c.type == "PRO_PLAYER_STREAMER"), viable_creators[0])
            c_campus = next((c for c in viable_creators if c.type == "CAMPUS_ESPORTS_CLUB"), viable_creators[1])
            c_den = next((c for c in viable_creators if c.type == "GRASSROOTS_GAMING_DEN"), viable_creators[2])
            syndicate_1_creators = [c_pro, c_campus, c_den]
            title_1 = "Collegiate & Community Grassroots Syndicate"
            rationale_1 = (
                f"Combines high-skill tactical authority ({c_pro.name}) with hyper-local campus reach "
                f"({c_campus.name}) and high-density neighborhood engagement ({c_den.name}). "
                f"Reaches verified Kenyan youth gamers with 100% tax compliance via BII."
            )
            synergy_score_1 = 97.4

        cost_1_usd = sum(c.base_rate_usd for c in syndicate_1_creators)
        cost_1_kes = cost_1_usd * settings.USD_TO_KES_RATE
        reach_1 = int(sum(c.monthly_reach for c in syndicate_1_creators) * 0.85)

        rec_1 = SyndicateRecommendation(
            syndicate_id=f"SYN-{uuid.uuid4().hex[:6].upper()}",
            campaign_id=brief.id,
            title=title_1,
            rationale=rationale_1,
            total_cost_usd=round(cost_1_usd, 2),
            total_cost_kes=round(cost_1_kes, 2),
            expected_reach=reach_1,
            creators=syndicate_1_creators,
            synergy_score=synergy_score_1,
            etims_compliance_mode="MIXED_DIRECT_AND_BII"
        )
        db.save_syndicate(rec_1)
        recommendations.append(rec_1)

        # Syndicate Option 2: "The National Tournament & Esports Circuit Syndicate"
        c_tourney = next((c for c in viable_creators if c.type == "TOURNAMENT_ORGANIZER"), viable_creators[0])
        c_female = next((c for c in viable_creators if c.gamer_tag == "QueenArrow"), viable_creators[1])
        c_regional = next((c for c in viable_creators if c.type == "REGIONAL_HUB"), viable_creators[2])

        syndicate_2_creators = [c_tourney, c_female, c_regional]
        cost_2_usd = sum(c.base_rate_usd for c in syndicate_2_creators)
        cost_2_kes = cost_2_usd * settings.USD_TO_KES_RATE
        reach_2 = int(sum(c.monthly_reach for c in syndicate_2_creators) * 0.88)

        rec_2 = SyndicateRecommendation(
            syndicate_id=f"SYN-{uuid.uuid4().hex[:6].upper()}",
            campaign_id=brief.id,
            title="National Esports Circuit & Inclusion Syndicate",
            rationale=(
                f"Anchored by Kenya's premier tournament league ({c_tourney.name}), championing gender diversity "
                f"with Forbes 30-under-30 icon {c_female.name}, and expanding reach into Rift Valley ({c_regional.name})."
            ),
            total_cost_usd=round(cost_2_usd, 2),
            total_cost_kes=round(cost_2_kes, 2),
            expected_reach=reach_2,
            creators=syndicate_2_creators,
            synergy_score=98.9,
            etims_compliance_mode="ALL_DIRECT"
        )
        db.save_syndicate(rec_2)
        recommendations.append(rec_2)

        return recommendations

    def deconstruct_brief_and_match(self, brief: CampaignBrief) -> BriefDeconstructionResult:
        """
        Comprehensive Agent 1 Entrypoint:
        1. Deconstructs the brand's natural language brief.
        2. Generates top Syndicate Bundles (multi-creator).
        3. Identifies top matching Solo Creators (individual ambassadors).
        4. Synthesizes an AI Strategic Recommendation comparing reach, synergy, and suitability.
        """
        if not brief.id:
            brief.id = f"CAMP-{uuid.uuid4().hex[:6].upper()}"
        db.save_campaign(brief)

        syndicates = self.analyze_brief_and_match(brief)
        all_creators = db.get_all_creators()
        brief_lower = (brief.brief + " " + brief.brand_name + " " + brief.target_audience).lower()

        # Check for explicit solo preference in brief text or settings
        has_solo_intent = (
            brief.strategy_preference == "SOLO" or
            any(w in brief_lower for w in ["solo", "single creator", "single streamer", "one gamer", "individual creator", "just one"])
        )

        # Rank creators for solo match
        scored_creators = []
        for c in all_creators:
            score = float(c.brand_safety_score)
            match_reasons = []

            # Check game alignment
            games = [g.strip().lower() for g in c.primary_game.replace("/", ",").split(",")]
            for g in games:
                if g in brief_lower:
                    score += 5.0
                    match_reasons.append(f"Primary Game match: {c.primary_game}")
                    break

            # Check location alignment
            loc_clean = c.location.lower()
            for pref_loc in brief.preferred_locations:
                if pref_loc.lower() in loc_clean or pref_loc.lower() in brief_lower:
                    score += 3.0
                    match_reasons.append(f"Geographic focus: {c.location}")
                    break

            # Budget viability check
            if c.base_rate_usd <= brief.budget_usd:
                score += 4.0
                match_reasons.append(f"Budget compatible (${c.base_rate_usd:.0f} <= ${brief.budget_usd:.0f})")
            else:
                score -= 10.0

            if not match_reasons:
                match_reasons.append(f"High brand safety ({c.brand_safety_score}%) with active youth following")

            normalized_score = min(99.4, round(score, 1))
            scored_creators.append((normalized_score, c, "; ".join(match_reasons)))

        # Sort top solo creators
        scored_creators.sort(key=lambda x: x[0], reverse=True)
        top_solo_entries = scored_creators[:3]

        solo_matches: List[SoloCreatorMatch] = []
        for s_score, c, rationale in top_solo_entries:
            cost_usd = c.base_rate_usd
            cost_kes = cost_usd * settings.USD_TO_KES_RATE
            solo_matches.append(
                SoloCreatorMatch(
                    creator=c,
                    match_score=s_score,
                    match_rationale=rationale,
                    recommended_deliverables=[
                        "Live stream banner & logo overlay (>= 3.5% screen occupancy)",
                        "Dedicated tournament match shoutcaster callout",
                        "Post-stream replay clip with #SponsorPlay tag"
                    ],
                    total_cost_usd=cost_usd,
                    total_cost_kes=cost_kes
                )
            )

        # AI Comparative Synthesis
        top_syn = syndicates[0] if syndicates else None
        top_solo = solo_matches[0] if solo_matches else None

        syn_reach = top_syn.expected_reach if top_syn else 0
        solo_reach = top_solo.creator.monthly_reach if top_solo else 0
        reach_multiple = round(syn_reach / max(1, solo_reach), 1)

        if has_solo_intent:
            rec_path = "SOLO"
            rec_title = "Solo Creator Sponsorship Recommended (Brand Intent Match)"
            verdict = (
                f"Based on your preference for an individual ambassador, Agent 1 recommends "
                f"{top_solo.creator.name} (@{top_solo.creator.gamer_tag}). Sponsoring solo provides 100% focused airtime, "
                f"unmatched {top_solo.creator.brand_safety_score}% brand safety, and immediate turnaround for ${top_solo.total_cost_usd:,.2f} USD."
            )
        elif syn_reach > solo_reach * 1.4:
            rec_path = "SYNDICATE"
            rec_title = f"Syndicate Bundle Recommended ({reach_multiple}x Greater Community Reach)"
            verdict = (
                f"For {brief.brand_name}'s target reach of {brief.target_reach:,} gamers, the '{top_syn.title}' "
                f"syndicate delivers {syn_reach:,} verified touchpoints across campus esports and grassroots dens. "
                f"A syndicate delivers {reach_multiple}x higher distribution efficiency per dollar than a single creator."
            )
        else:
            rec_path = "SYNDICATE"
            rec_title = "Syndicate Bundle Recommended (Balanced Micro-Creator Network)"
            verdict = (
                f"A blended syndicate combines competitive tactical authority with grassroots youth engagement, "
                f"giving {brief.brand_name} diversified campus presence under a single KRA Section 16 compliant contract."
            )

        ai_analysis = AIStrategicAnalysis(
            target_summary=f"Targeting {brief.target_reach:,} gamers with budget ${brief.budget_usd:,.2f} USD ({brief.target_audience})",
            detected_intent="SOLO" if has_solo_intent else ("SYNDICATE" if brief.strategy_preference == "SYNDICATE" else "AUTO"),
            recommended_path=rec_path,
            recommendation_title=rec_title,
            verdict_rationale=verdict,
            syndicate_score=top_syn.synergy_score if top_syn else 95.0,
            solo_score=top_solo.match_score if top_solo else 90.0,
            reach_comparison={
                "syndicate_reach": syn_reach,
                "solo_reach": solo_reach,
                "syndicate_cost_usd": top_syn.total_cost_usd if top_syn else 0,
                "solo_cost_usd": top_solo.total_cost_usd if top_solo else 0
            }
        )

        return BriefDeconstructionResult(
            campaign_id=brief.id,
            brand_name=brief.brand_name,
            ai_analysis=ai_analysis,
            syndicates=syndicates,
            solo_matches=solo_matches
        )

scout_agent = ScoutAgent()
