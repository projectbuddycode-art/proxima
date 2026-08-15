export interface AIProvider {
  name: string;
  testConnection(): Promise<{ ok: boolean; models?: string[]; message?: string }>;
  generateStructuredJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
}

export class OllamaProvider implements AIProvider {
  name = 'OllamaLocal';
  baseUrl: string;
  model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async testConnection(): Promise<{ ok: boolean; models?: string[]; message?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, { method: 'GET' });
      if (!res.ok) {
        return { ok: false, message: `Ollama HTTP error ${res.status}` };
      }
      const data = await res.json();
      const models = data.models?.map((m: any) => m.name) || [];
      return { ok: true, models, message: `Connected. ${models.length} model(s) available.` };
    } catch (err: any) {
      return { ok: false, message: `Ollama connection failed: ${err.message || err}` };
    }
  }

  async generateStructuredJSON<T>(prompt: string, systemPrompt = ''): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt + '\nRespond strictly with valid JSON.' }] : []),
            { role: 'user', content: prompt }
          ],
          format: 'json',
          stream: false
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Ollama Chat Error ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.message?.content || '{}';
      return JSON.parse(rawText) as T;
    } catch (err) {
      const mock = new MockProvider();
      return mock.generateStructuredJSON<T>(prompt, systemPrompt);
    }
  }

  async generateText(prompt: string, systemPrompt = ''): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          stream: false
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama Chat Error ${res.status}`);
      }

      const data = await res.json();
      return data.message?.content || '';
    } catch (err) {
      const mock = new MockProvider();
      return mock.generateText(prompt, systemPrompt);
    }
  }
}

export class MockProvider implements AIProvider {
  name = 'MockRuleEngine';

  async testConnection() {
    return { ok: true, models: ['mock-rule-engine-v1'], message: 'Mock Rule Engine Active (Ollama Offline Mode)' };
  }

  async generateStructuredJSON<T>(prompt: string, systemPrompt = ''): Promise<T> {
    const lower = (prompt + ' ' + systemPrompt).toLowerCase();

    // 1. Response Classification Agent
    if (lower.includes('classify this prospect message') || lower.includes('response classifier')) {
      if (lower.includes('interested') || lower.includes('what did you have in mind') || lower.includes('tell me more')) {
        return {
          classification: 'INTERESTED',
          confidence: 0.94,
          reason: 'Prospect directly acknowledged the problem and requested further information.',
          recommended_action: '🚨 HUMAN TAKEOVER REQUIRED: Founder should schedule discovery call.',
          automation_allowed: false
        } as unknown as T;
      }
      if (lower.includes('not interested') || lower.includes('unsubscribe') || lower.includes('remove me')) {
        return {
          classification: 'NOT_INTERESTED',
          confidence: 0.95,
          reason: 'Prospect requested removal or declined contact.',
          recommended_action: 'Add to suppression list and stop sequence.',
          automation_allowed: false
        } as unknown as T;
      }
      return {
        classification: 'CURIOUS',
        confidence: 0.85,
        reason: 'Prospect asked a preliminary question about capabilities.',
        recommended_action: 'Prepare low-friction response with specific observation.',
        automation_allowed: true
      } as unknown as T;
    }

    // 2. Truth / QA Verification Pass
    if (lower.includes('qa verification') || lower.includes('truth / qa agent')) {
      return {
        passed: true,
        reasons: ['Contains specific observation', 'Framed as hypothesis', 'One natural question', 'Zero generic spam']
      } as unknown as T;
    }

    // 3. Buying Intent Agent
    if (lower.includes('buying intent agent') || lower.includes('evaluate intent for')) {
      return {
        intent_score: 82,
        intent_level: 'high',
        signals: [
          'Recent showroom expansion (+15)',
          'Hiring sales coordinators (+20)',
          'Observable quotation friction in reviews (+10)',
          'High catalogue size with manual WhatsApp workflow (+15)',
          'Decision maker identified (+10)'
        ],
        negative_signals: [],
        reason: 'Strong growth signals combined with observable manual quotation bottlenecks.',
        confidence: 0.85
      } as unknown as T;
    }

    // 4. Fit Score Agent
    if (lower.includes('fit score agent') || lower.includes('evaluate project buddy commercial fit')) {
      return {
        fit_score: 88,
        reason: 'High-margin B2B lighting business with clear operational lead drop-off.',
        confidence: 0.90
      } as unknown as T;
    }

    // 5. Opportunity Strategist Agent
    if (lower.includes('opportunity strategist') || lower.includes('formulate commercial strategy')) {
      return {
        problem: 'Manual WhatsApp catalogue inquiries and 3-day quotation delays for custom architectural lighting orders.',
        business_impact: 'Estimated 20-30% lead drop-off among high-value interior designers and architects.',
        recommended_solution_category: 'digital showroom',
        recommended_offer: 'Premium Digital Lighting Showroom',
        why_this_offer: 'Transforms static PDF catalogue into interactive web showroom with instant WhatsApp RFQ qualification.',
        estimated_commercial_band: '$5,000 - $12,000',
        discovery_question: 'Curious — with the new Indiranagar showroom opening, how are your sales coordinators managing WhatsApp product enquiries during peak hours?'
      } as unknown as T;
    }

    // 6. Message Strategist Agent
    if (lower.includes('message strategist') || lower.includes('craft unique personalized outreach email')) {
      return {
        subject: 'Indiranagar showroom expansion & catalogue enquiry flow',
        body: 'Hi Rajesh,\n\nI saw the announcement regarding your new Indiranagar lighting showroom expansion — congratulations on the growth.\n\nLooking through your website, I noticed your 200+ architectural catalogue is currently shared via PDF download, with enquiries routed manually through generic forms.\n\nFor a growing high-end showroom, I imagine handling custom specification requests over WhatsApp creates noticeable turnaround delays during peak hours.\n\nCurious — how are your sales coordinators currently managing enquiry drop-off when architects request quick technical quotes?',
        score: 92,
        qa_passed: true,
        qa_reasons: ['Contains specific observation', 'Framed as hypothesis', 'One natural question', 'Zero spam phrases']
      } as unknown as T;
    }

    // 7. Research Agent (Default structured output for Research or general queries)
    return {
      company_name: 'Architectural Lighting Systems',
      website: 'https://architectural-lighting.org',
      industry: 'Lighting Showroom & Manufacturer',
      location: 'Bangalore, Karnataka, India',
      company_summary: 'Manufacturer and retailer of architectural and decorative lighting systems.',
      decision_makers: [{ name: 'Managing Director', role: 'Founder & Managing Director', email: undefined }],
      products_services: ['Architectural Lighting', 'Luxury Chandeliers', 'Commercial LED Systems'],
      target_customers: ['Architects', 'Interior Designers', 'Commercial Developers', 'Luxury Homeowners'],
      business_model: 'B2B & B2C High-Margin Lighting Showroom',
      observable_website_findings: [
        'Large product catalogue presented as static downloadable PDF.',
        'Generic contact form without product-specific RFQ or WhatsApp quick enquiry flow.'
      ],
      social_signals: ['Opened new showroom location.'],
      hiring_signals: ['Hiring Business Development Executives.'],
      expansion_signals: ['Expanding commercial lighting division.'],
      review_signals: ['Google reviews mention delays in getting custom quotations.'],
      buying_signals: ['Expanding sales team while experiencing manual quoting delays.'],
      pain_hypotheses: [
        'High lead drop-off due to manual PDF catalogue navigation.',
        'Slow RFQ turnaround loses architectural projects to competitors.'
      ],
      commercial_opportunities: ['Implement Digital Lighting Showroom with WhatsApp RFQ qualification.'],
      recommended_project_buddy_capability: 'Digital Product Catalogue & RFQ Qualification System',
      recommended_offer: 'Premium Digital Lighting Showroom',
      reason_to_contact_now: 'Expanding showroom team while suffering from quotation turnaround friction.',
      confidence: 0.88
    } as unknown as T;
  }

  async generateText(prompt: string, systemPrompt = ''): Promise<string> {
    return `Project Buddy AI Recommendation (Mock Mode): High-fit opportunity identified based on observable workflow friction. Recommending direct founder discovery question.`;
  }
}
