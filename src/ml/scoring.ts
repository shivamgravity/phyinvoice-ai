import { Project, WorkSession } from '../data/types';
import { checkExplicitNameMatch } from './signals';
import { cosineSimilarity } from './similarity';

export interface ProjectScore {
  projectId: string;
  totalScore: number;
}

export function computeKNNProjectScores(
  sessionEmbedding: number[],
  sessionDescription: string,
  allSessions: WorkSession[],
  projects: Project[],
  recentProjects: Set<string>,
  k: number = 5
): ProjectScore[] {
  
  // 1. Calculate similarity to all historical sessions
  const sessionScores = allSessions
    .filter(s => s.embedding != null && s.projectId != null)
    .map(s => {
      const sim = cosineSimilarity(sessionEmbedding, s.embedding!);
      return { projectId: s.projectId!, similarity: sim };
    })
    .sort((a, b) => b.similarity - a.similarity);

  // Take top K most similar sessions
  const topK = sessionScores.slice(0, k);

  // 2. Aggregate votes for each project
  const projectVotes = new Map<string, { sum: number, count: number }>();
  
  // Base vote from KNN
  for (const match of topK) {
    const weight = Math.pow(Math.max(0, match.similarity), 2);
    const current = projectVotes.get(match.projectId) || { sum: 0, count: 0 };
    current.sum += weight;
    current.count += 1;
    projectVotes.set(match.projectId, current);
  }

  // 2.5 Build dynamic vocabulary for each project
  const projectVocabulary = new Map<string, Set<string>>();
  for (const s of allSessions) {
    if (s.projectId && s.description) {
      const vocab = projectVocabulary.get(s.projectId) || new Set();
      // Extract keywords (words > 2 letters, lowercased)
      const words = s.description.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
      const stopWords = new Set([
        'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'onto',
        'working', 'on', 'fixing', 'debugging', 'testing', 'updating', 'adding', 
        'creating', 'deploying', 'making', 'building', 'doing', 'some', 'my', 
        'improving', 'review', 'practicing', 'using', 'learning'
      ]);
      words.forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) vocab.add(w);
      });
      projectVocabulary.set(s.projectId, vocab);
    }
  }

  const sessionWords = sessionDescription.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);

  // 3. Add global heuristics for all known projects
  const finalScores = new Map<string, number>();
  for (const project of projects) {
    const stats = projectVotes.get(project.id);
    let score = stats ? (stats.sum / stats.count) : 0;
    
    // Vocabulary Overlap Boost
    const vocab = projectVocabulary.get(project.id) || new Set();
    let overlap = 0;
    for (const w of sessionWords) {
      if (vocab.has(w)) overlap++;
    }
    const vocabBoost = sessionWords.length > 0 ? (overlap / sessionWords.length) * 0.20 : 0;
    score += vocabBoost;

    // Explicit Name Match (massive boost if user types the project name)
    const explicitMatch = checkExplicitNameMatch(sessionDescription, project.name);
    if (explicitMatch > 0) {
      score += explicitMatch * 2.0; 
    }

    // Temporal Context (small boost if used recently)
    if (recentProjects.has(project.id)) {
      score += 0.05;
    }
    
    if (score > 0) {
      finalScores.set(project.id, score);
    }
  }

  // Convert to sorted array
  return Array.from(finalScores.entries())
    .map(([projectId, totalScore]) => ({ projectId, totalScore }))
    .sort((a, b) => b.totalScore - a.totalScore);
}
