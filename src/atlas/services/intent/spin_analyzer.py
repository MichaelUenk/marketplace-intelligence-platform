"""
SPIN Analysis Engine

Situation, Problem, Implication, Need-Payoff framework for deal qualification.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .intent_types import SPINQuadrant, SPIN_QUESTIONS


@dataclass
class SPINQuadrantAnalysis:
    """Analysis for a single SPIN quadrant"""
    quadrant: SPINQuadrant
    content: str
    confidence: int  # 0-100
    sources: list[str] = field(default_factory=list)
    gaps: list[str] = field(default_factory=list)
    suggested_questions: list[str] = field(default_factory=list)


@dataclass
class SPINAnalysis:
    """Complete SPIN analysis for a deal"""
    deal_id: str
    situation: SPINQuadrantAnalysis
    problem: SPINQuadrantAnalysis
    implication: SPINQuadrantAnalysis
    need_payoff: SPINQuadrantAnalysis
    overall_score: int = 0
    completeness: int = 0  # 0-100%
    key_insight: str = ""
    gaps_summary: list[str] = field(default_factory=list)
    analyzed_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        self._calculate_scores()

    def _calculate_scores(self):
        """Calculate overall score and completeness"""
        quadrants = [self.situation, self.problem, self.implication, self.need_payoff]

        # Completeness based on filled quadrants
        filled = sum(1 for q in quadrants if q.content)
        self.completeness = int((filled / 4) * 100)

        # Score is average confidence of filled quadrants
        if filled > 0:
            total_confidence = sum(q.confidence for q in quadrants if q.content)
            self.overall_score = total_confidence // filled
        else:
            self.overall_score = 0

        # Collect all gaps
        self.gaps_summary = []
        for q in quadrants:
            self.gaps_summary.extend(q.gaps)

    def to_dict(self) -> dict:
        return {
            "deal_id": self.deal_id,
            "overall_score": self.overall_score,
            "completeness": self.completeness,
            "key_insight": self.key_insight,
            "gaps_summary": self.gaps_summary,
            "situation": {
                "content": self.situation.content,
                "confidence": self.situation.confidence,
                "sources": self.situation.sources,
                "gaps": self.situation.gaps,
                "suggested_questions": self.situation.suggested_questions,
            },
            "problem": {
                "content": self.problem.content,
                "confidence": self.problem.confidence,
                "sources": self.problem.sources,
                "gaps": self.problem.gaps,
                "suggested_questions": self.problem.suggested_questions,
            },
            "implication": {
                "content": self.implication.content,
                "confidence": self.implication.confidence,
                "sources": self.implication.sources,
                "gaps": self.implication.gaps,
                "suggested_questions": self.implication.suggested_questions,
            },
            "need_payoff": {
                "content": self.need_payoff.content,
                "confidence": self.need_payoff.confidence,
                "sources": self.need_payoff.sources,
                "gaps": self.need_payoff.gaps,
                "suggested_questions": self.need_payoff.suggested_questions,
            },
            "analyzed_at": self.analyzed_at.isoformat(),
        }


class SPINAnalyzer:
    """
    SPIN Analysis Engine

    Helps structure understanding of supplier's:
    - Situation: Current state and context
    - Problem: Pain points and challenges
    - Implication: Consequences of not solving
    - Need-Payoff: Value of solving the problem
    """

    def __init__(self):
        self.questions = SPIN_QUESTIONS

    def analyze(
        self,
        deal_id: str,
        situation: dict | None = None,
        problem: dict | None = None,
        implication: dict | None = None,
        need_payoff: dict | None = None,
    ) -> SPINAnalysis:
        """
        Perform SPIN analysis on deal data.

        Args:
            deal_id: Deal identifier
            situation: Dict with 'content', 'confidence', 'sources'
            problem: Dict with 'content', 'confidence', 'sources'
            implication: Dict with 'content', 'confidence', 'sources'
            need_payoff: Dict with 'content', 'confidence', 'sources'

        Returns:
            Complete SPINAnalysis
        """
        situation_analysis = self._analyze_quadrant(
            SPINQuadrant.SITUATION,
            situation or {},
        )
        problem_analysis = self._analyze_quadrant(
            SPINQuadrant.PROBLEM,
            problem or {},
        )
        implication_analysis = self._analyze_quadrant(
            SPINQuadrant.IMPLICATION,
            implication or {},
        )
        need_payoff_analysis = self._analyze_quadrant(
            SPINQuadrant.NEED_PAYOFF,
            need_payoff or {},
        )

        analysis = SPINAnalysis(
            deal_id=deal_id,
            situation=situation_analysis,
            problem=problem_analysis,
            implication=implication_analysis,
            need_payoff=need_payoff_analysis,
        )

        # Generate key insight
        analysis.key_insight = self._generate_key_insight(analysis)

        return analysis

    def _analyze_quadrant(
        self,
        quadrant: SPINQuadrant,
        data: dict,
    ) -> SPINQuadrantAnalysis:
        """Analyze a single SPIN quadrant"""
        content = data.get("content", "")
        confidence = data.get("confidence", 0)
        sources = data.get("sources", [])

        gaps = []
        suggested_questions = []

        if not content:
            gaps.append(f"{quadrant.value.title()} not documented")
            suggested_questions = self.questions[quadrant][:2]
        elif confidence < 70:
            gaps.append(f"{quadrant.value.title()} confidence low ({confidence}%)")
            suggested_questions = self._get_deepening_questions(quadrant, content)
        elif not sources:
            gaps.append(f"No sources cited for {quadrant.value}")

        return SPINQuadrantAnalysis(
            quadrant=quadrant,
            content=content,
            confidence=confidence,
            sources=sources,
            gaps=gaps,
            suggested_questions=suggested_questions,
        )

    def _get_deepening_questions(
        self,
        quadrant: SPINQuadrant,
        content: str,
    ) -> list[str]:
        """Get questions to deepen understanding of a quadrant"""
        base_questions = self.questions[quadrant]

        # Return questions that might help deepen the analysis
        deepening_questions = []
        for q in base_questions:
            # Simple heuristic: if the question's key terms aren't in content
            key_terms = q.lower().split()[:3]
            if not any(term in content.lower() for term in key_terms if len(term) > 4):
                deepening_questions.append(q)

        return deepening_questions[:2] if deepening_questions else base_questions[:2]

    def _generate_key_insight(self, analysis: SPINAnalysis) -> str:
        """Generate a key insight summary from the SPIN analysis"""
        if analysis.completeness < 50:
            return "SPIN analysis incomplete. Focus on understanding situation and problem first."

        insights = []

        # Situation insight
        if analysis.situation.content and analysis.situation.confidence >= 70:
            insights.append("Situation is well understood")

        # Problem insight
        if analysis.problem.content and analysis.problem.confidence >= 70:
            if analysis.implication.content:
                insights.append("Problem and implications are clear")
            else:
                insights.append("Problem identified but implications unclear")

        # Need-payoff insight
        if analysis.need_payoff.content and analysis.need_payoff.confidence >= 70:
            insights.append("Value proposition is clear to buyer")

        # Alignment insight
        if all([
            analysis.situation.confidence >= 70,
            analysis.problem.confidence >= 70,
            analysis.implication.confidence >= 70,
            analysis.need_payoff.confidence >= 70,
        ]):
            return "Strong SPIN alignment. Problem is real, implications understood, and solution value is clear."

        if insights:
            return ". ".join(insights) + "."

        return "Continue deepening SPIN understanding across all quadrants."

    def get_suggested_questions(
        self,
        analysis: SPINAnalysis,
    ) -> dict[str, list[str]]:
        """Get suggested questions for each SPIN quadrant"""
        suggestions = {}

        for quadrant, quadrant_analysis in [
            (SPINQuadrant.SITUATION, analysis.situation),
            (SPINQuadrant.PROBLEM, analysis.problem),
            (SPINQuadrant.IMPLICATION, analysis.implication),
            (SPINQuadrant.NEED_PAYOFF, analysis.need_payoff),
        ]:
            if quadrant_analysis.suggested_questions:
                suggestions[quadrant.value] = quadrant_analysis.suggested_questions
            elif quadrant_analysis.confidence < 90:
                suggestions[quadrant.value] = self.questions[quadrant][:2]

        return suggestions

    def check_commit_readiness(self, analysis: SPINAnalysis) -> dict:
        """Check if SPIN analysis is ready for commit stage"""
        requirements = {
            "situation_complete": bool(analysis.situation.content),
            "problem_complete": bool(analysis.problem.content),
            "implication_complete": bool(analysis.implication.content),
            "need_payoff_complete": bool(analysis.need_payoff.content),
            "score_threshold": analysis.overall_score >= 70,
        }

        blocking = []
        if not requirements["situation_complete"]:
            blocking.append("Situation not documented")
        if not requirements["problem_complete"]:
            blocking.append("Problem not documented")
        if not requirements["implication_complete"]:
            blocking.append("Implications not documented")
        if not requirements["need_payoff_complete"]:
            blocking.append("Need-payoff not documented")
        if not requirements["score_threshold"]:
            blocking.append(f"SPIN score {analysis.overall_score} below 70 threshold")

        return {
            "requirements": requirements,
            "blocking_items": blocking,
            "passed": len(blocking) == 0,
        }

    def create_spin_summary(self, analysis: SPINAnalysis) -> str:
        """Create a narrative summary of the SPIN analysis"""
        parts = []

        if analysis.situation.content:
            parts.append(f"**Situation:** {analysis.situation.content[:200]}")

        if analysis.problem.content:
            parts.append(f"**Problem:** {analysis.problem.content[:200]}")

        if analysis.implication.content:
            parts.append(f"**Implication:** {analysis.implication.content[:200]}")

        if analysis.need_payoff.content:
            parts.append(f"**Need-Payoff:** {analysis.need_payoff.content[:200]}")

        if not parts:
            return "No SPIN analysis documented yet."

        summary = "\n\n".join(parts)
        summary += f"\n\n**SPIN Score:** {analysis.overall_score}/100"

        if analysis.key_insight:
            summary += f"\n\n**Key Insight:** {analysis.key_insight}"

        return summary
