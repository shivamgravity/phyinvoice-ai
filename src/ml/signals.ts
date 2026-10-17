// Extremely simple stop words list
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it',
  'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these',
  'they', 'this', 'to', 'was', 'will', 'with', 'working', 'on', 'fixing', 'debugging', 
  'implementing', 'testing', 'creating', 'making', 'building', 'doing', 'some', 'my', 'I',
  'we', 'our', 'project', 'task', 'work'
]);

export function extractKeywords(description: string): string[] {
  const words = description.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  return words.filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

export function updateProjectKeywords(existingKeywords: string[], newDescription: string): string[] {
  const newKeywords = extractKeywords(newDescription);
  const keywordCounts: Record<string, number> = {};
  
  // Naive approach: just keep up to 20 unique keywords
  const combined = [...existingKeywords, ...newKeywords];
  for (const kw of combined) {
    keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
  }
  
  // Sort by frequency and keep top 20
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(entry => entry[0]);
}

export function calculateVocabularySimilarity(sessionDescription: string, projectKeywords: string[]): number {
  if (!projectKeywords || projectKeywords.length === 0) return 0;
  
  const sessionKeywords = extractKeywords(sessionDescription);
  if (sessionKeywords.length === 0) return 0;
  
  let matchCount = 0;
  const projectKwSet = new Set(projectKeywords);
  
  for (const kw of sessionKeywords) {
    if (projectKwSet.has(kw)) {
      matchCount++;
    }
  }
  
  // Jaccard-like or just match ratio
  return matchCount / sessionKeywords.length;
}

export function checkExplicitNameMatch(description: string, projectName: string): number {
  const descLower = description.toLowerCase();
  const nameLower = projectName.toLowerCase();
  
  // Very simplistic explicit name match
  if (nameLower.length > 3 && descLower.includes(nameLower)) {
    return 1.0;
  }
  return 0.0;
}
