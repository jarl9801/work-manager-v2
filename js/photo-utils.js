// photo-utils.js — Shared photo compression & quality detection for Field Reports
(function() {
    'use strict';

    function compressPhoto(file, maxW, quality) {
        maxW = maxW || 1280; quality = quality || 0.7;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function toGrayscale(imageData) {
        const d = imageData.data, len = d.length / 4;
        const gray = new Float32Array(len);
        for (let i = 0; i < len; i++) gray[i] = 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2];
        return gray;
    }

    function laplacianVariance(gray, w, h) {
        let sum = 0, sum2 = 0, n = 0;
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const val = -4 * gray[y*w+x] + gray[(y-1)*w+x] + gray[(y+1)*w+x] + gray[y*w+x-1] + gray[y*w+x+1];
                sum += val; sum2 += val * val; n++;
            }
        }
        if (n === 0) return 999;
        const mean = sum / n;
        return (sum2 / n) - (mean * mean);
    }

    function averageBrightness(gray) {
        let sum = 0;
        for (let i = 0; i < gray.length; i++) sum += gray[i];
        return gray.length > 0 ? sum / gray.length : 128;
    }

    function checkPhotoQuality(dataUrl, t) {
        t = t || function(k) { return k; };
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const scale = Math.min(200 / img.width, 200 / img.height, 1);
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const gray = toGrayscale(imageData);
                const blur = laplacianVariance(gray, canvas.width, canvas.height);
                const brightness = averageBrightness(gray);
                const warnings = [];
                if (blur < 100) warnings.push(t('photoBlurry'));
                if (brightness < 40) warnings.push(t('photoDark'));
                if (brightness > 240) warnings.push(t('photoOverexposed'));
                resolve({ isBlurry: blur < 100, isDark: brightness < 40, isOverexposed: brightness > 240, blurScore: blur, brightness, warnings });
            };
            img.onerror = () => resolve({ isBlurry:false, isDark:false, isOverexposed:false, blurScore:999, brightness:128, warnings:[] });
            img.src = dataUrl;
        });
    }

    function createPhotoFieldHTML(id, label, required, showNameInput) {
        const inputId = 'photo_' + id;
        const previewId = 'preview_' + id;
        let html = `<div class="fr-photo-section">
            <label class="fr-photo-label ${required ? 'required' : 'optional'}">${label}</label>`;
        if (showNameInput) {
            html += `<input type="text" class="fr-photo-name-input" id="name_${id}" value="${label}" style="font-size:12px;padding:6px 8px;margin-bottom:6px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);width:100%;">`;
        }
        html += `<div style="display:flex;gap:8px;">
                <button type="button" class="fr-upload-btn" onclick="window.PhotoUtils.triggerUpload('${inputId}')">📂 Galería</button>
                <button type="button" class="fr-upload-btn" onclick="window.PhotoUtils.triggerUpload('${inputId}_cam')">📷 Cámara</button>
            </div>
            <input type="file" class="fr-photo-file-input" id="${inputId}" accept="image/*" multiple onchange="window.PhotoUtils.handlePhoto(this,'${id}')">
            <input type="file" class="fr-photo-file-input" id="${inputId}_cam" accept="image/*" capture="environment" onchange="window.PhotoUtils.handlePhoto(this,'${id}')">
            <div class="fr-photo-preview-container" id="${previewId}"></div>
        </div>`;
        return html;
    }

    // Shared photo state per form context
    const contexts = {};

    function getContext(ctxId) {
        if (!contexts[ctxId]) contexts[ctxId] = { photos: {}, photoQuality: {} };
        return contexts[ctxId];
    }

    function clearContext(ctxId) {
        contexts[ctxId] = { photos: {}, photoQuality: {} };
    }

    window.PhotoUtils = {
        compressPhoto,
        checkPhotoQuality,
        createPhotoFieldHTML,
        getContext,
        clearContext,

        triggerUpload(inputId) {
            const el = document.getElementById(inputId);
            if (el) el.click();
        },

        async handlePhoto(input, fieldId) {
            if (!input.files || !input.files.length) return;
            // Determine context from fieldId prefix
            const ctxId = fieldId.startsWith('gfp_') || fieldId.startsWith('gfp-') ? 'gfp' : 'wc';
            const ctx = getContext(ctxId);

            for (const file of Array.from(input.files)) {
                try {
                    const dataUrl = await compressPhoto(file);
                    if (!ctx.photos[fieldId]) ctx.photos[fieldId] = [];
                    if (!ctx.photoQuality[fieldId]) ctx.photoQuality[fieldId] = [];
                    ctx.photos[fieldId].push(dataUrl);
                    const quality = await checkPhotoQuality(dataUrl);
                    ctx.photoQuality[fieldId].push(quality);

                    const preview = document.getElementById('preview_' + fieldId);
                    if (preview) {
                        const div = document.createElement('div');
                        div.className = 'fr-photo-preview';
                        div.innerHTML = `<img src="${dataUrl}"><button type="button" class="fr-photo-remove" onclick="window.PhotoUtils.removePhoto('${fieldId}',this)">×</button>`;
                        if (quality.warnings.length > 0) {
                            div.classList.add('fr-photo-warn');
                            const warn = document.createElement('div');
                            warn.className = 'fr-photo-warning';
                            warn.textContent = '⚠️ ' + quality.warnings.join(', ');
                            div.appendChild(warn);
                        }
                        preview.appendChild(div);
                    }
                    // Trigger counter update
                    if (window._fieldPhotoUpdateCallback) window._fieldPhotoUpdateCallback();
                } catch (err) {
                    console.error('Photo error:', err);
                }
            }
            input.value = '';
        },

        removePhoto(fieldId, btn) {
            const ctxId = fieldId.startsWith('gfp_') || fieldId.startsWith('gfp-') ? 'gfp' : 'wc';
            const ctx = getContext(ctxId);
            const container = btn.closest('.fr-photo-preview-container');
            const idx = Array.from(container.children).indexOf(btn.closest('.fr-photo-preview'));
            if (ctx.photos[fieldId]) ctx.photos[fieldId].splice(idx, 1);
            if (ctx.photoQuality[fieldId]) ctx.photoQuality[fieldId].splice(idx, 1);
            btn.closest('.fr-photo-preview').remove();
            if (window._fieldPhotoUpdateCallback) window._fieldPhotoUpdateCallback();
        },

        hasPhoto(ctxId, fieldId) {
            const ctx = getContext(ctxId);
            return ctx.photos[fieldId] && ctx.photos[fieldId].length > 0;
        },

        getPhotos(ctxId) {
            return getContext(ctxId).photos;
        },

        getPhotoQuality(ctxId) {
            return getContext(ctxId).photoQuality;
        },

        collectPhotoNames() {
            const names = {};
            document.querySelectorAll('[id^="name_"]').forEach(input => {
                const id = input.id.replace('name_', '');
                if (input.value.trim()) names[id] = input.value.trim();
            });
            return names;
        }
    };
})();
