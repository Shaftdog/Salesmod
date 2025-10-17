export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  score?: number;
}

/**
 * Search the web using Tavily API
 * Sign up: https://tavily.com (free $5 credit)
 */
export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  // Fallback to Brave if no Tavily key
  if (!apiKey || apiKey === 'your_tavily_key_here') {
    return searchBrave(query, maxResults);
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content || r.snippet || '',
      score: r.score,
    }));
  } catch (error) {
    console.error('Tavily search failed:', error);
    return [];
  }
}

/**
 * Search using Brave Search API (free tier: 2000/month)
 * Sign up: https://brave.com/search/api/
 */
export async function searchBrave(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey || apiKey === 'your_brave_key_here') {
    console.warn('No search API key configured. Research will use internal data only.');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      count: maxResults.toString(),
    });

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.web?.results || []).slice(0, maxResults).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.description || '',
    }));
  } catch (error) {
    console.error('Brave search failed:', error);
    return [];
  }
}

/**
 * Mock search for development/testing (no API needed)
 */
export async function mockSearch(query: string): Promise<SearchResult[]> {
  console.log('[Mock Search] Simulating web search for:', query);
  
  return [
    {
      title: `${query} - Company Information`,
      url: 'https://example.com/mock-result',
      snippet: `Mock search result for ${query}. In production, this would return real web search results from Tavily or Brave.`,
    },
  ];
}

