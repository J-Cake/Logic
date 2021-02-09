window.addEventListener('load', function() {
    document.querySelector('#tab-bar #own-tab').addEventListener('click', function() {
        this.classList.add('selected');
        document.querySelector('#tab-bar #shared-tab').classList.remove('selected');
        document.querySelector('#tab-view #own').classList.add('selected');
        document.querySelector('#tab-view #shared').classList.remove('selected')
    });

    document.querySelector('#tab-bar #shared-tab').addEventListener('click', function() {
        this.classList.add('selected');
        document.querySelector('#tab-bar #own-tab').classList.remove('selected');
        document.querySelector('#tab-view #shared').classList.add('selected');
        document.querySelector('#tab-view #own').classList.remove('selected')
    });

    for (const el of document.querySelectorAll('.controls > *'))
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            return false;
        })

    for (const anchor of document.querySelectorAll('.doc'))
        anchor.addEventListener('click', function() {
            window.location.href = '/edit/' + this.dataset.href;
        });

    for (const renameBtn of document.querySelectorAll('.renameDoc'))
        renameBtn.addEventListener('click', function(e) {
            const name = prompt(`Please enter a new name`);
            if (name)
                fetch('/')
        });
});