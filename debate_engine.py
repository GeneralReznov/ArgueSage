import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from gemini_service import GeminiService

logger = logging.getLogger(__name__)

class DebateEngine:
    def __init__(self, gemini_service: GeminiService):
        self.gemini = gemini_service
        self.debate_formats = self._load_debate_formats()
        self.lessons = self._load_lessons()
        self.achievements = self._load_achievements()
    
    def get_lessons_for_level(self, level: str) -> List[Dict[str, Any]]:
        """Get lessons appropriate for user's level"""
        return [lesson for lesson in self.lessons if lesson.get('level') == level]
    
    def get_lesson(self, lesson_id: str) -> Optional[Dict[str, Any]]:
        """Get specific lesson by ID"""
        for lesson in self.lessons:
            if lesson.get('id') == lesson_id:
                return lesson
        return None
    
    def get_debate_formats(self) -> List[Dict[str, Any]]:
        """Get available debate formats"""
        return list(self.debate_formats.values())
    
    def start_debate(self, motion: str, format_type: str, difficulty: str, user_position: str) -> Dict[str, Any]:
        """Start a new debate session"""
        debate_format = self.debate_formats.get(format_type, self.debate_formats['british_parliamentary'])
        
        # Determine AI position
        ai_position = 'opposition' if user_position == 'government' else 'government'
        
        debate_session = {
            'id': f"debate_{int(datetime.now().timestamp())}",
            'motion': motion,
            'format': format_type,
            'difficulty': difficulty,
            'user_position': user_position,
            'ai_position': ai_position,
            'current_speaker': 'user' if debate_format['first_speaker'] == 'government' and user_position == 'government' else 'ai',
            'round': 1,
            'speeches': [],
            'pois': [],
            'status': 'in_progress',
            'start_time': datetime.now().isoformat(),
            'speech_order': debate_format['speech_order'],
            'time_limits': debate_format['time_limits']
        }
        
        # If AI speaks first, generate opening speech
        if debate_session['current_speaker'] == 'ai':
            ai_speech = self._generate_ai_opening_speech(debate_session)
            debate_session['speeches'].append({
                'speaker': 'ai',
                'type': 'constructive',
                'content': ai_speech,
                'timestamp': datetime.now().isoformat()
            })
            debate_session['current_speaker'] = 'user'
            debate_session['round'] += 1
        
        return debate_session
    
    def process_user_speech(self, debate_session: Dict[str, Any], speech_text: str, speech_type: str) -> Dict[str, Any]:
        """Process user's speech and generate AI response"""
        # Add user speech to session
        debate_session['speeches'].append({
            'speaker': 'user',
            'type': speech_type,
            'content': speech_text,
            'timestamp': datetime.now().isoformat()
        })
        
        # Evaluate user speech
        evaluation_context = {
            'motion': debate_session['motion'],
            'speaker_position': debate_session['user_position'],
            'speech_type': speech_type,
            'speaker_level': debate_session['difficulty']
        }
        
        feedback = self.gemini.evaluate_speech(speech_text, evaluation_context)
        
        # Generate AI response if debate continues
        ai_response = None
        if debate_session['round'] < len(debate_session['speech_order']):
            ai_response = self._generate_ai_response(debate_session)
            debate_session['speeches'].append({
                'speaker': 'ai',
                'type': 'constructive',
                'content': ai_response,
                'timestamp': datetime.now().isoformat()
            })
            debate_session['round'] += 1
        
        # Check if debate should end
        if debate_session['round'] >= len(debate_session['speech_order']):
            debate_session['status'] = 'completed'
        
        return {
            'debate_session': debate_session,
            'feedback': feedback,
            'ai_response': ai_response
        }
    
    def process_poi(self, debate_session: Dict[str, Any], poi_text: str) -> Dict[str, Any]:
        """Process Point of Information"""
        poi_context = {
            'motion': debate_session['motion'],
            'ai_position': debate_session['ai_position'],
            'current_argument': self._get_current_ai_argument(debate_session)
        }
        
        ai_poi_response = self.gemini.generate_poi_response(poi_text, poi_context)
        
        poi_record = {
            'user_poi': poi_text,
            'ai_decision': ai_poi_response['decision'],
            'ai_response': ai_poi_response['response'],
            'timestamp': datetime.now().isoformat()
        }
        
        debate_session['pois'].append(poi_record)
        
        return {
            'debate_session': debate_session,
            'ai_response': ai_poi_response['response'],
            'accepted': ai_poi_response['decision'] == 'ACCEPT'
        }
    
    def end_debate(self, debate_session: Dict[str, Any]) -> Dict[str, Any]:
        """End debate and provide final evaluation"""
        debate_session['status'] = 'completed'
        debate_session['end_time'] = datetime.now().isoformat()
        
        # Generate comprehensive evaluation
        final_evaluation = self._generate_final_evaluation(debate_session)
        
        return final_evaluation
    
    def check_achievements(self, user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for new achievements"""
        new_achievements = []
        
        for achievement in self.achievements:
            if achievement['id'] not in [a.get('id') for a in user_profile['achievements']]:
                if self._check_achievement_criteria(achievement, user_profile):
                    new_achievements.append(achievement)
        
        return new_achievements
    
    def get_user_analytics(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generate user analytics and progress data"""
        total_debates = len(user_profile['debate_history'])
        total_points = user_profile['points']
        completed_lessons = len(user_profile['completed_lessons'])
        
        # Calculate win rate and average scores
        recent_debates = user_profile['debate_history'][-10:] if user_profile['debate_history'] else []
        avg_score = 0
        if recent_debates:
            scores = [d['result'].get('overall_score', 0) for d in recent_debates]
            avg_score = sum(scores) / len(scores) if scores else 0
        
        return {
            'total_debates': total_debates,
            'total_points': total_points,
            'completed_lessons': completed_lessons,
            'current_level': user_profile['level'],
            'achievements_count': len(user_profile['achievements']),
            'average_score': round(avg_score, 1),
            'recent_performance': recent_debates,
            'level_progress': self._calculate_level_progress(user_profile)
        }
    
    def _generate_ai_opening_speech(self, debate_session: Dict[str, Any]) -> str:
        """Generate AI's opening speech"""
        context = {
            'motion': debate_session['motion'],
            'ai_position': debate_session['ai_position'],
            'speech_type': 'constructive',
            'difficulty': debate_session['difficulty'],
            'previous_speeches': []
        }
        
        return self.gemini.generate_ai_debater_response(context)
    
    def _generate_ai_response(self, debate_session: Dict[str, Any]) -> str:
        """Generate AI response based on current debate state"""
        context = {
            'motion': debate_session['motion'],
            'ai_position': debate_session['ai_position'],
            'speech_type': 'rebuttal' if debate_session['round'] > 2 else 'constructive',
            'difficulty': debate_session['difficulty'],
            'previous_speeches': debate_session['speeches']
        }
        
        return self.gemini.generate_ai_debater_response(context)
    
    def _get_current_ai_argument(self, debate_session: Dict[str, Any]) -> str:
        """Get AI's current argument for POI context"""
        ai_speeches = [s for s in debate_session['speeches'] if s['speaker'] == 'ai']
        if ai_speeches:
            return ai_speeches[-1]['content'][:200]  # First 200 chars
        return ""
    
    def _generate_final_evaluation(self, debate_session: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive final evaluation"""
        all_speeches = debate_session.get('speeches', [])
        user_speeches = [s for s in all_speeches if s.get('speaker') == 'user']
        
        # Enhanced logging for debugging
        logger.info(f"Total speeches in session: {len(all_speeches)}")
        logger.info(f"User speeches found: {len(user_speeches)}")
        for i, speech in enumerate(all_speeches):
            speaker = speech.get('speaker', 'unknown')
            speech_type = speech.get('type', 'unknown')
            content = speech.get('content', '')
            content_length = len(content)
            logger.info(f"Speech {i}: speaker={speaker}, type={speech_type}, content_length={content_length}")
            if content_length > 0:
                logger.info(f"Speech {i} preview: {content[:100]}...")
        
        # If no user speeches, check if there are any speeches stored in session before failing
        if not user_speeches:
            logger.warning("No user speeches found for evaluation")
            if all_speeches:
                logger.info("However, found other speeches in session - this might indicate a data issue")
            
            return {
                'overall_score': 0,
                'detailed_feedback': 'No speeches to evaluate. This may be due to session storage issues.',
                'points': 0,
                'speech_count': 0,
                'poi_count': len(debate_session.get('pois', [])),
                'debate_duration': self._calculate_debate_duration(debate_session)
            }
        
        # Evaluate all user speeches
        total_score = 0
        all_feedback = []
        
        for speech in user_speeches:
            context = {
                'motion': debate_session['motion'],
                'speaker_position': debate_session['user_position'],
                'speech_type': speech['type'],
                'speaker_level': debate_session['difficulty']
            }
            
            evaluation = self.gemini.evaluate_speech(speech['content'], context)
            total_score += evaluation.overall_score - 15  # Adjust for 0-100 scale
            all_feedback.append(evaluation.detailed_feedback)
        
        avg_score = total_score / len(user_speeches) if user_speeches else 0
        points_awarded = int(avg_score * 0.5)  # Convert to points
        
        return {
            'overall_score': round(avg_score, 1),
            'detailed_feedback': '\n\n'.join(all_feedback),
            'points': points_awarded,
            'speech_count': len(user_speeches),
            'poi_count': len(debate_session['pois']),
            'debate_duration': self._calculate_debate_duration(debate_session)
        }
    
    def _check_achievement_criteria(self, achievement: Dict[str, Any], user_profile: Dict[str, Any]) -> bool:
        """Check if user meets achievement criteria"""
        criteria = achievement.get('criteria', {})
        debate_history = user_profile.get('debate_history', [])
        completed_lessons = user_profile.get('completed_lessons', [])
        
        # Basic criteria checks
        if 'min_debates' in criteria:
            if len(debate_history) < criteria['min_debates']:
                return False
        
        if 'min_points' in criteria:
            if user_profile.get('points', 0) < criteria['min_points']:
                return False
        
        if 'min_lessons' in criteria:
            if len(completed_lessons) < criteria['min_lessons']:
                return False
        
        # Advanced criteria checks
        if 'min_pois' in criteria:
            total_pois = sum(len(debate.get('pois', [])) for debate in debate_history)
            if total_pois < criteria['min_pois']:
                return False
        
        if 'avg_score' in criteria:
            if not debate_history:
                return False
            avg_score = sum(debate.get('result', {}).get('overall_score', 0) for debate in debate_history) / len(debate_history)
            if avg_score < criteria['avg_score']:
                return False
        
        if 'different_formats' in criteria:
            unique_formats = set(debate.get('format', '') for debate in debate_history)
            if len(unique_formats) < criteria['different_formats']:
                return False
        
        if 'min_advanced_lessons' in criteria:
            # Handle both string IDs and lesson objects
            advanced_lessons = []
            for lesson in completed_lessons:
                if isinstance(lesson, str):
                    # Look up lesson by ID to check difficulty
                    lesson_obj = self.get_lesson(lesson)
                    if lesson_obj and lesson_obj.get('difficulty') == 'advanced':
                        advanced_lessons.append(lesson_obj)
                elif isinstance(lesson, dict) and lesson.get('difficulty') == 'advanced':
                    advanced_lessons.append(lesson)
            
            if len(advanced_lessons) < criteria['min_advanced_lessons']:
                return False
        
        if 'perfect_streak' in criteria:
            recent_scores = [debate.get('result', {}).get('overall_score', 0) 
                           for debate in debate_history[-criteria['perfect_streak']:]]
            if len(recent_scores) < criteria['perfect_streak'] or any(score < 95 for score in recent_scores):
                return False
        
        if 'all_formats' in criteria and criteria['all_formats']:
            available_formats = {'british_parliamentary', 'policy_debate', 'public_forum'}
            used_formats = set(debate.get('format', '') for debate in debate_history)
            if not available_formats.issubset(used_formats):
                return False
        
        if 'all_lessons' in criteria and criteria['all_lessons']:
            total_lessons = len(self._load_lessons())
            if len(completed_lessons) < total_lessons:
                return False
        
        if 'quick_start' in criteria:
            if not completed_lessons or user_profile.get('points', 0) < 50:
                return False
        
        if 'score_improvement' in criteria:
            if len(debate_history) < 2:
                return False
            latest_score = debate_history[-1].get('result', {}).get('overall_score', 0)
            previous_score = debate_history[-2].get('result', {}).get('overall_score', 0)
            if latest_score - previous_score < criteria['score_improvement']:
                return False
        
        if 'debate_marathon' in criteria:
            recent_debates = debate_history[-criteria['debate_marathon']:]
            if len(recent_debates) < criteria['debate_marathon']:
                return False
        
        return True
    
    def _calculate_level_progress(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate progress towards next level"""
        current_level = user_profile['level']
        points = user_profile['points']
        
        level_thresholds = {
            'beginner': {'min': 0, 'max': 100},
            'intermediate': {'min': 100, 'max': 300},
            'advanced': {'min': 300, 'max': 1000}
        }
        
        current_threshold = level_thresholds.get(current_level, level_thresholds['beginner'])
        progress = min(100, ((points - current_threshold['min']) / (current_threshold['max'] - current_threshold['min'])) * 100)
        
        return {
            'current_level': current_level,
            'points_in_level': points - current_threshold['min'],
            'points_to_next': current_threshold['max'] - points,
            'progress_percentage': max(0, round(progress, 1))
        }
    
    def _calculate_debate_duration(self, debate_session: Dict[str, Any]) -> str:
        """Calculate debate duration"""
        if 'start_time' in debate_session and 'end_time' in debate_session:
            start = datetime.fromisoformat(debate_session['start_time'])
            end = datetime.fromisoformat(debate_session['end_time'])
            duration = end - start
            minutes = int(duration.total_seconds() // 60)
            return f"{minutes} minutes"
        return "Unknown"
    
    def _load_debate_formats(self) -> Dict[str, Dict[str, Any]]:
        """Load debate format configurations"""
        return {
            'british_parliamentary': {
                'name': 'British Parliamentary',
                'description': 'Four-team parliamentary format with opening and closing teams',
                'teams': 4,
                'speakers_per_team': 2,
                'speech_order': ['OG1', 'OO1', 'OG2', 'OO2', 'CG1', 'CO1', 'CG2', 'CO2'],
                'time_limits': {'constructive': 7, 'reply': 4},
                'first_speaker': 'government',
                'poi_allowed': True,
                'poi_time_window': [1, 6],
                'roles': {
                    'OG': 'Opening Government',
                    'OO': 'Opening Opposition',
                    'CG': 'Closing Government', 
                    'CO': 'Closing Opposition'
                }
            },
            'policy_debate': {
                'name': 'Policy Debate',
                'description': 'Two-team format with constructive and rebuttal speeches',
                'teams': 2,
                'speakers_per_team': 2,
                'speech_order': ['1AC', '1NC', '2AC', '2NC', '1NR', '1AR', '2NR', '2AR'],
                'time_limits': {'constructive': 8, 'rebuttal': 5, 'cross_ex': 3},
                'first_speaker': 'government',
                'poi_allowed': False,
                'cross_examination': True,
                'prep_time': 8,
                'roles': {
                    'A': 'Affirmative',
                    'N': 'Negative'
                }
            },
            'public_forum': {
                'name': 'Public Forum',
                'description': 'Accessible format with crossfire periods for current events',
                'teams': 2,
                'speakers_per_team': 2,
                'speech_order': ['Pro Team 1', 'Con Team 1', 'Pro Team 2', 'Con Team 2', 'Pro Rebuttal', 'Con Rebuttal', 'Pro Summary', 'Con Summary'],
                'time_limits': {'constructive': 4, 'rebuttal': 4, 'summary': 3, 'final_focus': 2, 'crossfire': 3},
                'first_speaker': 'government',
                'poi_allowed': False,
                'crossfire': True,
                'prep_time': 3,
                'roles': {
                    'Pro': 'Pro Team',
                    'Con': 'Con Team'
                }
            },
            'asian_parliamentary': {
                'name': 'Asian Parliamentary',
                'description': 'Three-team format with government, opposition, and member teams',
                'teams': 3,
                'speakers_per_team': 2,
                'speech_order': ['Gov 1', 'Opp 1', 'Mem 1', 'Gov 2', 'Opp 2', 'Mem 2', 'Gov Reply', 'Opp Reply'],
                'time_limits': {'constructive': 7, 'reply': 4},
                'first_speaker': 'government',
                'poi_allowed': True,
                'poi_time_window': [1, 6],
                'roles': {
                    'Gov': 'Government',
                    'Opp': 'Opposition',
                    'Mem': 'Member'
                }
            },
            'worlds_schools': {
                'name': 'Worlds Schools',
                'description': 'International format with proposition and opposition teams',
                'teams': 2,
                'speakers_per_team': 3,
                'speech_order': ['Prop 1', 'Opp 1', 'Prop 2', 'Opp 2', 'Prop 3', 'Opp 3', 'Opp Reply', 'Prop Reply'],
                'time_limits': {'constructive': 8, 'reply': 4},
                'first_speaker': 'government',
                'poi_allowed': True,
                'poi_time_window': [1, 7],
                'roles': {
                    'Prop': 'Proposition',
                    'Opp': 'Opposition'
                }
            }
        }
    
    def _load_lessons(self) -> List[Dict[str, Any]]:
        """Load learning lessons"""
        return [
            # Beginner Level Lessons
            {
                'id': 'debate_basics_1',
                'title': 'What is Debate?',
                'level': 'beginner',
                'description': 'Introduction to competitive debate and its fundamental principles',
                'content': '''<p>Debate is a structured discussion where participants present arguments for and against a given proposition (motion). In competitive debate, teams are assigned positions (government/affirmative or opposition/negative) and must construct logical, evidence-based arguments.</p>
                
                <h6>Key elements of debate:</h6>
                <ul>
                <li>Clear proposition or motion to debate</li>
                <li>Structured format with time limits</li>
                <li>Logical argumentation with evidence</li>
                <li>Clash between opposing viewpoints</li>
                <li>Adjudication based on argument quality</li>
                </ul>
                
                <h6>WUDC Standards for Beginners:</h6>
                <p>At beginner level, focus on:</p>
                <ul>
                <li>Making relevant arguments that address the core motion</li>
                <li>Using clear, understandable language</li>
                <li>Providing basic explanations for your claims</li>
                <li>Showing understanding of the debate topic</li>
                </ul>
                
                <p>The goal is not just to "win" but to engage in reasoned discourse that explores different perspectives on important issues.</p>''',
                'exercise': 'Explain in your own words what makes a good argument in debate. Include at least three specific characteristics and explain why each is important.',
                'difficulty': 'beginner',
                'estimated_time': 10,
                'points_possible': 25,
                'wudc_learning_objectives': [
                    'Demonstrate basic understanding of debate fundamentals',
                    'Identify key elements of structured argumentation',
                    'Explain the importance of logical reasoning in debate'
                ],
                'evaluation_criteria': 'Assessed on clarity of explanation, identification of key debate elements, and basic understanding of argumentation principles'
            },
            {
                'id': 'debate_basics_2',
                'title': 'Argument Structure',
                'level': 'beginner',
                'description': 'Learn the basic structure of a debate argument: Claim, Warrant, Impact',
                'content': '''<p>Every strong debate argument follows the CWI structure:</p>
                
                <ul>
                <li><strong>Claim:</strong> The assertion or statement you're making</li>
                <li><strong>Warrant:</strong> The reasoning or evidence that supports your claim</li>
                <li><strong>Impact:</strong> Why this matters - the consequences or significance</li>
                </ul>
                
                <h6>Example:</h6>
                <ul>
                <li>Claim: "Schools should ban smartphones"</li>
                <li>Warrant: "Studies show students are 23% more distracted when phones are present"</li>
                <li>Impact: "This leads to lower academic performance and reduced learning outcomes"</li>
                </ul>
                
                <h6>WUDC Standards for Argument Structure:</h6>
                <ul>
                <li>Arguments must be relevant to the motion and clearly stated</li>
                <li>Warrants should provide logical connection between claim and evidence</li>
                <li>Impacts should demonstrate significance and consequences</li>
                <li>Avoid logical gaps that weaken argument strength</li>
                </ul>
                
                <p>This structure ensures your arguments are logical, supported, and meaningful to the debate.</p>''',
                'exercise': 'Create a complete CWI argument about whether social media should be regulated. Clearly label each component and explain why your warrant logically supports your claim.',
                'difficulty': 'beginner',
                'estimated_time': 15,
                'points_possible': 25,
                'wudc_learning_objectives': [
                    'Master the CWI argument structure',
                    'Create logically coherent arguments without gaps',
                    'Demonstrate understanding of claim-warrant-impact relationships'
                ],
                'evaluation_criteria': 'Assessed on structural clarity, logical coherence, and strength of warrant-claim connection'
            },
            {
                'id': 'debate_basics_3',
                'title': 'Types of Evidence',
                'level': 'beginner',
                'description': 'Understanding different types of evidence and how to use them effectively',
                'content': '''<p>Strong arguments require strong evidence. Types of evidence include:</p>
                
                <ul>
                <li><strong>Statistical Evidence:</strong> Numbers, percentages, data from studies</li>
                <li><strong>Expert Testimony:</strong> Quotes from credible authorities</li>
                <li><strong>Examples:</strong> Real-world cases that illustrate your point</li>
                <li><strong>Logical Reasoning:</strong> Common sense connections and deductions</li>
                </ul>
                
                <h6>Quality indicators:</h6>
                <ul>
                <li>Recency: How current is the evidence?</li>
                <li>Relevance: Does it directly support your claim?</li>
                <li>Reliability: Is the source credible?</li>
                <li>Representative: Does it reflect the broader situation?</li>
                </ul>''',
                'exercise': 'Choose a debate topic and provide one example of each type of evidence (statistical, expert, example, logical) that could be used.',
                'difficulty': 'beginner',
                'estimated_time': 20,
                'points_possible': 30
            },
            
            # Intermediate Level Lessons
            {
                'id': 'debate_intermediate_1',
                'title': 'Rebuttal Strategies',
                'level': 'intermediate',
                'description': 'Advanced techniques for attacking and defending arguments',
                'content': '''<p>Effective rebuttal requires systematic approach to breaking down opponent arguments:</p>
                
                <h6>The 4-Step Rebuttal Process:</h6>
                <ol>
                <li><strong>Signpost:</strong> Clearly identify which argument you're addressing</li>
                <li><strong>Summarize:</strong> Briefly restate opponent's position</li>
                <li><strong>Attack:</strong> Challenge the logic, evidence, or impact</li>
                <li><strong>Rebuild:</strong> Strengthen your own position</li>
                </ol>
                
                <h6>Common Attack Strategies:</h6>
                <ul>
                <li>Question the evidence (outdated, biased, irrelevant)</li>
                <li>Challenge the logic (false causation, correlation vs causation)</li>
                <li>Minimize the impact (scope, probability, timeframe)</li>
                <li>Provide counter-evidence</li>
                </ul>
                
                <h6>Defense Strategies:</h6>
                <ul>
                <li>Reinforce with additional evidence</li>
                <li>Clarify misunderstandings</li>
                <li>Concede minor points while maintaining core argument</li>
                <li>Turn opponent's evidence to support your case</li>
                </ul>
                
                <h6>WUDC Standards for Intermediate Rebuttal:</h6>
                <ul>
                <li>Rebuttals should engage with core arguments, not peripheral points</li>
                <li>Attack the strongest version of opponent's argument (steelman, not strawman)</li>
                <li>Provide clear logical reasoning for why their argument fails</li>
                <li>Demonstrate sophisticated understanding of argument structure</li>
                <li>Offer substantive alternatives, not just criticism</li>
                </ul>''',
                'exercise': 'Given this argument: "Video games cause violence because players practice violent behaviors repeatedly," provide a comprehensive rebuttal using the 4-step process and WUDC standards.',
                'difficulty': 'intermediate',
                'estimated_time': 25,
                'points_possible': 50,
                'wudc_learning_objectives': [
                    'Master systematic rebuttal techniques',
                    'Engage with core arguments using WUDC standards',
                    'Demonstrate sophisticated argument analysis skills'
                ],
                'evaluation_criteria': 'Assessed on systematic approach, engagement with core issues, logical reasoning, and quality of counter-arguments'
            },
            {
                'id': 'debate_intermediate_2',
                'title': 'Case Building & Strategy',
                'level': 'intermediate',
                'description': 'How to construct a comprehensive debate case with multiple arguments',
                'content': '''<p>A strong debate case requires strategic thinking about argument selection and organization:</p>
                
                <h6>Case Structure:</h6>
                <ol>
                <li><strong>Definition:</strong> Clearly define key terms and scope</li>
                <li><strong>Criteria:</strong> Establish framework for evaluating arguments</li>
                <li><strong>Contentions:</strong> 2-4 main arguments supporting your position</li>
                <li><strong>Weighing:</strong> Explain why your arguments matter more</li>
                </ol>
                
                <h6>Argument Selection Criteria:</h6>
                <ul>
                <li>Strength: How well can you prove and defend it?</li>
                <li>Uniqueness: Does it offer something opponents can't turn?</li>
                <li>Impact: How significant are the consequences?</li>
                <li>Breadth: Does it cover multiple aspects of the topic?</li>
                </ul>
                
                <h6>Strategic Considerations:</h6>
                <ul>
                <li>Anticipate opponent responses</li>
                <li>Prepare defensive blocks</li>
                <li>Plan argument extensions</li>
                <li>Consider time allocation</li>
                </ul>''',
                'exercise': 'Build a comprehensive case structure for the motion "This house would implement universal basic income." Include definition, criteria, and at least 3 contentions with brief explanations.',
                'difficulty': 'intermediate',
                'estimated_time': 30,
                'points_possible': 50
            },
            {
                'id': 'debate_intermediate_3',
                'title': 'Cross-Examination Skills',
                'level': 'intermediate',
                'description': 'Mastering the art of questioning and responding under pressure',
                'content': '''<p>Cross-examination is a crucial skill in many debate formats:</p>
                
                <h6>Questioning Strategies:</h6>
                <ul>
                <li><strong>Clarification:</strong> "What exactly do you mean by..."</li>
                <li><strong>Limitation:</strong> "Are you claiming this applies to all cases?"</li>
                <li><strong>Comparison:</strong> "How does this compare to..."</li>
                <li><strong>Consequences:</strong> "What would happen if..."</li>
                <li><strong>Evidence:</strong> "What's your source for this claim?"</li>
                </ul>
                
                <h6>Effective Questioning Techniques:</h6>
                <ul>
                <li>Ask short, specific questions</li>
                <li>Don't argue during cross-ex</li>
                <li>Build towards a specific goal</li>
                <li>Control the pace and direction</li>
                <li>Listen carefully to answers</li>
                </ul>
                
                <h6>Answering Strategies:</h6>
                <ul>
                <li>Be direct and honest</li>
                <li>Don't volunteer extra information</li>
                <li>Clarify ambiguous questions</li>
                <li>Admit when you don't know</li>
                <li>Stay calm under pressure</li>
                </ul>''',
                'exercise': 'Create 5 strategic cross-examination questions for someone arguing that "Social media platforms should be held liable for user-generated content." Explain what each question aims to achieve.',
                'difficulty': 'intermediate',
                'estimated_time': 25,
                'points_possible': 45
            },
            
            # Advanced Level Lessons
            {
                'id': 'debate_advanced_1',
                'title': 'Advanced Rhetorical Techniques',
                'level': 'advanced',
                'description': 'Sophisticated persuasion strategies and logical frameworks',
                'content': '''<p>Advanced debaters master subtle rhetorical techniques:</p>
                
                <h6>Logical Frameworks:</h6>
                <ul>
                <li><strong>Consequentialism:</strong> Judge by outcomes and impacts</li>
                <li><strong>Deontological:</strong> Focus on moral duties and rules</li>
                <li><strong>Virtue Ethics:</strong> Emphasize character and intentions</li>
                <li><strong>Contractualism:</strong> What would rational people agree to?</li>
                </ul>
                
                <h6>Persuasion Techniques:</h6>
                <ul>
                <li><strong>Burden Shifting:</strong> Make opponents prove a negative</li>
                <li><strong>Definitional Control:</strong> Frame the debate through definitions</li>
                <li><strong>Narrative Building:</strong> Create compelling stories</li>
                <li><strong>Emotional Appeals:</strong> Use appropriate pathos with logos</li>
                <li><strong>Precedent Setting:</strong> Establish principles with broader implications</li>
                </ul>
                
                <h6>Advanced Argumentation:</h6>
                <ul>
                <li><strong>Thought Experiments:</strong> Test principles through hypotheticals</li>
                <li><strong>Paradox Resolution:</strong> Address apparent contradictions</li>
                <li><strong>System Analysis:</strong> Examine interconnected effects</li>
                <li><strong>Meta-argumentation:</strong> Argue about how to argue</li>
                </ul>''',
                'exercise': 'Analyze the motion "This house would prioritize economic growth over environmental protection" using TWO different philosophical frameworks. Explain how each framework would approach the debate differently.',
                'difficulty': 'advanced',
                'estimated_time': 35,
                'points_possible': 60
            },
            {
                'id': 'debate_advanced_2',
                'title': 'Complex Weighing & Comparison',
                'level': 'advanced',
                'description': 'Advanced techniques for comparing and weighing competing arguments',
                'content': '''<p>Advanced weighing goes beyond simple impact comparison:</p>
                
                <h6>Weighing Mechanisms:</h6>
                <ul>
                <li><strong>Magnitude:</strong> How big is the impact?</li>
                <li><strong>Probability:</strong> How likely is it to occur?</li>
                <li><strong>Timeframe:</strong> When will effects manifest?</li>
                <li><strong>Reversibility:</strong> Can negative effects be undone?</li>
                <li><strong>Certainty:</strong> How confident are we in the analysis?</li>
                </ul>
                
                <h6>Comparative Analysis:</h6>
                <ul>
                <li><strong>Necessity vs. Sufficiency:</strong> What's required vs. what's enough?</li>
                <li><strong>Correlation vs. Causation:</strong> Distinguish between relationships</li>
                <li><strong>Short-term vs. Long-term:</strong> Balance immediate and future effects</li>
                <li><strong>Individual vs. Collective:</strong> Weigh personal vs. societal impacts</li>
                </ul>
                
                <h6>Advanced Techniques:</h6>
                <ul>
                <li><strong>Turning:</strong> Show how opponent's arguments support your case</li>
                <li><strong>Absorption:</strong> Demonstrate how your case addresses their concerns</li>
                <li><strong>Sequencing:</strong> Explain the order of causal relationships</li>
                <li><strong>Thresholding:</strong> Identify critical tipping points</li>
                </ul>''',
                'exercise': 'For the motion "This house would ban private healthcare," create a comprehensive weighing analysis comparing healthcare accessibility vs. economic efficiency. Use at least 4 different weighing mechanisms.',
                'difficulty': 'advanced',
                'estimated_time': 40,
                'points_possible': 70
            },
            {
                'id': 'debate_advanced_3',
                'title': 'Strategic Debate Psychology',
                'level': 'advanced',
                'description': 'Understanding psychology, game theory, and strategic thinking in debate',
                'content': '''<p>Elite debaters understand the psychological and strategic dimensions:</p>
                
                <h6>Judge Psychology:</h6>
                <ul>
                <li><strong>Cognitive Biases:</strong> How judges process information</li>
                <li><strong>Attention Management:</strong> What judges remember and focus on</li>
                <li><strong>Persuasion Triggers:</strong> What makes arguments compelling</li>
                <li><strong>Decision Making:</strong> How judges evaluate competing claims</li>
                </ul>
                
                <h6>Strategic Considerations:</h6>
                <ul>
                <li><strong>Information Asymmetry:</strong> Using unique knowledge effectively</li>
                <li><strong>Signaling:</strong> Sending messages about your case strength</li>
                <li><strong>Bluffing:</strong> Strategic misdirection and uncertainty</li>
                <li><strong>Adaptation:</strong> Adjusting strategy based on opponent moves</li>
                </ul>
                
                <h6>Game Theory Applications:</h6>
                <ul>
                <li><strong>Nash Equilibrium:</strong> Optimal strategies given opponent responses</li>
                <li><strong>Prisoner's Dilemma:</strong> Cooperation vs. competition in debate</li>
                <li><strong>Zero-sum vs. Positive-sum:</strong> When collaboration benefits both sides</li>
                <li><strong>Risk Assessment:</strong> Balancing safe vs. risky strategic choices</li>
                </ul>
                
                <h6>Advanced Psychology:</h6>
                <ul>
                <li><strong>Framing Effects:</strong> How presentation influences perception</li>
                <li><strong>Anchoring:</strong> Setting reference points for evaluation</li>
                <li><strong>Confirmation Bias:</strong> How people seek confirming evidence</li>
                <li><strong>Social Proof:</strong> Using consensus and authority effectively</li>
                </ul>''',
                'exercise': 'Design a strategic approach for a debate where you have weaker evidence but stronger logical framework. Explain how you would use psychological principles to maximize your chances of success.',
                'difficulty': 'advanced',
                'estimated_time': 45,
                'points_possible': 80
            }
        ]
    
    def _load_achievements(self) -> List[Dict[str, Any]]:
        """Load achievement definitions"""
        return [
            {
                'id': 'first_lesson',
                'name': 'First Steps',
                'description': 'Complete your first lesson',
                'icon': '🎯',
                'criteria': {'min_lessons': 1},
                'points': 10
            },
            {
                'id': 'quick_learner',
                'name': 'Quick Learner',
                'description': 'Complete 5 lessons',
                'icon': '📚',
                'criteria': {'min_lessons': 5},
                'points': 25
            },
            {
                'id': 'debate_scholar',
                'name': 'Debate Scholar',
                'description': 'Complete 10 lessons',
                'icon': '🎓',
                'criteria': {'min_lessons': 10},
                'points': 50
            },
            {
                'id': 'first_debate',
                'name': 'First Debate',
                'description': 'Complete your first debate',
                'icon': '⚡',
                'criteria': {'min_debates': 1},
                'points': 20
            },
            {
                'id': 'debate_veteran',
                'name': 'Debate Veteran',
                'description': 'Complete 10 debates',
                'icon': '🏆',
                'criteria': {'min_debates': 10},
                'points': 100
            },
            {
                'id': 'high_scorer',
                'name': 'High Scorer',
                'description': 'Achieve an average score of 85+',
                'icon': '⭐',
                'criteria': {'avg_score': 85},
                'points': 75
            },
            {
                'id': 'point_collector',
                'name': 'Point Collector',
                'description': 'Earn 500 points',
                'icon': '💎',
                'criteria': {'min_points': 500},
                'points': 50
            },
            {
                'id': 'master_debater',
                'name': 'Master Debater',
                'description': 'Reach advanced level',
                'icon': '👑',
                'criteria': {'min_points': 1000},
                'points': 200
            }
        ]
