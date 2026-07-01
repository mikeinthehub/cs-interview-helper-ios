import { api } from './client';

export async function initSession(resumePath?: string, sessionName?: string) {
  return api.post('/session/init',
    { resume_path: resumePath, session_name: sessionName }
  );
}

export async function getSessionState(sessionId: string) {
  return api.get(`/session/${sessionId}/state`);
}

export async function getSessionStatus(sessionId: string) {
  return api.get(`/session/${sessionId}/status`);
}

export async function getTranscript(sessionId: string) {
  return api.get(`/session/${sessionId}/transcript`);
}

export async function getQuestionSelection(sessionId: string) {
  return api.get(`/session/${sessionId}/selection`);
}

export async function getCandidateProfile(sessionId: string) {
  return api.get(`/session/${sessionId}/profile`);
}

export async function listSessions() {
  return api.get('/session/');
}

export async function resetSession(sessionId: string) {
  return api.post(`/session/${sessionId}/reset`);
}
