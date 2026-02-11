// js/ui_helpers.js
// Shared UI helpers to reduce repeated initialization logic across tabs.

(function(window) {
    function createTabManager({
        tabsSelector = '.tab',
        contentsSelector = '.tab-content',
        defaultTab = 'summary',
        onActivate = () => {}
    } = {}) {
        const tabs = Array.from(document.querySelectorAll(tabsSelector));
        const tabContents = Array.from(document.querySelectorAll(contentsSelector));

        function activateTab(key) {
            const resolvedKey = (document.getElementById(`tab-${key}`) && document.getElementById(`content-${key}`))
                ? key
                : defaultTab;

            tabs.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            document.getElementById(`tab-${resolvedKey}`)?.classList.add('active');
            document.getElementById(`content-${resolvedKey}`)?.classList.add('active');

            onActivate(resolvedKey);
        }

        function keyFromHash() {
            return window.location.hash.replace('#', '') || defaultTab;
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const key = tab.id.slice('tab-'.length);
                window.location.hash = key;
                activateTab(key);
            });
        });

        window.addEventListener('hashchange', () => activateTab(keyFromHash()));

        return {
            activate: activateTab,
            current: keyFromHash
        };
    }

    function renderSearchableSelect({
        container,
        options = [],
        multiSelect = true,
        placeholder,
        onChange
    }) {
        const host = typeof container === 'string' ? d3.select(container) : container;
        if (!host || host.empty()) return null;

        const defaultText = placeholder || `Select Column${multiSelect ? 's' : ''}...`;
        host.html('');

        const root = host.append('div').attr('class', 'relative');
        const button = root.append('button')
            .attr('class', 'w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left truncate')
            .text(defaultText);

        const panel = root.append('div')
            .attr('class', 'absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto hidden');

        const searchInput = panel.append('input')
            .attr('type', 'text')
            .attr('placeholder', 'Search...')
            .attr('class', 'w-full px-3 py-2 border-b sticky top-0 z-10');

        const list = panel.append('div');
        const inputType = multiSelect ? 'checkbox' : 'radio';
        const inputName = host.attr('id') || `dropdown-${Math.random().toString(36).slice(2, 8)}`;

        function getSelectedValues() {
            return Array.from(host.selectAll('input:checked').nodes()).map(node => node.value);
        }

        function updateButtonText() {
            const selected = getSelectedValues();
            if (selected.length === 0) {
                button.text(defaultText);
                return;
            }

            let text = selected.join(', ');
            if (text.length > 40) {
                text = `${selected.length} column${selected.length > 1 ? 's' : ''} selected`;
            }
            button.text(text);
        }

        options.forEach(option => {
            const item = list.append('div').attr('class', 'px-3 py-2 hover:bg-gray-100 flex items-center');
            const optionId = `input-${inputName}-${option}`;

            item.append('input')
                .attr('type', inputType)
                .attr('value', option)
                .attr('id', optionId)
                .attr('name', inputName)
                .attr('class', 'mr-2')
                .on('change', () => {
                    updateButtonText();
                    onChange?.(getSelectedValues());
                });

            item.append('label').attr('for', optionId).text(option).attr('class', 'w-full');
        });

        searchInput.on('input', function() {
            const term = this.value.toLowerCase();
            list.selectAll('div').style('display', function() {
                return d3.select(this).select('label').text().toLowerCase().includes(term) ? '' : 'none';
            });
        });

        button.on('click', () => panel.classed('hidden', !panel.classed('hidden')));

        const clickHandler = function(event) {
            if (!root.node().contains(event.target)) {
                panel.classed('hidden', true);
            }
        };
        window.document.body.addEventListener('click', clickHandler);

        return {
            getSelectedValues,
            destroy() {
                window.document.body.removeEventListener('click', clickHandler);
                host.html('');
            }
        };
    }

    window.DashboardUI = {
        createTabManager,
        renderSearchableSelect
    };
})(window);
