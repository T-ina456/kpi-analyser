const Anthropic = require('@anthropic-ai/sdk');

class AIKPIGenerator {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async generateKPIRecommendations(dataAnalysis, dashboardType) {
    const prompt = this.buildPrompt(dataAnalysis, dashboardType);

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].text;
      return this.parseKPIRecommendations(response);
    } catch (error) {
      console.error('AI KPI Generation Error:', error);
      throw error;
    }
  }

  buildPrompt(dataAnalysis, dashboardType) {
    return `You are a business intelligence expert. Analyze this dataset and recommend the most valuable KPIs for a ${dashboardType} dashboard.

Dataset Analysis:
- Rows: ${dataAnalysis.rowCount}
- Columns: ${dataAnalysis.columnCount}
- Detected Business Domain: ${dataAnalysis.detectedDomains.join(', ')}

Column Information:
${Object.entries(dataAnalysis.columnTypes).map(([col, type]) => 
  `- ${col} (${type})`
).join('\n')}

Statistics Summary:
${Object.entries(dataAnalysis.statistics).slice(0, 10).map(([col, stats]) => 
  `- ${col}: ${stats.count} values, ${stats.uniqueCount} unique${stats.avg ? `, avg: ${stats.avg.toFixed(2)}` : ''}`
).join('\n')}

Provide exactly 8 KPI recommendations in this JSON format:
[
  {
    "name": "Total Revenue",
    "type": "SUM|AVG|COUNT|MIN|MAX",
    "field": "column_name",
    "priority": "high|medium|low",
    "category": "financial|operational|customer|performance",
    "description": "Brief description",
    "reasoning": "Why this KPI is important"
  }
]

Focus on:
1. Most impactful metrics for ${dashboardType} decisions
2. Mix of different KPI types (SUM, AVG, COUNT)
3. Both high-level and detailed metrics
4. Actionable insights

Return ONLY the JSON array, no other text.`;
  }

  parseKPIRecommendations(response) {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return empty array if parsing fails
      return [];
    }
  }
}

module.exports = AIKPIGenerator;