export enum AppMode {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  imageUrl: string;
  description: string;
  audioBuffer: AudioBuffer | null;
}
