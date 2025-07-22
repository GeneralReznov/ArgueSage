// Learning Module JavaScript
// Handles learning-specific functionality

// Global variables for learning module
let currentExercise = null;
let exerciseTimer = null;
let exerciseStartTime = null;

// Initialize learning module when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLearningModule();
    setupLessonFiltering();
    setupExerciseHandling();
    loadProgress();
});

// Initialize learning module
function initializeLearningModule() {
    // Setup word count for exercise answers
    const answerTextarea = document.getElementById('answer');
    const wordCountElement = document.getElementById('wordCount');
    
    if (answerTextarea && wordCountElement) {
        debateApp.setupWordCount(answerTextarea, wordCountElement);
    } else if (answerTextarea) {
        // Create word count element if it doesn't exist
        const wordCountDiv = document.createElement('div');
        wordCountDiv.id = 'wordCount';
        wordCountDiv.className = 'form-text';
        answerTextarea.parentNode.appendChild(wordCountDiv);
        debateApp.setupWordCount(answerTextarea, wordCountDiv);
    }
    
    // Setup auto-save for exercise answers
    if (answerTextarea) {
        answerTextarea.setAttribute('data-autosave', 'true');
    }
    
    // Initialize lesson progress indicators
    updateLessonProgressBars();
    
    // Setup achievement notifications
    checkForNewAchievements();
    
    // Show all lessons initially
    filterLessons('all');
}

// Setup lesson filtering
function setupLessonFiltering() {
    const filterButtons = document.querySelectorAll('[onclick*="filterLessons"]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const level = this.textContent.toLowerCase();
            filterLessons(level);
        });
    });
}

// Filter lessons by level
function filterLessons(level) {
    const lessonItems = document.querySelectorAll('.lesson-item');
    const noLessonsMessage = document.querySelector('.no-lessons-message');
    let visibleCount = 0;
    
    lessonItems.forEach(item => {
        const itemLevel = item.getAttribute('data-level');
        if (level === 'all' || itemLevel === level) {
            item.style.display = 'block';
            item.style.animation = 'fadeInUp 0.3s ease-out';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide no lessons message
    if (visibleCount === 0) {
        if (!noLessonsMessage) {
            showNoLessonsMessage(level);
        }
    } else if (noLessonsMessage) {
        noLessonsMessage.remove();
    }
    
    // Update filter button states
    updateFilterButtonStates(level);
    
    // Update dropdown button text
    const dropdownButton = document.querySelector('.dropdown-toggle');
    if (dropdownButton) {
        const levelText = level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1);
        dropdownButton.textContent = `Filter: ${levelText}`;
    }
}

// Show no lessons message
function showNoLessonsMessage(level) {
    const container = document.getElementById('lessonsContainer');
    if (container) {
        const message = document.createElement('div');
        message.className = 'col-12 no-lessons-message text-center py-5';
        message.innerHTML = `
            <i data-feather="search" class="text-muted mb-3" style="width: 64px; height: 64px;"></i>
            <h4 class="text-muted">No ${level} lessons found</h4>
            <p class="text-muted">Try a different skill level or check back later for new content.</p>
        `;
        container.appendChild(message);
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
}

// Update filter button states
function updateFilterButtonStates(activeLevel) {
    const filterButtons = document.querySelectorAll('[onclick*="filterLessons"]');
    filterButtons.forEach(button => {
        const buttonLevel = button.textContent.toLowerCase();
        if (buttonLevel === activeLevel) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Setup exercise handling
function setupExerciseHandling() {
    const exerciseForm = document.getElementById('exerciseForm');
    if (exerciseForm) {
        exerciseForm.addEventListener('submit', handleExerciseSubmission);
        
        // Start timer when user begins typing
        const answerField = document.getElementById('answer');
        if (answerField) {
            answerField.addEventListener('focus', startExerciseTimer);
        }
    }
}

// Start exercise timer
function startExerciseTimer() {
    if (!exerciseStartTime) {
        exerciseStartTime = Date.now();
        
        // Optional: Show timer in UI
        const timerElement = document.getElementById('exerciseTimer');
        if (timerElement) {
            exerciseTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - exerciseStartTime) / 1000);
                timerElement.textContent = debateApp.formatDuration(elapsed);
            }, 1000);
        }
    }
}

// Handle exercise submission
function handleExerciseSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const answerText = formData.get('answer');
    
    // Validation
    if (!answerText || answerText.trim().length < 10) {
        debateApp.showNotification('Please provide a more detailed answer (at least 10 characters)', 'warning');
        return;
    }
    
    // Clear timer
    if (exerciseTimer) {
        clearInterval(exerciseTimer);
    }
    
    // Add completion time to form data
    if (exerciseStartTime) {
        const completionTime = Math.floor((Date.now() - exerciseStartTime) / 1000);
        formData.append('completion_time', completionTime);
    }
    
    // Set loading state
    debateApp.setButtonLoading(submitBtn, true);
    
    // Submit to server
    submitExerciseToServer(formData, submitBtn);
}

// Submit exercise (for direct calls)
function submitExercise(event) {
    if (event) {
        event.preventDefault();
    }
    
    const form = document.getElementById('exerciseForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const answerText = formData.get('answer');
    
    // Validation
    if (!answerText || answerText.trim().length < 10) {
        if (typeof debateApp !== 'undefined') {
            debateApp.showNotification('Please provide a more detailed answer (at least 10 characters)', 'warning');
        } else {
            alert('Please provide a more detailed answer (at least 10 characters)');
        }
        return;
    }
    
    // Clear timer
    if (exerciseTimer) {
        clearInterval(exerciseTimer);
    }
    
    // Add completion time to form data
    if (exerciseStartTime) {
        const completionTime = Math.floor((Date.now() - exerciseStartTime) / 1000);
        formData.append('completion_time', completionTime);
    }
    
    // Set loading state
    if (typeof debateApp !== 'undefined') {
        debateApp.setButtonLoading(submitBtn, true);
    }
    
    // Submit to server
    submitExerciseToServer(formData, submitBtn);
}

// Submit exercise to server
function submitExerciseToServer(formData, submitBtn) {
    fetch('/learning/complete', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            displayExerciseFeedback(data.feedback, data.new_points, data.achievements);
            updateUserProgress(data.new_points);
            
            // Show achievements if any
            if (data.achievements && data.achievements.length > 0) {
                showAchievementNotifications(data.achievements);
            }
            
            if (typeof debateApp !== 'undefined') {
                debateApp.showNotification('Exercise completed successfully!', 'success');
            }
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    })
    .catch(error => {
        console.error('Error submitting exercise:', error);
        if (typeof debateApp !== 'undefined') {
            debateApp.showNotification('Failed to submit exercise. Please try again.', 'error');
        } else {
            alert('Failed to submit exercise. Please try again.');
        }
    })
    .finally(() => {
        // Force button reset regardless of other conditions
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading', 'disabled');
            submitBtn.innerHTML = '<i data-feather="send" class="me-2"></i>Submit Answer';
            
            // Replace feather icons
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
        
        // Backup reset using timeout
        setTimeout(() => {
            if (submitBtn && submitBtn.disabled) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-feather="send" class="me-2"></i>Submit Answer';
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        }, 100);
    });
}

// Display exercise feedback
function displayExerciseFeedback(feedback, newPoints, achievements) {
    const feedbackSection = document.getElementById('feedbackSection');
    const feedbackContent = document.getElementById('feedbackContent');
    
    if (!feedbackSection || !feedbackContent) return;
    
    // Create feedback HTML with structured layout and emojis
    let feedbackHTML = `
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div class="h4 text-success mb-1">🏆 ${feedback.points || 0}</div>
                    <small class="text-muted">Points Earned</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div class="h4 text-info mb-1">🎯 ${feedback.correctness || 0}/10</div>
                    <small class="text-muted">Correctness</small>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div class="h4 text-warning mb-1">📊 ${feedback.explanation_quality || 0}/10</div>
                    <small class="text-muted">Explanation Quality</small>
                </div>
            </div>
        </div>
    `;
    
    // Add strengths section
    if (feedback.strengths && feedback.strengths.length > 0) {
        feedbackHTML += `
            <div class="mb-4">
                <h6 class="text-success mb-3">
                    <i data-feather="check-circle" class="me-2"></i>
                    💪 Your Strengths
                </h6>
                <div class="row">
                    ${feedback.strengths.map(strength => `
                        <div class="col-md-6 mb-2">
                            <div class="d-flex align-items-start">
                                <span class="text-success me-2">✅</span>
                                <span>${strength}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Add areas for improvement
    if (feedback.areas_for_improvement && feedback.areas_for_improvement.length > 0) {
        feedbackHTML += `
            <div class="mb-4">
                <h6 class="text-primary mb-3">
                    <i data-feather="trending-up" class="me-2"></i>
                    🚀 Areas for Growth
                </h6>
                <div class="row">
                    ${feedback.areas_for_improvement.map(area => `
                        <div class="col-md-6 mb-2">
                            <div class="d-flex align-items-start">
                                <span class="text-primary me-2">🔄</span>
                                <span>${area}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Add detailed feedback
    if (feedback.detailed_feedback) {
        // Convert detailed feedback to bullet points with emojis
        const feedbackPoints = feedback.detailed_feedback.split('.').filter(point => point.trim().length > 0);
        const formattedFeedback = feedbackPoints.map(point => {
            const trimmed = point.trim();
            if (trimmed.length > 0) {
                return `<li class="mb-2"><span class="me-2">💡</span>${trimmed}${trimmed.endsWith('.') ? '' : '.'}</li>`;
            }
            return '';
        }).filter(point => point.length > 0).join('');
        
        feedbackHTML += `
            <div class="mb-4">
                <h6 class="mb-3">
                    <i data-feather="message-square" class="me-2"></i>
                    💭 Detailed Feedback
                </h6>
                <div class="bg-light p-3 rounded text-dark">
                    <ul class="list-unstyled mb-0">
                        ${formattedFeedback}
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Add suggestions if available (fallback for legacy format)
    if (feedback.suggestions && feedback.suggestions.length > 0) {
        feedbackHTML += `
            <div class="mb-4">
                <h6 class="text-primary mb-3">
                    <i data-feather="trending-up" class="me-2"></i>
                    🚀 Suggestions for Improvement
                </h6>
                <div class="row">
                    ${feedback.suggestions.map(suggestion => `
                        <div class="col-12 mb-2">
                            <div class="d-flex align-items-start">
                                <span class="text-primary me-2">💡</span>
                                <span>${suggestion}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Add next steps
    if (feedback.next_steps) {
        // Convert next steps to bullet points with emojis
        const nextStepsPoints = feedback.next_steps.split('.').filter(point => point.trim().length > 0);
        const formattedNextSteps = nextStepsPoints.map(point => {
            const trimmed = point.trim();
            if (trimmed.length > 0) {
                return `<li class="mb-2"><span class="me-2">🎯</span>${trimmed}${trimmed.endsWith('.') ? '' : '.'}</li>`;
            }
            return '';
        }).filter(point => point.length > 0).join('');
        
        feedbackHTML += `
            <div class="mb-4">
                <h6 class="mb-3">
                    <i data-feather="compass" class="me-2"></i>
                    🎯 Next Steps
                </h6>
                <div class="alert alert-info">
                    <ul class="list-unstyled mb-0">
                        ${formattedNextSteps}
                    </ul>
                </div>
            </div>
        `;
    }
    
    // Add action buttons
    feedbackHTML += `
        <div class="text-center mt-4">
            <button class="btn btn-primary me-2" onclick="continueToNextLesson()">
                <i data-feather="arrow-right" class="me-2"></i>
                Continue Learning
            </button>
            <button class="btn btn-outline-secondary" onclick="retryExercise()">
                <i data-feather="refresh-cw" class="me-2"></i>
                Try Again
            </button>
        </div>
    `;
    
    feedbackContent.innerHTML = feedbackHTML;
    feedbackSection.style.display = 'block';
    
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Reset any loading buttons
    const loadingButtons = document.querySelectorAll('.btn[disabled]');
    loadingButtons.forEach(btn => {
        if (btn.textContent.includes('Loading')) {
            btn.disabled = false;
            btn.innerHTML = '<i data-feather="send" class="me-2"></i>Submit Answer';
        }
    });
    
    // Scroll to feedback
    debateApp.smoothScrollTo(feedbackSection);
}

// Continue to next lesson
function findNextLesson(currentLessonId) {
    // Get all lesson elements and find the next one
    const lessonElements = document.querySelectorAll('[data-lesson-id]');
    const lessonIds = Array.from(lessonElements).map(el => el.getAttribute('data-lesson-id'));
    const currentIndex = lessonIds.indexOf(currentLessonId);
    
    if (currentIndex >= 0 && currentIndex < lessonIds.length - 1) {
        return lessonIds[currentIndex + 1];
    }
    return null;
}

function continueToNextLesson() {
    const currentLessonId = document.querySelector('input[name="lesson_id"]')?.value;
    
    if (currentLessonId) {
        // Enhanced logic to find and navigate to next lesson
        const nextLessonId = findNextLesson(currentLessonId);
        if (nextLessonId) {
            window.location.href = `/learning/lesson/${nextLessonId}`;
        } else {
            window.location.href = '/learning';
        }
    } else {
        window.location.href = '/learning';
    }
}

// Retry exercise
function retryExercise() {
    const answerTextarea = document.getElementById('answer');
    const feedbackSection = document.getElementById('feedbackSection');
    
    if (answerTextarea) {
        answerTextarea.value = '';
        answerTextarea.focus();
    }
    
    if (feedbackSection) {
        feedbackSection.style.display = 'none';
    }
    
    // Reset timer
    exerciseStartTime = null;
    if (exerciseTimer) {
        clearInterval(exerciseTimer);
    }
}

// Update user progress display
function updateUserProgress(newPoints) {
    const pointsElements = document.querySelectorAll('.user-points');
    pointsElements.forEach(element => {
        const currentPoints = parseInt(element.textContent) || 0;
        animateNumberChange(element, currentPoints, newPoints);
    });
}

// Animate number change
function animateNumberChange(element, from, to) {
    const duration = 1000;
    const steps = 20;
    const stepValue = (to - from) / steps;
    const stepDuration = duration / steps;
    let current = from;
    
    const timer = setInterval(() => {
        current += stepValue;
        element.textContent = Math.round(current);
        
        if (Math.abs(current - to) < Math.abs(stepValue)) {
            element.textContent = to;
            clearInterval(timer);
        }
    }, stepDuration);
}

// Show achievement notifications
function showAchievementNotifications(achievements) {
    achievements.forEach((achievement, index) => {
        setTimeout(() => {
            debateApp.showNotification(
                `🏆 Achievement Unlocked: ${achievement.name}!`,
                'success',
                5000
            );
        }, index * 1000);
    });
}

// Update lesson progress bars
function updateLessonProgressBars() {
    const progressBars = document.querySelectorAll('.lesson-progress');
    progressBars.forEach(bar => {
        const completed = parseInt(bar.getAttribute('data-completed') || 0);
        const total = parseInt(bar.getAttribute('data-total') || 1);
        const percentage = Math.round((completed / total) * 100);
        
        bar.style.width = percentage + '%';
        bar.setAttribute('aria-valuenow', percentage);
    });
}

// Load and display progress
function loadProgress() {
    // This could be enhanced to load progress from server
    // For now, we'll use the data already in the page
    updateLessonProgressBars();
    
    // Load any saved exercise data
    const savedAnswers = JSON.parse(localStorage.getItem('exerciseAnswers') || '{}');
    Object.keys(savedAnswers).forEach(lessonId => {
        const textarea = document.querySelector(`#answer[data-lesson="${lessonId}"]`);
        if (textarea && !textarea.value) {
            textarea.value = savedAnswers[lessonId];
        }
    });
}

// Save exercise progress
function saveExerciseProgress(lessonId, answer) {
    if (!lessonId || !answer) return;
    
    const savedAnswers = JSON.parse(localStorage.getItem('exerciseAnswers') || '{}');
    savedAnswers[lessonId] = answer;
    localStorage.setItem('exerciseAnswers', JSON.stringify(savedAnswers));
}

// Check for new achievements
function checkForNewAchievements() {
    // Check for achievements based on current progress
    fetch('/api/achievements/check', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.new_achievements) {
            showAchievementNotifications(data.new_achievements);
        }
    })
    .catch(error => {
        console.error('Error checking achievements:', error);
        // Fallback: show animation for existing achievements
        const achievementElements = document.querySelectorAll('.achievement-badge');
        achievementElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.animation = 'pulse 0.5s ease-in-out';
            }, index * 200);
        });
    });
}

// Export functions for global use
window.learningModule = {
    filterLessons,
    continueToNextLesson,
    retryExercise,
    saveExerciseProgress
};

// Handle exercise form submission globally
function submitExercise(event) {
    if (typeof handleExerciseSubmission === 'function') {
        handleExerciseSubmission(event);
    }
}

// Add CSS for learning-specific animations
const learningStyle = document.createElement('style');
learningStyle.textContent = `
    .lesson-item {
        transition: all 0.3s ease;
    }
    
    .lesson-completed {
        opacity: 0.8;
    }
    
    .lesson-completed .card {
        border-color: var(--bs-success);
    }
    
    .exercise-timer {
        font-family: 'Courier New', monospace;
        font-weight: bold;
        color: var(--bs-info);
    }
    
    .feedback-section {
        animation: slideInUp 0.5s ease-out;
    }
    
    @keyframes slideInUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .achievement-notification {
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #333;
        border: none;
        box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
    }
`;
document.head.appendChild(learningStyle);
