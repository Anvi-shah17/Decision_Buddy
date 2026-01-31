from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

def analyze_decision(context, decision):
    """
    Analyze a decision and return pros, cons, opportunity cost, time estimate, and next steps.
    This is a simple rule-based analysis. In a production app, this could use AI/ML.
    """
    context_lower = context.lower()
    decision_lower = decision.lower()
    
    # Generate pros based on keywords
    pros = []
    cons = []
    
    # Career-related decisions
    if any(word in context_lower for word in ['job', 'career', 'work', 'position', 'employment']):
        pros.append("Potential for professional growth and skill development")
        pros.append("New opportunities and network expansion")
        cons.append("May require adjustment period and learning curve")
        cons.append("Risk of unknown work culture or environment")
        opportunity_cost = "Time and energy that could be spent on current role or other opportunities"
        time_estimate = "3-6 months to fully transition and adapt"
    
    # Education-related decisions
    elif any(word in context_lower for word in ['school', 'education', 'course', 'degree', 'study', 'learning']):
        pros.append("Investment in personal and professional development")
        pros.append("Long-term career benefits and knowledge gain")
        cons.append("Financial cost and time commitment required")
        cons.append("Delayed entry into workforce or other pursuits")
        opportunity_cost = "Income and work experience you could gain during study period"
        time_estimate = "Several months to years depending on program length"
    
    # Financial decisions
    elif any(word in context_lower for word in ['buy', 'purchase', 'invest', 'money', 'financial', 'spend']):
        pros.append("Potential value or benefit from the purchase/investment")
        pros.append("Could improve quality of life or future returns")
        cons.append("Financial resources will be committed")
        cons.append("Risk of depreciation or not meeting expectations")
        opportunity_cost = "Alternative uses for the same funds (savings, other investments, experiences)"
        time_estimate = "Immediate for purchase, long-term for seeing full impact"
    
    # Relationship decisions
    elif any(word in context_lower for word in ['relationship', 'dating', 'partner', 'marriage', 'friend']):
        pros.append("Potential for personal happiness and emotional fulfillment")
        pros.append("Building meaningful connections and support system")
        cons.append("Requires time, effort, and emotional investment")
        cons.append("Risk of incompatibility or disappointment")
        opportunity_cost = "Time and emotional energy that could be spent elsewhere"
        time_estimate = "Ongoing commitment with varying timelines"
    
    # Location/moving decisions
    elif any(word in context_lower for word in ['move', 'relocate', 'city', 'location', 'apartment', 'house']):
        pros.append("New environment and fresh perspectives")
        pros.append("Potential for better opportunities or lifestyle")
        cons.append("Leaving behind familiar surroundings and support network")
        cons.append("Costs and logistics of moving")
        opportunity_cost = "Comfort and connections in current location"
        time_estimate = "1-3 months for moving process, 6-12 months to settle"
    
    # Default general decision
    else:
        pros.append("Opportunity for growth and new experiences")
        pros.append("Taking action rather than staying stagnant")
        pros.append("Learning from the outcome regardless of result")
        cons.append("Requires commitment and resources")
        cons.append("Involves uncertainty and risk")
        cons.append("May have unforeseen challenges")
        opportunity_cost = "Alternative paths and options you won't pursue"
        time_estimate = "Varies depending on decision scope and complexity"
    
    # Add decision-specific insights
    if 'yes' in decision_lower or 'should i' in decision_lower:
        pros.append("Moving forward with intention and purpose")
        cons.append("Committing to a specific path")
    
    # Generate next steps
    next_steps = [
        "1. Research thoroughly - gather all relevant information",
        "2. Set a decision deadline to avoid analysis paralysis",
        "3. Consult trusted advisors or people with relevant experience",
        "4. Consider your long-term goals and values alignment",
        "5. Trust your intuition after weighing all factors"
    ]
    
    return {
        'pros': pros,
        'cons': cons,
        'opportunity_cost': opportunity_cost,
        'time_estimate': time_estimate,
        'next_steps': next_steps
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    context = data.get('context', '').strip()
    decision = data.get('decision', '').strip()
    
    if not context or not decision:
        return jsonify({'error': 'Both context and decision are required'}), 400
    
    result = analyze_decision(context, decision)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
