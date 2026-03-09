// ======== Show/Hide Date Fields (MOVE TO TOP, OUTSIDE DOMContentLoaded) ========
window.showDateField = function(fieldId) {
    document.getElementById(fieldId).style.display = 'block';
}

window.hideDateField = function(fieldId) {
    document.getElementById(fieldId).style.display = 'none';
    var dateInput = document.getElementById(fieldId).querySelector('input[type="date"]');
    if (dateInput) dateInput.value = '';
}

// ======== NOW the DOMContentLoaded section ========
document.addEventListener('DOMContentLoaded', () => {
    // ======== Question Display Logic ========
    const dailyRadio = document.getElementById('daily');
    const weeklyRadio = document.getElementById('weekly');
    const monthlyRadio = document.getElementById('monthly');
    const additionalRadio = document.getElementById('additional');
    const dailyTime = document.getElementById('dailyTime');
    const morningRadio = document.getElementById('morning');
    const afternoonRadio = document.getElementById('afternoon');
    const morningSet = document.getElementById('morningQuestions');
    const afternoonSet = document.getElementById('afternoonQuestions');
    const weeklySet = document.getElementById('weeklyQuestions');
    const monthlySet = document.getElementById('monthlyQuestions');
    const additionalSet = document.getElementById('additionalQuestions');

    function updateDisplay() {
        dailyTime.style.display = 'none';
        morningSet.style.display = 'none';
        afternoonSet.style.display = 'none';
        weeklySet.style.display = 'none';
        monthlySet.style.display = 'none';
        additionalSet.style.display = 'none';

        if(dailyRadio.checked){
            dailyTime.style.display = 'block';
            if(morningRadio.checked) morningSet.style.display = 'block';
            else if(afternoonRadio.checked) afternoonSet.style.display = 'block';
        } else if(weeklyRadio.checked){
            weeklySet.style.display = 'block';
        } else if(monthlyRadio.checked){
            monthlySet.style.display = 'block';
        } else if(additionalRadio.checked){
            additionalSet.style.display = 'block';
        }
    }

    // Event listeners for morning/afternoon only (frequency radios handled separately below)
    [morningRadio, afternoonRadio].forEach(radio => {
        radio.addEventListener('change', updateDisplay);
    });

    // Initialize on page load
    updateDisplay();

    // ======== Grey out unselected tiles & clear answers on frequency switch ========
    function updateFrequencyCards() {
        const allCards = document.querySelectorAll('.freq-card');
        const selectedFrequency = document.querySelector('input[name="Frequency"]:checked');

        allCards.forEach(card => {
            const radioInput = card.querySelector('input[type="radio"]');
            if (selectedFrequency && radioInput.value !== selectedFrequency.value) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }

    function clearAllQuestionAnswers() {
        const questionSections = [
            '#morningQuestions', '#afternoonQuestions',
            '#weeklyQuestions', '#monthlyQuestions', '#additionalQuestions'
        ];
        questionSections.forEach(section => {
            document.querySelectorAll(section + ' input[type="radio"]').forEach(radio => {
                radio.checked = false;
            });
            // Hide and clear all notes boxes in this section
            document.querySelectorAll(section + ' .notes-box').forEach(box => {
                box.style.display = 'none';
                const textarea = box.querySelector('textarea');
                if (textarea) textarea.value = '';
                const msg = box.querySelector('.notes-required-msg');
                if (msg) msg.style.display = 'none';
                if (textarea) textarea.classList.remove('error');
            });
        });
        // Also clear Time of Day selection
        [morningRadio, afternoonRadio].forEach(r => r.checked = false);
        // Hide any open date fields
        document.querySelectorAll('.date-field').forEach(field => {
            field.style.display = 'none';
            const dateInput = field.querySelector('input[type="date"]');
            if (dateInput) dateInput.value = '';
        });
    }

    // When frequency tile is changed, clear previous answers and update card states
    [dailyRadio, weeklyRadio, monthlyRadio, additionalRadio].forEach(radio => {
        radio.addEventListener('change', function() {
            clearAllQuestionAnswers();
            updateFrequencyCards();
            updateDisplay();
        });
    });

    // ======== Inline Notes Box Logic ========
    document.getElementById('checklist-form').addEventListener('change', function(e) {
        // Only act on Yes/No question answers
        if (e.target.name === 'Frequency' || e.target.name === 'Time of Day') return;

        const questionItem = e.target.closest('.question-item');
        if (!questionItem) return;

        const notesBox = questionItem.querySelector('.notes-box');
        if (!notesBox) return;

        if (e.target.value === 'No') {
            // Show the notes box
            notesBox.style.display = 'block';
        } else if (e.target.value === 'Yes') {
            // Hide and clear the notes box
            notesBox.style.display = 'none';
            const textarea = notesBox.querySelector('textarea');
            if (textarea) {
                textarea.value = '';
                textarea.classList.remove('error');
            }
            const msg = notesBox.querySelector('.notes-required-msg');
            if (msg) msg.style.display = 'none';
        }
    });

    // ======== Custom Popup Logic ========
    const popup = document.getElementById('success-popup');
    const closeBtn = document.getElementById('success-close');

    function closePopup() {
        popup.classList.remove('show');
    }

    closeBtn.addEventListener('click', closePopup);

    // ======== FORM SUBMISSION TO GOOGLE APPS SCRIPT ========
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwD4QRvrg0RKeSoGvjD1vKK1V0NB15I6xPP51-WoW0-DosiWpn4Zx-ZN8QhYVXaw1e2Ow/exec';
    const form = document.getElementById('checklist-form');

    form.addEventListener('submit', e => {
        e.preventDefault();

        // ======== Validate all No answers have notes ========
        let notesValid = true;
        document.querySelectorAll('.question-item').forEach(item => {
            const noRadio = item.querySelector('input[type="radio"][value="No"]:checked');
            if (noRadio) {
                const notesBox = item.querySelector('.notes-box');
                const textarea = notesBox ? notesBox.querySelector('textarea') : null;
                const msg = notesBox ? notesBox.querySelector('.notes-required-msg') : null;
                if (textarea && textarea.value.trim() === '') {
                    notesValid = false;
                    textarea.classList.add('error');
                    if (msg) msg.style.display = 'block';
                    if (notesBox) notesBox.style.display = 'block';
                } else if (textarea) {
                    textarea.classList.remove('error');
                    if (msg) msg.style.display = 'none';
                }
            }
        });

        if (!notesValid) {
            Swal.fire({
                title: 'Notes Required',
                text: 'Please add a note for every question answered No.',
                icon: 'warning'
            });
            return;
        }

        const formData = new FormData(form);
        const params = new URLSearchParams();

        for (let [key, value] of formData.entries()) {
            params.append(key, value);
        }

        // Append notes for No answers
        document.querySelectorAll('.question-item').forEach(item => {
            const noRadio = item.querySelector('input[type="radio"][value="No"]:checked');
            if (noRadio) {
                const textarea = item.querySelector('.notes-box textarea');
                if (textarea && textarea.value.trim() !== '') {
                    params.append(noRadio.name + ' - Notes', textarea.value.trim());
                }
            }
        });

        fetch(scriptURL, { 
            method: 'POST', 
            body: params
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response:', data);
            if(data.result === 'success') {
                popup.classList.add('show');
                
                setTimeout(() => {
                    form.reset();
                    updateDisplay();
                    // Unlock all frequency cards after reset
                    document.querySelectorAll('.freq-card').forEach(card => {
                        card.classList.remove('disabled');
                    });
                    // Hide all notes boxes after reset
                    document.querySelectorAll('.notes-box').forEach(box => {
                        box.style.display = 'none';
                        const textarea = box.querySelector('textarea');
                        if (textarea) textarea.value = '';
                        const msg = box.querySelector('.notes-required-msg');
                        if (msg) msg.style.display = 'none';
                        if (textarea) textarea.classList.remove('error');
                    });
                }, 100);
            }
            else {
                Swal.fire({
                    title: 'Error',
                    text: data.error || 'Something went wrong',
                    icon: 'error'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Network error. Check console for details.',
                icon: 'error'
            });
        });
    });
});