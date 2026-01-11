const fs = require('fs');
const path = require('path');

class KnowledgeBase {
    constructor() {
        this.knowledge = {};
        this.loadKnowledge();
    }

    loadKnowledge() {
        try {
            const knowledgePath = path.join(__dirname, '../data/knowledge.json');
            if (fs.existsSync(knowledgePath)) {
                const rawData = fs.readFileSync(knowledgePath, 'utf8');
                this.knowledge = JSON.parse(rawData);
                console.log('✅ Knowledge base loaded successfully');
            } else {
                console.log('⚠️ Knowledge base file not found, using empty knowledge base');
                this.knowledge = {};
            }
        } catch (error) {
            console.error('❌ Error loading knowledge base:', error.message);
            this.knowledge = {};
        }
    }

    searchKnowledge(query) {
        if (!query || typeof query !== 'string') {
            return null;
        }

        const queryLower = query.toLowerCase();
        
        // Search through company information
        if (this.knowledge.company) {
            // Company name and description
            if (queryLower.includes('premade') || queryLower.includes('company') || queryLower.includes('what do you do')) {
                return `${this.knowledge.company.name} is ${this.knowledge.company.description}. Our mission is: ${this.knowledge.company.mission}`;
            }

            // Services
            if (queryLower.includes('service') || queryLower.includes('what do you offer')) {
                const services = Object.entries(this.knowledge.services || {})
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
                return `Our services include:\n${services}`;
            }

            // Careers
            if (queryLower.includes('career') || queryLower.includes('job') || queryLower.includes('hiring') || queryLower.includes('work')) {
                const positions = this.knowledge.careers?.openPositions?.join(', ') || 'Various positions';
                const benefits = this.knowledge.careers?.benefits?.join(', ') || 'Competitive benefits';
                return `We're hiring for: ${positions}. Benefits include: ${benefits}. Apply at: ${this.knowledge.careers?.applicationProcess || 'careers@premadeinnovation.com'}`;
            }

            // Contact information
            if (queryLower.includes('contact') || queryLower.includes('email') || queryLower.includes('phone')) {
                const contact = this.knowledge.contact || {};
                return `Contact us:\nEmail: ${contact.email || 'info@premadeinnovation.com'}\nPhone: ${contact.phone || 'N/A'}\nWebsite: ${contact.website || 'www.premadeinnovation.com'}`;
            }

            // Technologies
            if (queryLower.includes('technology') || queryLower.includes('tech stack') || queryLower.includes('programming')) {
                const technologies = this.knowledge.technologies || {};
                let techInfo = 'Our technology stack includes:\n';
                Object.entries(technologies).forEach(([category, items]) => {
                    if (Array.isArray(items)) {
                        techInfo += `${category}: ${items.join(', ')}\n`;
                    }
                });
                return techInfo;
            }

            // Founder information
            if (queryLower.includes('founder') || queryLower.includes('ceo') || queryLower.includes('manish')) {
                const founder = this.knowledge.founders || {};
                return `Our ${founder.role || 'CEO'} is ${founder.ceo || 'Manish Chandra'}. ${founder.background || 'Technology leader with extensive experience.'}`;
            }
        }

        // General AI/ML questions
        if (queryLower.includes('artificial intelligence') || queryLower.includes('ai')) {
            return 'Artificial Intelligence (AI) is the simulation of human intelligence in machines that are programmed to think and learn. At Premade Innovation, we specialize in developing custom AI solutions for businesses.';
        }

        if (queryLower.includes('machine learning') || queryLower.includes('ml')) {
            return 'Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. We use ML to create intelligent automation solutions.';
        }

        // No match found
        return null;
    }

    addKnowledge(category, key, value) {
        if (!this.knowledge[category]) {
            this.knowledge[category] = {};
        }
        this.knowledge[category][key] = value;
        this.saveKnowledge();
    }

    saveKnowledge() {
        try {
            const knowledgePath = path.join(__dirname, '../data/knowledge.json');
            fs.writeFileSync(knowledgePath, JSON.stringify(this.knowledge, null, 2));
            console.log('✅ Knowledge base saved successfully');
        } catch (error) {
            console.error('❌ Error saving knowledge base:', error.message);
        }
    }

    getKnowledge() {
        return this.knowledge;
    }
}

// Create and export a singleton instance
const knowledgeBase = new KnowledgeBase();

module.exports = {
    searchKnowledge: (query) => knowledgeBase.searchKnowledge(query),
    addKnowledge: (category, key, value) => knowledgeBase.addKnowledge(category, key, value),
    getKnowledge: () => knowledgeBase.getKnowledge()
};