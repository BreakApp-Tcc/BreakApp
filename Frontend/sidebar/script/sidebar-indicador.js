function setActiveSidebarItem() {
    const currentPath = window.location.pathname;

    const pageMap = {
        '/homepage': 0,
        '/dieta': 1,
        '/alimentos': 2,
        '/planos': 4
    };

    const sideItems = document.querySelectorAll('.side-item');

    sideItems.forEach(item => {
        item.classList.remove('active');
    });

    let activeIndex = -1;

    for (let path in pageMap) {
        if (currentPath.includes(path)) {
            activeIndex = pageMap[path];
            break;
        }
    }

    if (activeIndex !== -1 && sideItems[activeIndex]) {
        sideItems[activeIndex].classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', setActiveSidebarItem);
window.addEventListener('popstate', setActiveSidebarItem);