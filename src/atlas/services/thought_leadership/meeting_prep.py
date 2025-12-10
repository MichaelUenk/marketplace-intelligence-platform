# src/atlas/services/thought_leadership/meeting_prep.py
"""
Meeting Prep Agent - T-24h automated meeting preparation.

Generates:
- Meeting briefs with company/contact context
- Customized presentations
- Meeting plans with objectives and questions
- Info request emails to attendees
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
import os

# Import Mistral client for European AI
try:
    from atlas.services.ai_agent.mistral_client import MistralClient
except ImportError:
    MistralClient = None


@dataclass
class AttendeeProfile:
    """Profile information for a meeting attendee"""
    email: str
    name: str
    title: Optional[str] = None
    company: Optional[str] = None
    linkedin_url: Optional[str] = None
    previous_interactions: List[Dict[str, Any]] = None
    notes: Optional[str] = None

    def __post_init__(self):
        if self.previous_interactions is None:
            self.previous_interactions = []


@dataclass
class MeetingBrief:
    """Auto-generated meeting brief"""
    meeting_id: str
    company_overview: str
    attendee_profiles: List[AttendeeProfile]
    past_interactions: List[Dict[str, Any]]
    key_talking_points: List[str]
    risks_and_concerns: List[str]
    recommended_questions: List[str]
    deal_context: Optional[Dict[str, Any]] = None
    generated_at: datetime = None

    def __post_init__(self):
        if self.generated_at is None:
            self.generated_at = datetime.now()


@dataclass
class MeetingPlan:
    """Auto-generated meeting plan"""
    meeting_id: str
    objectives: List[str]
    agenda: List[Dict[str, Any]]
    questions_to_ask: List[str]
    topics_to_cover: List[str]
    time_allocation: Dict[str, int]
    generated_at: datetime = None

    def __post_init__(self):
        if self.generated_at is None:
            self.generated_at = datetime.now()


class MeetingPrepAgent:
    """
    Automated meeting preparation agent.

    Triggered 24 hours before external meetings to prepare:
    - Context briefs
    - Presentations
    - Meeting plans
    - Pre-meeting info requests
    """

    # Prompt templates for Mistral AI
    BRIEF_PROMPT = """You are a sales intelligence assistant helping prepare for a sales meeting.

Meeting Details:
- Title: {meeting_title}
- Company: {company_name}
- Attendees: {attendees}
- Meeting Type: {meeting_type}
- Deal Stage: {deal_stage}

Company Context:
{company_context}

Past Interactions:
{past_interactions}

Generate a comprehensive meeting brief including:
1. Company Overview (2-3 sentences)
2. Key Talking Points (3-5 bullet points)
3. Potential Risks/Concerns (2-3 items)
4. Recommended Discovery Questions (3-5 questions)

Focus on actionable insights that will help the sales rep be better prepared."""

    MEETING_PLAN_PROMPT = """You are a sales coach helping plan a {meeting_type} meeting.

Meeting Context:
- Company: {company_name}
- Attendees: {attendees}
- Deal Stage: {deal_stage}
- Duration: {duration_minutes} minutes

Generate a structured meeting plan including:
1. Clear objectives (what should be accomplished)
2. Detailed agenda with time allocations
3. Key questions to ask
4. Topics that must be covered

Keep the plan focused and actionable."""

    INFO_REQUEST_PROMPT = """Generate a brief, professional pre-meeting email to send to {attendee_name}
at {company_name} before our {meeting_type} meeting.

The email should:
1. Express enthusiasm for the upcoming meeting
2. Ask 2-3 contextual discovery questions based on:
   - Their role: {attendee_role}
   - Deal stage: {deal_stage}
   - Known context: {known_context}
3. Offer to share any materials in advance

Keep it concise and professional. Sign off with {sender_name}."""

    def __init__(
        self,
        mistral_api_key: Optional[str] = None,
        neo4j_driver=None,
        qdrant_client=None
    ):
        """
        Initialize the Meeting Prep Agent.

        Args:
            mistral_api_key: Mistral AI API key (or from env)
            neo4j_driver: Neo4j driver for knowledge graph queries
            qdrant_client: Qdrant client for vector search
        """
        self.mistral_api_key = mistral_api_key or os.getenv("MISTRAL_API_KEY")
        self.neo4j_driver = neo4j_driver
        self.qdrant_client = qdrant_client

        # Initialize Mistral client if available
        if MistralClient and self.mistral_api_key:
            self.llm = MistralClient(api_key=self.mistral_api_key)
        else:
            self.llm = None

    async def prepare_meeting(
        self,
        meeting_id: str,
        title: str,
        company_id: str,
        attendee_emails: List[str],
        meeting_type: str,
        deal_id: Optional[str] = None,
        start_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Full meeting preparation workflow.

        Generates all artifacts needed for a successful meeting.

        Args:
            meeting_id: Unique meeting identifier
            title: Meeting title
            company_id: Company ID from CRM
            attendee_emails: List of attendee email addresses
            meeting_type: Type of meeting (discovery, demo, proposal, etc.)
            deal_id: Associated deal ID
            start_time: Meeting start time

        Returns:
            Dictionary containing brief, plan, and presentation URL
        """
        # 1. Gather context
        company = await self._get_company_context(company_id)
        contacts = await self._get_contact_profiles(attendee_emails)
        past_interactions = await self._search_past_interactions(company_id, attendee_emails)
        deal = await self._get_deal_context(deal_id) if deal_id else None

        # 2. Generate meeting brief
        brief = await self.generate_brief(
            meeting_id=meeting_id,
            meeting_title=title,
            company=company,
            contacts=contacts,
            past_interactions=past_interactions,
            meeting_type=meeting_type,
            deal=deal
        )

        # 3. Generate meeting plan
        plan = await self.generate_meeting_plan(
            meeting_id=meeting_id,
            company=company,
            contacts=contacts,
            meeting_type=meeting_type,
            deal=deal,
            duration_minutes=60
        )

        # 4. Generate presentation (if applicable)
        presentation_url = None
        if meeting_type in ["demo", "proposal"]:
            presentation_url = await self._generate_presentation(
                meeting_id=meeting_id,
                company=company,
                meeting_type=meeting_type
            )

        # 5. Store artifacts
        await self._store_artifacts(meeting_id, brief, plan, presentation_url)

        return {
            "meeting_id": meeting_id,
            "brief": brief,
            "plan": plan,
            "presentation_url": presentation_url,
            "generated_at": datetime.now().isoformat()
        }

    async def generate_brief(
        self,
        meeting_id: str,
        meeting_title: str,
        company: Dict[str, Any],
        contacts: List[AttendeeProfile],
        past_interactions: List[Dict[str, Any]],
        meeting_type: str,
        deal: Optional[Dict[str, Any]] = None
    ) -> MeetingBrief:
        """
        Generate a comprehensive meeting brief.

        Uses AI to create context-aware talking points and questions.
        """
        if not self.llm:
            # Return mock brief if no LLM available
            return self._generate_mock_brief(meeting_id, company, contacts)

        # Format context for prompt
        attendees_str = ", ".join([f"{c.name} ({c.title})" for c in contacts if c.name])
        interactions_str = "\n".join([
            f"- {i.get('date', 'Unknown date')}: {i.get('summary', 'No summary')}"
            for i in past_interactions[:5]
        ]) or "No previous interactions recorded."

        prompt = self.BRIEF_PROMPT.format(
            meeting_title=meeting_title,
            company_name=company.get("name", "Unknown"),
            attendees=attendees_str,
            meeting_type=meeting_type,
            deal_stage=deal.get("stage", "Unknown") if deal else "N/A",
            company_context=company.get("description", "No company description available."),
            past_interactions=interactions_str
        )

        # Generate with Mistral
        response = await self.llm.chat_async([
            {"role": "user", "content": prompt}
        ])

        # Parse response into structured brief
        return self._parse_brief_response(meeting_id, response, company, contacts, past_interactions, deal)

    async def generate_meeting_plan(
        self,
        meeting_id: str,
        company: Dict[str, Any],
        contacts: List[AttendeeProfile],
        meeting_type: str,
        deal: Optional[Dict[str, Any]] = None,
        duration_minutes: int = 60
    ) -> MeetingPlan:
        """
        Generate a structured meeting plan with agenda.
        """
        if not self.llm:
            return self._generate_mock_plan(meeting_id, meeting_type, duration_minutes)

        attendees_str = ", ".join([f"{c.name} ({c.title})" for c in contacts if c.name])

        prompt = self.MEETING_PLAN_PROMPT.format(
            meeting_type=meeting_type,
            company_name=company.get("name", "Unknown"),
            attendees=attendees_str,
            deal_stage=deal.get("stage", "Unknown") if deal else "N/A",
            duration_minutes=duration_minutes
        )

        response = await self.llm.chat_async([
            {"role": "user", "content": prompt}
        ])

        return self._parse_plan_response(meeting_id, response, duration_minutes)

    async def generate_info_request(
        self,
        meeting_id: str,
        attendee: AttendeeProfile,
        company_name: str,
        meeting_type: str,
        deal_stage: str,
        sender_name: str
    ) -> Dict[str, str]:
        """
        Generate a pre-meeting info request email.

        Sent 24h before meeting to gather context from attendees.
        """
        if not self.llm:
            return self._generate_mock_info_request(attendee, company_name, sender_name)

        prompt = self.INFO_REQUEST_PROMPT.format(
            attendee_name=attendee.name or attendee.email,
            company_name=company_name,
            meeting_type=meeting_type,
            attendee_role=attendee.title or "stakeholder",
            deal_stage=deal_stage,
            known_context="Initial discovery phase" if not attendee.previous_interactions else "Ongoing engagement",
            sender_name=sender_name
        )

        response = await self.llm.chat_async([
            {"role": "user", "content": prompt}
        ])

        return {
            "to": attendee.email,
            "subject": f"Preparing for our meeting on {datetime.now().strftime('%B %d')}",
            "body": response
        }

    # ─────────────────────────────────────────────────────────────
    # Context Gathering Methods
    # ─────────────────────────────────────────────────────────────

    async def _get_company_context(self, company_id: str) -> Dict[str, Any]:
        """Fetch company context from knowledge graph"""
        if not self.neo4j_driver:
            return {"id": company_id, "name": "Unknown Company", "description": "No data available"}

        # Query Neo4j for company data
        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (c:Company {id: $company_id})
                OPTIONAL MATCH (c)-[:HAS_DEAL]->(d:Deal)
                RETURN c {.*,
                    deals: collect(d {.*})
                } as company
            """, company_id=company_id).single()

            if result:
                return dict(result["company"])

        return {"id": company_id, "name": "Unknown Company"}

    async def _get_contact_profiles(self, emails: List[str]) -> List[AttendeeProfile]:
        """Fetch contact profiles from CRM/knowledge graph"""
        profiles = []

        if not self.neo4j_driver:
            # Return basic profiles
            for email in emails:
                profiles.append(AttendeeProfile(email=email, name=email.split("@")[0].title()))
            return profiles

        with self.neo4j_driver.session() as session:
            for email in emails:
                result = session.run("""
                    MATCH (p:Person {email: $email})
                    OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
                    RETURN p {.*, company: c.name} as person
                """, email=email).single()

                if result:
                    person = result["person"]
                    profiles.append(AttendeeProfile(
                        email=email,
                        name=person.get("name", email),
                        title=person.get("title"),
                        company=person.get("company"),
                        linkedin_url=person.get("linkedin")
                    ))
                else:
                    profiles.append(AttendeeProfile(email=email, name=email.split("@")[0].title()))

        return profiles

    async def _search_past_interactions(
        self,
        company_id: str,
        attendee_emails: List[str]
    ) -> List[Dict[str, Any]]:
        """Search for past interactions using vector search"""
        if not self.qdrant_client:
            return []

        # Search for relevant transcripts/interactions
        # This would use semantic search on the meeting_transcripts collection
        # For now, return empty list
        return []

    async def _get_deal_context(self, deal_id: str) -> Dict[str, Any]:
        """Fetch deal context from CRM"""
        if not self.neo4j_driver:
            return {"id": deal_id, "stage": "Unknown"}

        with self.neo4j_driver.session() as session:
            result = session.run("""
                MATCH (d:Deal {id: $deal_id})
                RETURN d {.*} as deal
            """, deal_id=deal_id).single()

            if result:
                return dict(result["deal"])

        return {"id": deal_id, "stage": "Unknown"}

    async def _generate_presentation(
        self,
        meeting_id: str,
        company: Dict[str, Any],
        meeting_type: str
    ) -> Optional[str]:
        """Generate customized presentation"""
        # TODO: Integrate with presentation generation service
        # For now, return a placeholder URL
        return f"/storage/presentations/{meeting_id}_deck.pptx"

    async def _store_artifacts(
        self,
        meeting_id: str,
        brief: MeetingBrief,
        plan: MeetingPlan,
        presentation_url: Optional[str]
    ):
        """Store generated artifacts in database/storage"""
        # TODO: Implement artifact storage
        pass

    # ─────────────────────────────────────────────────────────────
    # Mock Data Generation (for demo/testing)
    # ─────────────────────────────────────────────────────────────

    def _generate_mock_brief(
        self,
        meeting_id: str,
        company: Dict[str, Any],
        contacts: List[AttendeeProfile]
    ) -> MeetingBrief:
        """Generate mock brief for testing"""
        return MeetingBrief(
            meeting_id=meeting_id,
            company_overview=f"{company.get('name', 'The company')} is a B2B organization focused on enterprise solutions.",
            attendee_profiles=contacts,
            past_interactions=[],
            key_talking_points=[
                "Discuss current pain points with existing solutions",
                "Present value proposition tailored to their industry",
                "Address integration requirements",
                "Clarify timeline and budget parameters"
            ],
            risks_and_concerns=[
                "Competitor evaluation may be ongoing",
                "Budget approval process unclear"
            ],
            recommended_questions=[
                "What triggered your search for a new solution?",
                "Who else is involved in the decision-making process?",
                "What does success look like for this initiative?",
                "What's your timeline for implementation?"
            ]
        )

    def _generate_mock_plan(
        self,
        meeting_id: str,
        meeting_type: str,
        duration_minutes: int
    ) -> MeetingPlan:
        """Generate mock meeting plan for testing"""
        return MeetingPlan(
            meeting_id=meeting_id,
            objectives=[
                "Understand prospect's current challenges",
                "Qualify budget and timeline",
                "Identify decision makers and process",
                "Establish next steps"
            ],
            agenda=[
                {"topic": "Introduction and rapport building", "duration": 5},
                {"topic": "Discovery questions", "duration": 20},
                {"topic": "Solution overview", "duration": 15},
                {"topic": "Q&A and objection handling", "duration": 10},
                {"topic": "Next steps and action items", "duration": 10}
            ],
            questions_to_ask=[
                "What's driving this initiative?",
                "How are you currently handling this?",
                "What's the impact of not solving this?",
                "Who else should be involved in our discussions?"
            ],
            topics_to_cover=["Pain points", "Current solution", "Budget", "Timeline", "Decision process"],
            time_allocation={
                "Introduction": 5,
                "Discovery": 20,
                "Presentation": 15,
                "Q&A": 10,
                "Wrap-up": 10
            }
        )

    def _generate_mock_info_request(
        self,
        attendee: AttendeeProfile,
        company_name: str,
        sender_name: str
    ) -> Dict[str, str]:
        """Generate mock info request email"""
        return {
            "to": attendee.email,
            "subject": f"Looking forward to our meeting - Quick questions",
            "body": f"""Hi {attendee.name or 'there'},

I'm looking forward to our upcoming conversation! To make the most of our time together, it would be helpful to understand a few things beforehand:

1. What specific challenges are you currently facing that prompted this discussion?
2. Are there any specific topics you'd like me to focus on during our meeting?

Feel free to reply to this email or add any agenda items you'd like to discuss.

Best regards,
{sender_name}"""
        }

    def _parse_brief_response(
        self,
        meeting_id: str,
        response: str,
        company: Dict[str, Any],
        contacts: List[AttendeeProfile],
        past_interactions: List[Dict[str, Any]],
        deal: Optional[Dict[str, Any]]
    ) -> MeetingBrief:
        """Parse AI response into structured MeetingBrief"""
        # Simple parsing - in production, use more sophisticated parsing
        lines = response.split("\n")
        talking_points = []
        risks = []
        questions = []

        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue

            if "talking point" in line.lower() or "key point" in line.lower():
                current_section = "talking_points"
            elif "risk" in line.lower() or "concern" in line.lower():
                current_section = "risks"
            elif "question" in line.lower():
                current_section = "questions"
            elif line.startswith("-") or line.startswith("•") or line[0].isdigit():
                content = line.lstrip("-•0123456789. ")
                if current_section == "talking_points":
                    talking_points.append(content)
                elif current_section == "risks":
                    risks.append(content)
                elif current_section == "questions":
                    questions.append(content)

        return MeetingBrief(
            meeting_id=meeting_id,
            company_overview=company.get("description", "No overview available."),
            attendee_profiles=contacts,
            past_interactions=past_interactions,
            key_talking_points=talking_points or ["Discuss challenges", "Present solution", "Address concerns"],
            risks_and_concerns=risks or ["Unknown factors may exist"],
            recommended_questions=questions or ["What are your main priorities?"],
            deal_context=deal
        )

    def _parse_plan_response(
        self,
        meeting_id: str,
        response: str,
        duration_minutes: int
    ) -> MeetingPlan:
        """Parse AI response into structured MeetingPlan"""
        # Simple parsing - would be more sophisticated in production
        return MeetingPlan(
            meeting_id=meeting_id,
            objectives=["Understand needs", "Present value", "Establish next steps"],
            agenda=[
                {"topic": "Introduction", "duration": 5},
                {"topic": "Discovery", "duration": int(duration_minutes * 0.4)},
                {"topic": "Solution", "duration": int(duration_minutes * 0.3)},
                {"topic": "Wrap-up", "duration": int(duration_minutes * 0.15)}
            ],
            questions_to_ask=["What's driving this initiative?", "Who else is involved?"],
            topics_to_cover=["Pain points", "Solution fit", "Next steps"],
            time_allocation={"Discovery": 40, "Presentation": 30, "Discussion": 30}
        )
