export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { action } = req.body;

  if (action === 'analyze') {
    const { food } = req.body;
    if (!food) return res.status(400).json({ error: 'No food description provided' });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: `You are a nutrition estimation AI. Given a food description, estimate the nutritional content. Return ONLY valid JSON, no other text. Format:
{"items":[{"name":"item name","calories":number,"protein":number,"carbs":number,"fat":number}],"total":{"calories":number,"protein":number,"carbs":number,"fat":number}}
Use reasonable portion sizes. Calories in kcal, macros in grams. Be accurate but round to whole numbers.`,
          messages: [{ role: 'user', content: food }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', errText);
        return res.status(500).json({ error: 'AI analysis failed' });
      }

      const data = await response.json();
      const text = data.content[0].text.trim();

      // Extract JSON from response (handle potential markdown wrapping)
      let jsonStr = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const nutrition = JSON.parse(jsonStr);
      return res.status(200).json(nutrition);
    } catch (error) {
      console.error('Food analysis error:', error);
      return res.status(500).json({ error: 'Failed to analyze food' });
    }
  }

  if (action === 'goals') {
    const { weight, goalWeight, activityLevel, goal } = req.body;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system: `You are a sports nutrition advisor. Given a user's stats, recommend daily macro targets. Return ONLY valid JSON:
{"calories":number,"protein":number,"carbs":number,"fat":number,"explanation":"brief 1-2 sentence rationale"}
Use evidence-based recommendations. Protein in g, carbs in g, fat in g. Calories in kcal.`,
          messages: [{
            role: 'user',
            content: `Current weight: ${weight} lbs. Goal weight: ${goalWeight} lbs. Activity level: ${activityLevel}. Goal: ${goal}. Recommend daily macros.`
          }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', errText);
        return res.status(500).json({ error: 'AI goals failed' });
      }

      const data = await response.json();
      const text = data.content[0].text.trim();
      let jsonStr = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonStr = jsonMatch[0];

      const goals = JSON.parse(jsonStr);
      return res.status(200).json(goals);
    } catch (error) {
      console.error('Goals error:', error);
      return res.status(500).json({ error: 'Failed to generate goals' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
