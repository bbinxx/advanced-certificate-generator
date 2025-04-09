document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const signinModal = document.getElementById('signin-modal');
    const signupModal = document.getElementById('signup-modal');
    const signinBtn = document.getElementById('signin-btn');
    const signupBtn = document.getElementById('signup-btn');
    const closeBtns = document.querySelectorAll('.close-btn');

    // Logging utility for debugging
    const logger = {
        log: (message) => {
            console.log(`[AUTH DEBUG] ${message}`);
        },
        error: (message, error) => {
            console.error(`[AUTH ERROR] ${message}`, error);
        }
    };

    // Token management utility
    const TokenManager = {
        setToken: (token) => {
            logger.log('Storing token');
            localStorage.setItem('authToken', token);
            document.cookie = `token=${token}; path=/; SameSite=Strict; Secure`;
        },
        getToken: () => {
            return localStorage.getItem('authToken');
        },
        removeToken: () => {
            logger.log('Removing token');
            localStorage.removeItem('authToken');
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
    };

    // Authenticated fetch wrapper
    const authenticatedFetch = async (url, options = {}) => {
        const token = TokenManager.getToken();
        const headers = {
            ...options.headers,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 401) {
                logger.log('Unauthorized access');
                TokenManager.removeToken();
                window.location.href = '/?error=unauthorized';
                return null;
            }
            return response;
        } catch (error) {
            logger.error('Fetch error:', error);
            throw error;
        }
    };

    // Error display helper function
    const showError = (form, message) => {
        logger.error('Form Error', message);
        
        // Remove any existing error messages
        const existingError = form.querySelector('.error-message');
        if (existingError) existingError.remove();

        // Create and insert new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
        errorDiv.textContent = message;
        form.insertBefore(errorDiv, form.firstChild);
    };

    // Modal management functions
    const openModal = (modal) => {
        if (!modal) return;
        logger.log(`Opening modal: ${modal.id}`);
        
        // Hide all modals first
        [signinModal, signupModal].forEach(m => {
            if (m && m !== modal) m.classList.add('hidden');
        });
        
        // Show target modal
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    };

    const closeModals = () => {
        logger.log('Closing all modals');
        [signinModal, signupModal].forEach(modal => {
            if (modal) modal.classList.add('hidden');
        });
        document.body.classList.remove('modal-open');
    };

    // Event Listeners for Modal Buttons
    signinBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        logger.log('Sign In button clicked');
        openModal(signinModal);
    });

    signupBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        logger.log('Sign Up button clicked');
        openModal(signupModal);
    });

    // Close modal buttons
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            logger.log('Close button clicked');
            closeModals();
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === signinModal || e.target === signupModal) {
            logger.log('Clicked outside modal');
            closeModals();
        }
    });

    // Form handling for Sign In
    const signinForm = document.getElementById('signin-form');
    signinForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        logger.log('Sign In form submitted');

        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        try {
            const response = await fetch('/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            
            if (response.ok && data.token) {
                logger.log('Sign In successful');
                TokenManager.setToken(data.token);
                
                try {
                    const designResponse = await authenticatedFetch('/design');
                    if (designResponse) {
                        window.location.href = '/design';
                    }
                } catch (authError) {
                    logger.error('Design page access failed', authError);
                    showError(signinForm, 'Authentication failed. Please try again.');
                }
            } else {
                logger.error('Sign In failed', data.error);
                showError(signinForm, data.error || 'Sign in failed. Please try again.');
            }
        } catch (error) {
            logger.error('Sign In error', error);
            showError(signinForm, 'An error occurred during sign in. Please try again.');
        }
    });

    // Form handling for Sign Up
    const signupForm = document.getElementById('signup-form');
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        logger.log('Sign Up form submitted');

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                logger.log('Sign Up successful, attempting auto sign-in');
                const signinResponse = await fetch('/signin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const signinData = await signinResponse.json();

                if (signinResponse.ok && signinData.token) {
                    logger.log('Auto Sign In successful');
                    TokenManager.setToken(signinData.token);
                    window.location.href = '/design';
                } else {
                    logger.error('Auto Sign In failed', signinData.error);
                    showError(signupForm, 'Account created but sign in failed. Please sign in manually.');
                }
            } else {
                logger.error('Sign Up failed', data.error);
                showError(signupForm, data.error || 'Sign up failed. Please try again.');
            }
        } catch (error) {
            logger.error('Sign Up error', error);
            showError(signupForm, 'An error occurred during sign up. Please try again.');
        }
    });

    // Check if there's an error parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'unauthorized') {
        logger.log('Unauthorized access detected');
        openModal(signinModal);
        showError(signinForm, 'Please sign in to access this page');
    }
});