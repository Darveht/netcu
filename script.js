
class NetflixVideoPlayer {
    constructor() {
        this.video = null;
        this.subtitles = [];
        this.currentSubtitle = null;
        this.subtitlesEnabled = false;
        this.controlsTimeout = null;
        this.isDragging = false;
        this.videoLibrary = [];
        this.currentVideoId = null;
        this.filteredVideos = [];
        
        this.initializeElements();
        this.bindEvents();
        this.loadVideoLibrary();
        this.renderVideoGrid();
    }
    
    initializeElements() {
        // Library elements
        this.librarySection = document.getElementById('librarySection');
        this.videoGrid = document.getElementById('videoGrid');
        this.searchInput = document.getElementById('searchInput');
        this.addVideoBtn = document.getElementById('addVideoBtn');
        this.addFirstVideoBtn = document.getElementById('addFirstVideoBtn');
        
        // Upload elements
        this.uploadSection = document.getElementById('uploadSection');
        this.playerSection = document.getElementById('playerSection');
        this.videoFile = document.getElementById('videoFile');
        this.subtitleFile = document.getElementById('subtitleFile');
        this.videoTitle = document.getElementById('videoTitle');
        this.loadMediaBtn = document.getElementById('loadMedia');
        this.cancelUpload = document.getElementById('cancelUpload');
        
        // Player elements
        this.videoPlayer = document.getElementById('videoPlayer');
        this.subtitleText = document.getElementById('subtitleText');
        this.controlsOverlay = document.getElementById('controlsOverlay');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.videoTitleDisplay = document.getElementById('videoTitleDisplay');
        
        // Control elements
        this.backBtn = document.getElementById('backBtn');
        this.centerPlayBtn = document.getElementById('centerPlayBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.subtitleBtn = document.getElementById('subtitleBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.editTitleBtn = document.getElementById('editTitleBtn');
        
        // Progress elements
        this.progressBar = document.querySelector('.progress-bar');
        this.progressFilled = document.getElementById('progressFilled');
        this.progressHandle = document.getElementById('progressHandle');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        
        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editTitleInput = document.getElementById('editTitleInput');
        this.saveTitle = document.getElementById('saveTitle');
        this.cancelEdit = document.getElementById('cancelEdit');
    }
    
    bindEvents() {
        // Library events
        this.searchInput.addEventListener('input', (e) => this.searchVideos(e.target.value));
        this.addVideoBtn.addEventListener('click', () => this.showUploadSection());
        this.addFirstVideoBtn.addEventListener('click', () => this.showUploadSection());
        
        // Upload events
        this.loadMediaBtn.addEventListener('click', () => this.saveVideo());
        this.cancelUpload.addEventListener('click', () => this.showLibrary());
        
        // Modal events
        this.editTitleBtn.addEventListener('click', () => this.showEditModal());
        this.saveTitle.addEventListener('click', () => this.saveVideoTitle());
        this.cancelEdit.addEventListener('click', () => this.hideEditModal());
        
        // Video events
        this.videoPlayer.addEventListener('loadedmetadata', () => this.onVideoLoaded());
        this.videoPlayer.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.videoPlayer.addEventListener('ended', () => this.onVideoEnded());
        this.videoPlayer.addEventListener('waiting', () => this.showLoading());
        this.videoPlayer.addEventListener('canplay', () => this.hideLoading());
        this.videoPlayer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.togglePlayPause();
        });
        
        // Bloquear eventos nativos que causan expansión
        this.videoPlayer.addEventListener('webkitfullscreenchange', (e) => e.preventDefault());
        this.videoPlayer.addEventListener('fullscreenchange', (e) => e.preventDefault());
        this.videoPlayer.addEventListener('webkitbeginfullscreen', (e) => e.preventDefault());
        this.videoPlayer.addEventListener('webkitendfullscreen', (e) => e.preventDefault());
        this.videoPlayer.addEventListener('enterpictureinpicture', (e) => e.preventDefault());
        this.videoPlayer.addEventListener('leavepictureinpicture', (e) => e.preventDefault());
        
        // Deshabilitar menú contextual del video
        this.videoPlayer.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Control events
        this.backBtn.addEventListener('click', () => this.goBack());
        this.centerPlayBtn.addEventListener('click', () => this.togglePlayPause());
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.subtitleBtn.addEventListener('click', () => this.toggleSubtitles());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        
        // Progress bar events
        this.progressBar.addEventListener('click', (e) => this.seekTo(e));
        this.progressBar.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Controls visibility
        this.playerSection.addEventListener('mousemove', () => this.showControls());
        this.playerSection.addEventListener('mouseleave', () => this.hideControls());
        this.controlsOverlay.addEventListener('mouseenter', () => this.showControls());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });
        
        // Fullscreen events
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange());
    }
    
    // Video Library Management
    loadVideoLibrary() {
        // Try to load from new metadata storage first
        const metadata = localStorage.getItem('netflix_video_metadata');
        if (metadata) {
            this.videoLibrary = JSON.parse(metadata);
        } else {
            // Fallback to old storage method
            const stored = localStorage.getItem('netflix_video_library');
            if (stored) {
                this.videoLibrary = JSON.parse(stored);
            }
        }
        this.filteredVideos = [...this.videoLibrary];
    }
    
    saveVideoLibrary() {
        localStorage.setItem('netflix_video_library', JSON.stringify(this.videoLibrary));
    }
    
    saveVideoLibraryMetadata() {
        // Save only metadata, not the actual video files
        const metadata = this.videoLibrary.map(video => ({
            id: video.id,
            title: video.title,
            subtitleData: video.subtitleData,
            duration: video.duration,
            createdAt: video.createdAt,
            type: video.type,
            size: video.size
        }));
        localStorage.setItem('netflix_video_metadata', JSON.stringify(metadata));
    }
    
    generateVideoId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    showUploadSection() {
        this.librarySection.style.display = 'none';
        this.uploadSection.style.display = 'flex';
        this.videoTitle.value = '';
        this.videoFile.value = '';
        this.subtitleFile.value = '';
    }
    
    showLibrary() {
        this.uploadSection.style.display = 'none';
        this.playerSection.style.display = 'none';
        this.librarySection.style.display = 'block';
        this.renderVideoGrid();
    }
    
    async saveVideo() {
        const videoFile = this.videoFile.files[0];
        const subtitleFile = this.subtitleFile.files[0];
        const title = this.videoTitle.value.trim();
        
        if (!videoFile) {
            alert('Por favor selecciona un archivo de video');
            return;
        }
        
        if (!title) {
            alert('Por favor ingresa un título para el video');
            return;
        }
        
        // Check file size (limit to 50MB for better performance)
        if (videoFile.size > 50 * 1024 * 1024) {
            alert('El archivo de video es muy grande. Por favor selecciona un archivo menor a 50MB.');
            return;
        }
        
        this.showLoading();
        
        try {
            // Create object URL instead of base64 for better performance
            const videoData = URL.createObjectURL(videoFile);
            let subtitleData = null;
            
            if (subtitleFile) {
                subtitleData = await subtitleFile.text();
            }
            
            const videoId = this.generateVideoId();
            const videoEntry = {
                id: videoId,
                title: title,
                videoData: videoData,
                videoFile: videoFile, // Store file reference
                subtitleData: subtitleData,
                duration: 0,
                createdAt: new Date().toISOString(),
                type: videoFile.type,
                size: videoFile.size
            };
            
            this.videoLibrary.push(videoEntry);
            this.saveVideoLibraryMetadata(); // Save only metadata, not the file
            this.filteredVideos = [...this.videoLibrary];
            
            this.hideLoading();
            this.showLibrary();
            
        } catch (error) {
            console.error('Error saving video:', error);
            
            // Mensaje de error más específico
            let errorMessage = 'Error al guardar el video.';
            if (error.name === 'QuotaExceededError') {
                errorMessage = 'No hay suficiente espacio de almacenamiento. Intenta con un archivo más pequeño.';
            } else if (error.message && error.message.includes('size')) {
                errorMessage = 'El archivo es muy grande. Por favor selecciona un archivo menor a 50MB.';
            } else {
                errorMessage = 'Error al procesar el video. Verifica que el archivo sea válido.';
            }
            
            alert(errorMessage);
            this.hideLoading();
        }
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    searchVideos(query) {
        if (!query.trim()) {
            this.filteredVideos = [...this.videoLibrary];
        } else {
            this.filteredVideos = this.videoLibrary.filter(video =>
                video.title.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.renderVideoGrid();
    }
    
    renderVideoGrid() {
        if (this.filteredVideos.length === 0) {
            this.videoGrid.innerHTML = `
                <div class="empty-library">
                    <p>${this.videoLibrary.length === 0 ? 'No hay videos en tu biblioteca' : 'No se encontraron videos'}</p>
                    <button class="netflix-button" onclick="window.player.showUploadSection()">
                        ${this.videoLibrary.length === 0 ? 'Agregar tu primer video' : 'Agregar video'}
                    </button>
                </div>
            `;
            return;
        }
        
        this.videoGrid.innerHTML = this.filteredVideos.map(video => `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <div class="play-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <div class="video-info">
                    <div class="video-title-card">${video.title}</div>
                    <div class="video-duration">${this.formatDate(video.createdAt)}</div>
                    <div class="video-actions">
                        <button class="action-btn play" onclick="window.player.playVideo('${video.id}')">
                            Reproducir
                        </button>
                        <button class="action-btn delete" onclick="window.player.deleteVideo('${video.id}')">
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers for video cards
        this.videoGrid.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.video-actions')) {
                    const videoId = card.dataset.videoId;
                    this.playVideo(videoId);
                }
            });
        });
    }
    
    playVideo(videoId) {
        const video = this.videoLibrary.find(v => v.id === videoId);
        if (!video) return;
        
        this.currentVideoId = videoId;
        this.librarySection.style.display = 'none';
        this.playerSection.style.display = 'block';
        
        // Load video - handle both old and new storage methods
        if (video.videoFile) {
            // New method: create object URL from file
            this.videoPlayer.src = URL.createObjectURL(video.videoFile);
        } else if (video.videoData) {
            // Old method: use stored data URL
            this.videoPlayer.src = video.videoData;
        } else {
            alert('Error: No se pudo cargar el video. Por favor súbelo nuevamente.');
            this.showLibrary();
            return;
        }
        
        this.videoTitleDisplay.textContent = video.title;
        
        // Load subtitles if available
        if (video.subtitleData) {
            this.parseSubtitles(video.subtitleData);
            this.subtitlesEnabled = true;
            this.subtitleBtn.classList.add('active');
        } else {
            this.subtitles = [];
            this.subtitlesEnabled = false;
            this.subtitleBtn.classList.remove('active');
        }
        
        this.showControls();
    }
    
    deleteVideo(videoId) {
        if (confirm('¿Estás seguro de que quieres eliminar este video?')) {
            this.videoLibrary = this.videoLibrary.filter(v => v.id !== videoId);
            this.saveVideoLibrary();
            this.filteredVideos = this.filteredVideos.filter(v => v.id !== videoId);
            this.renderVideoGrid();
        }
    }
    
    showEditModal() {
        if (!this.currentVideoId) return;
        const video = this.videoLibrary.find(v => v.id === this.currentVideoId);
        if (!video) return;
        
        this.editTitleInput.value = video.title;
        this.editModal.style.display = 'flex';
    }
    
    hideEditModal() {
        this.editModal.style.display = 'none';
    }
    
    saveVideoTitle() {
        const newTitle = this.editTitleInput.value.trim();
        if (!newTitle) {
            alert('El título no puede estar vacío');
            return;
        }
        
        const video = this.videoLibrary.find(v => v.id === this.currentVideoId);
        if (video) {
            video.title = newTitle;
            this.saveVideoLibrary();
            this.videoTitleDisplay.textContent = newTitle;
            
            // Update filtered videos
            const filteredIndex = this.filteredVideos.findIndex(v => v.id === this.currentVideoId);
            if (filteredIndex !== -1) {
                this.filteredVideos[filteredIndex].title = newTitle;
            }
        }
        
        this.hideEditModal();
    }
    
    async parseSubtitles(text) {
        this.subtitles = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        // Variables para manejo de diferentes formatos
        let expectingTime = false;
        let expectingText = false;
        let currentStart = 0;
        let currentEnd = 0;
        let textLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Saltar líneas de metadatos VTT
            if (line.toLowerCase().includes('webvtt') || 
                line.toLowerCase().includes('kind:') || 
                line.toLowerCase().includes('language:') ||
                line.toLowerCase().includes('note:')) {
                continue;
            }
            
            // Formato VTT con timestamps embebidos: "palabra<00:00:12.160><c> texto</c>"
            const vttTimestampMatch = line.match(/^(.+?)<(\d{2}:\d{2}:\d{2}\.\d{3})>(?:<c>(.+?)<\/c>)?/);
            if (vttTimestampMatch) {
                const baseText = vttTimestampMatch[1].trim();
                const timestamp = vttTimestampMatch[2];
                const additionalText = vttTimestampMatch[3] ? vttTimestampMatch[3].trim() : '';
                
                const startTime = this.parseTime(timestamp);
                let fullText = baseText;
                
                if (additionalText) {
                    fullText = baseText + ' ' + additionalText;
                }
                
                // Limpiar texto de tags HTML
                fullText = fullText.replace(/<[^>]*>/g, '').trim();
                
                if (fullText.length > 1) {
                    this.subtitles.push({
                        start: startTime,
                        end: startTime + 3,
                        text: fullText
                    });
                }
                continue;
            }
            
            // Formato SRT: número de subtítulo
            if (/^\d+$/.test(line) && !expectingText) {
                if (textLines.length > 0) {
                    // Guardar subtítulo anterior
                    this.subtitles.push({
                        start: currentStart,
                        end: currentEnd,
                        text: textLines.join(' ').trim()
                    });
                    textLines = [];
                }
                expectingTime = true;
                expectingText = false;
                continue;
            }
            
            // Formato SRT/VTT: timestamps con -->
            if (line.includes('-->')) {
                const timeMatch = line.match(/(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[.,]\d{2,3})/);
                if (timeMatch) {
                    currentStart = this.parseTime(timeMatch[1]);
                    currentEnd = this.parseTime(timeMatch[2]);
                    expectingTime = false;
                    expectingText = true;
                    continue;
                }
            }
            
            // Procesar líneas de texto
            if (expectingText || (!line.includes('-->') && !(/^\d+$/.test(line)))) {
                // Limpiar línea de tags HTML/VTT
                let cleanLine = line.replace(/<[^>]*>/g, '').trim();
                
                // Formato simple: "MM:SS texto"
                const simpleTimeMatch = cleanLine.match(/^(\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s+(.+)/);
                if (simpleTimeMatch) {
                    const startTime = this.parseTime(simpleTimeMatch[1]);
                    const text = simpleTimeMatch[2].trim();
                    
                    if (text.length > 2) {
                        this.subtitles.push({
                            start: startTime,
                            end: startTime + 4,
                            text: text
                        });
                    }
                    continue;
                }
                
                // Verificar si es texto válido
                if (cleanLine.length > 2) {
                    // Detectar idiomas (español e inglés)
                    const isSpanishText = /[ñáéíóúü¿¡]|(?:\b(?:que|con|por|para|una|del|las|los|muy|más|año|años|día|días|como|pero|todo|este|esta|desde|hasta|cuando|donde|puede|pueden|tiene|tienen|hacer|hace|otro|otra|otros|otras|tiempo|persona|personas|vida|trabajo|casa|mundo|país|estado|ciudad|gobierno|problema|problemas|parte|partes|grupo|grupos|momento|momentos|lugar|lugares|mano|manos|ojo|ojos|cosa|cosas|vez|veces|forma|formas|agua|fuego|tierra|aire|amor|corazón|familia|amigo|amigos|hermano|hermanos|padre|madre|hijo|hijos|mujer|hombre|niño|niños|dinero|trabajo|escuela|universidad|hospital|iglesia|calle|carro|casa|comida|agua|libro|libros|música|película|películas|juego|juegos|deporte|deportes|animal|animales|árbol|árboles|flor|flores|cielo|mar|sol|luna|estrella|estrellas)\b)/i.test(cleanLine);
                    
                    const isEnglishText = /\b(?:the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|she|too|any|use|your|work|life|only|over|said|each|make|most|move|must|name|well|also|back|call|came|come|could|every|first|from|good|great|hand|have|here|home|just|know|last|left|like|look|made|many|more|much|never|only|other|people|place|right|said|same|seem|should|since|some|still|such|take|than|them|these|they|think|this|those|time|very|water|were|what|when|where|which|while|will|with|would|write|year|years|about|after|again|before|being|between|both|during|each|few|into|through|under|until|while|without|world|would|write|written|year|years|young)\b/i.test(cleanLine);
                    
                    if (isSpanishText || isEnglishText || cleanLine.split(' ').length >= 2) {
                        if (expectingText && currentStart >= 0 && currentEnd > currentStart) {
                            textLines.push(cleanLine);
                        } else {
                            // Crear subtítulo sin timestamp específico
                            const autoStart = this.subtitles.length * 3.5;
                            this.subtitles.push({
                                start: autoStart,
                                end: autoStart + 3.5,
                                text: cleanLine
                            });
                        }
                    }
                }
            }
        }
        
        // Agregar último subtítulo si queda pendiente
        if (textLines.length > 0 && currentStart >= 0 && currentEnd > currentStart) {
            this.subtitles.push({
                start: currentStart,
                end: currentEnd,
                text: textLines.join(' ').trim()
            });
        }
        
        // Eliminar duplicados y ordenar
        const uniqueSubtitles = [];
        const seen = new Set();
        
        for (let subtitle of this.subtitles) {
            const key = `${Math.floor(subtitle.start)}-${subtitle.text.substring(0, 20)}`;
            if (!seen.has(key) && subtitle.text.length > 1) {
                seen.add(key);
                uniqueSubtitles.push(subtitle);
            }
        }
        
        this.subtitles = uniqueSubtitles.sort((a, b) => a.start - b.start);
        
        console.log(`Loaded ${this.subtitles.length} subtitles`);
    }
    
    parseTime(timeStr) {
        if (!timeStr) return 0;
        
        // Normalizar formato (comas a puntos)
        timeStr = timeStr.replace(/,/g, '.').trim();
        
        // Remover corchetes si los hay
        timeStr = timeStr.replace(/[\[\]]/g, '');
        
        const parts = timeStr.split(':');
        
        if (parts.length === 1) {
            // Solo segundos: "45" o "45.123"
            return parseFloat(parts[0]) || 0;
        } else if (parts.length === 2) {
            // Minutos:segundos: "01:45" o "1:45.123"
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseFloat(parts[1]) || 0;
            return minutes * 60 + seconds;
        } else if (parts.length === 3) {
            // Horas:minutos:segundos: "01:23:45" o "1:23:45.123"
            const hours = parseInt(parts[0]) || 0;
            const minutes = parseInt(parts[1]) || 0;
            const seconds = parseFloat(parts[2]) || 0;
            return hours * 3600 + minutes * 60 + seconds;
        }
        
        return 0;
    }
    
    onVideoLoaded() {
        this.durationEl.textContent = this.formatTime(this.videoPlayer.duration);
        this.hideLoading();
        
        // Update duration in library
        if (this.currentVideoId) {
            const video = this.videoLibrary.find(v => v.id === this.currentVideoId);
            if (video) {
                video.duration = this.videoPlayer.duration;
                this.saveVideoLibrary();
            }
        }
    }
    
    onTimeUpdate() {
        if (!this.isDragging) {
            const progress = (this.videoPlayer.currentTime / this.videoPlayer.duration) * 100;
            this.progressFilled.style.width = `${progress}%`;
            this.progressHandle.style.left = `${progress}%`;
        }
        
        this.currentTimeEl.textContent = this.formatTime(this.videoPlayer.currentTime);
        this.updateSubtitles();
    }
    
    updateSubtitles() {
        if (!this.subtitlesEnabled || this.subtitles.length === 0) {
            this.subtitleText.style.display = 'none';
            this.subtitleText.classList.remove('highlight');
            return;
        }
        
        const currentTime = this.videoPlayer.currentTime;
        let activeSubtitle = null;
        
        // Buscar subtítulo con tolerancia de tiempo mejorada
        for (let subtitle of this.subtitles) {
            const tolerance = 0.3; // 300ms de tolerancia
            if (currentTime >= (subtitle.start - tolerance) && currentTime <= (subtitle.end + tolerance)) {
                activeSubtitle = subtitle;
                break;
            }
        }
        
        // Si no encontramos con tolerancia, buscar el más cercano
        if (!activeSubtitle) {
            let closestSubtitle = null;
            let closestDistance = Infinity;
            
            for (let subtitle of this.subtitles) {
                const distance = Math.min(
                    Math.abs(currentTime - subtitle.start),
                    Math.abs(currentTime - subtitle.end)
                );
                
                if (distance < closestDistance && distance < 1.0) { // 1 segundo de distancia máxima
                    closestDistance = distance;
                    closestSubtitle = subtitle;
                }
            }
            
            activeSubtitle = closestSubtitle;
        }
        
        if (activeSubtitle && activeSubtitle !== this.currentSubtitle) {
            this.subtitleText.textContent = activeSubtitle.text;
            this.subtitleText.style.display = 'block';
            this.subtitleText.classList.remove('highlight');
            
            // Añadir efecto de highlight temporal
            setTimeout(() => {
                if (this.subtitleText.style.display === 'block') {
                    this.subtitleText.classList.add('highlight');
                }
            }, 50);
            
            setTimeout(() => {
                this.subtitleText.classList.remove('highlight');
            }, 600);
            
            this.currentSubtitle = activeSubtitle;
        } else if (!activeSubtitle && this.currentSubtitle) {
            // Mantener subtítulo visible un poco más tiempo
            setTimeout(() => {
                if (!activeSubtitle) {
                    this.subtitleText.style.display = 'none';
                    this.subtitleText.classList.remove('highlight');
                    this.currentSubtitle = null;
                }
            }, 200);
        }
    }
    
    togglePlayPause() {
        if (this.videoPlayer.paused) {
            this.videoPlayer.play();
            this.updatePlayPauseIcons(false);
        } else {
            this.videoPlayer.pause();
            this.updatePlayPauseIcons(true);
        }
        this.showControls();
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
    
    toggleMute() {
        if (this.videoPlayer.muted) {
            this.videoPlayer.muted = false;
            this.volumeSlider.value = this.videoPlayer.volume * 100;
            this.updateVolumeIcon(false);
        } else {
            this.videoPlayer.muted = true;
            this.updateVolumeIcon(true);
        }
    }
    
    setVolume(value) {
        this.videoPlayer.volume = value / 100;
        this.videoPlayer.muted = value == 0;
        this.updateVolumeIcon(value == 0);
    }
    
    updateVolumeIcon(muted) {
        const volumeIcon = this.volumeBtn.querySelector('.volume-icon');
        const muteIcon = this.volumeBtn.querySelector('.mute-icon');
        
        volumeIcon.style.display = muted ? 'none' : 'block';
        muteIcon.style.display = muted ? 'block' : 'none';
    }
    
    toggleSubtitles() {
        this.subtitlesEnabled = !this.subtitlesEnabled;
        this.subtitleBtn.classList.toggle('active', this.subtitlesEnabled);
        
        if (!this.subtitlesEnabled) {
            this.subtitleText.style.display = 'none';
        }
    }
    
    toggleFullscreen() {
        try {
            const isFullscreen = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement ||
                                document.msFullscreenElement;
            
            if (!isFullscreen) {
                // Enter fullscreen - usar simulación CSS en lugar de API nativa
                this.simulateFullscreen(true);
            } else {
                // Exit fullscreen
                if (document.exitFullscreen && typeof document.exitFullscreen === 'function') {
                    document.exitFullscreen().catch(() => this.simulateFullscreen(false));
                } else if (document.webkitExitFullscreen && typeof document.webkitExitFullscreen === 'function') {
                    document.webkitExitFullscreen();
                } else if (document.webkitCancelFullScreen && typeof document.webkitCancelFullScreen === 'function') {
                    document.webkitCancelFullScreen();
                } else if (document.mozCancelFullScreen && typeof document.mozCancelFullScreen === 'function') {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen && typeof document.msExitFullscreen === 'function') {
                    document.msExitFullscreen();
                } else {
                    this.simulateFullscreen(false);
                }
            }
        } catch (err) {
            console.log('Using CSS fullscreen simulation');
            this.simulateFullscreen(!this.playerSection.classList.contains('simulated-fullscreen'));
        }
    }
    
    simulateFullscreen(enable) {
        if (enable) {
            this.playerSection.classList.add('simulated-fullscreen');
            document.body.style.overflow = 'hidden';
        } else {
            this.playerSection.classList.remove('simulated-fullscreen');
            document.body.style.overflow = 'auto';
        }
        this.onFullscreenChange();
    }
    
    onFullscreenChange() {
        const expandIcon = this.fullscreenBtn.querySelector('.expand-icon');
        const compressIcon = this.fullscreenBtn.querySelector('.compress-icon');
        
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement ||
                            document.msFullscreenElement ||
                            this.playerSection.classList.contains('simulated-fullscreen');
        
        if (isFullscreen) {
            expandIcon.style.display = 'none';
            compressIcon.style.display = 'block';
        } else {
            expandIcon.style.display = 'block';
            compressIcon.style.display = 'none';
        }
    }
    
    seekTo(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const progress = clickX / rect.width;
        const newTime = progress * this.videoPlayer.duration;
        
        this.videoPlayer.currentTime = newTime;
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.drag(e);
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progress = clickX / rect.width;
        
        this.progressFilled.style.width = `${progress * 100}%`;
        this.progressHandle.style.left = `${progress * 100}%`;
    }
    
    endDrag() {
        if (!this.isDragging) return;
        
        const progress = parseFloat(this.progressFilled.style.width) / 100;
        const newTime = progress * this.videoPlayer.duration;
        this.videoPlayer.currentTime = newTime;
        
        this.isDragging = false;
    }
    
    showControls() {
        this.controlsOverlay.classList.add('visible');
        this.controlsOverlay.classList.remove('hidden');
        
        clearTimeout(this.controlsTimeout);
        this.controlsTimeout = setTimeout(() => {
            if (!this.videoPlayer.paused) {
                this.hideControls();
            }
        }, 3000);
    }
    
    hideControls() {
        if (!this.controlsOverlay.matches(':hover')) {
            this.controlsOverlay.classList.remove('visible');
            this.controlsOverlay.classList.add('hidden');
        }
    }
    
    showLoading() {
        this.loadingSpinner.style.display = 'block';
    }
    
    hideLoading() {
        this.loadingSpinner.style.display = 'none';
    }
    
    goBack() {
        this.videoPlayer.pause();
        this.playerSection.style.display = 'none';
        this.showLibrary();
        
        // Reset player state
        this.videoPlayer.src = '';
        this.subtitles = [];
        this.currentSubtitle = null;
        this.currentVideoId = null;
        this.subtitleText.style.display = 'none';
    }
    
    onVideoEnded() {
        this.updatePlayPauseIcons(true);
        this.showControls();
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
                this.videoPlayer.currentTime = Math.max(0, this.videoPlayer.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.videoPlayer.currentTime = Math.min(this.videoPlayer.duration, this.videoPlayer.currentTime + 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(100, this.videoPlayer.volume * 100 + 10));
                this.volumeSlider.value = this.videoPlayer.volume * 100;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.videoPlayer.volume * 100 - 10));
                this.volumeSlider.value = this.videoPlayer.volume * 100;
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleSubtitles();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    this.toggleFullscreen();
                }
                break;
        }
        
        this.showControls();
    }
    
    handleOrientationChange() {
        this.videoPlayer.style.width = '100%';
        this.videoPlayer.style.height = '100%';
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.player = new NetflixVideoPlayer();
});
