// CSV Configuration - Add your CSV files here
const availableCSVFiles = [
  {
    filename: 'questions-gnm.csv',
    title: 'GNM Nursing Questions',
    description: 'Comprehensive question bank for General Nursing & Midwifery students',
    icon: '🏥',
    questionCount: null // Will be auto-detected
  },
  // Add more CSV files here as needed
  // Example:
  // {
  //   filename: 'anatomy-questions.csv',
  //   title: 'Anatomy & Physiology',
  //   description: 'Human anatomy and physiology flashcards',
  //   icon: '🫀',
  //   questionCount: null
  // }
];

let data = [];
let index = 0;

const card = document.getElementById("card");
const scene = document.getElementById("scene");
const controls = document.getElementById("controls");
const csvSelection = document.getElementById("csvSelection");
const csvGrid = document.getElementById("csvGrid");

// Generate CSV selection cards
async function renderCSVSelection() {
  csvGrid.innerHTML = '';

  // Create cards with loading state first
  availableCSVFiles.forEach((csvFile, idx) => {
    const csvCard = document.createElement('div');
    csvCard.className = 'csv-card';
    csvCard.style.animationDelay = `${idx * 0.1}s`;
    csvCard.dataset.filename = csvFile.filename;

    csvCard.innerHTML = `
      <span class="csv-icon">${csvFile.icon}</span>
      <div class="csv-title">${csvFile.title}</div>
      <div class="csv-description">${csvFile.description}</div>
      <span class="csv-count">Loading...</span>
    `;

    csvCard.addEventListener('click', () => {
      loadCSVFile(csvFile.filename);
    });

    csvGrid.appendChild(csvCard);
  });

  // Fetch question counts asynchronously
  for (let i = 0; i < availableCSVFiles.length; i++) {
    const csvFile = availableCSVFiles[i];
    try {
      const response = await fetch(csvFile.filename);
      if (response.ok) {
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const questionCount = Math.max(0, lines.length - 1); // Subtract header row

        // Update the card with question count
        const card = csvGrid.querySelector(`[data-filename="${csvFile.filename}"]`);
        if (card) {
          const countElement = card.querySelector('.csv-count');
          countElement.textContent = `${questionCount} Questions`;
        }
      }
    } catch (error) {
      // If error, just show the card without count
      const card = csvGrid.querySelector(`[data-filename="${csvFile.filename}"]`);
      if (card) {
        const countElement = card.querySelector('.csv-count');
        countElement.textContent = 'Click to start';
      }
    }
  }
}

// Load CSV file from server
function loadCSVFile(filename) {
  fetch(filename)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          data = results.data;
          if (data.length > 0) {
            index = 0;
            csvSelection.classList.add('hidden');
            scene.style.display = "block";
            controls.style.display = "flex";
            renderCard();
          } else {
            alert('No data found in CSV file');
          }
        },
        error: function (error) {
          alert('Error parsing CSV: ' + error.message);
        }
      });
    })
    .catch(error => {
      alert('Error loading CSV file: ' + error.message);
    });
}

function renderCard() {
  card.classList.remove("is-flipped");
  const q = data[index];

  document.getElementById("topic").innerText = q.Topic || "Nursing";
  document.getElementById("question").innerText = q.Question_Text;

  const optionsContainer = document.getElementById("options");
  optionsContainer.innerHTML = '';

  // Create clickable options
  const options = ['A', 'B', 'C', 'D'];
  options.forEach(opt => {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.textContent = `${opt}. ${q[`Option_${opt}`]}`;
    optionDiv.dataset.option = opt;

    optionDiv.addEventListener('click', () => handleOptionClick(opt, q.Correct_Answer.trim()));

    optionsContainer.appendChild(optionDiv);
  });

  // Back side
  const correctKey = q.Correct_Answer.trim();
  document.getElementById("ansLabel").innerText = correctKey;
  document.getElementById("ansText").innerText =
    q[`Option_${correctKey}`];

  document.getElementById("progress").innerText = `${index + 1} / ${data.length}`;

  document.getElementById("prevBtn").disabled = index === 0;
  document.getElementById("nextBtn").disabled = index === data.length - 1;
}

function handleOptionClick(selectedOption, correctOption) {
  const allOptions = document.querySelectorAll('.option-item');

  allOptions.forEach(opt => {
    opt.classList.add('option-disabled');

    if (opt.dataset.option === selectedOption) {
      if (selectedOption === correctOption) {
        opt.classList.add('option-correct');
      } else {
        opt.classList.add('option-wrong');
      }
    }

    // Always show correct answer
    if (opt.dataset.option === correctOption) {
      opt.classList.add('option-correct');
    }
  });

  // Auto-flip to show answer after 1.5 seconds
  setTimeout(() => {
    card.classList.add('is-flipped');
  }, 1500);
}

card.addEventListener("click", () => {
  card.classList.toggle("is-flipped");
});

document.getElementById("nextBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (index < data.length - 1) {
    index++;
    renderCard();
  }
});

document.getElementById("prevBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (index > 0) {
    index--;
    renderCard();
  }
});

// Mobile swipe gesture support
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

card.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

card.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}, { passive: true });

function handleSwipe() {
  const swipeThreshold = 50;
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  // Only handle horizontal swipes (ignore if too much vertical movement)
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    return; // This is likely a scroll
  }

  // Swipe left (next card)
  if (deltaX < -swipeThreshold && index < data.length - 1) {
    index++;
    renderCard();
  }
  // Swipe right (previous card)
  else if (deltaX > swipeThreshold && index > 0) {
    index--;
    renderCard();
  }
}

// Prevent double-tap zoom on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Header click - Return to CSV selection
document.querySelector('header').addEventListener('click', () => {
  if (!csvSelection.classList.contains('hidden')) return; // Already on selection screen

  // Reset and show CSV selection
  scene.style.display = 'none';
  controls.style.display = 'none';
  csvSelection.classList.remove('hidden');
  data = [];
  index = 0;
});

// Progress click - Show question list modal
const questionModal = document.getElementById('questionModal');
const questionGrid = document.getElementById('questionGrid');
const closeModal = document.getElementById('closeModal');

document.getElementById('progress').addEventListener('click', (e) => {
  e.stopPropagation();
  openQuestionModal();
});

function openQuestionModal() {
  questionGrid.innerHTML = '';

  for (let i = 0; i < data.length; i++) {
    const questionNum = document.createElement('div');
    questionNum.className = 'question-number';
    questionNum.textContent = i + 1;

    if (i === index) {
      questionNum.classList.add('current');
    }

    questionNum.addEventListener('click', () => {
      index = i;
      renderCard();
      closeQuestionModal();
    });

    questionGrid.appendChild(questionNum);
  }

  questionModal.classList.add('active');
}

function closeQuestionModal() {
  questionModal.classList.remove('active');
}

closeModal.addEventListener('click', closeQuestionModal);

// Close modal when clicking outside
questionModal.addEventListener('click', (e) => {
  if (e.target === questionModal) {
    closeQuestionModal();
  }
});

// Initialize - Render CSV selection on page load
renderCSVSelection();
