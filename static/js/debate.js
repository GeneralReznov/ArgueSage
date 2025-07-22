// Debate Platform Core JavaScript
// Handles common functionality across the application

// Global variables
let notificationTimeout;
let currentModal;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCommon();
    initializeTooltips();
    initializeModals();
    setupGlobalEventListeners();
});

// Common initialization
function initializeCommon() {
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.remove();
                    }
                }, 300);
            }
        }, 5000);
    });
    
    // Initialize progress bars animation
    animateProgressBars();
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize modals
function initializeModals() {
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach(modalEl => {
        modalEl.addEventListener('shown.bs.modal', function () {
            const firstInput = modalEl.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        });
    });
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Handle form submissions with loading states
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.classList.contains('no-loading')) {
                setButtonLoading(submitBtn, true);
            }
        });
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Handle auto-save for textareas
    document.querySelectorAll('textarea[data-autosave]').forEach(textarea => {
        setupAutoSave(textarea);
    });
}

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter to submit forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'TEXTAREA') {
            const form = activeElement.closest('form');
            if (form) {
                form.requestSubmit();
            }
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape' && currentModal) {
        const modalInstance = bootstrap.Modal.getInstance(currentModal);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
}

// Button loading state management
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    // Clear existing notification
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // Remove existing notification
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast alert alert-${type} alert-dismissible position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i data-feather="${getNotificationIcon(type)}" class="me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Initialize Feather icons for the notification
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Auto-remove after duration
    if (duration > 0) {
        notificationTimeout = setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, duration);
    }
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'x-circle',
        'warning': 'alert-triangle',
        'info': 'info',
        'primary': 'star'
    };
    return icons[type] || 'info';
}

// Animate progress bars
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach(bar => {
        const targetWidth = bar.style.width || bar.getAttribute('data-width') || '0%';
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 100);
    });
}

// Setup auto-save functionality
function setupAutoSave(textarea) {
    const saveKey = `autosave_${textarea.id || textarea.name || Date.now()}`;
    let saveTimeout;
    
    // Load saved content
    const savedContent = localStorage.getItem(saveKey);
    if (savedContent && !textarea.value) {
        textarea.value = savedContent;
    }
    
    // Save on input
    textarea.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem(saveKey, textarea.value);
            showAutoSaveIndicator(textarea);
        }, 1000);
    });
    
    // Clear saved content on form submit
    const form = textarea.closest('form');
    if (form) {
        form.addEventListener('submit', function() {
            localStorage.removeItem(saveKey);
        });
    }
}

// Show auto-save indicator
function showAutoSaveIndicator(element) {
    const indicator = document.createElement('small');
    indicator.className = 'text-muted ms-2 auto-save-indicator';
    indicator.innerHTML = '<i data-feather="save" class="me-1"></i>Auto-saved';
    indicator.style.opacity = '0';
    
    // Remove existing indicator
    const existingIndicator = element.parentNode.querySelector('.auto-save-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Add new indicator
    element.parentNode.appendChild(indicator);
    
    // Animate in
    setTimeout(() => {
        indicator.style.transition = 'opacity 0.3s';
        indicator.style.opacity = '1';
    }, 10);
    
    // Initialize Feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Remove after 2 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 300);
        }
    }, 2000);
}

// Word count functionality
function setupWordCount(textarea, targetElement) {
    function updateWordCount() {
        const text = textarea.value.trim();
        const wordCount = text ? text.split(/\s+/).length : 0;
        const charCount = text.length;
        
        targetElement.innerHTML = `${wordCount} words, ${charCount} characters`;
        
        // Color coding based on length
        if (wordCount > 600) {
            targetElement.className = 'text-danger';
        } else if (wordCount > 450) {
            targetElement.className = 'text-warning';
        } else if (wordCount > 300) {
            targetElement.className = 'text-success';
        } else {
            targetElement.className = 'text-muted';
        }
    }
    
    textarea.addEventListener('input', updateWordCount);
    updateWordCount(); // Initial count
}

// Copy to clipboard functionality
function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(successMessage, 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyToClipboard(text, successMessage);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification(successMessage, 'success');
    } catch (err) {
        console.error('Failed to copy: ', err);
        showNotification('Copy failed. Please copy manually.', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Format time duration
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Smooth scroll to element
function smoothScrollTo(element) {
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Debounce function for performance
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Debate-specific functions
function submitSpeech(event) {
    event.preventDefault();
    
    const form = document.getElementById('speechForm');
    const formData = new FormData(form);
    const submitBtn = document.getElementById('speechSubmitBtn');
    const speechText = formData.get('speech');
    
    // Validation
    if (!speechText || speechText.trim().length < 50) {
        showNotification('Please provide a more detailed speech (at least 50 characters)', 'warning');
        return;
    }
    
    // Set loading state
    setButtonLoading(submitBtn, true);
    
    // Submit to server
    fetch('/debate/speech', {
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
            showNotification('Speech submitted successfully!', 'success');
            
            // Add user's speech to debate flow first
            addUserSpeechToFlow(speechText);
            
            // Then update debate flow with AI response
            updateDebateFlow(data.feedback, data.ai_response);
            
            // Handle debate status
            if (data.debate_status === 'completed') {
                showNotification('Debate completed! Check your final evaluation.', 'info');
                setTimeout(() => {
                    window.location.href = '/progress';
                }, 3000);
            } else {
                // Clear form for next speech
                form.reset();
            }
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
    })
    .catch(error => {
        console.error('Error submitting speech:', error);
        showNotification('Failed to submit speech. Please try again.', 'error');
    })
    .finally(() => {
        setButtonLoading(submitBtn, false);
        setTimeout(() => {
            if (submitBtn && submitBtn.innerHTML.includes('Loading')) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-feather="send" class="me-2"></i>Deliver Speech';
                if (typeof feather !== 'undefined') {
                            feather.replace();
                        }
                    }
                }, 100);
    });
}

function offerPOI() {
    const poiText = prompt('Enter your Point of Information:');
    if (!poiText) return;
    
    fetch('/debate/poi', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `poi=${encodeURIComponent(poiText)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const status = data.accepted ? 'accepted' : 'declined';
            showNotification(`POI ${status}: ${data.ai_response}`, 'info');
            
            // Update POI section instead of debate flow
            updatePOISection(poiText, data.ai_response, data.accepted);
        } else {
            showNotification(data.error || 'Failed to process POI', 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting POI:', error);
        showNotification('Failed to submit POI. Please try again.', 'error');
    });
}

function addUserSpeechToFlow(speechText) {
    // Add user's speech to the debate flow immediately
    const debateFlow = document.getElementById('debateFlow');
    if (debateFlow && speechText) {
        const userSpeechBubble = document.createElement('div');
        userSpeechBubble.className = 'speech-bubble user';
        const userSpeechHtml = speechText.replace(/\n/g, '<br>');
        const showExpandButton = speechText.length > 500;
        
        userSpeechBubble.innerHTML = `
            <div class="card bg-primary text-white">
                <div class="card-body">
                    <h6 class="card-title">
                        You
                        <small class="opacity-75">(Constructive)</small>
                    </h6>
                    <div class="card-text">
                        <div class="speech-content" style="max-height: 300px; overflow-y: auto;">
                            ${userSpeechHtml}
                        </div>
                        ${showExpandButton ? `
                        <button class="btn btn-sm btn-outline-light mt-2" onclick="toggleSpeechExpansion(this)">
                            <i data-feather="maximize" class="me-1"></i>
                            Show Full Speech
                        </button>
                        ` : ''}
                    </div>
                    <small class="opacity-75">${new Date().toLocaleString()}</small>
                </div>
            </div>
        `;
        debateFlow.appendChild(userSpeechBubble);
        
        // Initialize Feather icons for the new content
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Scroll to bottom
        debateFlow.scrollTop = debateFlow.scrollHeight;
    }
}

function updatePOISection(userPOI, aiResponse, accepted) {
    // Find existing POI section using a more compatible approach
    let poiSection = null;
    const allCards = document.querySelectorAll('.card');
    
    for (let card of allCards) {
        const headerText = card.querySelector('.card-header h6');
        if (headerText && headerText.textContent.includes('Points of Information')) {
            poiSection = card;
            break;
        }
    }
    
    if (!poiSection) {
        // Create POI section if it doesn't exist
        const sidebar = document.querySelector('.col-lg-4');
        if (sidebar) {
            poiSection = document.createElement('div');
            poiSection.className = 'card mb-4';
            poiSection.innerHTML = `
                <div class="card-header">
                    <h6 class="mb-0">
                        <i data-feather="help-circle" class="me-2"></i>
                        Points of Information
                    </h6>
                </div>
                <div class="card-body" id="poiContainer">
                </div>
            `;
            // Insert before the debate controls (last card in sidebar)
            const debateControls = sidebar.querySelector('.card:last-child');
            if (debateControls) {
                sidebar.insertBefore(poiSection, debateControls);
            } else {
                sidebar.appendChild(poiSection);
            }
            
            // Initialize Feather icons for the new section
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    }
    
    const poiContainer = poiSection ? poiSection.querySelector('.card-body') : null;
    if (poiContainer) {
        // Create new POI entry
        const poiEntry = document.createElement('div');
        poiEntry.className = 'mb-3 poi-entry';
        const decision = accepted ? 'ACCEPT' : 'DECLINE';
        const statusClass = accepted ? 'text-success' : 'text-warning';
        const timestamp = new Date().toLocaleTimeString();
        
        poiEntry.innerHTML = `
            <small class="text-muted">Your POI (${timestamp}):</small>
            <div class="bg-light p-2 rounded mb-1" style="color:black">${userPOI}</div>
            <small class="text-muted">
                AI ${decision}: 
                <span class="${statusClass}">
                    ${aiResponse}
                </span>
            </small>
        `;
        
        // Add with a slight animation
        poiEntry.style.opacity = '0';
        poiEntry.style.transform = 'translateY(-10px)';
        poiContainer.appendChild(poiEntry);
        
        // Animate entry
        setTimeout(() => {
            poiEntry.style.transition = 'all 0.3s ease';
            poiEntry.style.opacity = '1';
            poiEntry.style.transform = 'translateY(0)';
        }, 50);
        
        // Scroll POI section into view smoothly
        setTimeout(() => {
            poiSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

function updateDebateFlow(feedback, aiResponse) {
    // Instead of reloading, dynamically update the debate flow
    const debateFlow = document.getElementById('debateFlow');
    if (debateFlow && aiResponse) {
        // Create new speech bubble for AI response
        const aiSpeechBubble = document.createElement('div');
        aiSpeechBubble.className = 'speech-bubble ai';
        const aiResponseHtml = aiResponse.replace(/\n/g, '<br>');
        const showExpandButton = aiResponse.length > 500;
        
        aiSpeechBubble.innerHTML = `
            <div class="card bg-secondary">
                <div class="card-body">
                    <h6 class="card-title">
                        AI Opponent
                        <small class="opacity-75">(Constructive)</small>
                    </h6>
                    <div class="card-text">
                        <div class="speech-content" style="max-height: 300px; overflow-y: auto;">
                            ${aiResponseHtml}
                        </div>
                        ${showExpandButton ? `
                        <button class="btn btn-sm btn-outline-light mt-2" onclick="toggleSpeechExpansion(this)">
                            <i data-feather="maximize" class="me-1"></i>
                            Show Full Speech
                        </button>
                        ` : ''}
                    </div>
                    <small class="opacity-75">${new Date().toLocaleString()}</small>
                </div>
            </div>
        `;
        debateFlow.appendChild(aiSpeechBubble);
        
        // Initialize Feather icons for the new content
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Scroll to bottom
        debateFlow.scrollTop = debateFlow.scrollHeight;
    } else {
        // Fallback to reload if dynamic update fails
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

function toggleSpeechExpansion(button) {
    const speechContent = button.parentElement.querySelector('.speech-content');
    const icon = button.querySelector('i');
    
    // Check if currently expanded by checking if maxHeight is 'none' or if the button text contains 'Show Less'
    const isExpanded = speechContent.style.maxHeight === 'none' || button.textContent.includes('Show Less');
    
    if (isExpanded) {
        speechContent.style.maxHeight = '300px';
        button.innerHTML = '<i data-feather="maximize" class="me-1"></i>Show Full Speech';
        feather.replace();
    } else {
        speechContent.style.maxHeight = 'none';
        button.innerHTML = '<i data-feather="minimize-2" class="me-1"></i>Show Less';
        feather.replace();
    }
}

function startDebate(event) {
    event.preventDefault();
    const form = document.getElementById('debateSetupForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    setButtonLoading(submitBtn, true);
    
    fetch('/debate/start', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Debate started successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/debate';
            }, 1000);
        } else {
            throw new Error(data.error || 'Failed to start debate');
        }
    })
    .catch(error => {
        console.error('Error starting debate:', error);
        showNotification('Failed to start debate. Please try again.', 'error');
    })
    .finally(() => {
        setButtonLoading(submitBtn, false);
    });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-toast {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 0.375rem;
    }
`;
document.head.appendChild(style);

// Export functions for use in other scripts
window.debateApp = {
    showNotification,
    setButtonLoading,
    copyToClipboard,
    formatDuration,
    smoothScrollTo,
    setupWordCount,
    debounce,
    throttle
};
