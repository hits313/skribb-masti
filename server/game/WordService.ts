import { GameSettings } from '../../shared/types';

const WORDS = {
  easy: ['cat', 'dog', 'sun', 'moon', 'star', 'tree', 'flower', 'house', 'car', 'book'],
  medium: ['planet', 'guitar', 'camera', 'pizza', 'robot', 'castle', 'dragon', 'wizard', 'ghost', 'alien'],
  hard: ['astronaut', 'telescope', 'microscope', 'volcano', 'tornado', 'hurricane', 'earthquake', 'tsunami', 'avalanche', 'blizzard']
};

export class WordService {
  getWords(count: number, difficulty: 'easy' | 'medium' | 'hard' = 'easy'): string[] {
    const pool = WORDS[difficulty];
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  getRandomWord(difficulty: 'easy' | 'medium' | 'hard' = 'easy'): string {
    const words = this.getWords(1, difficulty);
    return words[0];
  }
}
