"""
WUDC Speaker Scale Data for Tutorial System
Based on the official WUDC Speaker, Chair, Panelist and Trainee Scales
"""

# WUDC Speaker Scale (50-100 points)
WUDC_SPEAKER_SCALE = {
    "scale_range": {"min": 50, "max": 100},
    "description": "World Universities Debating Championship official evaluation scale",
    "tiers": {
        "elite": {
            "range": (89, 100),
            "name": "🌟 Elite Championship Level",
            "emoji": "🏆",
            "description": "Brilliant arguments, exceptional engagement, virtually unassailable",
            "characteristics": [
                "Sophisticated argumentation with nuanced analysis",
                "Exceptional strategic positioning and case development",
                "Compelling rhetorical delivery and engagement",
                "Masterful handling of rebuttals and points of information",
                "World championship level performance"
            ]
        },
        "competitive": {
            "range": (76, 88),
            "name": "💪 Tournament Ready",
            "emoji": "🥇",
            "description": "Strong arguments, good strategy, competitive performance",
            "characteristics": [
                "Well-constructed arguments with clear logic",
                "Good strategic awareness and positioning",
                "Effective use of evidence and examples",
                "Solid rebuttal skills and engagement",
                "Ready for competitive tournament play"
            ]
        },
        "developing": {
            "range": (60, 75),
            "name": "🌱 Developing Skills",
            "emoji": "📈",
            "description": "Basic skills present, needs refinement and practice",
            "characteristics": [
                "Basic argument structure is present",
                "Some evidence and reasoning provided",
                "Room for improvement in clarity and depth",
                "Developing strategic thinking",
                "Needs more practice and refinement"
            ]
        },
        "needs_work": {
            "range": (50, 59),
            "name": "🔧 Needs Development",
            "emoji": "⚠️",
            "description": "Significant gaps in argumentation and delivery",
            "characteristics": [
                "Weak or unclear arguments",
                "Limited use of evidence",
                "Poor logical structure",
                "Minimal strategic awareness",
                "Requires substantial improvement"
            ]
        }
    }
}

# WUDC Evaluation Criteria (25 points each)
WUDC_EVALUATION_CRITERIA = {
    "argument_quality": {
        "name": "🎯 Argument Quality",
        "weight": 25,
        "description": "Clarity, relevance, and logical structure of arguments",
        "components": [
            "Clear and specific claims",
            "Logical argument structure",
            "Relevance to the motion",
            "Coherent presentation"
        ]
    },
    "evidence_use": {
        "name": "📚 Evidence Use",
        "weight": 25,
        "description": "Credibility, specificity, and integration of evidence",
        "components": [
            "Credible sources and data",
            "Specific examples and statistics",
            "Proper integration with arguments",
            "Relevance to claims"
        ]
    },
    "reasoning": {
        "name": "🔗 Reasoning",
        "weight": 25,
        "description": "Logical connections, causation, and impact analysis",
        "components": [
            "Clear logical connections",
            "Causal relationships explained",
            "Impact assessment",
            "Conclusion follows from premises"
        ]
    },
    "strategic_positioning": {
        "name": "♟️ Strategic Positioning",
        "weight": 25,
        "description": "Side-appropriate framing and debate strategy",
        "components": [
            "Appropriate framing for position",
            "Strategic awareness",
            "Effective rebuttals",
            "Debate format understanding"
        ]
    }
}

# WUDC Debate Formats
WUDC_DEBATE_FORMATS = {
    "british_parliamentary": {
        "name": "🏛️ British Parliamentary",
        "emoji": "🇬🇧",
        "description": "WUDC official format with four teams",
        "structure": {
            "teams": 4,
            "positions": ["Opening Government", "Opening Opposition", "Closing Government", "Closing Opposition"],
            "speech_time": "7 minutes",
            "prep_time": "15 minutes"
        },
        "evaluation_focus": [
            "Extension arguments for closing teams",
            "Strategic positioning within the debate",
            "Engagement with other teams",
            "Format-specific skills"
        ]
    },
    "asian_parliamentary": {
        "name": "🌏 Asian Parliamentary",
        "emoji": "🥋",
        "description": "Three-team format popular in Asia",
        "structure": {
            "teams": 3,
            "positions": ["Government", "Opposition", "Member Government"],
            "speech_time": "8 minutes",
            "prep_time": "30 minutes"
        }
    },
    "australs": {
        "name": "🇦🇺 Australs Format",
        "emoji": "🦘",
        "description": "Australian championship format",
        "structure": {
            "teams": 2,
            "positions": ["Affirmative", "Negative"],
            "speech_time": "8 minutes",
            "prep_time": "1 hour"
        }
    }
}

# WUDC Skills Framework
WUDC_SKILLS_FRAMEWORK = {
    "core_skills": {
        "argumentation": {
            "name": "🎯 Argumentation",
            "emoji": "🎯",
            "description": "Building compelling logical arguments",
            "levels": {
                "beginner": "Basic claim-evidence structure",
                "intermediate": "Multi-layered arguments with analysis",
                "advanced": "Sophisticated reasoning with nuanced positions"
            }
        },
        "rebuttal": {
            "name": "⚔️ Rebuttal",
            "emoji": "⚔️",
            "description": "Attacking and defending arguments",
            "levels": {
                "beginner": "Simple point-by-point responses",
                "intermediate": "Strategic targeting of key arguments",
                "advanced": "Sophisticated engagement with reasoning"
            }
        },
        "evidence": {
            "name": "📚 Evidence",
            "emoji": "📚",
            "description": "Using credible sources effectively",
            "levels": {
                "beginner": "Basic facts and examples",
                "intermediate": "Statistics and expert opinions",
                "advanced": "Integrated evidence with source evaluation"
            }
        },
        "strategy": {
            "name": "♟️ Strategy",
            "emoji": "♟️",
            "description": "Debate tactics and positioning",
            "levels": {
                "beginner": "Understanding basic positions",
                "intermediate": "Tactical argument selection",
                "advanced": "Meta-strategic debate management"
            }
        },
        "delivery": {
            "name": "🎭 Delivery",
            "emoji": "🎭",
            "description": "Presentation and engagement",
            "levels": {
                "beginner": "Clear speaking and structure",
                "intermediate": "Engaging presentation style",
                "advanced": "Compelling rhetorical techniques"
            }
        }
    }
}

# WUDC Achievement System
WUDC_ACHIEVEMENTS = {
    "first_speech": {
        "name": "🎤 First Speech",
        "emoji": "🎤",
        "description": "Complete your first debate speech",
        "tier": "bronze",
        "points": 50
    },
    "tournament_ready": {
        "name": "🏆 Tournament Ready",
        "emoji": "🏆",
        "description": "Achieve WUDC score of 76+",
        "tier": "silver",
        "points": 200
    },
    "championship_level": {
        "name": "🌟 Championship Level",
        "emoji": "🌟",
        "description": "Achieve WUDC score of 89+",
        "tier": "gold",
        "points": 500
    },
    "evidence_master": {
        "name": "📊 Evidence Master",
        "emoji": "📊",
        "description": "Consistently use high-quality evidence",
        "tier": "silver",
        "points": 150
    },
    "strategic_thinker": {
        "name": "🧠 Strategic Thinker",
        "emoji": "🧠",
        "description": "Demonstrate advanced strategic positioning",
        "tier": "gold",
        "points": 300
    }
}

# WUDC Training Modules
WUDC_TRAINING_MODULES = {
    "beginner": {
        "name": "🌱 Foundation Builder",
        "emoji": "🌱",
        "target_score": (60, 75),
        "modules": [
            {
                "id": "basic_argumentation",
                "name": "🎯 Basic Argumentation",
                "description": "Learn to build clear, logical arguments",
                "exercises": [
                    "Claim-evidence-reasoning structure",
                    "Motion analysis practice",
                    "Basic case construction"
                ]
            },
            {
                "id": "evidence_basics",
                "name": "📚 Evidence Fundamentals",
                "description": "Using facts and examples effectively",
                "exercises": [
                    "Source evaluation",
                    "Statistics usage",
                    "Example selection"
                ]
            }
        ]
    },
    "intermediate": {
        "name": "💪 Skill Developer",
        "emoji": "💪",
        "target_score": (76, 88),
        "modules": [
            {
                "id": "advanced_rebuttal",
                "name": "⚔️ Advanced Rebuttal",
                "description": "Strategic attack and defense",
                "exercises": [
                    "Argument prioritization",
                    "Clash engagement",
                    "Defensive strategies"
                ]
            },
            {
                "id": "strategic_positioning",
                "name": "♟️ Strategic Positioning",
                "description": "Tactical debate management",
                "exercises": [
                    "Format-specific strategies",
                    "Team coordination",
                    "Time management"
                ]
            }
        ]
    },
    "advanced": {
        "name": "🌟 Championship Mastery",
        "emoji": "🌟",
        "target_score": (89, 100),
        "modules": [
            {
                "id": "sophisticated_analysis",
                "name": "🧠 Sophisticated Analysis",
                "description": "World-class argumentation",
                "exercises": [
                    "Nuanced position development",
                    "Complex impact analysis",
                    "Meta-argument construction"
                ]
            },
            {
                "id": "rhetorical_mastery",
                "name": "🎭 Rhetorical Mastery",
                "description": "Elite presentation skills",
                "exercises": [
                    "Advanced persuasion techniques",
                    "Audience engagement",
                    "Compelling delivery"
                ]
            }
        ]
    }
}

def get_wudc_tier(score):
    """Get WUDC tier information based on score"""
    for tier_name, tier_info in WUDC_SPEAKER_SCALE["tiers"].items():
        if tier_info["range"][0] <= score <= tier_info["range"][1]:
            return tier_info
    return WUDC_SPEAKER_SCALE["tiers"]["needs_work"]

def calculate_wudc_score(argument_quality, evidence_use, reasoning, strategic_positioning):
    """Calculate WUDC score from components"""
    return min(100, 50 + argument_quality + evidence_use + reasoning + strategic_positioning)

def get_skill_level(score):
    """Get skill level based on WUDC score"""
    if score >= 89:
        return "advanced"
    elif score >= 76:
        return "intermediate"
    elif score >= 60:
        return "beginner"
    else:
        return "needs_development"

def get_training_recommendations(current_score, weak_areas):
    """Get personalized training recommendations"""
    skill_level = get_skill_level(current_score)
    recommendations = []
    
    # Get appropriate training modules
    if skill_level in WUDC_TRAINING_MODULES:
        module = WUDC_TRAINING_MODULES[skill_level]
        recommendations.append({
            "type": "module",
            "title": f"Focus on {module['name']}",
            "description": f"Target score: {module['target_score'][0]}-{module['target_score'][1]}",
            "modules": module["modules"]
        })
    
    # Add specific skill recommendations
    for area in weak_areas:
        if area in WUDC_SKILLS_FRAMEWORK["core_skills"]:
            skill = WUDC_SKILLS_FRAMEWORK["core_skills"][area]
            recommendations.append({
                "type": "skill",
                "title": f"Improve {skill['name']}",
                "description": skill["description"],
                "level": skill["levels"][skill_level] if skill_level in skill["levels"] else skill["levels"]["beginner"]
            })
    
    return recommendations