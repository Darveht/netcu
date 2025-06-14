class VideoHubPlayer {
    constructor() {
        this.videoLibrary = this.loadVideoLibrary();
        this.currentVideo = null;
        this.currentSection = 'feed';
        this.dualAudioEnabled = false;
        this.currentLanguage = 'spanish';
        this.backgroundPlayEnabled = false;
        this.subtitles = [];
        this.currentSubtitle = null;
        this.subtitlesEnabled = false;
        this.controlsTimeout = null;
        this.uploadProgress = 0;

        // Audio contexts for dual language
        this.audioContext = null;
        this.spanishAudio = null;
        this.englishAudio = null;
        this.currentAudioSource = null;

        this.initializeElements();
        this.bindEvents();
        this.renderContent();
        this.checkBackgroundPlay();

        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudioContext();
            }
        }, { once: true });
    }

    initializeElements() {
        // Navigation
        this.feedNavBtn = document.getElementById('feedNavBtn');
        this.tvNavBtn = document.getElementById('tvNavBtn');
        this.uploadNavBtn = document.getElementById('uploadNavBtn');

        // Sidebar
        this.feedSidebarBtn = document.getElementById('feedSidebarBtn');
        this.tvSidebarBtn = document.getElementById('tvSidebarBtn');
        this.uploadSidebarBtn = document.getElementById('uploadSidebarBtn');

        // Sections
        this.feedSection = document.getElementById('feedSection');
        this.tvSection = document.getElementById('tvSection');
        this.uploadSection = document.getElementById('uploadSection');
        this.playerSection = document.getElementById('playerSection');

        // Upload elements
        this.uploadForm = document.getElementById('uploadForm');
        this.videoFile = document.getElementById('videoFile');
        this.videoTitle = document.getElementById('videoTitle');
        this.videoDescription = document.getElementById('videoDescription');
        this.subtitleFile = document.getElementById('subtitleFile');
        this.videoFormat = document.getElementById('videoFormat');
        this.cancelUpload = document.getElementById('cancelUpload');
        this.uploadBtn = document.getElementById('uploadBtn');

        // Dual audio
        this.dualAudioToggle = document.getElementById('dualAudioToggle');
        this.dualAudioInputs = document.getElementById('dualAudioInputs');
        this.audioSpanish = document.getElementById('audioSpanish');
        this.audioEnglish = document.getElementById('audioEnglish');

        // Loading
        this.uploadLoading = document.getElementById('uploadLoading');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');

        // Content containers
        this.videoPosts = document.getElementById('videoPosts');
        this.tvGrid = document.getElementById('tvGrid');

        // Player elements
        this.videoPlayer = document.getElementById('videoPlayer');
        this.controlsOverlay = document.getElementById('controlsOverlay');
        this.videoTitleDisplay = document.getElementById('videoTitleDisplay');
        this.subtitleText = document.getElementById('subtitleText');
        this.languageSwitch = document.getElementById('languageSwitch');
        this.backgroundPlayToggle = document.getElementById('backgroundPlayToggle');

        // Controls
        this.backBtn = document.getElementById('backBtn');
        this.centerPlayBtn = document.getElementById('centerPlayBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.subtitleBtn = document.getElementById('subtitleBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFilled = document.getElementById('progressFilled');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
    }

    bindEvents() {
        // Navigation events
        this.feedNavBtn.addEventListener('click', () => this.showSection('feed'));
        this.tvNavBtn.addEventListener('click', () => this.showSection('tv'));
        this.uploadNavBtn.addEventListener('click', () => this.showSection('upload'));

        this.feedSidebarBtn.addEventListener('click', () => this.showSection('feed'));
        this.tvSidebarBtn.addEventListener('click', () => this.showSection('tv'));
        this.uploadSidebarBtn.addEventListener('click', () => this.showSection('upload'));

        // Upload events
        this.uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        this.cancelUpload.addEventListener('click', () => this.showSection('feed'));
        this.dualAudioToggle.addEventListener('click', () => this.toggleDualAudio());

        // Player events
        this.backBtn.addEventListener('click', () => this.closePlayer());
        this.centerPlayBtn.addEventListener('click', () => this.togglePlayPause());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.subtitleBtn.addEventListener('click', () => this.toggleSubtitles());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.backgroundPlayToggle.addEventListener('click', () => this.toggleBackgroundPlay());

        // Video events
        this.videoPlayer.addEventListener('loadedmetadata', () => this.onVideoLoaded());
        this.videoPlayer.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.videoPlayer.addEventListener('ended', () => this.onVideoEnded());
        this.videoPlayer.addEventListener('click', () => this.togglePlayPause());

        // Progress bar
        this.progressBar.addEventListener('click', (e) => this.seekTo(e));

        // Language switch
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLanguage(e.target.dataset.lang));
        });

        // Controls visibility
        this.playerSection.addEventListener('mousemove', () => this.showControls());
        this.playerSection.addEventListener('mouseleave', () => this.hideControls());

        // TV filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterTVContent(e.target.dataset.filter));
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Background play detection
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    showSection(section) {
        // Update active states
        document.querySelectorAll('.nav-item, .sidebar-item').forEach(item => {
            item.classList.remove('active');
        });

        // Hide all sections
        this.feedSection.style.display = 'none';
        this.tvSection.style.display = 'none';
        this.uploadSection.style.display = 'none';

        // Show selected section
        switch(section) {
            case 'feed':
                this.feedSection.style.display = 'block';
                this.feedNavBtn.classList.add('active');
                this.feedSidebarBtn.classList.add('active');
                this.renderFeed();
                break;
            case 'tv':
                this.tvSection.style.display = 'block';
                this.tvNavBtn.classList.add('active');
                this.tvSidebarBtn.classList.add('active');
                this.renderTV();
                break;
            case 'upload':
                this.uploadSection.style.display = 'block';
                this.uploadNavBtn.classList.add('active');
                this.uploadSidebarBtn.classList.add('active');
                break;
        }

        this.currentSection = section;
    }

    toggleDualAudio() {
        this.dualAudioEnabled = !this.dualAudioEnabled;
        this.dualAudioToggle.classList.toggle('active', this.dualAudioEnabled);
        this.dualAudioInputs.classList.toggle('active', this.dualAudioEnabled);
    }

    async handleUpload(e) {
        e.preventDefault();

        const videoFile = this.videoFile.files[0];
        const title = this.videoTitle.value.trim();
        const description = this.videoDescription.value.trim();
        const format = this.videoFormat.value;

        if (!videoFile || !title) {
            alert('Por favor completa los campos obligatorios');
            return;
        }

        // Show loading animation
        this.showUploadLoading();

        try {
            const videoData = {
                id: this.generateId(),
                title: title,
                description: description,
                format: format,
                videoUrl: URL.createObjectURL(videoFile),
                videoFile: videoFile,
                createdAt: new Date().toISOString(),
                likes: 0,
                views: 0,
                duration: 0
            };

            // Handle subtitles
            if (this.subtitleFile.files[0]) {
                videoData.subtitles = await this.subtitleFile.files[0].text();
            }

            // Handle dual audio
            if (this.dualAudioEnabled) {
                if (this.audioSpanish.files[0]) {
                    videoData.audioSpanish = URL.createObjectURL(this.audioSpanish.files[0]);
                }
                if (this.audioEnglish.files[0]) {
                    videoData.audioEnglish = URL.createObjectURL(this.audioEnglish.files[0]);
                }
                videoData.hasDualAudio = true;
            }

            // Simulate upload progress
            await this.simulateUploadProgress();

            // Save to library
            this.videoLibrary.push(videoData);
            this.saveVideoLibrary();

            // Show success and redirect
            this.hideUploadLoading();
            this.showUploadSuccess();

            setTimeout(() => {
                this.resetUploadForm();
                this.showSection('feed');
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            this.hideUploadLoading();
            alert('Error al subir el video. Inténtalo de nuevo.');
        }
    }

    async simulateUploadProgress() {
        const steps = [
            { progress: 10, text: 'Verificando archivo...', subtext: 'Validando formato de video' },
            { progress: 25, text: 'Procesando video...', subtext: 'Optimizando calidad' },
            { progress: 50, text: 'Procesando audio...', subtext: 'Configurando idiomas' },
            { progress: 75, text: 'Generando miniatura...', subtext: 'Creando vista previa' },
            { progress: 90, text: 'Guardando...', subtext: 'Finalizando proceso' },
            { progress: 100, text: '¡Completado!', subtext: 'Video subido exitosamente' }
        ];

        for (let step of steps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            this.updateUploadProgress(step.progress, step.text, step.subtext);
        }
    }

    updateUploadProgress(progress, text, subtext) {
        this.uploadProgress.style.width = `${progress}%`;
        this.loadingText.textContent = text;
        this.loadingSubtext.textContent = subtext;
    }

    showUploadLoading() {
        this.uploadForm.style.display = 'none';
        this.uploadLoading.style.display = 'block';
    }

    hideUploadLoading() {
        this.uploadLoading.style.display = 'none';
        this.uploadForm.style.display = 'block';
    }

    showUploadSuccess() {
        this.uploadForm.classList.add('upload-success');
        this.loadingText.textContent = '¡Video subido exitosamente!';
        this.loadingSubtext.textContent = 'Redirigiendo al feed...';
    }

    resetUploadForm() {
        this.uploadForm.reset();
        this.uploadForm.classList.remove('upload-success');
        this.dualAudioEnabled = false;
        this.dualAudioToggle.classList.remove('active');
        this.dualAudioInputs.classList.remove('active');
        this.updateUploadProgress(0, 'Subiendo video...', 'Esto puede tomar unos minutos');
    }

    renderContent() {
        this.renderFeed();
        this.renderTV();
    }

    renderFeed() {
        const feedVideos = this.videoLibrary.filter(video => video.format === 'feed');

        if (feedVideos.length === 0) {
            this.videoPosts.innerHTML = `
                <div class="empty-feed">
                    <h3>¡Bienvenido a VideoHub!</h3>
                    <p>No hay videos aún. ¡Sube tu primer video para comenzar!</p>
                    <button class="facebook-button" onclick="document.getElementById('uploadNavBtn').click()">
                        <i class="fas fa-plus"></i>
                        Subir Video
                    </button>
                </div>
            `;
            return;
        }

        this.videoPosts.innerHTML = feedVideos.map(video => `
            <div class="video-post" data-video-id="${video.id}">
                <div class="post-header">
                    <div class="post-avatar">U</div>
                    <div class="post-info">
                        <h4>Usuario</h4>
                        <span>${this.formatDate(video.createdAt)}</span>
                    </div>
                </div>

                <div class="post-video-container" onclick="this.playVideo('${video.id}')">
                    <video class="post-video" src="${video.videoUrl}" preload="metadata"></video>
                    <div class="feed-video-overlay">
                        <div class="feed-play-btn">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    ${video.hasDualAudio ? '<div class="dual-audio-badge"><i class="fas fa-language"></i></div>' : ''}
                </div>

                <div class="post-content">
                    <h3>${video.title}</h3>
                    <p>${video.description}</p>
                </div>

                <div class="post-actions">
                    <div class="action-group">
                        <button class="action-btn" onclick="this.likeVideo('${video.id}')">
                            <i class="far fa-heart"></i>
                            ${video.likes || 0}
                        </button>
                        <button class="action-btn">
                            <i class="far fa-comment"></i>
                            Comentar
                        </button>
                        <button class="action-btn">
                            <i class="fas fa-share"></i>
                            Compartir
                        </button>
                    </div>
                    <button class="action-btn" onclick="this.deleteVideo('${video.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.post-video-container').forEach((container, index) => {
            container.addEventListener('click', () => {
                const videoId = feedVideos[index].id;
                this.playVideo(videoId);
            });
        });
    }

    renderTV() {
        const tvVideos = this.videoLibrary.filter(video => video.format === 'tv');

        if (tvVideos.length === 0) {
            this.tvGrid.innerHTML = `
                <div class="empty-feed">
                    <h3>Explora contenido increíble</h3>
                    <p>Descubre videos de la comunidad en formato TV</p>
                    <button class="facebook-button" onclick="document.getElementById('uploadNavBtn').click()">
                        <i class="fas fa-plus"></i>
                        Subir Video TV
                    </button>
                </div>
            `;
            return;
        }

        this.tvGrid.innerHTML = tvVideos.map(video => `
            <div class="tv-video-card" data-video-id="${video.id}">
                <div class="tv-video-thumbnail">
                    <video src="${video.videoUrl}" preload="metadata"></video>
                    <div class="tv-video-overlay">
                        <div class="tv-play-btn">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                    ${video.hasDualAudio ? '<div class="dual-audio-badge"><i class="fas fa-language"></i></div>' : ''}
                </div>
                <div class="tv-video-info">
                    <h3 class="tv-video-title">${video.title}</h3>
                    <div class="tv-video-meta">
                        <span>${video.views || 0} visualizaciones</span>
                        <span>${this.formatDate(video.createdAt)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.tv-video-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                const videoId = tvVideos[index].id;
                this.playVideo(videoId);
            });
        });
    }

    playVideo(videoId) {
        const video = this.videoLibrary.find(v => v.id === videoId);
        if (!video) return;

        this.currentVideo = video;

        // Show player
        this.playerSection.style.display = 'block';
        this.videoPlayer.src = video.videoUrl;
        this.videoTitleDisplay.textContent = video.title;

        // Setup dual audio if available
        if (video.hasDualAudio) {
            this.setupDualAudio(video);
            this.languageSwitch.style.display = 'flex';
        } else {
            this.languageSwitch.style.display = 'none';
        }

        // Setup subtitles
        if (video.subtitles) {
            this.parseSubtitles(video.subtitles);
            this.subtitlesEnabled = true;
            this.subtitleBtn.classList.add('active');
        } else {
            this.subtitles = [];
            this.subtitlesEnabled = false;
            this.subtitleBtn.classList.remove('active');
        }

        // Increment view count
        video.views = (video.views || 0) + 1;
        this.saveVideoLibrary();

        this.showControls();
    }

    async setupDualAudio(video) {
        if (!this.audioContext) {
            this.initAudioContext();
        }

        try {
            // Load audio files
            if (video.audioSpanish) {
                const response = await fetch(video.audioSpanish);
                const arrayBuffer = await response.arrayBuffer();
                this.spanishAudio = await this.audioContext.decodeAudioData(arrayBuffer);
            }

            if (video.audioEnglish) {
                const response = await fetch(video.audioEnglish);
                const arrayBuffer = await response.arrayBuffer();
                this.englishAudio = await this.audioContext.decodeAudioData(arrayBuffer);
            }

            this.setupAudioSync();
        } catch (error) {
            console.error('Error setting up dual audio:', error);
        }
    }

    initAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    setupAudioSync() {
        // Mute original video audio when dual audio is active
        this.videoPlayer.muted = true;

        // Play the current language audio
        this.playCurrentLanguageAudio();
    }

    playCurrentLanguageAudio() {
        if (this.currentAudioSource) {
            this.currentAudioSource.stop();
        }

        const audioBuffer = this.currentLanguage === 'spanish' ? this.spanishAudio : this.englishAudio;

        if (audioBuffer && this.audioContext) {
            this.currentAudioSource = this.audioContext.createBufferSource();
            this.currentAudioSource.buffer = audioBuffer;
            this.currentAudioSource.connect(this.audioContext.destination);

            // Sync with video time
            const startTime = this.videoPlayer.currentTime;
            this.currentAudioSource.start(0, startTime);
        }
    }

    switchLanguage(language) {
        this.currentLanguage = language;

        // Update button states
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === language);
        });

        // Switch audio if dual audio is available
        if (this.currentVideo && this.currentVideo.hasDualAudio) {
            this.playCurrentLanguageAudio();
        }
    }

    toggleBackgroundPlay() {
        this.backgroundPlayEnabled = !this.backgroundPlayEnabled;
        this.backgroundPlayToggle.classList.toggle('active', this.backgroundPlayEnabled);

        if (this.backgroundPlayEnabled) {
            this.backgroundPlayToggle.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            this.backgroundPlayToggle.innerHTML = '<i class="fas fa-play"></i>';
        }

        localStorage.setItem('backgroundPlayEnabled', this.backgroundPlayEnabled);
    }

    handleVisibilityChange() {
        if (this.backgroundPlayEnabled && this.currentVideo) {
            if (document.hidden) {
                // Page is hidden, continue playing audio only
                this.videoPlayer.pause();
                if (this.currentAudioSource) {
                    // Audio continues playing
                }
            } else {
                // Page is visible, resume video
                this.videoPlayer.play();
                this.playCurrentLanguageAudio();
            }
        }
    }

    checkBackgroundPlay() {
        const saved = localStorage.getItem('backgroundPlayEnabled');
        if (saved === 'true') {
            this.backgroundPlayEnabled = true;
            this.backgroundPlayToggle.classList.add('active');
            this.backgroundPlayToggle.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }

    closePlayer() {
        this.playerSection.style.display = 'none';
        this.videoPlayer.pause();
        this.videoPlayer.src = '';

        if (this.currentAudioSource) {
            this.currentAudioSource.stop();
            this.currentAudioSource = null;
        }

        this.currentVideo = null;
        this.backgroundPlayToggle.style.display = 'none';
    }

    togglePlayPause() {
        if (this.videoPlayer.paused) {
            this.videoPlayer.play();
            this.playCurrentLanguageAudio();
            this.updatePlayPauseIcons(false);
            this.backgroundPlayToggle.style.display = 'flex';
        } else {
            this.videoPlayer.pause();
            if (this.currentAudioSource) {
                this.currentAudioSource.stop();
            }
            this.updatePlayPauseIcons(true);
        }
    }

    updatePlayPauseIcons(paused) {
        const playIcons = document.querySelectorAll('.play-icon');
        const pauseIcons = document.querySelectorAll('.pause-icon');

        playIcons.forEach(icon => {
            icon.style.display = paused ? 'block' : 'none';
        });

        pauseIcons.forEach(icon => {
            icon.style.display = paused ? 'none' : 'block';
        });
    }

    onVideoLoaded() {
        this.durationEl.textContent = this.formatTime(this.videoPlayer.duration);
    }

    onTimeUpdate() {
        const progress = (this.videoPlayer.currentTime / this.videoPlayer.duration) * 100;
        this.progressFilled.style.width = `${progress}%`;
        this.currentTimeEl.textContent = this.formatTime(this.videoPlayer.currentTime);
        this.updateSubtitles();
    }

    onVideoEnded() {
        this.updatePlayPauseIcons(true);
        this.backgroundPlayToggle.style.display = 'none';
        if (this.currentAudioSource) {
            this.currentAudioSource.stop();
        }
    }

    updateSubtitles() {
        if (!this.subtitlesEnabled || this.subtitles.length === 0) {
            this.subtitleText.style.display = 'none';
            return;
        }

        const currentTime = this.videoPlayer.currentTime;
        const activeSubtitle = this.subtitles.find(subtitle => 
            currentTime >= subtitle.start && currentTime <= subtitle.end
        );

        if (activeSubtitle && activeSubtitle !== this.currentSubtitle) {
            this.subtitleText.textContent = activeSubtitle.text;
            this.subtitleText.style.display = 'block';
            this.currentSubtitle = activeSubtitle;
        } else if (!activeSubtitle) {
            this.subtitleText.style.display = 'none';
            this.currentSubtitle = null;
        }
    }

    async parseSubtitles(text) {
        this.subtitles = [];
        const lines = text.split('\n').filter(line => line.trim());

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // SRT format: timestamp line
            if (line.includes('-->')) {
                const [start, end] = line.split('-->').map(t => this.parseTime(t.trim()));
                const textLines = [];

                // Get subtitle text
                for (let j = i + 1; j < lines.length && lines[j].trim() && !lines[j].includes('-->'); j++) {
                    textLines.push(lines[j].trim());
                }

                if (textLines.length > 0) {
                    this.subtitles.push({
                        start: start,
                        end: end,
                        text: textLines.join(' ')
                    });
                }
            }
        }

        this.subtitles.sort((a, b) => a.start - b.start);
    }

    parseTime(timeStr) {
        const parts = timeStr.replace(',', '.').split(':');
        if (parts.length === 3) {
            const hours = parseInt(parts[0]);
            const minutes = parseInt(parts[1]);
            const seconds = parseFloat(parts[2]);
            return hours * 3600 + minutes * 60 + seconds;
        }
        return 0;
    }

    toggleSubtitles() {
        this.subtitlesEnabled = !this.subtitlesEnabled;
        this.subtitleBtn.classList.toggle('active', this.subtitlesEnabled);

        if (!this.subtitlesEnabled) {
            this.subtitleText.style.display = 'none';
        }
    }

    toggleMute() {
        if (this.currentVideo && this.currentVideo.hasDualAudio) {
            // For dual audio, just toggle the audio source volume
            return;
        }

        this.videoPlayer.muted = !this.videoPlayer.muted;
        this.volumeBtn.innerHTML = this.videoPlayer.muted ? 
            '<i class="fas fa-volume-mute"></i>' : 
            '<i class="fas fa-volume-up"></i>';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.playerSection.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    seekTo(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progress = clickX / rect.width;
        this.videoPlayer.currentTime = progress * this.videoPlayer.duration;

        // Sync audio if dual audio is active
        if (this.currentVideo && this.currentVideo.hasDualAudio) {
            this.playCurrentLanguageAudio();
        }
    }

    showControls() {
        this.controlsOverlay.classList.add('visible');
        clearTimeout(this.controlsTimeout);
        this.controlsTimeout = setTimeout(() => {
            if (!this.videoPlayer.paused) {
                this.hideControls();
            }
        }, 3000);
    }

    hideControls() {
        this.controlsOverlay.classList.remove('visible');
    }

    handleKeyboard(e) {
        if (this.playerSection.style.display === 'none') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.videoPlayer.currentTime -= 10;
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.videoPlayer.currentTime += 10;
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleSubtitles();
                break;
            case 'Escape':
                this.closePlayer();
                break;
        }
    }

    filterTVContent(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Apply filter logic here
        this.renderTV();
    }

    deleteVideo(videoId) {
        if (confirm('¿Estás seguro de que quieres eliminar este video?')) {
            this.videoLibrary = this.videoLibrary.filter(v => v.id !== videoId);
            this.saveVideoLibrary();
            this.renderContent();
        }
    }

    likeVideo(videoId) {
        const video = this.videoLibrary.find(v => v.id === videoId);
        if (video) {
            video.likes = (video.likes || 0) + 1;
            this.saveVideoLibrary();
            this.renderContent();
        }
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Hace unos minutos';
        if (hours < 24) return `Hace ${hours}h`;
        if (hours < 48) return 'Ayer';
        return date.toLocaleDateString('es-ES');
    }

    // Storage functions
    loadVideoLibrary() {
        try {
            const stored = localStorage.getItem('videoHub_library');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading video library:', error);
            return [];
        }
    }

    saveVideoLibrary() {
        try {
            // Only save metadata, not the actual file objects
            const metadata = this.videoLibrary.map(video => ({
                ...video,
                videoFile: undefined // Remove file reference to avoid storage issues
            }));
            localStorage.setItem('videoHub_library', JSON.stringify(metadata));
        } catch (error) {
            console.error('Error saving video library:', error);
            alert('Error al guardar. Tu almacenamiento local puede estar lleno.');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.videoHub = new VideoHubPlayer();
});
