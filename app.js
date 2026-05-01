const INTERVALS = [
  { name: "Minor 2nd", semitones: 1 },
  { name: "Major 2nd", semitones: 2 },
  { name: "Minor 3rd", semitones: 3 },
  { name: "Major 3rd", semitones: 4 },
  { name: "Perfect 4th", semitones: 5 },
  { name: "Tritone", semitones: 6 },
  { name: "Perfect 5th", semitones: 7 },
  { name: "Minor 6th", semitones: 8 },
  { name: "Major 6th", semitones: 9 },
  { name: "Minor 7th", semitones: 10 },
  { name: "Major 7th", semitones: 11 },
  { name: "Octave", semitones: 12 },
];

const CHORDS = [
  { name: "Major", semitones: [0, 4, 7] },
  { name: "Minor", semitones: [0, 3, 7] },
  { name: "Diminished", semitones: [0, 3, 6] },
  { name: "Augmented", semitones: [0, 4, 8] },
  { name: "Dominant 7th", semitones: [0, 4, 7, 10] },
  { name: "Major 7th", semitones: [0, 4, 7, 11] },
  { name: "Minor 7th", semitones: [0, 3, 7, 10] },
  { name: "Diminished 7th", semitones: [0, 3, 6, 9] },
];

const PRESETS = {
  interval: {
    beginner: ["Minor 2nd", "Major 2nd", "Minor 3rd", "Major 3rd", "Perfect 4th", "Perfect 5th", "Octave"],
    intermediate: INTERVALS.map((item) => item.name),
    advanced: INTERVALS.map((item) => item.name),
  },
  chord: {
    beginner: ["Major", "Minor"],
    intermediate: ["Major", "Minor", "Diminished", "Augmented"],
    advanced: CHORDS.map((item) => item.name),
  },
};

const state = {
  mode: "interval",
  difficulty: "beginner",
  direction: "both",
  currentQuestion: null,
  score: 0,
  attempts: 0,
  answered: false,
  autoPlayNext: false,
  audioContext: null,
  activePlayback: null,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const elements = {
  modeControls: document.querySelector("#mode-controls"),
  difficultyControls: document.querySelector("#difficulty-controls"),
  directionField: document.querySelector("#direction-field"),
  directionControls: document.querySelector("#direction-controls"),
  answerGrid: document.querySelector("#answer-grid"),
  score: document.querySelector("#score"),
  attempts: document.querySelector("#attempts"),
  playButton: document.querySelector("#play-button"),
  nextButton: document.querySelector("#next-button"),
  feedback: document.querySelector("#feedback"),
  promptLabel: document.querySelector("#prompt-label"),
  promptTitle: document.querySelector("#prompt-title"),
};

function midiToFrequency(midiNote) {
  return 440 * 2 ** ((midiNote - 69) / 12);
}

function midiToNoteName(midiNote) {
  const noteName = NOTE_NAMES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return `${noteName}${octave}`;
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getAnswerPool() {
  const source = state.mode === "interval" ? INTERVALS : CHORDS;
  const allowedNames = PRESETS[state.mode][state.difficulty];
  return source.filter((item) => allowedNames.includes(item.name));
}

function getIntervalDirection() {
  if (state.direction === "ascending") {
    return 1;
  }
  if (state.direction === "descending") {
    return -1;
  }
  return Math.random() < 0.5 ? -1 : 1;
}

function generateQuestion() {
  const answerPool = getAnswerPool();
  const answer = pickRandom(answerPool);
  const root = Math.floor((state.mode === "interval" ? 54 : 48) + Math.random() * 13);
  const direction = state.mode === "interval" ? getIntervalDirection() : 1;

  state.currentQuestion = {
    answer,
    root,
    secondNote: root + answer.semitones * direction,
    mode: state.mode,
  };
  state.answered = false;
  elements.nextButton.disabled = true;
  setFeedback("Press play when you are ready.", "");
  renderAnswers();
}

function resetSession() {
  state.score = 0;
  state.attempts = 0;
  state.autoPlayNext = false;
  updateScore();
  generateQuestion();
}

function updateScore() {
  elements.score.textContent = state.score;
  elements.attempts.textContent = state.attempts;
}

function setFeedback(message, type) {
  elements.feedback.textContent = message;
  elements.feedback.className = "feedback";
  if (type) {
    elements.feedback.classList.add(type);
  }
}

function updatePromptText() {
  const isInterval = state.mode === "interval";
  elements.promptLabel.textContent = isInterval ? "Listen to the two notes." : "Listen to the chord.";
  elements.promptTitle.textContent = isInterval ? "What interval did you hear?" : "What chord quality did you hear?";
  elements.directionField.classList.toggle("is-hidden", !isInterval);
}

function renderAnswers() {
  const answerPool = getAnswerPool();
  elements.answerGrid.innerHTML = "";

  answerPool.forEach((answer) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer.name;
    button.dataset.answer = answer.name;
    button.disabled = state.answered;
    button.addEventListener("click", () => handleAnswer(answer.name));
    elements.answerGrid.append(button);
  });
}

function markAnswers(selectedName) {
  elements.answerGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    if (button.dataset.answer === state.currentQuestion.answer.name) {
      button.classList.add("is-correct");
    }
    if (button.dataset.answer === selectedName && selectedName !== state.currentQuestion.answer.name) {
      button.classList.add("is-wrong");
    }
  });
}

function handleAnswer(selectedName) {
  if (state.answered) {
    return;
  }

  state.answered = true;
  state.attempts += 1;

  const correctName = state.currentQuestion.answer.name;
  const reveal = getQuestionReveal();
  if (selectedName === correctName) {
    state.score += 1;
    setFeedback(`Correct: ${correctName}. ${reveal}`, "is-correct");
  } else {
    setFeedback(`Not quite. The answer was ${correctName}. ${reveal}`, "is-wrong");
  }

  updateScore();
  markAnswers(selectedName);
  elements.nextButton.disabled = false;
}

function getQuestionReveal() {
  const { answer, root, secondNote, mode } = state.currentQuestion;

  if (mode === "interval") {
    return `Notes: ${midiToNoteName(root)} to ${midiToNoteName(secondNote)}.`;
  }

  return `Chord: ${midiToNoteName(root)} ${answer.name}.`;
}

function stopActivePlayback() {
  if (!state.activePlayback || !state.audioContext) {
    return;
  }

  const now = state.audioContext.currentTime;
  state.activePlayback.oscillators.forEach((oscillator) => {
    try {
      oscillator.stop(now);
    } catch {
      // The voice may already have stopped naturally.
    }
  });

  try {
    state.activePlayback.output.disconnect();
  } catch {
    // The output may already be disconnected.
  }
  state.activePlayback = null;
}

async function getAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
  }
  if (state.audioContext.state === "suspended") {
    await state.audioContext.resume();
  }
  return state.audioContext;
}

function playTone(audioContext, output, frequency, startTime, duration, gainValue) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.025);
  gain.gain.setValueAtTime(gainValue, startTime + duration - 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain).connect(output);
  oscillator.addEventListener("ended", () => {
    if (!state.activePlayback) {
      return;
    }
    state.activePlayback.oscillators = state.activePlayback.oscillators.filter((voice) => voice !== oscillator);
  });
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
  return oscillator;
}

async function playCurrentQuestion() {
  const audioContext = await getAudioContext();
  stopActivePlayback();
  const output = audioContext.createGain();
  output.gain.setValueAtTime(1, audioContext.currentTime);
  output.connect(audioContext.destination);
  state.activePlayback = {
    output,
    oscillators: [],
  };

  const now = audioContext.currentTime + 0.05;
  const { answer, root, secondNote, mode } = state.currentQuestion;

  if (mode === "interval") {
    state.activePlayback.oscillators.push(playTone(audioContext, output, midiToFrequency(root), now, 0.55, 0.23));
    state.activePlayback.oscillators.push(playTone(audioContext, output, midiToFrequency(secondNote), now + 0.72, 0.6, 0.23));
  } else {
    const gainValue = Math.max(0.08, 0.24 / answer.semitones.length);
    answer.semitones.forEach((offset) => {
      state.activePlayback.oscillators.push(playTone(audioContext, output, midiToFrequency(root + offset), now, 1.15, gainValue));
    });
  }
}

function setActiveButton(container, dataName, value) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset[dataName] === value);
  });
}

elements.modeControls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button || button.dataset.mode === state.mode) {
    return;
  }

  state.mode = button.dataset.mode;
  setActiveButton(elements.modeControls, "mode", state.mode);
  updatePromptText();
  resetSession();
  elements.playButton.textContent = "Play";
});

elements.difficultyControls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-difficulty]");
  if (!button || button.dataset.difficulty === state.difficulty) {
    return;
  }

  state.difficulty = button.dataset.difficulty;
  setActiveButton(elements.difficultyControls, "difficulty", state.difficulty);
  resetSession();
  elements.playButton.textContent = "Play";
});

elements.directionControls.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-direction]");
  if (!button || button.dataset.direction === state.direction) {
    return;
  }

  state.direction = button.dataset.direction;
  setActiveButton(elements.directionControls, "direction", state.direction);
  resetSession();
  elements.playButton.textContent = "Play";
});

elements.playButton.addEventListener("click", async () => {
  try {
    await playCurrentQuestion();
    state.autoPlayNext = true;
    elements.playButton.textContent = "Replay";
    setFeedback("Choose the answer you heard.", "");
  } catch (error) {
    console.error(error);
    setFeedback("Audio could not start. Try refreshing the page, then press Play again.", "is-wrong");
  }
});

elements.nextButton.addEventListener("click", async () => {
  generateQuestion();
  if (!state.autoPlayNext) {
    elements.playButton.textContent = "Play";
    return;
  }

  try {
    await playCurrentQuestion();
    elements.playButton.textContent = "Replay";
    setFeedback("Choose the answer you heard.", "");
  } catch (error) {
    console.error(error);
    state.autoPlayNext = false;
    elements.playButton.textContent = "Play";
    setFeedback("Audio could not start. Press Play to try again.", "is-wrong");
  }
});

updatePromptText();
resetSession();
