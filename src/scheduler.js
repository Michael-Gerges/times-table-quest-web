export const BOX_INTERVALS_STEPS = [1, 2, 4, 7, 12, 20];
export const MASTERY_BOX = 5;
export const MASTERY_STREAK = 3;

/**
 * A single multiplication card (a × b).
 */
export class Card {
  constructor(a, b, box = 0, streak = 0) {
    this.a = a;
    this.b = b;
    this.box = box;
    this.streak = streak;
    this.dueStep = 0;
    this.attempts = 0;
    this.corrects = 0;
    this.avgTime = null;
  }
  get key() {
    return `${this.a}x${this.b}`;
  }
  mastered() {
    return this.box >= MASTERY_BOX && this.streak >= MASTERY_STREAK;
  }
  /**
   * Record an attempt with elapsed time in seconds.
   * @param {boolean} correct
   * @param {number} elapsed
   */
  record(correct, elapsed) {
    this.attempts += 1;
    if (correct) this.corrects += 1;
    this.avgTime = this.avgTime == null ? elapsed : 0.7 * this.avgTime + 0.3 * elapsed;
  }
}

/**
 * Build and shuffle the deck from configured ranges.
 * @param {Array<[number, number, number]>} ranges
 * @returns {Card[]}
 */
export function buildDeck(ranges) {
  const deck = [];
  ranges.forEach(([a, start, end]) => {
    for (let b = start; b <= end; b++) {
      deck.push(new Card(a, b));
    }
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * Scheduler implementing spaced repetition.
 */
export class Scheduler {
  constructor(cards) {
    this.cards = cards;
    this.step = 0;
  }
  nextCard() {
    this.step += 1;
    const ready = this.cards.filter(
      (c) => !c.mastered() && c.dueStep <= this.step
    );
    if (ready.length === 0) {
      const pending = this.cards.filter((c) => !c.mastered());
      if (pending.length === 0) return null;
      return pending.reduce((m, c) => (c.dueStep < m.dueStep ? c : m), pending[0]);
    }
    ready.sort((a, b) => {
      if (a.box !== b.box) return a.box - b.box;
      return Math.random() - 0.5;
    });
    return ready[0];
  }
  /**
   * Update card scheduling after an attempt.
   * @param {Card} card
   * @param {boolean} correct
   * @param {boolean} fast
   */
  reschedule(card, correct, fast) {
    if (correct) {
      card.streak += 1;
      const inc = fast ? 2 : 1;
      card.box = Math.min(card.box + inc, BOX_INTERVALS_STEPS.length - 1);
      const delay = BOX_INTERVALS_STEPS[card.box];
      card.dueStep = this.step + delay;
    } else {
      card.streak = 0;
      card.box = Math.max(card.box - 1, 0);
      card.dueStep = this.step + 1;
    }
  }
}
