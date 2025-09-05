let selectedStyle = '';
let currentUser = null;
let selectedPlan = null;

// Subscription functionality
function subscribe(plan) {
    if (!currentUser) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            updateUserInterface();
            updateUserDashboard();
        } else {
            selectedPlan = plan;
            openLoginModal(); // Open login modal when not logged in
            return;
        }
    }

    selectedPlan = plan;
    const planDetails = {
        starter: { name: 'Starter', price: 29, features: '2 videos/month, Basic editing, 1080p' },
        professional: { name: 'Professional', price: 79, features: '5 videos/month, All styles, 4K quality' },
        enterprise: { name: 'Enterprise', price: 199, features: 'Unlimited videos, Custom styles, 8K quality' }
    };

    document.getElementById('selectedPlan').innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 10px;">
            <h3>${planDetails[plan].name} Plan</h3>
            <div style="font-size: 2rem; color: #ff6b6b; font-weight: bold;">$${planDetails[plan].price}/month</div>
            <p>${planDetails[plan].features}</p>
        </div>
    `;

    // Set the amount for PayPal
    selectedPlanAmount = planDetails[plan].price;

    // Update PayPal amount if the function exists
    if (typeof updatePayPalAmount === 'function') {
        updatePayPalAmount(planDetails[plan].price);
    }

    const subModal = document.getElementById('subscriptionModal');
    subModal.style.setProperty('display', 'flex', 'important');
}

function handleSubscription(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button');
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    setTimeout(() => {
        alert(`Welcome to KG9 Video ${selectedPlan} plan! Your subscription is now active.`);

        // Update user data
        currentUser.plan = selectedPlan;
        updateUserDashboard();
        showDashboard();
        closeModal();

        submitBtn.textContent = `Subscribe for ${document.getElementById('selectedPlan').querySelector('div').textContent.match(/\$(\d+)/)[1]}/month`;
        submitBtn.disabled = false;
    }, 2000);
}

// Payment Form Functions
function handlePayment(event) {
    event.preventDefault();
    hidePaymentErrors();

    const formData = new FormData(event.target);
    const cardName = formData.get('cardName').trim();
    const cardNumber = formData.get('cardNumber');
    const expiryDate = formData.get('expiryDate');
    const cvv = formData.get('cvv');
    const amount = formData.get('amount');

    let isValid = true;

    // Validate cardholder name
    if (cardName.length < 2) {
        showPaymentError('nameError', 'Please enter a valid name');
        isValid = false;
    }

    // Validate card number
    if (!validateCardNumber(cardNumber)) {
        showPaymentError('cardError', 'Please enter a valid 16-digit card number');
        isValid = false;
    }

    // Validate expiry date
    if (!validateExpiryDate(expiryDate)) {
        showPaymentError('expiryError', 'Please enter a valid expiry date (MM/YY)');
        isValid = false;
    }

    // Validate CVV
    if (!validateCVV(cvv)) {
        showPaymentError('cvvError', 'Please enter a valid CVV (3-4 digits)');
        isValid = false;
    }

    // Validate amount
    if (!validateAmount(amount)) {
        showPaymentError('amountError', 'Please enter a valid amount (max $10,000)');
        isValid = false;
    }

    if (isValid) {
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Processing...';

        // Simulate payment processing
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Payment Successful!';
            document.getElementById('successMessage').style.display = 'block';

            // Update user data for subscription
            if (selectedPlan) {
                currentUser.plan = selectedPlan;
                updateUserDashboard();
                showDashboard();
            }

            // Reset form after 3 seconds
            setTimeout(() => {
                event.target.reset();
                submitBtn.textContent = 'Pay Now';
                document.getElementById('successMessage').style.display = 'none';
                closeModal();
            }, 3000);
        }, 2000);
    }
}

function validateCardNumber(cardNumber) {
    // Remove spaces and check if it's 16 digits
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
}

function validateExpiryDate(expiry) {
    // Check MM/YY format
    const match = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1]);
    const year = parseInt('20' + match[2]);

    if (month < 1 || month > 12) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false;
    }

    return true;
}

function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
}

function validateAmount(amount) {
    const numAmount = parseFloat(amount);
    return numAmount > 0 && numAmount <= 10000; // Max $10,000
}

function showPaymentError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hidePaymentErrors() {
    const errors = document.querySelectorAll('#paymentForm .error-message');
    errors.forEach(error => {
        error.style.display = 'none';
    });
}

// Authentication functionality
function openLoginModal() {
    const modal = document.getElementById('authModal');
    modal.style.setProperty('display', 'flex', 'important');
    showLogin();
}

function closeModal() {
    const authModal = document.getElementById('authModal');
    const subModal = document.getElementById('subscriptionModal');
    const forgotModal = document.getElementById('forgotPasswordModal');

    authModal.style.setProperty('display', 'none', 'important');
    subModal.style.setProperty('display', 'none', 'important');
    forgotModal.style.setProperty('display', 'none', 'important');
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function handleLogin(event) {
    event.preventDefault();

    // Clear previous errors
    document.getElementById('emailError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    let isValid = true;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address.';
        isValid = false;
    }

    // Password validation
    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long.';
        isValid = false;
    }

    if (!isValid) return;

    // Check if email is registered
    let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
    const user = registeredUsers.find(user => user.email === email);
    if (!user) {
        document.getElementById('emailError').textContent = 'Email is not registered. Please sign up first.';
        return;
    }

    const submitBtn = event.target.querySelector('button');
    submitBtn.textContent = 'Logging in...';

    setTimeout(() => {
        // Simulate login
        currentUser = {
            name: user.name,
            email: user.email,
            plan: user.plan || 'professional',
            status: user.status || 'active',
            videosUsed: user.videosUsed || 0,
            totalVideos: user.totalVideos || 0,
            nextBilling: user.nextBilling || 'N/A'
        };

        // Remember me functionality
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('rememberedUser');
        }

        updateUserInterface();
        updateUserDashboard();
        closeModal();

        submitBtn.textContent = 'Login';
    }, 1500);
}

function forgotPassword() {
    const forgotModal = document.getElementById('forgotPasswordModal');
    forgotModal.style.setProperty('display', 'flex', 'important');
}

function handleForgotPassword(event) {
    event.preventDefault();

    const emailInput = document.getElementById('resetEmail');
    const emailError = document.getElementById('resetEmailError');
    const email = emailInput.value;

    emailError.textContent = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address.';
        return;
    }

    const submitBtn = event.target.querySelector('button');
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
        alert(`If an account with ${email} exists, a password reset link has been sent.`);
        submitBtn.textContent = 'Send Reset Link';
        submitBtn.disabled = false;
        closeModal();
    }, 2000);
}

function handleSignup(event) {
    event.preventDefault();

    const name = event.target.querySelector('input[type="text"]').value;
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;
    const confirmPassword = event.target.querySelectorAll('input[type="password"]')[1].value;

    // Get existing users
    let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    // Check if email already exists
    if (registeredUsers.some(user => user.email === email)) {
        alert('An account with this email already exists.');
        return;
    }

    // Check password match
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const submitBtn = event.target.querySelector('button');
    submitBtn.textContent = 'Creating Account...';

    setTimeout(() => {
        // Create new user
        const newUser = {
            name: name,
            email: email,
            password: password, // In real app, this should be hashed
            plan: null,
            status: 'inactive',
            videosUsed: 0,
            totalVideos: 0,
            nextBilling: null
        };

        // Add to registered users
        registeredUsers.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

        // Simulate login after signup
        currentUser = { ...newUser };
        delete currentUser.password; // Don't store password in currentUser

        // Persist currentUser in localStorage for login session
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        updateUserInterface();
        closeModal();

        if (selectedPlan) {
            subscribe(selectedPlan);
        }

        submitBtn.textContent = 'Create Account';
    }, 1500);
}

function updateUserInterface() {
    const loginBtn = document.getElementById('loginBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (currentUser) {
        loginBtn.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
        loginBtn.onclick = function(event) { event.preventDefault(); toggleDropdown(); };
        // Dropdown is hidden by default, shown on click via toggleDropdown

        // Update subscription buttons
        const subscribeButtons = document.querySelectorAll('.subscribe-btn');
        subscribeButtons.forEach(btn => {
            if (currentUser.plan) {
                const planName = btn.onclick.toString().match(/subscribe\('(\w+)'\)/);
                if (planName && planName[1] === currentUser.plan) {
                    btn.textContent = 'Current Plan';
                    btn.classList.add('current-plan');
                    btn.onclick = null;
                }
            }
        });
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.onclick = function(event) { event.preventDefault(); openLoginModal(); };
        userDropdown.style.display = 'none'; // Hide dropdown when not logged in
    }
}

function updateUserDashboard() {
    if (!currentUser) return;
   
    document.getElementById('userName').textContent = `Welcome back, ${currentUser.name}!`;
    document.getElementById('currentPlan').textContent = currentUser.plan ? currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1) : 'No plan';
    document.getElementById('videosCount').textContent = currentUser.videosUsed;
    document.getElementById('totalVideos').textContent = currentUser.totalVideos;
    document.getElementById('nextBilling').textContent = currentUser.nextBilling ? currentUser.nextBilling.split(',')[0] : 'N/A';
   
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = currentUser.status;
    statusBadge.className = `status-badge ${currentUser.status === 'active' ? 'status-active' : 'status-inactive'}`;
}

function showDashboard() {
    if (!currentUser) {
        openLoginModal(); // Open login modal when trying to access dashboard without being logged in
        return;
    }

    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
}

function manageSubscription() {
    alert('Subscription management coming soon! You can upgrade, downgrade, or cancel your plan here.');
}

function logout() {
    currentUser = null;
    selectedPlan = null;
    localStorage.removeItem('currentUser'); // Clear session
    updateUserInterface();
    document.getElementById('dashboard').style.display = 'none';

    // Reset subscription buttons
    const subscribeButtons = document.querySelectorAll('.subscribe-btn');
    subscribeButtons.forEach((btn, index) => {
        const plans = ['starter', 'professional', 'enterprise'];
        btn.textContent = `Choose ${plans[index].charAt(0).toUpperCase() + plans[index].slice(1)}`;
        btn.classList.remove('current-plan');
        btn.onclick = () => subscribe(plans[index]);
    });
}

function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'block';
    }
}


// Original functionality
function selectStyle(style) {
    selectedStyle = style;
    document.getElementById('style').value = style;
   
    // Visual feedback
    document.querySelectorAll('.style-card').forEach(card => {
        card.style.border = '3px solid transparent';
    });
    if (event && event.currentTarget) {
        event.currentTarget.style.border = '3px solid #ff6b6b';
       
        // Animate selection
        event.currentTarget.style.transform = 'scale(0.95)';
        setTimeout(() => {
            event.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
        }, 100);
    }
}

function handleSubmit(event) {
    event.preventDefault();
   
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
   
    // Simulate form submission
    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
   
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
   
    setTimeout(() => {
        alert(`Thank you ${data.name}! We've received your inquiry for a ${data['project-type']} project. We'll contact you within 24 hours to discuss your vision.`);
        submitBtn.textContent = 'Message Sent!';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            event.target.reset();
            selectedStyle = '';
            // Reset style card borders
            document.querySelectorAll('.style-card').forEach(card => {
                card.style.border = '3px solid transparent';
            });
        }, 2000);
    }, 1500);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to header
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.2)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.1)';
    }
});

// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards for animation
document.querySelectorAll('.video-card, .style-card, .pricing-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Close modals and dropdown when clicking outside
window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    const subModal = document.getElementById('subscriptionModal');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const dropdown = document.getElementById('userDropdown');
    const loginBtn = document.getElementById('loginBtn');

    if (event.target === authModal) {
        closeModal();
    }
    if (event.target === subModal) {
        closeModal();
    }
    if (event.target === forgotModal) {
        closeModal();
    }
    if (dropdown && event.target !== loginBtn && !loginBtn.contains(event.target)) {
        dropdown.style.display = 'none';
    }
}

// Payment Form Input Formatting
document.addEventListener('DOMContentLoaded', function() {
    // Force hide all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });

    // Close any open modals
    closeModal();

    // Do not open login modal automatically on page load
    // Remove any call to openLoginModal() here or elsewhere on load

    // Payment form input formatting
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');

    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            value = value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value;
        });
    }

    if (expiryDateInput) {
        expiryDateInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            e.target.value = value.slice(0, 4);
        });
    }

    // Real-time validation feedback for payment form
    const paymentInputs = document.querySelectorAll('#paymentForm input');
    paymentInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const errorId = this.id + 'Error';
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    });
});

// FAQ functionality
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Open clicked item if it wasn't already active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// Contact form functionality
function handleContact(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Simulate form submission
    setTimeout(() => {
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData);

        alert(`Thank you ${data.contactName}! Your message has been sent successfully. We'll get back to you within 24 hours regarding your ${data.contactSubject} inquiry.`);

        submitBtn.textContent = 'Message Sent!';
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            event.target.reset();
        }, 2000);
    }, 1500);
}

// Modal login functionality (integrated into kg9.HTML)
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners are handled by onclick attributes in the HTML
    // and by the existing modal functions in kg9.HTML
});

// Login form handler for modal
function handleLoginForm(event) {
    event.preventDefault();

    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;

    // Basic validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    // Simulate login process
    const submitBtn = event.target.querySelector('.form-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;

    setTimeout(() => {
        // Check if user exists in localStorage
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = registeredUsers.find(u => u.email === email && u.password === password);

        if (user) {
            // Store current user
            currentUser = { ...user };
            delete currentUser.password; // Don't store password in memory
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            // Update UI and close modal
            updateUserInterface();
            updateUserDashboard();
            closeModal();
        alert(`Welcome back, ${user.name}!`);
        // Show welcome modal
        const welcomeModal = document.getElementById('welcomeModal');
        const welcomeMessage = document.getElementById('welcomeMessage');
        welcomeMessage.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
        welcomeModal.style.display = 'flex';

        // Auto close welcome modal after 3 seconds
        setTimeout(() => {
            welcomeModal.style.display = 'none';
        }, 3000);
    } else {
        alert('Invalid email or password. Please try again.');
    }

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// Forgot password handler for modal
function handleForgotPassword() {
    const email = document.querySelector('#authModal input[type="email"]').value;

    if (!email) {
        alert('Please enter your email address first');
        return;
    }

    alert(`Password reset link sent to ${email}. Please check your email.`);
}

// Sign up handler
function handleSignUp() {
    alert('Redirecting to sign up page...');
    // You can redirect to a signup page here
    // window.location.href = 'signup.html';
}

// Apple login handler for modal
function handleAppleLogin() {
    alert('Apple login is not implemented yet. Please use email login.');
    // Implement Apple Sign-In here
    // This would typically use Apple's Sign-In SDK
}

// Google login handler for modal
function handleGoogleLogin() {
    alert('Google login is not implemented yet. Please use email login.');
    // Implement Google Sign-In here
    // This would typically use Google's Sign-In API
}

window.addEventListener('load', function() {
    // Additional safeguard
    closeModal();

    // Load user session from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
        updateUserDashboard();
    }
});
