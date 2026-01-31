from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import random
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

class DecisionAnalyzer:
    def __init__(self):
        # Keywords for identifying positive and negative aspects
        self.positive_keywords = [
            'good', 'great', 'excellent', 'benefit', 'advantage', 'profit', 'gain', 
            'improve', 'better', 'success', 'opportunity', 'valuable', 'useful',
            'helpful', 'positive', 'growth', 'learn', 'experience', 'save', 'earn'
        ]
        
        self.negative_keywords = [
            'bad', 'terrible', 'awful', 'disadvantage', 'loss', 'cost', 'expensive',
            'difficult', 'hard', 'risky', 'dangerous', 'waste', 'problem', 'issue',
            'stress', 'worry', 'negative', 'harm', 'damage', 'fail', 'difficult'
        ]
        
        # Time estimation patterns
        self.time_patterns = {
            'immediate': ['now', 'immediately', 'today', 'right away'],
            'short': ['week', 'weeks', 'few days', 'couple days'],
            'medium': ['month', 'months', 'few months'],
            'long': ['year', 'years', 'long term', 'forever']
        }

        # Feedback storage - use absolute path to ensure file is created in backend directory
        self.feedback_file = os.path.join(os.path.dirname(__file__), 'feedback_data.json')
        self.feedback_data = self._load_feedback_data()
        
    def _load_feedback_data(self):
        """Load existing feedback data from file"""
        if os.path.exists(self.feedback_file):
            try:
                with open(self.feedback_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {'responses': [], 'patterns': {}}
    
    def _save_feedback_data(self):
        """Save feedback data to file"""
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(self.feedback_file), exist_ok=True)
            with open(self.feedback_file, 'w') as f:
                json.dump(self.feedback_data, f, indent=2)
            print(f"Feedback saved successfully to {self.feedback_file}")
        except Exception as e:
            print(f"Error saving feedback to {self.feedback_file}: {e}")
            # Don't raise the exception - just log it so the API doesn't fail
    
    def record_feedback(self, decision_text, analysis, rating, feedback_text=""):
        """Record user feedback for continuous improvement"""
        feedback_entry = {
            'timestamp': datetime.now().isoformat(),
            'decision': decision_text,
            'analysis': analysis,
            'rating': rating,
            'feedback_text': feedback_text
        }
        
        self.feedback_data['responses'].append(feedback_entry)
        
        # Analyze patterns for improvement
        self._analyze_feedback_patterns(decision_text, rating)
        
        self._save_feedback_data()
        
        return {"status": "Feedback recorded successfully"}
    
    def _analyze_feedback_patterns(self, decision_text, rating):
        """Analyze feedback patterns to improve future responses"""
        text_lower = decision_text.lower()
        
        # Extract key themes from the decision
        themes = []
        theme_keywords = {
            'party_exam': ['party', 'exam', 'study', 'midterm', 'test'],
            'career': ['job', 'career', 'work', 'quit', 'promotion'],
            'education': ['school', 'education', 'course', 'degree'],
            'relationship': ['relationship', 'dating', 'marriage', 'partner'],
            'financial': ['money', 'buy', 'invest', 'save', 'expensive'],
            'health': ['health', 'fitness', 'exercise', 'diet', 'gym'],
            'travel': ['travel', 'trip', 'vacation', 'journey']
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                themes.append(theme)
        
        # Update patterns based on rating
        for theme in themes:
            if theme not in self.feedback_data['patterns']:
                self.feedback_data['patterns'][theme] = {
                    'total_ratings': 0,
                    'total_count': 0,
                    'avg_rating': 0,
                    'needs_improvement': False
                }
            
            pattern = self.feedback_data['patterns'][theme]
            pattern['total_ratings'] += rating
            pattern['total_count'] += 1
            pattern['avg_rating'] = pattern['total_ratings'] / pattern['total_count']
            pattern['needs_improvement'] = pattern['avg_rating'] < 3.0
    
    def _get_theme_performance(self, text):
        """Get performance data for themes in the current decision"""
        text_lower = text.lower()
        relevant_patterns = {}
        
        theme_keywords = {
            'party_exam': ['party', 'exam', 'study', 'midterm', 'test'],
            'career': ['job', 'career', 'work', 'quit', 'promotion'],
            'education': ['school', 'education', 'course', 'degree'],
            'relationship': ['relationship', 'dating', 'marriage', 'partner'],
            'financial': ['money', 'buy', 'invest', 'save', 'expensive'],
            'health': ['health', 'fitness', 'exercise', 'diet', 'gym'],
            'travel': ['travel', 'trip', 'vacation', 'journey']
        }
        
        for theme, keywords in theme_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                if theme in self.feedback_data['patterns']:
                    relevant_patterns[theme] = self.feedback_data['patterns'][theme]
        
        return relevant_patterns

    def analyze_decision(self, decision_text, user_context=None):
        """Analyze the decision text with user context for personalized pros, cons, opportunity cost, and time estimate"""
        
        # Generate personalized pros and cons based on context
        pros = self._generate_contextual_pros(decision_text, user_context)
        cons = self._generate_contextual_cons(decision_text, user_context)
        
        # Estimate opportunity cost with context
        opportunity_cost = self._estimate_contextual_opportunity_cost(decision_text, user_context)
        
        # Estimate time requirement with context
        time_estimate = self._estimate_contextual_time(decision_text, user_context)
        
        return {
            'pros': pros,
            'cons': cons,
            'opportunity_cost': opportunity_cost,
            'time': time_estimate
        }
    
    def _generate_pros(self, text):
        """Generate pros based on decision context and learning from feedback"""
        text_lower = text.lower()
        pros = []
        
        # Check if we need to be more specific based on feedback
        performance_data = self._get_theme_performance(text)
        needs_more_detail = any(pattern.get('needs_improvement', False) for pattern in performance_data.values())
        
        # Party vs Study conflict (prioritize social benefits)
        if any(word in text_lower for word in ['party', 'celebration', 'event']) and any(word in text_lower for word in ['exam', 'midterm', 'test', 'study']):
            if needs_more_detail:
                pros.extend([
                    "Could be an unforgettable night with friends that you'll remember for years",
                    "Networking opportunity to meet people who could become lifelong friends",
                    "Mental reset from study pressure - sometimes a break improves focus afterward",
                    "Celebration and social connection can boost confidence and mental health"
                ])
            else:
                pros.extend([
                    "Could be an amazing night and create lifelong memories",
                    "Opportunity to socialize and make new friends",
                    "Mental break from exam stress and pressure",
                    "May boost mood and confidence before exams"
                ])
        
        # Social/Party/Event related
        elif any(word in text_lower for word in ['party', 'celebration', 'event', 'gathering', 'social']):
            if needs_more_detail:
                pros.extend([
                    "Expand your social circle and build meaningful connections",
                    "Create shared experiences and memories that strengthen relationships",
                    "Deserved reward for your hard work and achievements",
                    "Opportunity to practice social skills and gain confidence"
                ])
            else:
                pros.extend([
                    "Great opportunity to socialize and network",
                    "Create memorable experiences and stories",
                    "Relax and have fun after working hard",
                    "Strengthen relationships with friends"
                ])
        
        # Education/Learning related
        elif any(word in text_lower for word in ['study', 'learn', 'course', 'education', 'skill', 'exam', 'midterm']):
            if needs_more_detail:
                pros.extend([
                    "Acquire specific skills that directly impact your career trajectory",
                    "Build knowledge foundation that compounds over time",
                    "Achieve academic milestones that open doors to better opportunities",
                    "Develop critical thinking and problem-solving abilities"
                ])
            else:
                pros.extend([
                    "Gain new knowledge and skills",
                    "Improve future career prospects",
                    "Better grades and academic achievement",
                    "Personal development and growth"
                ])
        
        # Career/Job related
        elif any(word in text_lower for word in ['job', 'career', 'work', 'salary', 'promotion']):
            pros.extend([
                "Better financial stability",
                "Professional growth opportunities",
                "Enhanced resume and experience",
                "Increased earning potential"
            ])
        
        # Relationship decisions
        elif any(word in text_lower for word in ['relationship', 'dating', 'marriage', 'partner', 'boyfriend', 'girlfriend']):
            pros.extend([
                "Emotional fulfillment and companionship",
                "Personal growth through shared experiences",
                "Support system during challenging times",
                "Creating meaningful connections and memories"
            ])
        
        # Investment/Money related
        elif any(word in text_lower for word in ['invest', 'buy', 'money', 'save', 'purchase']):
            pros.extend([
                "Potential financial returns",
                "Asset building opportunity",
                "Future value appreciation",
                "Financial security and independence"
            ])
        
        # Health/Fitness related
        elif any(word in text_lower for word in ['health', 'fitness', 'exercise', 'diet', 'gym']):
            pros.extend([
                "Improved physical health and strength",
                "Better mental well-being and mood",
                "Increased energy and vitality",
                "Enhanced self-confidence and body image"
            ])
        
        # Travel/Experience related
        elif any(word in text_lower for word in ['travel', 'trip', 'vacation', 'experience']):
            pros.extend([
                "Memorable experiences and adventures",
                "Cultural exposure and learning",
                "Personal enrichment and perspective",
                "Break from routine and stress relief"
            ])
        
        # Generic pros if no specific category
        else:
            pros = [
                "Potential for positive outcomes",
                "New opportunities for growth",
                "Chance to improve current situation",
                "Learning experience regardless of outcome"
            ]
        
        return pros[:4]  # Limit to 4 pros
    
    def _generate_cons(self, text):
        """Generate cons based on decision context"""
        text_lower = text.lower()
        cons = []
        
        # Party vs Study conflict (prioritize academic consequences)
        if any(word in text_lower for word in ['party', 'celebration', 'event']) and any(word in text_lower for word in ['exam', 'midterm', 'test', 'study']):
            cons.extend([
                "Could negatively impact exam performance and grades",
                "This exam opportunity won't come again - parties happen regularly",
                "May lead to regret if you underperform on important exams",
                "Compromising your academic future for temporary entertainment"
            ])
        
        # Social/Party decisions (general concerns)
        elif any(word in text_lower for word in ['party', 'celebration', 'event', 'social']):
            cons.extend([
                "Expensive and could strain your budget",
                "May interfere with other important commitments",
                "Risk of poor decisions or overindulgence",
                "Time that could be spent on productive activities"
            ])
        
        # Academic/Study decisions
        elif any(word in text_lower for word in ['study', 'education', 'course', 'exam', 'midterm']):
            cons.extend([
                "Significant time investment with opportunity costs",
                "Financial burden and potential debt",
                "High stress and pressure to perform",
                "No guarantee of career success afterward"
            ])
        
        # Career decisions
        elif any(word in text_lower for word in ['job', 'career', 'work', 'quit', 'leave']):
            cons.extend([
                "Risk of financial instability and income loss",
                "Potential career disruption and setbacks",
                "Uncertainty in job market and economy",
                "Loss of benefits and professional security"
            ])
        
        # Relationship decisions
        elif any(word in text_lower for word in ['relationship', 'dating', 'marriage', 'partner']):
            cons.extend([
                "Emotional vulnerability and potential heartbreak",
                "Time and energy commitment that limits other pursuits",
                "Risk of becoming dependent on another person",
                "Possibility of incompatibility or conflicts"
            ])
        
        # Financial concerns
        elif any(word in text_lower for word in ['expensive', 'cost', 'money', 'buy', 'invest']):
            cons.extend([
                "Significant financial investment required",
                "Risk of financial loss or poor returns",
                "Opportunity cost of alternative investments",
                "Potential to strain your budget or savings"
            ])
        
        # Health/Lifestyle changes
        elif any(word in text_lower for word in ['health', 'fitness', 'diet', 'gym']):
            cons.extend([
                "Requires consistent effort and discipline",
                "May involve discomfort or lifestyle sacrifices",
                "Results may take time and aren't guaranteed",
                "Potential for injury or health complications"
            ])
        
        # Travel decisions
        elif any(word in text_lower for word in ['travel', 'trip', 'vacation']):
            cons.extend([
                "Expensive with potential for unexpected costs",
                "Time away from work or other responsibilities",
                "Risk of travel complications or safety issues",
                "Money could be used for more practical needs"
            ])
        
        # Generic cons if no specific category
        else:
            cons = [
                "Potential negative consequences",
                "Risk of regret or disappointment",
                "Opportunity cost of other options",
                "Uncertainty about the outcome"
            ]
        
        return cons[:4]  # Limit to 4 cons
    
    def _estimate_opportunity_cost(self, text):
        """Generate a short paragraph about what might be given up for this decision"""
        text_lower = text.lower()
        
        # Party vs Study conflict - be more specific about the actual trade-off
        if any(word in text_lower for word in ['party', 'celebration', 'event']) and any(word in text_lower for word in ['exam', 'midterm', 'test', 'study']):
            return "By choosing to attend the party, you're giving up crucial study time for your upcoming exams. This is particularly significant because exams are one-time opportunities that directly impact your grades, academic standing, and future prospects. While parties happen frequently throughout life, each exam represents a unique chance to demonstrate your knowledge and advance your education. The hours spent at the party could be used for final review, practice problems, or getting adequate rest before your exams."
        
        # Career vs current job decisions
        elif any(word in text_lower for word in ['quit', 'leave job', 'change career']) and any(word in text_lower for word in ['job', 'work', 'career']):
            return "By leaving your current job, you're giving up the security of a steady paycheck, established workplace relationships, and proven career trajectory. You're also sacrificing accumulated benefits, potential promotions within your current company, and the comfort of a familiar work environment. This decision means trading known stability for uncertain possibilities in a new role or industry."
            
        # Education vs immediate income
        elif any(word in text_lower for word in ['school', 'university', 'degree', 'masters', 'education']) and not any(word in text_lower for word in ['party', 'exam']):
            return "By pursuing further education, you're giving up years of potential earning and work experience. Instead of building your career and accumulating savings, you'll be investing time and money in learning. You're also missing opportunities to advance in your current field, build professional networks through work, and gain practical skills that only come from real-world experience."
            
        # Buying expensive items vs saving/investing
        elif any(word in text_lower for word in ['buy', 'purchase']) and any(word in text_lower for word in ['expensive', 'cost', 'money', 'car', 'house', 'laptop']):
            return "By making this purchase, you're giving up the financial flexibility that comes with having those funds available. This money could have been invested to grow over time, used for emergency situations, or saved for other important goals like a house down payment or retirement. You're also giving up the option to make different purchases in the future when better deals or newer models become available."
            
        # Travel vs saving money and time
        elif any(word in text_lower for word in ['travel', 'trip', 'vacation', 'holiday']):
            return "By taking this trip, you're giving up the money that could be used for long-term financial goals like building an emergency fund, investing for retirement, or saving for major purchases. You're also using vacation time that could be saved for future opportunities or emergencies. Additionally, you're giving up the chance to explore local experiences or invest time in personal projects and relationships at home."
            
        # Relationship decisions
        elif any(word in text_lower for word in ['relationship', 'dating', 'marriage', 'partner', 'boyfriend', 'girlfriend']):
            return "By committing to this relationship, you're giving up the freedom to explore other romantic connections and the independence to make decisions solely based on your own preferences. You're also investing time and emotional energy that could be directed toward personal goals, friendships, or career advancement. This means potentially missing opportunities to meet other compatible partners or to focus entirely on self-development."
            
        # Health and fitness commitments
        elif any(word in text_lower for word in ['gym', 'fitness', 'diet', 'exercise', 'health']):
            return "By committing to this health and fitness routine, you're giving up leisure time that could be spent on hobbies, socializing, or relaxation. You're also allocating money toward gym memberships, healthy food, or equipment that could be used for other enjoyable activities. Additionally, you're accepting some discomfort and discipline that comes with lifestyle changes instead of maintaining your current comfortable habits."
            
        # Investment decisions
        elif any(word in text_lower for word in ['invest', 'stock', 'crypto', 'real estate']):
            return "By making this investment, you're giving up the liquidity and immediate access to your money. These funds could be used for current needs, emergencies, or other investment opportunities that might arise. You're also accepting the risk of potential losses instead of keeping your money in safer, guaranteed returns like savings accounts or bonds."
            
        # Generic but more contextual
        else:
            return "Making this decision requires giving up other potential opportunities and alternatives that are currently available to you. This includes the time, energy, and resources that could be directed toward different goals, as well as the flexibility to pursue other options that might arise in the future."
    
    def _estimate_time(self, text):
        """Estimate time requirement for the decision"""
        text_lower = text.lower()
        
        # Check for explicit time mentions
        for duration, keywords in self.time_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                if duration == 'immediate':
                    return "Immediate to 1 week"
                elif duration == 'short':
                    return "1-4 weeks"
                elif duration == 'medium':
                    return "1-6 months"
                elif duration == 'long':
                    return "6 months to several years"
        
        # Party vs Study decisions (immediate impact)
        if any(word in text_lower for word in ['party', 'celebration', 'event']) and any(word in text_lower for word in ['exam', 'midterm', 'test']):
            return "Decision needed immediately - exam impact within days"
        
        # Estimate based on decision type
        if any(word in text_lower for word in ['party', 'event', 'social', 'celebration']):
            return "One evening (4-6 hours)"
        elif any(word in text_lower for word in ['degree', 'education', 'study', 'course']):
            return "Several months to years"
        elif any(word in text_lower for word in ['job', 'career change']):
            return "1-6 months"
        elif any(word in text_lower for word in ['buy', 'purchase']):
            return "Immediate to few weeks"
        elif any(word in text_lower for word in ['travel', 'trip']):
            return "Few days to few weeks"
        elif any(word in text_lower for word in ['relationship', 'dating']):
            return "Ongoing commitment (months to years)"
        else:
            return "1-3 months"
            
    def _generate_contextual_pros(self, text, context):
        """Generate highly personalized pros based on user context"""
        if not context:
            return self._generate_pros(text)
            
        pros = []
        decision_type = context.get('decisionType', '')
        priorities = context.get('priorities', [])
        stress_level = context.get('stressLevel', '')
        time_commitment = context.get('timeCommitment', '')
        specific_answers = context.get('specificAnswers', {})
        budget = context.get('budget', '')
        
        # Base pros from original method
        base_pros = self._generate_pros(text)
        
        # Add highly context-specific pros based on user's actual situation
        if decision_type == 'career':
            if 'growth' in priorities:
                if specific_answers.get('long_term_alignment') == 'yes':
                    pros.append("This perfectly aligns with your career goals AND your growth priority - a rare win-win opportunity")
                else:
                    pros.append("Even if not perfectly aligned, this could build transferable skills for your growth priority")
                    
            if 'money' in priorities:
                if specific_answers.get('paid_status') == 'paid':
                    pros.append("Direct financial benefit that addresses your money priority immediately")
                elif specific_answers.get('paid_status') == 'unpaid':
                    pros.append("While unpaid, the experience could lead to better-paying opportunities that match your money focus")
                else:
                    pros.append("Unclear compensation means you should negotiate - your money priority matters")
                    
            if time_commitment == 'plenty' and stress_level == 'low':
                pros.append("With plenty of time and low stress, you're in the perfect position to take on new career challenges")
            elif time_commitment == 'limited' and 'growth' in priorities:
                pros.append("Even with limited time, focused career moves often have disproportionate growth impact")
                
        elif decision_type == 'study':
            if 'growth' in priorities:
                if specific_answers.get('current_workload') == 'light':
                    pros.append("Light workload + growth priority = ideal time to invest in learning new skills")
                elif specific_answers.get('current_workload') == 'heavy':
                    pros.append("Despite heavy workload, strategic learning now could reduce future study burden")
                    
            if 'longterm' in priorities:
                pros.append("Education investment aligns perfectly with your long-term thinking - compound benefits over time")
                
            if specific_answers.get('term_time') == 'no' and stress_level == 'low':
                pros.append("During break time with low stress - optimal conditions for focused learning")
                
        elif decision_type == 'money':
            if 'money' in priorities and specific_answers.get('affects_essentials') == 'no':
                pros.append("This won't impact essentials AND directly serves your money priority - smart financial move")
                
            if 'longterm' in priorities and specific_answers.get('cost_type') == 'onetime':
                pros.append("One-time cost for long-term benefit matches your priorities perfectly")
                
            if budget == 'yes' and specific_answers.get('cost_type') == 'onetime':
                pros.append("While budget is tight, one-time costs are manageable and could improve your financial position")
                
        elif decision_type == 'health':
            if 'mental' in priorities and specific_answers.get('long_term_health') == 'yes':
                pros.append("Long-term health benefits + mental wellbeing priority = this could transform your quality of life")
                
            if stress_level == 'high' and specific_answers.get('wellbeing_risk') == 'low':
                pros.append("Low-risk option that could reduce your current high stress - worth trying")
                
            if 'longterm' in priorities:
                pros.append("Health investments now pay dividends for decades - perfect for your long-term thinking")
                
        elif decision_type == 'relationships':
            if 'mental' in priorities and specific_answers.get('setting_boundary') == 'yes':
                pros.append("Setting boundaries will improve your mental wellbeing long-term - brave and necessary")
                
            if specific_answers.get('affects_others') == 'no' and stress_level == 'high':
                pros.append("Decision only affects you, so prioritize what reduces your stress without guilt")
                
            if 'longterm' in priorities:
                pros.append("Healthy relationships require tough decisions now for long-term happiness")
                
        elif decision_type == 'time':
            if 'freetime' in priorities and specific_answers.get('what_delayed') == 'work':
                pros.append("Protecting personal time from work overflow directly serves your free time priority")
                
            if specific_answers.get('deadline_soon') == 'no':
                pros.append("No immediate deadline means you can be thoughtful rather than reactive")
        
        # Universal stress and time-based pros
        if stress_level == 'high':
            if 'mental' in priorities:
                pros.append("Taking action could break the stress cycle that's affecting your mental wellbeing")
            if decision_type in ['health', 'time']:
                pros.append("High stress makes this decision more urgent - your wellbeing can't wait")
        elif stress_level == 'low':
            pros.append("Your clear headspace means you can approach this thoughtfully rather than emotionally")
            
        # Time commitment insights
        if time_commitment == 'plenty':
            if 'growth' in priorities:
                pros.append("Abundant time + growth mindset = perfect conditions for meaningful progress")
        elif time_commitment == 'limited':
            if 'shortterm' in priorities:
                pros.append("Limited time forces focus on what matters most - aligns with your short-term priority")
                
        # Priority-specific affirmations
        if 'shortterm' in priorities and decision_type in ['career', 'money']:
            pros.append("This could deliver quick wins that align with your short-term results focus")
        if 'freetime' in priorities and stress_level == 'low':
            pros.append("With low stress and free time as a priority, this could enhance your personal life balance")
            
        # Combine and prioritize
        all_pros = base_pros + pros
        return self._prioritize_insights(all_pros, priorities)[:6]  # Limit to 6 most relevant
    
    def _generate_contextual_cons(self, text, context):
        """Generate highly personalized cons based on user context and specific situation"""
        if not context:
            return self._generate_cons(text)
            
        cons = []
        decision_type = context.get('decisionType', '')
        priorities = context.get('priorities', [])
        stress_level = context.get('stressLevel', '')
        time_commitment = context.get('timeCommitment', '')
        specific_answers = context.get('specificAnswers', {})
        budget = context.get('budget', '')
        
        # Base cons from original method
        base_cons = self._generate_cons(text)
        
        # Add highly context-specific cons based on user's actual situation
        if decision_type == 'career':
            if specific_answers.get('paid_status') == 'unpaid' and 'money' in priorities:
                cons.append("Zero financial compensation directly conflicts with your money priority - opportunity cost is real")
            if specific_answers.get('long_term_alignment') == 'no' and 'longterm' in priorities:
                cons.append("Poor long-term alignment undermines your long-term thinking priority")
            if time_commitment == 'limited' and 'growth' in priorities:
                cons.append("Limited time availability might prevent you from fully capitalizing on growth opportunities")
            if stress_level == 'high':
                cons.append("Adding career pressure when already stressed could lead to burnout")
                
        elif decision_type == 'study':
            if specific_answers.get('current_workload') == 'heavy' and stress_level == 'high':
                cons.append("Heavy workload + high stress + more studying = recipe for academic burnout")
            if specific_answers.get('term_time') == 'yes' and 'freetime' in priorities:
                cons.append("During term time, this directly conflicts with your free time priority")
            if time_commitment == 'limited' and specific_answers.get('current_workload') == 'heavy':
                cons.append("Limited time + heavy workload means something will suffer - likely this or your other responsibilities")
                
        elif decision_type == 'money':
            if specific_answers.get('affects_essentials') == 'yes' and stress_level == 'high':
                cons.append("Risking essential expenses while already stressed could create serious financial anxiety")
            if budget == 'yes' and specific_answers.get('cost_type') == 'recurring':
                cons.append("Tight budget + recurring costs = potential financial strain every month")
            if 'shortterm' in priorities and 'longterm' in specific_answers.get('benefits', '').lower():
                cons.append("Long-term benefits don't align with your short-term results priority")
                
        elif decision_type == 'health':
            if specific_answers.get('wellbeing_risk') == 'high' and 'mental' in priorities:
                cons.append("High wellbeing risk directly threatens your mental health priority")
            if time_commitment == 'limited' and 'longterm' in priorities:
                cons.append("Limited time for health changes undermines the long-term benefits you value")
            if specific_answers.get('long_term_health') == 'no' and 'longterm' in priorities:
                cons.append("No lasting health benefits conflicts with your long-term thinking")
                
        elif decision_type == 'relationships':
            if specific_answers.get('affects_others') == 'yes' and stress_level == 'high':
                cons.append("High stress + affecting others = potential for relationship damage if handled poorly")
            if specific_answers.get('setting_boundary') == 'yes' and 'shortterm' in priorities:
                cons.append("Boundary-setting often creates short-term conflict, which conflicts with your quick results priority")
                
        elif decision_type == 'time':
            if specific_answers.get('deadline_soon') == 'yes' and stress_level == 'high':
                cons.append("Approaching deadline + high stress = poor conditions for quality decision-making")
            if specific_answers.get('what_delayed') == 'work' and time_commitment == 'limited':
                cons.append("Delaying work with limited time availability could create professional problems")
            if specific_answers.get('what_delayed') == 'personal' and 'mental' in priorities:
                cons.append("Sacrificing personal time threatens your mental wellbeing priority")
        
        # Universal stress-based concerns
        if stress_level == 'high':
            cons.append("High stress already clouds judgment - adding decision pressure could lead to poor choices")
            if decision_type not in ['health', 'mental']:
                cons.append("Current stress levels suggest focusing on stress reduction, not new commitments")
        
        # Time commitment reality checks
        if time_commitment == 'limited':
            if 'growth' in priorities:
                cons.append("Limited time availability could prevent meaningful progress on your growth goals")
            cons.append("Limited time means you might half-commit, reducing benefits and increasing regret")
            
        # Priority conflict alerts
        if 'freetime' in priorities and time_commitment in ['limited', 'moderate']:
            cons.append("This decision directly reduces free time, which you've identified as a priority")
        if 'money' in priorities and decision_type == 'money' and budget == 'yes':
            cons.append("Tight budget makes this financially risky despite money being your priority")
        if 'mental' in priorities and stress_level == 'high':
            cons.append("Adding new stressors when mental wellbeing is already a priority concern")
            
        # Timing-specific warnings
        if 'shortterm' in priorities and decision_type in ['study', 'health']:
            cons.append("Results will be gradual, not the quick wins your short-term priority suggests you need")
        if 'longterm' in priorities and stress_level == 'high':
            cons.append("Hard to think long-term when current stress demands immediate attention")
            
        # Decision type conflicts
        if decision_type == 'career' and 'freetime' in priorities:
            cons.append("Career moves often reduce free time, conflicting with your leisure priority")
        if decision_type == 'study' and 'money' in priorities and specific_answers.get('paid_status') != 'paid':
            cons.append("Time spent studying doesn't immediately address your money priority")
            
        # Combine and prioritize
        all_cons = base_cons + cons
        return self._prioritize_insights(all_cons, priorities, reverse=True)[:6]  # Limit to 6 most relevant
    
    def _estimate_contextual_opportunity_cost(self, text, context):
        """Generate highly personalized opportunity cost based on user's specific situation"""
        if not context:
            return self._estimate_opportunity_cost(text)
            
        decision_type = context.get('decisionType', '')
        priorities = context.get('priorities', [])
        time_commitment = context.get('timeCommitment', '')
        stress_level = context.get('stressLevel', '')
        specific_answers = context.get('specificAnswers', {})
        budget = context.get('budget', '')
        
        # Build a personalized opportunity cost analysis
        costs = []
        
        # Time-based opportunity costs
        if time_commitment == 'limited':
            costs.append("your already scarce free time")
            if 'freetime' in priorities:
                costs.append("precious personal time that you've identified as a priority")
        elif time_commitment == 'moderate':
            costs.append("5-10 hours per week that could be spent on other important goals")
        elif time_commitment == 'plenty':
            costs.append("substantial time that could accelerate progress in other areas")
            
        # Priority-specific opportunity costs
        if 'money' in priorities:
            if decision_type != 'money':
                costs.append("time that could be spent on income-generating activities")
            elif budget == 'yes':
                costs.append("financial flexibility when your budget is already tight")
                
        if 'growth' in priorities:
            if decision_type not in ['career', 'study']:
                costs.append("learning opportunities that could advance your personal development")
                
        if 'mental' in priorities and stress_level == 'high':
            costs.append("mental energy you desperately need for stress recovery")
            
        # Decision-specific opportunity costs with context
        if decision_type == 'career':
            if specific_answers.get('long_term_alignment') == 'no':
                costs.append("career momentum in your actual field of interest")
            if specific_answers.get('paid_status') == 'unpaid' and 'money' in priorities:
                costs.append("paid opportunities that would address your financial priorities")
            if time_commitment != 'plenty':
                costs.append("focus needed for your existing professional responsibilities")
                
        elif decision_type == 'study':
            if specific_answers.get('current_workload') == 'heavy':
                costs.append("academic performance in your current coursework")
            if 'freetime' in priorities:
                costs.append("relaxation time needed to prevent burnout")
            if 'money' in priorities:
                costs.append("part-time work opportunities for financial gain")
                
        elif decision_type == 'money':
            if specific_answers.get('affects_essentials') == 'yes':
                costs.append("financial security for basic needs")
            if budget == 'yes':
                costs.append("emergency fund protection in an already tight financial situation")
            if 'longterm' in priorities and specific_answers.get('cost_type') == 'recurring':
                costs.append("long-term financial flexibility due to ongoing monthly commitments")
                
        elif decision_type == 'health':
            if stress_level == 'high' and specific_answers.get('wellbeing_risk') == 'high':
                costs.append("mental stability when you're already struggling with stress")
            if time_commitment == 'limited':
                costs.append("rest and recovery time your body might need")
                
        elif decision_type == 'relationships':
            if specific_answers.get('affects_others') == 'yes':
                costs.append("potential harmony with important people in your life")
            if stress_level == 'high':
                costs.append("emotional energy needed to manage your current stress")
                
        elif decision_type == 'time':
            what_delayed = specific_answers.get('what_delayed', '')
            if what_delayed == 'work':
                costs.append("professional reputation and career advancement")
            elif what_delayed == 'personal':
                costs.append("self-care and relationships that sustain your wellbeing")
            elif what_delayed == 'other_commitments':
                costs.append("trustworthiness and reliability with existing commitments")
                
        # Stress-level impact on opportunity cost
        if stress_level == 'high':
            costs.append("energy you need for stress management and mental health recovery")
            if decision_type not in ['health', 'mental']:
                costs.append("the simplicity and reduced decision-making that would lower your stress")
        elif stress_level == 'low' and 'mental' in priorities:
            costs.append("the peace of mind that comes from maintaining your current low-stress state")
            
        # Priority conflicts as opportunity costs
        if 'shortterm' in priorities and decision_type in ['study', 'health']:
            costs.append("quick wins and immediate results that match your short-term focus")
        if 'longterm' in priorities and stress_level == 'high':
            costs.append("the emotional bandwidth needed for strategic long-term thinking")
            
        # Build the final message
        if len(costs) >= 2:
            main_costs = costs[:2]
            opportunity_cost_msg = f"By choosing this path, you're giving up {main_costs[0]} and {main_costs[1]}."
        elif len(costs) == 1:
            opportunity_cost_msg = f"By choosing this path, you're giving up {costs[0]}."
        else:
            opportunity_cost_msg = "By choosing this path, you're giving up alternative opportunities that might be available."
            
        # Add contextual advice
        context_advice = ""
        if stress_level == 'high':
            context_advice = " Given your high stress level, consider whether this trade-off adds unnecessary complexity to your life right now."
        elif 'money' in priorities and decision_type != 'money':
            context_advice = " Since money is a priority for you, weigh whether this time investment will eventually lead to financial benefits."
        elif time_commitment == 'limited' and 'growth' in priorities:
            context_advice = " With limited time but growth as a priority, ensure this decision offers meaningful learning opportunities."
        elif 'freetime' in priorities and time_commitment != 'plenty':
            context_advice = " Since you value free time and don't have much to spare, this decision requires careful consideration of its necessity."
            
        return opportunity_cost_msg + context_advice
    
    def _estimate_contextual_time(self, text, context):
        """Generate highly personalized time estimate based on user's specific situation and constraints"""
        if not context:
            return self._estimate_time(text)
            
        decision_type = context.get('decisionType', '')
        time_commitment = context.get('timeCommitment', '')
        stress_level = context.get('stressLevel', '')
        priorities = context.get('priorities', [])
        specific_answers = context.get('specificAnswers', {})
        
        # Base time availability assessment
        time_reality = {
            'limited': "With only 0-5 hours per week available",
            'moderate': "With 5-10 hours per week to dedicate",
            'plenty': "With 10+ hours per week available"
        }
        
        base_time = time_reality.get(time_commitment, "Given your time situation")
        
        # Build personalized time assessment
        time_factors = []
        efficiency_factors = []
        warning_factors = []
        
        # Decision-type specific time considerations
        if decision_type == 'career':
            if specific_answers.get('long_term_alignment') == 'yes':
                efficiency_factors.append("alignment with your goals should make time feel well-invested")
            elif specific_answers.get('long_term_alignment') == 'no':
                warning_factors.append("misalignment might make every hour feel wasted")
                
            if specific_answers.get('paid_status') == 'unpaid' and 'money' in priorities:
                warning_factors.append("unpaid work might feel more time-consuming when money is a priority")
                
        elif decision_type == 'study':
            if specific_answers.get('current_workload') == 'heavy':
                warning_factors.append("heavy existing workload means every study hour will feel precious")
            if specific_answers.get('term_time') == 'yes' and stress_level == 'high':
                warning_factors.append("term-time stress could make learning take 50% longer than usual")
            elif specific_answers.get('term_time') == 'no':
                efficiency_factors.append("break time allows for more focused, efficient learning")
                
        elif decision_type == 'money':
            if specific_answers.get('affects_essentials') == 'yes':
                warning_factors.append("financial stress from essential expenses could slow decision-making")
            if specific_answers.get('cost_type') == 'recurring':
                time_factors.append("recurring costs require ongoing monthly budget management")
                
        elif decision_type == 'health':
            if specific_answers.get('wellbeing_risk') == 'high' and stress_level == 'high':
                warning_factors.append("high stress + health risks = need extra time for careful consideration")
            if specific_answers.get('long_term_health') == 'yes':
                efficiency_factors.append("long-term health benefits provide motivation for consistent effort")
                
        elif decision_type == 'time':
            if specific_answers.get('deadline_soon') == 'yes':
                warning_factors.append("approaching deadline creates time pressure that could force quick decisions")
            if specific_answers.get('what_delayed') == 'work' and time_commitment == 'limited':
                warning_factors.append("delaying work with limited time creates a dangerous time crunch")
                
        # Stress level impact on time perception and efficiency
        if stress_level == 'high':
            warning_factors.append("high stress typically slows decision-making and reduces focus")
            time_factors.append("you'll need extra buffer time for stress-related delays")
        elif stress_level == 'low':
            efficiency_factors.append("low stress levels should help you work more efficiently")
            
        # Priority-based time insights
        if 'freetime' in priorities and time_commitment == 'limited':
            warning_factors.append("valuing free time while having limited time creates internal conflict")
        if 'growth' in priorities:
            efficiency_factors.append("growth mindset typically leads to more productive time use")
        if 'shortterm' in priorities:
            efficiency_factors.append("short-term focus could help you move quickly on immediate actions")
            warning_factors.append("but rushing could compromise quality for speed")
        if 'longterm' in priorities and stress_level == 'high':
            warning_factors.append("hard to think long-term when current stress demands immediate attention")
            
        # Build the comprehensive time estimate
        estimate_parts = [base_time]
        
        if time_factors:
            estimate_parts.append(f", and considering that {time_factors[0]}")
            
        if efficiency_factors and warning_factors:
            estimate_parts.append(f", {efficiency_factors[0]}. However, {warning_factors[0]}")
        elif efficiency_factors:
            estimate_parts.append(f", {efficiency_factors[0]}")
        elif warning_factors:
            estimate_parts.append(f", be aware that {warning_factors[0]}")
            
        # Add specific timeline guidance based on context
        if time_commitment == 'limited' and stress_level == 'high':
            estimate_parts.append(". Realistically, expect this to take 2-3x longer than normal due to time and stress constraints.")
        elif time_commitment == 'plenty' and stress_level == 'low':
            estimate_parts.append(". With abundant time and low stress, you're in optimal conditions for efficient progress.")
        elif decision_type == 'career' and specific_answers.get('long_term_alignment') == 'yes':
            estimate_parts.append(". Since this aligns with your goals, time invested should feel worthwhile and pass quickly.")
        elif 'freetime' in priorities:
            estimate_parts.append(". Remember that protecting your free time priority might mean setting stricter boundaries on how much time you dedicate.")
            
        # Final time management advice based on context
        final_advice = ""
        if time_commitment == 'limited':
            if stress_level == 'high':
                final_advice = " Consider whether now is the right time, or if waiting for lower stress/more time would be wiser."
            else:
                final_advice = " Focus on the most essential aspects to maximize your limited time investment."
        elif stress_level == 'high' and decision_type not in ['health', 'mental']:
            final_advice = " High stress suggests prioritizing decisions that reduce complexity rather than add to it."
            
        return "".join(estimate_parts) + final_advice
    
    def _prioritize_insights(self, insights, priorities, reverse=False):
        """Prioritize insights based on user priorities"""
        if not priorities:
            return insights
            
        priority_keywords = {
            'growth': ['learn', 'grow', 'develop', 'skill', 'experience', 'knowledge'],
            'money': ['money', 'financial', 'income', 'cost', 'expensive', 'budget'],
            'freetime': ['time', 'schedule', 'free', 'personal', 'relax'],
            'mental': ['stress', 'mental', 'wellbeing', 'peace', 'anxiety', 'health'],
            'longterm': ['long-term', 'future', 'career', 'lasting', 'permanent'],
            'shortterm': ['immediate', 'quick', 'short-term', 'now', 'soon']
        }
        
        scored_insights = []
        for insight in insights:
            score = 0
            insight_lower = insight.lower()
            for priority in priorities:
                if priority in priority_keywords:
                    for keyword in priority_keywords[priority]:
                        if keyword in insight_lower:
                            score += 2 if reverse else 1
            scored_insights.append((score, insight))
        
        # Sort by score (highest first for pros, lowest first for cons if reverse=True)
        scored_insights.sort(key=lambda x: x[0], reverse=not reverse)
        return [insight for score, insight in scored_insights]

analyzer = DecisionAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze_decision():
    try:
        data = request.get_json()
        
        if not data or 'decision' not in data:
            return jsonify({'error': 'Decision text is required'}), 400
        
        decision_text = data['decision']
        user_context = data.get('user_context', None)
        
        if not decision_text.strip():
            return jsonify({'error': 'Decision text cannot be empty'}), 400
        
        # Analyze the decision with user context for personalized results
        analysis = analyzer.analyze_decision(decision_text, user_context)
        
        # Add unique ID for feedback tracking
        analysis_id = str(uuid.uuid4())
        
        return jsonify({
            'success': True,
            'analysis_id': analysis_id,
            'decision': decision_text,
            'analysis': analysis
        })
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        print(f"DEBUG: Received feedback data: {data}")
        
        required_fields = ['analysis_id', 'decision', 'analysis', 'rating']
        if not data:
            print("DEBUG: No data received")
            return jsonify({'error': 'No data received'}), 400
            
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"DEBUG: Missing fields: {missing_fields}")
            print(f"DEBUG: Available fields: {list(data.keys()) if data else 'None'}")
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400
        
        analysis_id = data['analysis_id']
        decision = data['decision']
        analysis = data['analysis']
        rating = data['rating']
        feedback_text = data.get('feedback_text', '')
        
        # Validate rating
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be a number between 1 and 5'}), 400
        
        # Record the feedback
        result = analyzer.record_feedback(decision, analysis, rating, feedback_text)
        
        return jsonify({
            'success': True,
            'message': 'Thank you for your feedback! This helps us improve.',
            'result': result
        })
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/feedback-stats', methods=['GET'])
def get_feedback_stats():
    try:
        stats = {
            'total_feedback': len(analyzer.feedback_data['responses']),
            'patterns': analyzer.feedback_data['patterns'],
            'recent_ratings': []
        }
        
        # Get last 10 ratings
        recent = analyzer.feedback_data['responses'][-10:]
        for entry in recent:
            stats['recent_ratings'].append({
                'rating': entry['rating'],
                'timestamp': entry['timestamp'][:10]  # Just the date
            })
        
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Decision Buddy API is running'})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
