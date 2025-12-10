"""
iBood Signals Intelligence - Confidence Scoring System

Scores signals based on:
- Source Reliability (25%)
- Signal Strength (25%)
- Recency (20%)
- Corroboration (15%)
- Historical Accuracy (15%)
"""

from __future__ import annotations

from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Any

from .signal_types import SignalType, SignalPriority, SIGNAL_DEFINITIONS


@dataclass
class ConfidenceFactors:
    """Individual factors contributing to confidence score"""
    source_reliability: float  # 0-100
    signal_strength: float     # 0-100
    recency: float             # 0-100
    corroboration: float       # 0-100
    historical_accuracy: float # 0-100

    @property
    def total(self) -> float:
        """Calculate weighted total (0-100)"""
        return (
            self.source_reliability * 0.25 +
            self.signal_strength * 0.25 +
            self.recency * 0.20 +
            self.corroboration * 0.15 +
            self.historical_accuracy * 0.15
        )


# Source reliability scores
SOURCE_RELIABILITY: dict[str, float] = {
    # Official sources (90-100)
    "sec_filing": 100,
    "10k_filing": 100,
    "10q_filing": 100,
    "annual_report": 98,
    "earnings_call": 95,
    "earnings_transcript": 95,
    "company_press_release": 92,
    "investor_presentation": 90,

    # Government/Registry sources (85-95)
    "companies_house": 95,
    "kvk_registry": 95,
    "bundesanzeiger": 95,
    "official_filing": 92,
    "regulatory_filing": 90,
    "import_export_data": 85,

    # Financial news (75-90)
    "bloomberg": 90,
    "reuters": 90,
    "ft": 88,
    "wsj": 88,
    "financial_news": 85,
    "analyst_report": 82,
    "credit_rating": 80,

    # Trade publications (70-85)
    "industry_publication": 80,
    "trade_publication": 78,
    "retail_dive": 75,
    "consumer_goods_tech": 75,

    # Press releases (65-80)
    "pr_newswire": 78,
    "business_wire": 78,
    "globenewswire": 75,
    "press_release": 72,

    # Other sources (50-70)
    "news": 65,
    "local_news": 60,
    "trade_show_calendar": 70,
    "linkedin": 55,
    "job_posting": 50,
    "marketplace_data": 60,
    "social_media": 45,

    # Unknown/unverified
    "unknown": 40,
    "rumor": 25,
}


class ConfidenceScorer:
    """
    Score signal confidence based on multiple factors.

    Score Ranges:
    - 90-100%: Very High Confidence — Act now
    - 75-89%: High Confidence — Strong opportunity
    - 60-74%: Medium Confidence — Worth investigating
    - Below 60%: Low Confidence — Monitor only
    """

    def __init__(self, historical_data: dict[str, float] | None = None):
        """
        Args:
            historical_data: Dict mapping signal_type to historical success rate
        """
        self.historical_accuracy = historical_data or {}

    def score(
        self,
        signal_type: str | SignalType,
        source_type: str,
        source_date: datetime | str | None = None,
        corroborating_sources: int = 0,
        evidence_strength: float | None = None,
        rag_boost: float = 0.0,
    ) -> tuple[float, ConfidenceFactors]:
        """
        Calculate confidence score for a signal.

        Args:
            signal_type: Type of signal
            source_type: Source of the signal (e.g., 'sec_filing', 'news')
            source_date: When the source was published
            corroborating_sources: Number of additional sources confirming
            evidence_strength: Manual override for evidence strength (0-100)
            rag_boost: Adjustment from RAG system based on similar signals

        Returns:
            Tuple of (total_score, factors_breakdown)
        """
        if isinstance(signal_type, str):
            try:
                signal_type = SignalType(signal_type)
            except ValueError:
                signal_type = None

        # 1. Source Reliability (25%)
        source_key = source_type.lower().replace(" ", "_") if source_type else "unknown"
        source_reliability = SOURCE_RELIABILITY.get(source_key, SOURCE_RELIABILITY["unknown"])

        # 2. Signal Strength (25%)
        if evidence_strength is not None:
            signal_strength = evidence_strength
        else:
            signal_strength = self._calculate_signal_strength(signal_type, source_type)

        # 3. Recency (20%)
        recency = self._calculate_recency(source_date)

        # 4. Corroboration (15%)
        corroboration = self._calculate_corroboration(corroborating_sources)

        # 5. Historical Accuracy (15%)
        historical = self._calculate_historical_accuracy(signal_type)

        factors = ConfidenceFactors(
            source_reliability=source_reliability,
            signal_strength=signal_strength,
            recency=recency,
            corroboration=corroboration,
            historical_accuracy=historical,
        )

        # Apply RAG boost (capped at ±15 points)
        total = min(100, max(0, factors.total + rag_boost))

        return total, factors

    def _calculate_signal_strength(
        self,
        signal_type: SignalType | None,
        source_type: str,
    ) -> float:
        """Calculate signal strength based on type and source clarity"""
        base_strength = 70  # Default

        # Hot signals from official sources are strongest
        if signal_type:
            signal_def = SIGNAL_DEFINITIONS.get(signal_type, {})
            priority = signal_def.get("priority")

            if priority == SignalPriority.HOT:
                base_strength = 85
            elif priority == SignalPriority.STRATEGIC:
                base_strength = 75
            elif priority == SignalPriority.MARKET:
                base_strength = 65
            else:
                base_strength = 60

        # Boost for official sources
        source_key = source_type.lower().replace(" ", "_") if source_type else ""
        if source_key in ["sec_filing", "10k_filing", "10q_filing", "earnings_call", "earnings_transcript"]:
            base_strength = min(100, base_strength + 10)
        elif source_key in ["company_press_release", "investor_presentation"]:
            base_strength = min(100, base_strength + 5)

        return base_strength

    def _calculate_recency(self, source_date: datetime | str | None) -> float:
        """Calculate recency score - fresher signals score higher"""
        if source_date is None:
            return 50  # Unknown recency

        if isinstance(source_date, str):
            try:
                source_date = datetime.fromisoformat(source_date.replace("Z", "+00:00"))
            except ValueError:
                return 50

        now = datetime.now(source_date.tzinfo) if source_date.tzinfo else datetime.now()
        age_days = (now - source_date).days

        if age_days < 0:
            return 100  # Future date (announcement)
        elif age_days <= 1:
            return 100
        elif age_days <= 3:
            return 95
        elif age_days <= 7:
            return 85
        elif age_days <= 14:
            return 75
        elif age_days <= 30:
            return 65
        elif age_days <= 60:
            return 50
        elif age_days <= 90:
            return 35
        else:
            return 20

    def _calculate_corroboration(self, corroborating_sources: int) -> float:
        """Calculate corroboration score based on number of confirming sources"""
        if corroborating_sources >= 5:
            return 100
        elif corroborating_sources >= 3:
            return 90
        elif corroborating_sources >= 2:
            return 80
        elif corroborating_sources >= 1:
            return 65
        else:
            return 40  # Single source

    def _calculate_historical_accuracy(self, signal_type: SignalType | None) -> float:
        """Calculate historical accuracy based on past signal success"""
        if signal_type is None:
            return 70  # Default

        type_key = signal_type.value
        if type_key in self.historical_accuracy:
            # Convert success rate (0-1) to score (0-100)
            return min(100, max(0, self.historical_accuracy[type_key] * 100))

        # Default historical scores by priority
        signal_def = SIGNAL_DEFINITIONS.get(signal_type, {})
        priority = signal_def.get("priority")

        if priority == SignalPriority.HOT:
            return 80  # Hot signals historically convert well
        elif priority == SignalPriority.STRATEGIC:
            return 70
        elif priority == SignalPriority.MARKET:
            return 60
        else:
            return 55

    def score_deal_potential(
        self,
        signal_type: str | SignalType,
        company_data: dict | None = None,
        market_data: dict | None = None,
        rag_boost: float = 0.0,
    ) -> float:
        """
        Calculate deal potential score (likelihood of successful deal).

        Factors:
        - Signal type (hot signals have higher potential)
        - Company financial health
        - Previous relationship
        - Competitive landscape
        - Timing (seasonality)
        """
        if isinstance(signal_type, str):
            try:
                signal_type = SignalType(signal_type)
            except ValueError:
                signal_type = None

        base_score = 50.0

        # Signal type contribution
        if signal_type:
            signal_def = SIGNAL_DEFINITIONS.get(signal_type, {})
            priority = signal_def.get("priority")

            if priority == SignalPriority.HOT:
                base_score += 25
            elif priority == SignalPriority.STRATEGIC:
                base_score += 15
            elif priority == SignalPriority.MARKET:
                base_score += 10
            else:
                base_score += 5

        # Company data contribution
        if company_data:
            # Previous supplier relationship
            if company_data.get("status") == "active_supplier":
                base_score += 15
            elif company_data.get("status") == "contacted":
                base_score += 5

            # Past GMV
            past_gmv = company_data.get("past_gmv", 0)
            if past_gmv > 1000000:
                base_score += 10
            elif past_gmv > 100000:
                base_score += 5

        # Market data contribution
        if market_data:
            competition = market_data.get("competition_level", "medium")
            if competition == "low":
                base_score += 10
            elif competition == "high":
                base_score -= 10

        # Apply RAG boost
        base_score = min(100, max(0, base_score + rag_boost))

        return base_score

    def get_confidence_label(self, score: float) -> str:
        """Get human-readable confidence label"""
        if score >= 90:
            return "Very High"
        elif score >= 75:
            return "High"
        elif score >= 60:
            return "Medium"
        else:
            return "Low"

    def get_action_recommendation(self, score: float) -> str:
        """Get action recommendation based on confidence score"""
        if score >= 90:
            return "Act now - Very high confidence opportunity"
        elif score >= 75:
            return "Strong opportunity - Prioritize outreach"
        elif score >= 60:
            return "Worth investigating - Gather more information"
        else:
            return "Monitor only - Low confidence signal"
