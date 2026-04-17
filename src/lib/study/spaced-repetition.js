/**
 * SM-2 Algorithm Implementation for Spaced Repetition
 * 
 * Quality (0-5):
 * 5: perfect response
 * 4: correct response after a hesitation
 * 3: correct response recalled with serious difficulty
 * 2: incorrect response; where the correct one seemed easy to recall
 * 1: incorrect response; the correct one remembered
 * 0: complete blackout.
 */

export function calculateSM2FromQuality(quality, prevInterval = 0, prevEaseFactor = 2.5, repetition = 0) {
  let interval;
  let easeFactor = prevEaseFactor;
  let nextRepetition = repetition;

  if (quality >= 3) { // Correct
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEaseFactor);
    }
    nextRepetition++;
  } else { // Incorrect
    interval = 1;
    nextRepetition = 0;
  }

  // Ease Factor calculation: EF'=EF+(0.1-(5-q)*(0.08+(5-q)*0.02))
  easeFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetition: nextRepetition,
    nextReviewDate: nextReviewDate.toISOString().split('T')[0] // Just the date part
  };
}

export function calculateSM2(accuracyPercent, prevInterval = 0, prevEaseFactor = 2.5, repetition = 0) {
  // Map 0-100% to 0-5 quality scale
  let quality = 0;
  if (accuracyPercent >= 90) quality = 5;
  else if (accuracyPercent >= 75) quality = 4;
  else if (accuracyPercent >= 60) quality = 3;
  else if (accuracyPercent >= 40) quality = 2;
  else if (accuracyPercent >= 20) quality = 1;
  else quality = 0;

  return calculateSM2FromQuality(quality, prevInterval, prevEaseFactor, repetition);
}
