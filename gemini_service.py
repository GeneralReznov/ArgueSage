import os
import json
import logging
from datetime import datetime
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class DebateEvaluation(BaseModel):
    argument_quality: int  # 1-10
    logical_coherence: int  # 1-10
    rhetorical_techniques: int  # 1-10
    response_to_opposition: int  # 1-10
    structure_and_timing: int  # 1-10
    delivery_and_presentation: int  # 1-10
    overall_score: int  # 1-100
    detailed_feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    points_awarded: int

class LearningFeedback(BaseModel):
    correctness: int  # 1-10
    explanation_quality: int  # 1-10
    suggestions: List[str]
    points: int
    next_steps: str

class GeminiService:
    def __init__(self):
        os.environ['GEMINI_API_KEY'] = "AIzaSyChpIrLMzJc42ETm0jS4KiKC_ra9Gv1_vE"
        api_key = os.environ['GEMINI_API_KEY']
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-1.5-flash"
        self.pro_model = "gemini-1.5-flash"  # Use flash instead of pro to avoid quota issues
    
    def generate_ai_debater_response(self, context: Dict[str, Any]) -> str:
        """Generate AI debater's speech response"""
        try:
            prompt = self._build_debater_prompt(context)
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            
            return response.text or "I need more time to formulate my response."
        except Exception as e:
            logger.error(f"Error generating AI debater response: {e}")
            return "I apologize, but I'm having technical difficulties. Please proceed."
    
    def evaluate_speech(self, speech_text: str, context: Dict[str, Any]) -> DebateEvaluation:
        """Evaluate a debate speech using AI judge"""
        try:
            system_prompt = self._build_judge_system_prompt()
            evaluation_prompt = self._build_evaluation_prompt(speech_text, context)
            
            response = self.client.models.generate_content(
                model=self.pro_model,
                contents=[
                    types.Content(role="user", parts=[types.Part(text=evaluation_prompt)])
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=DebateEvaluation,
                ),
            )
            
            if response.text:
                data = json.loads(response.text)
                return DebateEvaluation(**data)
            else:
                return self._default_evaluation()
                
        except Exception as e:
            logger.error(f"Error evaluating speech: {e}")
            # Return a more detailed error evaluation
            evaluation = self._default_evaluation()
            evaluation.detailed_feedback = f"Error processing speech evaluation: {str(e)}"
            return evaluation
    
    def generate_case_prep(self, motion: str, position: str) -> Dict[str, Any]:
        """Generate case preparation materials"""
        try:
            prompt = f"""
            As an expert debate coach, help prepare a comprehensive case for the following motion:
            
            Motion: "{motion}"
            Position: {position}
            
            Please provide a structured case brief with the following sections. Use emoji headers but avoid markdown bold formatting (no **):
            
            📋 CASE DEFINITION
            Define key terms and establish the framework for this debate. Be clear and precise about what this motion means and the scope of the debate.
            
            💪 MAIN ARGUMENTS
            Present 3-4 strong arguments supporting the {position} position:
            - Each argument should have a clear claim statement
            - Provide supporting evidence and real-world examples
            - Include logical reasoning connecting evidence to your claim
            - Number each argument clearly (1, 2, 3, etc.)
            
            🛡️ REBUTTALS
            Anticipate opposition arguments and provide counter-responses:
            - Identify the most likely opposition points
            - Provide specific pre-emptive rebuttals for each
            - Include defensive strategies to protect your case
            
            📊 EVIDENCE & EXAMPLES
            Provide concrete supporting materials:
            - Recent statistics and data points with sources when possible
            - Specific real-world examples and case studies
            - Expert opinions or relevant studies
            - Historical precedents if applicable
            
            🎯 STRATEGIC ADVICE
            Offer tactical guidance for this specific position:
            - Key themes and frames to emphasize throughout the debate
            - Debate flow strategy and speech structure recommendations
            - Points of Information opportunities and tactics
            - Timing considerations for revealing strongest arguments
            
            🧠 CONCLUSION
            Summarize the winning strategy:
            - Your three strongest points in order of importance
            - The overall narrative that ties your case together
            - Key phrases or sound bites to remember
            - Final advice for confident delivery
            
            Write in clear, professional language suitable for competitive debate. Use bullet points and numbered lists for organization, but avoid using asterisks or other markdown formatting symbols.
            """
            
            response = self.client.models.generate_content(
                model=self.pro_model,
                contents=prompt
            )
            
            # Parse the response into structured format
            case_text = response.text or "Case preparation failed."
            return self._parse_case_prep_response(case_text)
            
        except Exception as e:
            logger.error(f"Error generating case prep: {e}")
            # Return a more structured error response
            return {
                "error": "Failed to generate case preparation materials",
                "full_text": f"Error: {str(e)}\n\nPlease try again or contact support if the issue persists.",
                "sections": {"error": f"API Error: {str(e)}"},
                "timestamp": str(datetime.now())
            }
    
    def evaluate_learning_response(self, lesson_id: str, user_answer: str, lesson_difficulty: str = 'beginner') -> Dict[str, Any]:
        """Evaluate a learning exercise response using WUDC-based standards"""
        try:
            # Adjust scoring criteria based on difficulty using WUDC-inspired framework
            if lesson_difficulty == 'beginner':
                max_points = 25
                expectations = "basic understanding and clear communication"
                score_guidance = "Be very strict. Empty, minimal, or irrelevant responses: 0-15 range. Basic effort: 30-50 range. Good performance: 60-70 range."
            elif lesson_difficulty == 'intermediate':
                max_points = 50
                expectations = "deeper analysis, strategic thinking, and comprehensive explanations"
                score_guidance = "Be strict. Poor responses: 0-10 range. Basic effort: 25-35 range. Good performance: 45-65 range."
            else:  # advanced
                max_points = 80
                expectations = "sophisticated analysis, original insights, and mastery of complex concepts"
                score_guidance = "Be very demanding. Weak responses: 0-5 range. Adequate effort: 15-30 range. Good performance: 40-50+ range."
            
            prompt = f"""
            As an expert debate educator using WUDC-inspired evaluation standards, assess this learning response:
            
            Lesson: {lesson_id} (Difficulty: {lesson_difficulty})
            Student Answer: "{user_answer}"
            
            ## CRITICAL EVALUATION REQUIREMENTS:
            BE VERY STRICT AND DEMANDING. This is a professional debate training environment.
            
            For {lesson_difficulty} level, expect {expectations}.
            {score_guidance}
            
            ## STRICT WUDC-Inspired Learning Assessment Criteria:
            **IMPORTANT: Responses that are empty, minimal (1-3 words), irrelevant, or show no effort MUST receive scores of 1-3 out of 10.**
            
            **Outstanding (9-10)**: Exceptional understanding, sophisticated reasoning, addresses all core concepts with depth
            **Excellent (7-8)**: Clear understanding, strong reasoning, addresses most core concepts effectively  
            **Good (5-6)**: Solid grasp with some gaps, mostly relevant but lacks some depth
            **Basic (3-4)**: Shows minimal understanding, significant gaps, limited reasoning
            **Poor (1-2)**: Extremely limited understanding, irrelevant, or minimal effort
            **Unacceptable (0-1)**: No meaningful engagement, empty responses, completely off-topic
            
            ## ZERO TOLERANCE FOR:
            - Responses like "no claim", "no reason", "test", single words
            - Off-topic or irrelevant content
            - Copy-paste answers without understanding
            - Responses under 15 meaningful words
            
            Provide structured feedback in the following format:
            
            CORRECTNESS: [score 1-10 based on accuracy and understanding - BE VERY STRICT]
            EXPLANATION_QUALITY: [score 1-10 based on clarity and depth - BE DEMANDING]
            POINTS: [0-{max_points} based on overall performance - MINIMAL EFFORT = MINIMAL POINTS]
            
            STRENGTHS:
            • [Specific strength with reference to WUDC criteria - if ANY strengths exist]
            • [Another strength focusing on argument quality or reasoning - if applicable]
            • [Third strength highlighting good practices - if demonstrated]
            
            AREAS_FOR_IMPROVEMENT:
            • [Specific area with reference to professional standards - be direct about failures]
            • [Another area focusing on logical gaps or clarity - highlight all deficiencies]
            • [Third area suggesting concrete improvements - demand higher standards]
            
            DETAILED_FEEDBACK:
            [Provide 3-4 detailed feedback points, each as a separate sentence. Be honest about poor performance. Focus on: argument structure, engagement with core concepts, logical consistency, and use of examples. Reference WUDC-style evaluation criteria. Do not sugarcoat poor responses.]
            
            NEXT_STEPS:
            [Provide 2-3 specific actionable next steps that would improve debate skills, each as a separate sentence. Be realistic about the current level.]
            
            Remember: Professional standards mean honest evaluation. Poor responses deserve poor scores.
            """
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            
            feedback_text = response.text or ""
            logger.debug(f"Raw AI response: {feedback_text}")
            
            parsed_feedback = self._parse_learning_feedback(feedback_text)
            logger.debug(f"Parsed feedback type: {type(parsed_feedback)}")
            logger.debug(f"Parsed feedback content: {parsed_feedback}")
            
            # Ensure we always return a dictionary
            if isinstance(parsed_feedback, str):
                logger.warning(f"Parsing returned string instead of dict: {parsed_feedback}")
                return {
                    "correctness": 7,
                    "explanation_quality": 7,
                    "suggestions": ["Continue practicing debate fundamentals"],
                    "points": 10,
                    "next_steps": "Move to the next lesson",
                    "full_feedback": parsed_feedback
                }
            
            return parsed_feedback
            
        except Exception as e:
            logger.error(f"Error evaluating learning response: {e}")
            return {"correctness": 5, "points": 5, "feedback": "Please try again."}
    
    def generate_poi_response(self, poi_text: str, context: Dict[str, Any]) -> Dict[str, str]:
        """Generate AI response to a Point of Information"""
        try:
            prompt = f"""
            You are an AI debater. A Point of Information (POI) has been offered to you:
            
            POI: "{poi_text}"
            
            Context:
            - Motion: {context.get('motion', '')}
            - Your position: {context.get('ai_position', '')}
            - Current argument: {context.get('current_argument', '')}
            
            IMPORTANT DECISION RULES:
            1. ACCEPT only if the POI:
               - Directly challenges your current argument in a way you can strongly rebut
               - Asks for clarification that you can provide confidently
               - Gives you an opportunity to strengthen your position
            
            2. DECLINE if the POI:
               - Supports the opposing side (opposite to your position)
               - Would force you to agree with the other side
               - Is irrelevant or off-topic
               - Would weaken your argument
               - You don't have time to address properly
            
            Based on these rules, decide whether to ACCEPT or DECLINE the POI.
            
            Response format (be very clear):
            DECISION: [ACCEPT/DECLINE]
            RESPONSE: [Your response - if ACCEPT, give a strong rebuttal; if DECLINE, politely decline]
            """
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            
            return self._parse_poi_response(response.text or "")
            
        except Exception as e:
            logger.error(f"Error generating POI response: {e}")
            return {"decision": "DECLINE", "response": "Thank you, but I'll continue with my argument."}
    
    def _build_debater_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt for AI debater speech generation"""
        motion = context.get('motion', '')
        position = context.get('ai_position', '')
        speech_type = context.get('speech_type', 'constructive')
        difficulty = context.get('difficulty', 'intermediate')
        previous_speeches = context.get('previous_speeches', [])
        
        prompt = f"""
        You are an AI debater participating in a debate. Here are the details:
        
        Motion: "{motion}"
        Your Position: {position}
        Speech Type: {speech_type}
        Difficulty Level: {difficulty}
        
        Previous speeches in this debate:
        {self._format_previous_speeches(previous_speeches)}
        
        Deliver a {speech_type} speech that is appropriate for {difficulty} level.
        Your speech should be:
        - 2-3 minutes worth of content (approximately 250-400 words)
        - Well-structured with clear arguments
        - Responsive to previous speeches if applicable
        - Engaging and persuasive
        - Appropriate for the debate format
        
        Please deliver your speech now:
        """
        
        return prompt
    
    def _build_judge_system_prompt(self) -> str:
        """Build system prompt for AI judge based on WUDC Speaker Scale"""
        return """
        You are an expert debate judge trained in the WUDC Speaker Scale evaluation system.
        Your task is to assess speeches based on professional debate judging standards.
        
        ## WUDC Speaker Scale Guidelines (50-100 points):
        
        **Exceptional (95-100)**: Flawless and compelling arguments; one of the best speeches possible
        **Brilliant (89-94)**: Incredible speech with exceptionally well-made arguments engaging core issues
        **Excellent (86-88)**: Highly compelling arguments addressing core issues; only minor flaws
        **Strong (83-85)**: Arguments address core issues with strong explanations; limited flaws
        **Good (79-82)**: Relevant arguments without obvious logical gaps; well explained
        **Above Average (76-78)**: Mostly relevant arguments; occasional logical gaps but clear to follow
        **Average (73-75)**: Generally relevant but may miss core issues; simplistic and vulnerable
        **Below Average (70-72)**: Frequently relevant but regular logical gaps; sometimes unclear
        **Weak (67-69)**: Some relevant arguments but significant logical gaps; difficult to follow
        **Poor (64-66)**: Limited relevant arguments; often unclear and hard to credit
        **Very Poor (61-63)**: Occasional relevant claims; frequently unclear and confusing
        **Failing (50-60)**: Minimal relevance; very hard to follow or credit
        
        ## Evaluation Criteria:
        1. **Argument Quality (1-10)**: Strength, relevance, and engagement with core issues
        2. **Logical Coherence (1-10)**: Structure, flow, and absence of logical gaps
        3. **Rhetorical Techniques (1-10)**: Persuasive language and effective delivery
        4. **Response to Opposition (1-10)**: Engagement with counterarguments and rebuttals
        5. **Structure and Timing (1-10)**: Organization and effective use of allocated time
        6. **Delivery and Presentation (1-10)**: Clarity, confidence, and audience engagement
        
        ## Overall Score Calculation:
        - Map individual criterion scores to WUDC scale (50-100)
        - Consider difficulty level and speaker experience
        - Focus on argument quality and core issue engagement as primary factors
        - Provide detailed, constructive feedback with specific examples
        
        Be fair, encouraging, and maintain professional judging standards.
        """
    
    def _build_evaluation_prompt(self, speech_text: str, context: Dict[str, Any]) -> str:
        """Build prompt for speech evaluation using WUDC standards"""
        speaker_level = context.get('speaker_level', 'intermediate')
        
        # Adjust expectations based on speaker level
        if speaker_level == 'beginner':
            expectation = "Focus on basic argument structure, relevance, and clarity. Expect scores in 65-75 range for good performance."
        elif speaker_level == 'intermediate':
            expectation = "Look for solid arguments with good explanations and logical flow. Expect scores in 70-80 range for good performance."
        else:  # advanced
            expectation = "Expect sophisticated arguments, strong rebuttals, and excellent engagement with core issues. Expect scores in 75-85+ range for good performance."
        
        return f"""
        Please evaluate the following debate speech using WUDC Speaker Scale standards:
        
        Speech: "{speech_text}"
        
        Context:
        - Motion: {context.get('motion', '')}
        - Speaker's Position: {context.get('speaker_position', '')}
        - Speech Type: {context.get('speech_type', 'constructive')}
        - Speaker Level: {speaker_level}
        
        Evaluation Guidelines:
        {expectation}
        
        Your evaluation should:
        1. Score each criterion (1-10) based on WUDC standards
        2. Provide overall score (50-100) using WUDC Speaker Scale
        3. Identify specific strengths and areas for improvement
        4. Give detailed feedback that helps the speaker improve
        5. Consider argument quality and core issue engagement as primary factors
        
        Format your response as structured JSON with all required fields.
        """
    
    def _format_previous_speeches(self, speeches: List[Dict]) -> str:
        """Format previous speeches for context"""
        if not speeches:
            return "No previous speeches in this debate."
        
        formatted = []
        for speech in speeches:
            speaker = speech.get('speaker', 'Unknown')
            content = speech.get('content', '')[:200] + "..."
            formatted.append(f"{speaker}: {content}")
        
        return "\n".join(formatted)
    
    def _parse_case_prep_response(self, response_text: str) -> Dict[str, Any]:
        """Parse case preparation response into structured format"""
        return {
            "full_text": response_text,
            "sections": self._extract_case_sections(response_text),
            "timestamp": str(datetime.now())
        }
    
    def _extract_case_sections(self, text: str) -> Dict[str, str]:
        """Extract different sections from case prep text"""
        sections = {}
        current_section = "overview"
        current_content = []
        
        for line in text.split('\n'):
            if any(keyword in line.lower() for keyword in ['definition', 'argument', 'rebuttal', 'evidence', 'strategy']):
                if current_content:
                    sections[current_section] = '\n'.join(current_content)
                current_section = line.strip().lower()
                current_content = []
            else:
                current_content.append(line)
        
        if current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _parse_learning_feedback(self, response_text: str) -> Dict[str, Any]:
        """Parse learning feedback response"""
        try:
            lines = response_text.split('\n')
            
            # Default to low scores for poor responses
            feedback = {
                "correctness": 1,
                "explanation_quality": 1,
                "points": 0,
                "strengths": [],
                "areas_for_improvement": [],
                "detailed_feedback": "",
                "next_steps": "",
                "full_feedback": response_text
            }
            
            current_section = None
            current_content = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for section headers
                if line.startswith('CORRECTNESS:'):
                    try:
                        score = int(''.join(filter(str.isdigit, line)))
                        feedback["correctness"] = min(score, 10)
                    except:
                        pass
                elif line.startswith('EXPLANATION_QUALITY:'):
                    try:
                        score = int(''.join(filter(str.isdigit, line)))
                        feedback["explanation_quality"] = min(score, 10)
                    except:
                        pass
                elif line.startswith('POINTS:'):
                    try:
                        score = int(''.join(filter(str.isdigit, line)))
                        feedback["points"] = score
                    except:
                        pass
                elif line.startswith('STRENGTHS:'):
                    current_section = 'strengths'
                    current_content = []
                elif line.startswith('AREAS_FOR_IMPROVEMENT:'):
                    current_section = 'areas_for_improvement'
                    current_content = []
                elif line.startswith('DETAILED_FEEDBACK:'):
                    current_section = 'detailed_feedback'
                    current_content = []
                elif line.startswith('NEXT_STEPS:'):
                    current_section = 'next_steps'
                    current_content = []
                elif current_section:
                    if line.startswith('•'):
                        current_content.append(line[1:].strip())
                    else:
                        current_content.append(line)
                    
                    # Store content for list sections
                    if current_section in ['strengths', 'areas_for_improvement'] and line.startswith('•'):
                        feedback[current_section] = [item for item in current_content if item.strip()]
                    elif current_section in ['detailed_feedback', 'next_steps']:
                        feedback[current_section] = ' '.join(current_content)
            
            # Final assignment for any remaining content
            if current_section in ['detailed_feedback', 'next_steps']:
                feedback[current_section] = ' '.join(current_content)
            
            # Fallback to suggestions if areas_for_improvement is empty
            if not feedback["areas_for_improvement"]:
                feedback["areas_for_improvement"] = ["Continue practicing debate fundamentals"]
                
            return feedback
            
        except Exception as e:
            logger.error(f"Error parsing learning feedback: {e}")
            return {
                "correctness": 1,
                "explanation_quality": 1,
                "points": 0,
                "strengths": ["None identified in this response"],
                "areas_for_improvement": ["Provide meaningful engagement with lesson content", "Follow proper argument structure", "Demonstrate understanding of core concepts"],
                "detailed_feedback": "Response could not be properly evaluated due to formatting or content issues. Please provide a substantive answer that demonstrates understanding of the lesson material.",
                "next_steps": "Review the lesson material thoroughly and provide a detailed response that addresses the exercise requirements.",
                "full_feedback": response_text
            }
    
    def _parse_poi_response(self, response_text: str) -> Dict[str, str]:
        """Parse POI response"""
        logger.info(f"Parsing POI response: {response_text[:200]}...")
        
        lines = response_text.split('\n')
        decision = "DECLINE"
        response = "Thank you, but I'll continue with my argument."
        
        for line in lines:
            line = line.strip()
            if line.startswith('DECISION:'):
                decision = line.replace('DECISION:', '').strip().upper()
                logger.info(f"Found decision: {decision}")
            elif line.startswith('RESPONSE:'):
                response = line.replace('RESPONSE:', '').strip()
                logger.info(f"Found response: {response[:100]}...")
        
        # Ensure decision is valid
        if decision not in ['ACCEPT', 'DECLINE']:
            logger.warning(f"Invalid decision '{decision}', defaulting to DECLINE")
            decision = "DECLINE"
            
        logger.info(f"Final parsed decision: {decision}")
        
        return {
            "decision": decision,
            "response": response
        }
    
    def generate_content(self, prompt: str) -> str:
        """Generate simple content using Gemini"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text or ""
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return ""
    
    def _default_evaluation(self) -> DebateEvaluation:
        """Return default evaluation when AI fails"""
        return DebateEvaluation(
            argument_quality=6,
            logical_coherence=6,
            rhetorical_techniques=6,
            response_to_opposition=6,
            structure_and_timing=6,
            delivery_and_presentation=6,
            overall_score=60,
            detailed_feedback="Technical difficulties prevented detailed evaluation. Please continue practicing.",
            strengths=["Participated in the debate"],
            areas_for_improvement=["Continue developing debate skills"],
            points_awarded=15
        )
