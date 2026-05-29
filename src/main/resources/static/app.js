document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const shortenForm = document.getElementById('shorten-form');
    const longUrlInput = document.getElementById('long-url');
    const customAliasInput = document.getElementById('custom-alias');
    const expirationSelect = document.getElementById('expiration-select');
    const submitBtn = document.getElementById('submit-btn');
    
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedSettings = document.querySelector('.advanced-settings');
    
    const resultCard = document.getElementById('result-card');
    const shortenedUrlDisplay = document.getElementById('shortened-url-display');
    const copyBtn = document.getElementById('copy-btn');
    const qrCodeImg = document.getElementById('qr-code-img');
    const qrPlaceholder = document.querySelector('.qr-placeholder');
    
    const totalLinksCount = document.getElementById('total-links-count');
    const totalClicksCount = document.getElementById('total-clicks-count');
    
    const linksListBody = document.getElementById('links-list-body');
    const refreshBtn = document.getElementById('refresh-btn');
    
    const errorModal = document.getElementById('error-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // State Variables
    let currentLinks = [];

    // Set base URL in alias prefix label
    const setAliasPrefix = () => {
        const prefixLabel = document.getElementById('prefix-url-label');
        if (prefixLabel) {
            const host = window.location.host;
            prefixLabel.textContent = `${host}/`;
        }
    };
    setAliasPrefix();

    // 1. Check for Redirect Errors (URL params)
    const checkRedirectErrors = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('error')) {
            const errorType = urlParams.get('error');
            const code = urlParams.get('code') || '';
            
            let title = 'Redirection Error';
            let message = 'An unexpected error occurred during redirection.';

            if (errorType === 'not_found') {
                title = 'Link Not Found';
                message = `The shortened code "${code}" does not exist in our database. Please check the URL and try again.`;
            } else if (errorType === 'expired') {
                title = 'Link Expired';
                message = `The shortened link "${code}" has reached its expiration date and is no longer active.`;
            }

            modalTitle.textContent = title;
            modalMessage.textContent = message;
            errorModal.classList.remove('hidden');

            // Clear URL query parameters without reloading
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };
    checkRedirectErrors();

    // Modal Close
    modalCloseBtn.addEventListener('click', () => {
        errorModal.classList.add('hidden');
    });

    // 2. Accordion for Advanced Settings
    advancedToggle.addEventListener('click', () => {
        advancedSettings.classList.toggle('active');
    });

    // 3. Load Links and Update Dashboard
    const fetchLinks = async () => {
        try {
            const response = await fetch('/api/v1/urls/list');
            if (!response.ok) throw new Error('Failed to load links');
            currentLinks = await response.json();
            renderLinksTable(currentLinks);
            animateStats(currentLinks);
        } catch (error) {
            console.error('Error fetching links:', error);
            showToast('Could not load active links directory', 'error');
        }
    };

    // Render Table Rows
    const renderLinksTable = (links) => {
        if (links.length === 0) {
            linksListBody.innerHTML = `
                <tr class="empty-state-row">
                    <td colspan="6">
                        <div class="empty-state">
                            <i class="fa-regular fa-folder-open"></i>
                            <p>No shortened links found. Create your first link above!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        linksListBody.innerHTML = links.map(link => {
            const createdDate = new Date(link.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let expiresContent = '<span class="badge badge-never">Never</span>';
            if (link.expiresAt) {
                const expiryDate = new Date(link.expiresAt);
                if (expiryDate < new Date()) {
                    expiresContent = '<span class="badge badge-expired">Expired</span>';
                } else {
                    expiresContent = `<span class="badge badge-active">${expiryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>`;
                }
            }

            return `
                <tr data-code="${link.shortCode}">
                    <td>
                        <a href="${link.shortUrl}" target="_blank" class="table-link">
                            ${window.location.host}/${link.shortCode}
                            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem;"></i>
                        </a>
                    </td>
                    <td>
                        <div class="original-url-cell" title="${link.longUrl}">${link.longUrl}</div>
                    </td>
                    <td>${createdDate}</td>
                    <td>${expiresContent}</td>
                    <td><span class="click-badge">${link.clickCount}</span></td>
                    <td class="text-right">
                        <div class="action-buttons">
                            <button class="btn btn-icon btn-copy-table" data-url="${link.shortUrl}" title="Copy Link">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                            <button class="btn btn-icon btn-delete" data-code="${link.shortCode}" title="Delete Link">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach Event Listeners to generated elements
        document.querySelectorAll('.btn-copy-table').forEach(button => {
            button.addEventListener('click', (e) => {
                const url = button.getAttribute('data-url');
                copyToClipboard(url, button);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const code = button.getAttribute('data-code');
                deleteLink(code);
            });
        });
    };

    // 4. Animate Stat Counters
    const animateStats = (links) => {
        const totalLinks = links.length;
        const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);

        animateValue(totalLinksCount, parseInt(totalLinksCount.textContent) || 0, totalLinks, 800);
        animateValue(totalClicksCount, parseInt(totalClicksCount.textContent) || 0, totalClicks, 800);
    };

    const animateValue = (obj, start, end, duration) => {
        if (start === end) {
            obj.textContent = end;
            return;
        }
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end;
            }
        };
        window.requestAnimationFrame(step);
    };

    // 5. Shorten URL Form Submission
    shortenForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const longUrl = longUrlInput.value.trim();
        const customAlias = customAliasInput.value.trim();
        const expirationValue = expirationSelect.value;

        // Reset submit button state to loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span>Shortening...</span>
            <i class="fa-solid fa-spinner fa-spin"></i>
        `;

        const payload = { longUrl };
        if (customAlias) payload.customAlias = customAlias;
        if (expirationValue !== 'never') payload.ttlSeconds = parseInt(expirationValue);

        try {
            const response = await fetch('/api/v1/urls/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Validation error');
            }

            // Success display
            shortenedUrlDisplay.value = data.shortUrl;
            
            // Generate QR Code via qrserver API
            qrCodeImg.classList.add('hidden');
            qrPlaceholder.classList.remove('hidden');
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.shortUrl)}`;
            qrCodeImg.onload = () => {
                qrPlaceholder.classList.add('hidden');
                qrCodeImg.classList.remove('hidden');
            };

            resultCard.classList.remove('hidden');
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            showToast('Short link generated!', 'success');
            
            // Reset Form inputs (excluding longUrl if they want to keep track)
            customAliasInput.value = '';
            expirationSelect.value = 'never';
            if (advancedSettings.classList.contains('active')) {
                advancedSettings.classList.remove('active');
            }

            // Reload Directory
            fetchLinks();

        } catch (error) {
            console.error('Error shortening URL:', error);
            showToast(error.message || 'Failed to shorten URL. Check formatting.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span>Shorten Link</span>
                <i class="fa-solid fa-arrow-right"></i>
            `;
        }
    });

    // 6. Clipboard Manager
    const copyToClipboard = (text, buttonElement) => {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
            
            // Temporary button animation
            const icon = buttonElement.querySelector('i');
            const textSpan = buttonElement.querySelector('span');

            const originalIconClass = icon.className;
            icon.className = 'fa-solid fa-check';
            buttonElement.style.borderColor = 'var(--color-success)';
            buttonElement.style.color = 'var(--color-success)';

            if (textSpan) {
                const originalText = textSpan.textContent;
                textSpan.textContent = 'Copied!';
                setTimeout(() => {
                    icon.className = originalIconClass;
                    buttonElement.style.borderColor = '';
                    buttonElement.style.color = '';
                    textSpan.textContent = originalText;
                }, 2000);
            } else {
                setTimeout(() => {
                    icon.className = originalIconClass;
                    buttonElement.style.borderColor = '';
                    buttonElement.style.color = '';
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Could not copy automatically', 'error');
        });
    };

    copyBtn.addEventListener('click', () => {
        copyToClipboard(shortenedUrlDisplay.value, copyBtn);
    });

    // 7. Delete Action
    const deleteLink = async (code) => {
        if (!confirm(`Are you sure you want to delete the short link "/${code}"?`)) return;

        try {
            const response = await fetch(`/api/v1/urls/${code}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Deletion failed');

            showToast('Short URL deleted successfully', 'success');
            fetchLinks();

            // Hide main results card if that was deleted
            const currentResult = shortenedUrlDisplay.value;
            if (currentResult && currentResult.endsWith('/' + code)) {
                resultCard.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error deleting link:', error);
            showToast('Failed to delete URL mapping', 'error');
        }
    };

    // 8. Refresh & Poll
    refreshBtn.addEventListener('click', () => {
        // Rotate Refresh Icon
        const icon = refreshBtn.querySelector('i');
        icon.classList.add('fa-spin');
        fetchLinks().finally(() => {
            setTimeout(() => {
                icon.classList.remove('fa-spin');
            }, 500);
        });
    });

    // 9. Toast Notification Handler
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

        // Auto remove toast after 4s
        setTimeout(() => {
            toast.style.animation = 'fade-in 0.3s reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    };

    // Initial Load
    fetchLinks();
});
