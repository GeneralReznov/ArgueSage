/**
 * Multi-lingual Speech Service Integration
 * Provides speech-to-text, text-to-speech, and translation capabilities
 */

class SpeechManager {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.currentLanguage = 'en';
        this.supportedLanguages = {};
        this.audioContext = null;
        this.stream = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Load supported languages
            this.currentLanguage = 'en';
            await this.loadSupportedLanguages();
            
            // Get user's preferred language
            await this.loadUserLanguage();
            
            // Force English as current language if not already set
            if (!this.currentLanguage || this.currentLanguage === 'as' || !this.supportedLanguages[this.currentLanguage]) {
                this.currentLanguage = 'en';
            }
            
            // Setup UI components
            this.setupUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Speech Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Speech Manager:', error);
            // Force English as default on error
            this.currentLanguage = 'en';
            this.showNotification('Speech features unavailable', 'error');
        }
    }
    
    async loadSupportedLanguages() {
        try {
            const response = await fetch('/api/speech/languages');
            const data = await response.json();
            
            if (data.languages) {
                this.supportedLanguages = data.languages;
                this.populateLanguageSelectors();
            }
        } catch (error) {
            console.error('Failed to load supported languages:', error);
        }
    }
    
    async loadUserLanguage() {
        try {
            const response = await fetch('/api/user/language');
            const data = await response.json();
            
                if (data.language && data.language !== 'as' && this.supportedLanguages[data.language]) {
                this.currentLanguage = data.language;
            } else {
                // Default to English if no language preference is set
                this.currentLanguage = 'en';
                this.setLanguage('en');
            }
            this.updateLanguageSelectors();
        } catch (error) {
            console.error('Failed to load user language:', error);
            // Default to English on error
            this.currentLanguage = 'en';
            this.updateLanguageSelectors();
        }
    }
    
    populateLanguageSelectors() {
        const selectors = document.querySelectorAll('.language-selector');
        
        selectors.forEach(selector => {
            selector.innerHTML = '';
            
            // Add English first to ensure it's at the top
            if (this.supportedLanguages['en']) {
                const englishOption = document.createElement('option');
                englishOption.value = 'en';
                englishOption.textContent = this.supportedLanguages['en'].name;
                englishOption.selected = true;
                selector.appendChild(englishOption);
            }

            // Add other languages (excluding English since we already added it)
            Object.entries(this.supportedLanguages).forEach(([code, info]) => {
                if (code !== 'en') {
                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = info.name;
                    selector.appendChild(option);
                }
            });

            // Ensure the selector value is set to English
            selector.value = 'en';
        });
    }
    
    updateLanguageSelectors() {
        const selectors = document.querySelectorAll('.language-selector');
        selectors.forEach(selector => {
            selector.value = this.currentLanguage;
        });
        
        // Update navigation language display
        const currentLanguageSpan = document.getElementById('currentLanguage');
        if (currentLanguageSpan) {
            currentLanguageSpan.textContent = this.currentLanguage.toUpperCase();
        }
        
        // Update dropdown active state
        const dropdown = document.getElementById('languageDropdown');
        if (dropdown) {
            const options = dropdown.querySelectorAll('.language-option');
            options.forEach(option => {
                option.classList.remove('active');
                if (option.dataset.lang === this.currentLanguage) {
                    option.classList.add('active');
                }
            });
        }
    }
    
    setupUI() {
        // Enhance existing text areas with speech capabilities
        this.enhanceTextAreas();
        
        // Setup speech control panel interactions
        this.setupSpeechPanel();
    }
    
    setupSpeechPanel() {
        // Setup language dropdown in navigation
        this.populateNavigationLanguages();
        
        // Setup language selector in speech panel
        this.populateLanguageSelectors();
        
        // Track currently focused textarea for speech input
        this.currentActiveTextarea = null;
        
        document.addEventListener('focus', (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                this.currentActiveTextarea = e.target;
            }
        });
    }
    
    populateNavigationLanguages() {
        const dropdown = document.getElementById('languageDropdown');
        if (!dropdown || !this.supportedLanguages) return;
        
        dropdown.innerHTML = '';
        
        Object.entries(this.supportedLanguages).forEach(([code, info]) => {
            const item = document.createElement('li');
            item.innerHTML = `
                <a class="dropdown-item language-option ${code === this.currentLanguage ? 'active' : ''}" 
                   href="#" data-lang="${code}">
                    ${info.name}
                </a>
            `;
            dropdown.appendChild(item);
        });
        
        // Add click event listeners to language options only once
        if (!dropdown.hasAttribute('data-listeners-added')) {
            dropdown.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('.language-option');
                if (target) {
                    const newLanguage = target.dataset.lang;
                    this.changeLanguage(newLanguage);
                }
            });
            dropdown.setAttribute('data-listeners-added', 'true');
        }
    }
    
    toggleSpeechPanel() {
        const panel = document.getElementById('speechControlPanel');
        const toggle = document.getElementById('speechToggle');
        
        if (panel) {
            if (panel.style.display === 'none' || !panel.style.display) {
                this.showSpeechPanel();
            } else {
                this.hideSpeechPanel();
            }
        }
    }
    
    showSpeechPanel() {
        const panel = document.getElementById('speechControlPanel');
        const toggle = document.getElementById('speechToggle');
        
        if (panel) {
            panel.style.display = 'block';
            toggle?.classList.add('active');
            
            // Re-initialize feather icons
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    }
    
    hideSpeechPanel() {
        const panel = document.getElementById('speechControlPanel');
        const toggle = document.getElementById('speechToggle');
        
        if (panel) {
            panel.style.display = 'none';
            toggle?.classList.remove('active');
        }
    }
    
    createSpeechControls() {
        // This method is no longer needed as controls are in the base template
        // Keeping for backward compatibility
        return;
    }
    
    enhanceTextAreas() {
        const textAreas = document.querySelectorAll('textarea, input[type="text"]');
        
        textAreas.forEach(textarea => {
            if (textarea.classList.contains('speech-enhanced')) return;
            
            textarea.classList.add('speech-enhanced');
            
            // Create speech controls for this textarea
            const controls = document.createElement('div');
            controls.className = 'speech-textarea-controls mt-2';
            controls.innerHTML = `
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-sm btn-outline-primary speech-to-text-btn" 
                            data-target="${textarea.id || 'textarea-' + Date.now()}">
                        <i data-feather="mic"></i> Speech to Text
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-info text-to-speech-btn"
                            data-target="${textarea.id || 'textarea-' + Date.now()}">
                        <i data-feather="volume-2"></i> Read Aloud
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-success translate-text-btn"
                            data-target="${textarea.id || 'textarea-' + Date.now()}">
                        <i data-feather="globe"></i> Translate
                    </button>
                </div>
            `;
            
            // Insert controls after textarea
            textarea.parentNode.insertBefore(controls, textarea.nextSibling);
        });
        
        // Re-initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }
    
    setupEventListeners() {
        // Speech toggle button in navigation
        const speechToggle = document.getElementById('speechToggle');
        if (speechToggle) {
            speechToggle.addEventListener('click', () => this.toggleSpeechPanel());
        }
        
        // Language dropdown in navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('language-option')) {
                const langCode = e.target.dataset.lang;
                this.setLanguage(langCode);
            }
        });
        
        // Close speech panel
        const closeSpeechPanel = document.getElementById('closeSpeechPanel');
        if (closeSpeechPanel) {
            closeSpeechPanel.addEventListener('click', () => this.hideSpeechPanel());
        }
        
        // Recording controls in speech panel
        const startRecording = document.getElementById('startRecording');
        const stopRecording = document.getElementById('stopRecording');
        
        if (startRecording) {
            startRecording.addEventListener('click', () => this.startRecording());
        }
        if (stopRecording) {
            stopRecording.addEventListener('click', () => this.stopRecording());
        }
        
        // Insert transcription button
        const insertTranscription = document.getElementById('insertTranscription');
        if (insertTranscription) {
            insertTranscription.addEventListener('click', () => this.insertTranscriptionIntoActive());
        }
        
        // Language selection in speech panel
        const speechLanguage = document.getElementById('speechLanguage');
        if (speechLanguage) {
            speechLanguage.addEventListener('change', (e) => this.setLanguage(e.target.value));
        }
        
        // Enhanced textarea buttons - use event delegation to prevent duplicate listeners
        if (!document.body.hasAttribute('data-speech-listeners-attached')) {
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('speech-to-text-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetId = e.target.dataset.target;
                    this.startSpeechToTextForTextarea(targetId);
                } else if (e.target.classList.contains('text-to-speech-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetId = e.target.dataset.target;
                    this.playTextToSpeech(targetId);
                } else if (e.target.classList.contains('translate-text-btn')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetId = e.target.dataset.target;
                    this.translateText(targetId);
                }
            });
            document.body.setAttribute('data-speech-listeners-attached', 'true');
        }
    }
    
    async setLanguage(language) {
        try {
            const response = await fetch('/api/user/language', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ language: language })
            });
            
            if (response.ok) {
                this.currentLanguage = language;
                this.updateLanguageSelectors();
                this.showNotification(`Language set to ${this.supportedLanguages[language].name}`, 'success');
            }
        } catch (error) {
            console.error('Failed to set language:', error);
            this.showNotification('Failed to set language', 'error');
        }
    }
    
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            this.stream = stream;
            
            // Try to use WAV format if supported, otherwise use webm
            const options = { mimeType: 'audio/wav' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/ogg';
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        options.mimeType = 'audio/mp4';
                    }
                }
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            const startBtn = document.getElementById('startRecording');
            const stopBtn = document.getElementById('stopRecording');
            const recordingStatus = document.getElementById('recordingStatus');
            
            if (startBtn) startBtn.classList.add('d-none');
            if (stopBtn) stopBtn.classList.remove('d-none');
            if (recordingStatus) recordingStatus.style.display = 'block';
            
            this.showNotification('Recording started...', 'info');
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showNotification('Failed to start recording. Please check microphone permissions.', 'error');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Stop all tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Update UI
            const startBtn = document.getElementById('startRecording');
            const stopBtn = document.getElementById('stopRecording');
            const recordingStatus = document.getElementById('recordingStatus');
            
            if (startBtn) startBtn.classList.remove('d-none');
            if (stopBtn) stopBtn.classList.add('d-none');
            if (recordingStatus) recordingStatus.style.display = 'none';
            
            this.showNotification('Recording stopped. Processing...', 'info');
        }
    }
    
    async processRecording() {
        try {
            // Determine the correct MIME type based on what was recorded
            let mimeType = 'audio/wav';
            if (this.mediaRecorder && this.mediaRecorder.mimeType) {
                mimeType = this.mediaRecorder.mimeType;
            }
            
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            const formData = new FormData();
            
            // Set appropriate file extension based on MIME type
            let filename = 'recording.wav';
            if (mimeType.includes('webm')) {
                filename = 'recording.webm';
            } else if (mimeType.includes('ogg')) {
                filename = 'recording.ogg';
            } else if (mimeType.includes('mp4')) {
                filename = 'recording.mp4';
            }
            
            formData.append('audio', audioBlob, filename);
            formData.append('language', this.currentLanguage);
            
            const response = await fetch('/api/speech/speech-to-text', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayTranscription(result.text);
                this.showNotification('Speech recognized successfully!', 'success');
            } else {
                this.showNotification(result.error || 'Speech recognition failed', 'error');
            }
        } catch (error) {
            console.error('Failed to process recording:', error);
            this.showNotification('Failed to process recording', 'error');
        }
    }
    
    async startSpeechToText(targetId) {
        const target = document.getElementById(targetId) || document.querySelector(`[data-target="${targetId}"]`);
        if (!target) return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            this.currentTarget = target;
            
            // Try to use WAV format if supported, otherwise use webm
            const options = { mimeType: 'audio/wav' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/webm';
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/ogg';
                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        options.mimeType = 'audio/mp4';
                    }
                }
            }
            
            const mediaRecorder = new MediaRecorder(stream, options);
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                await this.processSpeechToText(audioBlob, target);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            this.showNotification('Listening... Click anywhere to stop', 'info');
            
            // Stop recording on next click
            const stopRecording = () => {
                mediaRecorder.stop();
                document.removeEventListener('click', stopRecording);
                this.showNotification('Processing speech...', 'info');
            };
            
            setTimeout(() => {
                document.addEventListener('click', stopRecording);
            }, 100);
            
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            this.showNotification('Failed to access microphone', 'error');
        }
    }
    
    async processSpeechToText(audioBlob, target) {
        try {
            const formData = new FormData();
            
            // Use appropriate filename based on blob type
            let filename = 'speech.webm';
            if (audioBlob.type.includes('wav')) {
                filename = 'speech.wav';
            } else if (audioBlob.type.includes('ogg')) {
                filename = 'speech.ogg';
            } else if (audioBlob.type.includes('mp4')) {
                filename = 'speech.mp4';
            }
            
            formData.append('audio', audioBlob, filename);
            formData.append('language', this.currentLanguage);
            
            const response = await fetch('/api/speech/speech-to-text', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                const currentText = target.value || '';
                const newText = currentText + (currentText ? ' ' : '') + result.text;
                target.value = newText;
                
                // Trigger input event for any listeners
                target.dispatchEvent(new Event('input', { bubbles: true }));
                
                this.showNotification('Speech converted to text!', 'success');
            } else {
                this.showNotification(result.error || 'Speech recognition failed', 'error');
            }
        } catch (error) {
            console.error('Failed to process speech:', error);
            this.showNotification('Failed to process speech', 'error');
        }
    }
    
    async playTextToSpeech(targetId) {
        const target = document.getElementById(targetId) || document.querySelector(`[data-target="${targetId}"]`);
        if (!target) return;
        
        const text = target.value;
        if (!text.trim()) {
            this.showNotification('No text to read', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/speech/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: this.currentLanguage
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Play audio
                const audio = new Audio(`data:audio/mp3;base64,${result.audio_data}`);
                audio.play();
                
                this.showNotification('Playing text as speech...', 'info');
            } else {
                this.showNotification(result.error || 'Text-to-speech failed', 'error');
            }
        } catch (error) {
            console.error('Failed to convert text to speech:', error);
            this.showNotification('Failed to convert text to speech', 'error');
        }
    }
    
    async translateText(targetId) {
        const target = document.getElementById(targetId) || document.querySelector(`[data-target="${targetId}"]`);
        if (!target) return;
        
        const text = target.value;
        if (!text.trim()) {
            this.showNotification('No text to translate', 'warning');
            return;
        }
        
        // Show translation modal
        this.showTranslationModal(text, target);
        
    }
    
    showTranslationModal(text, target) {
        // Remove existing translation modal if it exists
        const existingModal = document.getElementById('translation-modal');
        if (existingModal) {
            const bsExistingModal = bootstrap.Modal.getInstance(existingModal);
            if (bsExistingModal) {
                bsExistingModal.hide();
            }
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'translation-modal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Translate Text</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">From:</label>
                            <select id="translate-from" class="form-select language-selector">
                                <option value="auto">Auto-detect</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">To:</label>
                            <select id="translate-to-modal" class="form-select language-selector">
                                <option value="hi">Hindi</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Original Text:</label>
                            <div class="form-control" style="min-height: 100px;">${text}</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Translation:</label>
                            <div id="translation-result" class="form-control" style="min-height: 100px;">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Translating...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="use-translation">Use Translation</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Initialize modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Populate language options
        Object.entries(this.supportedLanguages).forEach(([code, info]) => {
            const option1 = document.createElement('option');
            option1.value = code;
            option1.textContent = info.name;
            document.getElementById('translate-from').appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = code;
            option2.textContent = info.name;
            document.getElementById('translate-to-modal').appendChild(option2);
        });
        
        // Set current language
        document.getElementById('translate-from').value = this.currentLanguage;
        
        // Auto-translate
        this.performTranslation(text, this.currentLanguage, 'hi');
        
        // Event listeners
        document.getElementById('use-translation').addEventListener('click', (e) => {
            e.preventDefault();
            const translation = document.getElementById('translation-result').textContent;
            if (translation && translation !== 'Translating...' && !translation.includes('spinner-border')) {
                target.value = translation;
                target.dispatchEvent(new Event('input', { bubbles: true }));
                bsModal.hide();
            }
        });
        
        // Add change listeners for language selectors
        document.getElementById('translate-from').addEventListener('change', (e) => {
            e.preventDefault();
            const toLang = document.getElementById('translate-to-modal').value;
            this.performTranslation(text, e.target.value, toLang);
        });
        
        document.getElementById('translate-to-modal').addEventListener('change', (e) => {
            e.preventDefault();
            const fromLang = document.getElementById('translate-from').value;
            this.performTranslation(text, fromLang, e.target.value);
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }
    
    async performTranslation(text, fromLang, toLang) {
        try {
            const response = await fetch('/api/speech/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    source_language: fromLang,
                    target_language: toLang
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('translation-result').textContent = result.translated_text;
            } else {
                document.getElementById('translation-result').textContent = result.error || 'Translation failed';
            }
        } catch (error) {
            console.error('Translation error:', error);
            document.getElementById('translation-result').textContent = 'Translation failed';
        }
    }
    
    displayTranscription(text) {
        // Display transcription in the speech panel
        const transcriptionResult = document.getElementById('transcriptionResult');
        const transcriptionText = document.getElementById('transcriptionText');
        
        if (transcriptionResult && transcriptionText) {
            transcriptionText.value = text;
            transcriptionResult.style.display = 'block';
        }
    }
    
    insertTranscriptionIntoActive() {
        const transcriptionText = document.getElementById('transcriptionText');
        if (!transcriptionText || !transcriptionText.value) {
            this.showNotification('No transcription available', 'warning');
            return;
        }
        
        const target = this.currentActiveTextarea || document.activeElement;
        if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) {
            const currentText = target.value || '';
            const newText = currentText + (currentText ? ' ' : '') + transcriptionText.value;
            target.value = newText;
            
            // Trigger input event for any listeners
            target.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Clear transcription
            transcriptionText.value = '';
            document.getElementById('transcriptionResult').style.display = 'none';
            
            this.showNotification('Transcription inserted successfully!', 'success');
        } else {
            this.showNotification('Please click on a text field first', 'warning');
        }
    }
    
    startSpeechToTextForTextarea(targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            this.currentActiveTextarea = target;
            this.showSpeechPanel();
            this.startRecording();
        }
    }
    
    updateLanguageSelectors() {
        // Update navigation language display
        const currentLanguageSpan = document.getElementById('currentLanguage');
        if (currentLanguageSpan && this.supportedLanguages[this.currentLanguage]) {
            const langCode = this.currentLanguage.toUpperCase();
            currentLanguageSpan.textContent = langCode;
        }
        
        // Update speech panel language selector
        const speechLanguage = document.getElementById('speechLanguage');
        if (speechLanguage) {
            speechLanguage.value = this.currentLanguage;
        }
        
        // Update navigation dropdown active state
        document.querySelectorAll('.language-option').forEach(option => {
            option.classList.remove('active');
            if (option.dataset.lang === this.currentLanguage) {
                option.classList.add('active');
            }
        });
        
        // Update all language selectors
        const selectors = document.querySelectorAll('.language-selector');
        selectors.forEach(selector => {
            selector.value = this.currentLanguage;
        });
    }
    
    showNotification(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible speech-notification`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 300px;
            animation: slideIn 0.3s ease-in-out;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize speech manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.speechManager = new SpeechManager();
});

// CSS for speech functionality
const speechStyles = `
    .speech-controls {
        background: var(--bs-dark);
        border-radius: 0.375rem;
        padding: 1rem;
        margin-bottom: 1rem;
        border: 1px solid var(--bs-border-color);
    }
    
    .speech-panel {
        color: var(--bs-light);
    }
    
    .speech-textarea-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .speech-enhanced {
        position: relative;
    }
    
    .speech-notification {
        animation: slideIn 0.3s ease-in-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .recording-indicator {
        color: #dc3545;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = speechStyles;
document.head.appendChild(styleSheet);

// Add changeLanguage method to SpeechManager
SpeechManager.prototype.changeLanguage = function(newLanguage) {
    if (this.supportedLanguages[newLanguage]) {
        this.currentLanguage = newLanguage;
        this.updateLanguageSelectors();
        
        // Save to server
        fetch('/api/user/language', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: newLanguage
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification(`Language changed to ${this.supportedLanguages[newLanguage].name}`, 'success');
            }
        })
        .catch(error => {
            console.error('Failed to save language preference:', error);
        });
    }
};

// Initialize SpeechManager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.speechManager = new SpeechManager();
});