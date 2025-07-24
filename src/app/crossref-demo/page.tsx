'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CrossRefResult {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  url?: string;
  abstract?: string;
  source: string;
  confidenceScore?: number;
  evidenceLevel?: string;
  studyType?: string;
  citationCount?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  isOpenAccess?: boolean;
}

interface SearchResponse {
  success: boolean;
  results: CrossRefResult[];
  insights: {
    totalResults: number;
    highConfidenceCount: number;
    recentCount: number;
    openAccessCount: number;
    averageCitationCount: number;
    sourceBreakdown: {
      pubmed: number;
      crossref: number;
    };
  };
  query: string;
  searchType: string;
}

export default function CrossRefDemo() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [results, setResults] = useState<CrossRefResult[]>([]);
  const [insights, setInsights] = useState<SearchResponse['insights'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchTypes = [
    { value: 'general', label: 'General Medical Research' },
    { value: 'drug', label: 'Drug Research' },
    { value: 'disease', label: 'Disease Research' },
    { value: 'clinical-trials', label: 'Clinical Trials' },
    { value: 'systematic-reviews', label: 'Systematic Reviews' },
    { value: 'recent', label: 'Recent Research' },
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          type: searchType,
          limit: 15,
          sources: ['pubmed', 'crossref'],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setInsights(data.insights);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getEvidenceLevelColor = (level?: string) => {
    switch (level) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'PubMed': return 'bg-blue-100 text-blue-800';
      case 'CrossRef': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">CrossRef Medical Research Demo</h1>
        <p className="text-gray-600">
          Test the integrated CrossRef + PubMed medical research API
        </p>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Search Medical Literature</CardTitle>
          <CardDescription>
            Search across PubMed and CrossRef databases for medical research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter your medical research query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {searchTypes.map((type) => (
              <Button
                key={type.value}
                variant={searchType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType(type.value)}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Search Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{insights.totalResults}</div>
                <div className="text-sm text-gray-600">Total Results</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{insights.highConfidenceCount}</div>
                <div className="text-sm text-gray-600">High Confidence</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{insights.recentCount}</div>
                <div className="text-sm text-gray-600">Recent (2+ years)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{insights.openAccessCount}</div>
                <div className="text-sm text-gray-600">Open Access</div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center space-x-4">
              <Badge variant="outline">PubMed: {insights.sourceBreakdown.pubmed}</Badge>
              <Badge variant="outline">CrossRef: {insights.sourceBreakdown.crossref}</Badge>
              <Badge variant="outline">
                Avg Citations: {Math.round(insights.averageCitationCount)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg leading-tight">
                  {result.url ? (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {result.title}
                    </a>
                  ) : (
                    result.title
                  )}
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge className={getSourceColor(result.source)}>
                    {result.source}
                  </Badge>
                  {result.evidenceLevel && (
                    <Badge className={getEvidenceLevelColor(result.evidenceLevel)}>
                      {result.evidenceLevel}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                <div className="space-y-1">
                  <div><strong>Authors:</strong> {result.authors.join(', ')}</div>
                  <div>
                    <strong>Journal:</strong> {result.journal} ({result.year})
                    {result.volume && ` Vol. ${result.volume}`}
                    {result.issue && ` (${result.issue})`}
                    {result.pages && `, pp. ${result.pages}`}
                  </div>
                  {result.publisher && (
                    <div><strong>Publisher:</strong> {result.publisher}</div>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result.abstract && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {result.abstract}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 items-center">
                {result.studyType && (
                  <Badge variant="outline">{result.studyType}</Badge>
                )}
                {result.confidenceScore && (
                  <Badge variant="outline">
                    Confidence: {result.confidenceScore}%
                  </Badge>
                )}
                {result.citationCount !== undefined && (
                  <Badge variant="outline">
                    Citations: {result.citationCount}
                  </Badge>
                )}
                {result.isOpenAccess && (
                  <Badge className="bg-green-100 text-green-800">
                    Open Access
                  </Badge>
                )}
                {result.doi && (
                  <a
                    href={`https://doi.org/${result.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    DOI: {result.doi}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Enter a medical research query to see results from PubMed and CrossRef
          </CardContent>
        </Card>
      )}
    </div>
  );
}
