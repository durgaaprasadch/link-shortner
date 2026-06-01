document.addEventListener('DOMContentLoaded', () => {
    // DOM Selectors
    const urlForm = document.getElementById('url-shortener-form');
    const longUrlInput = document.getElementById('long-url');
    const customAliasInput = document.getElementById('custom-alias');
    const expirationSelect = document.getElementById('expiration-select');
    const btnSubmit = document.getElementById('btn-submit');
    
    const accordionToggle = document.getElementById('accordion-toggle');
    const settingsAccordion = document.querySelector('.settings-accordion');
    
    const successPanel = document.getElementById('success-panel');
    const shortenedUrlDisplay = document.getElementById('shortened-url-display');
    const copyBtn = document.getElementById('copy-btn');
    const qrCodeImg = document.getElementById('qr-code-img');
    const qrPlaceholder = document.querySelector('.qr-placeholder');
    
    const totalLinksCount = document.getElementById('total-links-count');
    const totalClicksCount = document.getElementById('total-clicks-count');
    
    const tableBody = document.getElementById('table-body');
    const refreshBtn = document.getElementById('refresh-btn');
    
    const errorModal = document.getElementById('error-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    let localLinksCache = [];

    // Dynamically set prefix label based on window hostname
    const initializeAliasPrefix = () => {
        const prefixLabel = document.getElementById('prefix-url-label');
        if (prefixLabel) {
            const host = window.location.host;
            prefixLabel.textContent = `${host}/`;
        }
    };
    initializeAliasPrefix();

    // Check for redirection landing errors in URL query params
    const checkRedirectStatus = () => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.has('error')) {
            const errorType = queryParams.get('error');
            const code = queryParams.get('code') || '';
            
            let title = 'Redirection Failed';
            let message = 'An unknown error occurred during link resolution.';

            if (errorType === 'not_found') {
                title = 'Link Not Found';
                message = `The short code "${code}" could not be found. Please verify the URL and try again.`;
            } else if (errorType === 'expired') {
                title = 'Link Expired';
                message = `The short link "${code}" has reached its expiration date and is no longer available.`;
            }

            modalTitle.textContent = title;
            modalMessage.textContent = message;
            errorModal.classList.remove('hidden');

            // Strip query parameters from URL bar
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };
    checkRedirectStatus();

    // Close modal event
    modalCloseBtn.addEventListener('click', () => {
        errorModal.classList.add('hidden');
    });

    // Expand/Collapse accordion options
    accordionToggle.addEventListener('click', () => {
        settingsAccordion.classList.toggle('active');
    });

    // Fetch active links from the database
    const loadLinks = async () => {
        try {
            const response = await fetch('/api/v1/urls/list');
            if (!response.ok) throw new Error('API server error');
            localLinksCache = await response.json();
            renderTable(localLinksCache);
            updateDashboardWidgets(localLinksCache);
        } catch (error) {
            console.error('API Error:', error);
            showToast('Unable to fetch links directory from database.', 'error');
        }
    };

    // Render table rows dynamically
    const renderTable = (links) => {
        if (links.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-state-row">
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fa-regular fa-folder-open"></i>
                            <p>No links created yet. Paste a link above to get started.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = links.map(link => {
            const dateStr = new Date(link.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let expiryLabel = '<span class="badge badge-never">Never</span>';
            if (link.expiresAt) {
                const expiryDate = new Date(link.expiresAt);
                if (expiryDate < new Date()) {
                    expiryLabel = '<span class="badge badge-expired">Expired</span>';
                } else {
                    expiryLabel = `<span class="badge badge-active">${expiryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>`;
                }
            }

            return `
                <tr data-code="${link.shortCode}">
                    <td>
                        <a href="${link.shortUrl}" target="_blank" class="table-link-anchor">
                            ${window.location.host}/${link.shortCode}
                            <i class="fa-solid fa-arrow-up-right-from-square inline-icon"></i>
                        </a>
                    </td>
                    <td>
                        <div class="destination-text-cell" title="${link.longUrl}">${link.longUrl}</div>
                    </td>
                    <td>${dateStr}</td>
                    <td>${expiryLabel}</td>
                    <td><span class="click-count-badge">${link.clickCount}</span></td>
                    <td class="text-right">
                        <div class="row-action-buttons">
                            <button class="btn btn-icon btn-copy-row" data-url="${link.shortUrl}" title="Copy Link">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button class="btn btn-icon btn-delete-row" data-code="${link.shortCode}" title="Delete Link">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire event handlers to dynamic row buttons
        document.querySelectorAll('.btn-copy-row').forEach(button => {
            button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                executeClipboardCopy(url, button);
            });
        });

        document.querySelectorAll('.btn-delete-row').forEach(button => {
            button.addEventListener('click', () => {
                const code = button.getAttribute('data-code');
                confirmAndDeleteLink(code);
            });
        });
    };

    // Animate stats cards values
    const updateDashboardWidgets = (links) => {
        const total = links.length;
        const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);

        animateStatCounter(totalLinksCount, parseInt(totalLinksCount.textContent) || 0, total, 600);
        animateStatCounter(totalClicksCount, parseInt(totalClicksCount.textContent) || 0, totalClicks, 600);
    };

    const animateStatCounter = (element, start, end, duration) => {
        if (start === end) {
            element.textContent = end;
            return;
        }
        let startTime = null;
        const step = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        };
        window.requestAnimationFrame(step);
    };

    // Handle form submission and short link generation
    urlForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const longUrl = longUrlInput.value.trim();
        const customAlias = customAliasInput.value.trim();
        const expirationValue = expirationSelect.value;

        // Toggle submit state
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `
            <span>Processing...</span>
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

        const requestBody = { longUrl };
        if (customAlias) requestBody.customAlias = customAlias;
        if (expirationValue !== 'never') requestBody.ttlSeconds = parseInt(expirationValue);

        try {
            const response = await fetch('/api/v1/urls/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            // Set result value
            shortenedUrlDisplay.value = data.shortUrl;
            
            // Fetch QR Code via open API
            qrCodeImg.classList.add('hidden');
            qrPlaceholder.classList.remove('hidden');
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.shortUrl)}`;
            qrCodeImg.onload = () => {
                qrPlaceholder.classList.add('hidden');
                qrCodeImg.classList.remove('hidden');
            };

            successPanel.classList.remove('hidden');
            successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

            showToast('Short URL generated successfully.', 'success');
            
            // Clean up inputs
            customAliasInput.value = '';
            expirationSelect.value = 'never';
            if (settingsAccordion.classList.contains('active')) {
                settingsAccordion.classList.remove('active');
            }

            // Refresh table view
            loadLinks();

        } catch (error) {
            console.error('API Error:', error);
            showToast(error.message || 'Failed to shorten link.', 'error');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `
                <span>Shorten URL</span>
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    });

    // Copy to clipboard utility
    const executeClipboardCopy = (text, btnElement) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard.', 'success');
            
            const icon = btnElement.querySelector('i');
            const textSpan = btnElement.querySelector('span');

            const previousClass = icon.className;
            icon.className = 'fa-solid fa-check';
            btnElement.classList.add('copied-success');

            if (textSpan) {
                const originalText = textSpan.textContent;
                textSpan.textContent = 'Copied!';
                setTimeout(() => {
                    icon.className = previousClass;
                    btnElement.classList.remove('copied-success');
                    textSpan.textContent = originalText;
                }, 1500);
            } else {
                setTimeout(() => {
                    icon.className = previousClass;
                    btnElement.classList.remove('copied-success');
                }, 1500);
            }
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            showToast('Failed to copy to clipboard.', 'error');
        });
    };

    copyBtn.addEventListener('click', () => {
        executeClipboardCopy(shortenedUrlDisplay.value, copyBtn);
    });

    // Delete link entry
    const confirmAndDeleteLink = async (code) => {
        if (!confirm(`Are you sure you want to delete the short URL "/${code}"?`)) return;

        try {
            const response = await fetch(`/api/v1/urls/${code}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Deletion request failed');

            showToast('Short URL deleted successfully.', 'success');
            loadLinks();

            // Clear output display if currently showing the deleted URL
            const currentSuccessOutput = shortenedUrlDisplay.value;
            if (currentSuccessOutput && currentSuccessOutput.endsWith('/' + code)) {
                successPanel.classList.add('hidden');
            }
        } catch (error) {
            console.error('API Error:', error);
            showToast('Could not delete link mapping.', 'error');
        }
    };

    // Manual list refresh trigger
    refreshBtn.addEventListener('click', () => {
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        loadLinks().finally(() => {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 400);
        });
    });

    // Custom Toast Notification System
    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-circle-check';
        if (type === 'error') iconClass = 'fa-circle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fade-in 0.2s reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, 3000);
    };

    // Fetch links on bootstrap
    loadLinks();
});
