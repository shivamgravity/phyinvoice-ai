import { Project, WorkSession } from '../data/types';
import { computeKNNProjectScores, ProjectScore } from './scoring';

export interface ClassificationResult {
  projectId: string | null;
  confidence: number;
  reason: string;
  alternatives: ProjectScore[];
}

export const NOVELTY_THRESHOLD = 0.12;

export function classifySession(
  sessionEmbedding: number[],
  sessionDescription: string,
  allSessions: WorkSession[],
  projects: Project[],
  recentProjects: Set<string>
): ClassificationResult {
  
  if (projects.length === 0) {
    return {
      projectId: null,
      confidence: 0,
      reason: 'No existing projects',
      alternatives: []
    };
  }

  const scores: ProjectScore[] = computeKNNProjectScores(
    sessionEmbedding,
    sessionDescription,
    allSessions,
    projects,
    recentProjects
  );
  
  if (scores.length === 0) {
     return {
        projectId: null,
        confidence: 0,
        reason: 'No historical context matches',
        alternatives: []
     };
  }

  const bestMatch = scores[0];
  const secondBestScore = scores.length > 1 ? scores[1].totalScore : 0;
  
  const margin = bestMatch.totalScore - secondBestScore;
  
  // Novel Work Threshold
  if (bestMatch.totalScore < NOVELTY_THRESHOLD) {
    return {
      projectId: null,
      confidence: bestMatch.totalScore,
      reason: 'Score below novelty threshold (Novel Work)',
      alternatives: scores.slice(0, 3)
    };
  }

  const bestMatchProject = projects.find(p => p.id === bestMatch.projectId);
  if (bestMatchProject?.isArchived) {
    return {
      projectId: bestMatch.projectId,
      confidence: bestMatch.totalScore,
      reason: 'Matched archived project',
      alternatives: scores.slice(0, 3)
    };
  }

  const confidence = margin < 0.05 ? margin : bestMatch.totalScore;

  return {
    projectId: bestMatch.projectId,
    confidence,
    reason: margin < 0.05 ? 'Ambiguous assignment (small margin)' : 'Optimistic assignment',
    alternatives: scores.slice(0, 3)
  };
}
