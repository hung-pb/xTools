function toggleNode(element) {
    const parent = element.parentElement;
    parent.classList.toggle('open');
}

// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    menuToggle.classList.toggle('active');
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
}

if (menuToggle) {
    menuToggle.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

// Simple router logic for iframe vs welcome screen
const iframe = document.getElementById('content-frame');
const welcome = document.getElementById('welcome-slogan');
const links = document.querySelectorAll('a[target="content-frame"]');

links.forEach(link => {
    link.addEventListener('click', () => {
        welcome.style.display = 'none';
        iframe.classList.add('active');

        // Active state styling
        document.querySelectorAll('.tree-label').forEach(el => el.classList.remove('active'));
        link.classList.add('active');

        // Auto-close sidebar on mobile
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    });
});
