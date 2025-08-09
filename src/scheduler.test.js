import { describe, it, expect } from 'vitest';
import { Card, Scheduler, BOX_INTERVALS_STEPS, MASTERY_BOX, MASTERY_STREAK } from './scheduler.js';

describe('Scheduler', () => {
  it('promotes card on correct answer', () => {
    const card = new Card(2, 3);
    const sched = new Scheduler([card]);
    sched.reschedule(card, true, false);
    expect(card.box).toBe(1);
    expect(card.dueStep).toBe(BOX_INTERVALS_STEPS[1]);
  });

  it('promotes faster when fast', () => {
    const card = new Card(2, 3);
    const sched = new Scheduler([card]);
    sched.reschedule(card, true, true);
    expect(card.box).toBe(2);
  });

  it('demotes on wrong answer', () => {
    const card = new Card(2, 3, 2);
    const sched = new Scheduler([card]);
    sched.reschedule(card, false, false);
    expect(card.box).toBe(1);
    expect(card.streak).toBe(0);
    expect(card.dueStep).toBe(sched.step + 1);
  });

  it('detects mastery', () => {
    const card = new Card(2, 3, MASTERY_BOX, MASTERY_STREAK);
    expect(card.mastered()).toBe(true);
  });

  it('nextCard returns ready card', () => {
    const c1 = new Card(2, 2);
    const c2 = new Card(3, 3);
    c1.dueStep = 0;
    c2.dueStep = 10;
    const sched = new Scheduler([c1, c2]);
    const first = sched.nextCard();
    expect(first).toBe(c1);
  });
});
