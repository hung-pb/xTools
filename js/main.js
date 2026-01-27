function toggleNode(element) {
    const parent = element.parentElement;
    parent.classList.toggle('open');
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
    });
});
