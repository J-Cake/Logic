window.addEventListener('load', function() {
    document.querySelector('#tab-bar #own-tab').addEventListener('click', function() {
        document.querySelectorAll('#tab-bar .tab-header').forEach(i => i.classList.remove('selected'));
        document.querySelectorAll('#tab-view .tab').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        document.querySelector('#tab-view #own').classList.add('selected');
    });

    document.querySelector('#tab-bar #shared-tab').addEventListener('click', function() {
        document.querySelectorAll('#tab-bar .tab-header').forEach(i => i.classList.remove('selected'));
        document.querySelectorAll('#tab-view .tab').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        document.querySelector('#tab-view #shared').classList.add('selected');
    });

    document.querySelector('#tab-bar #my-components-tab').addEventListener('click', function() {
        document.querySelectorAll('#tab-bar .tab-header').forEach(i => i.classList.remove('selected'));
        document.querySelectorAll('#tab-view .tab').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        document.querySelector('#tab-view #my-components').classList.add('selected');
    });

    for (const anchor of document.querySelectorAll('#own .doc, #shared .doc'))
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