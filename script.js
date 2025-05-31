// Word database with syllable counts
this.wordDatabase = [
    // 1 syllable words
    { word: 'cat', syllables: 1 },
    { word: 'dog', syllables: 1 },
    { word: 'sun', syllables: 1 },
    { word: 'fish', syllables: 1 },
    { word: 'book', syllables: 1 },

    // 2 syllable words
    { word: 'apple', syllables: 2 },
    { word: 'flower', syllables: 2 },
    { word: 'cookie', syllables: 2 },
    { word: 'pizza', syllables: 2 },
    { word: 'rabbit', syllables: 2 },

    // 3 syllable words
    { word: 'butterfly', syllables: 3 },
    { word: 'elephant', syllables: 3 },
    { word: 'banana', syllables: 3 },
    { word: 'bicycle', syllables: 3 },
    { word: 'dinosaur', syllables: 3 }
];

const sounds = {
    plant: new Audio('assets/seed_plant.mp3'),
    water: new Audio('assets/watering_can.mp3'),
    grow: new Audio('assets/plant_growing.mp3')
};
document.addEventListener('DOMContentLoaded', () => {
    const seedCards = document.querySelectorAll('.seed-card');
    const plantSpot = document.getElementById('plant-spot');
    const plantButton = document.getElementById('plant-button');
    const scoreElement = document.getElementById('score');
    let selectedCard = null;
    let planted = false;
    var score = 0;
    let answeredWords = new Set();
    let isWatering = false;


    const lottieContainer = document.createElement('div');
    lottieContainer.className = 'lottie-container';

    var anim = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: 'assets/plant.json'
    });

    // Handle card selection and speech
    seedCards.forEach(card => {
        card.addEventListener('click', () => {
            seedCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedCard = card;

            const word = card.dataset.word;
            speechSynthesis.cancel();
            speechSynthesis.speak(new SpeechSynthesisUtterance(word));

            if (!planted) {
                plantButton.style.display = 'block';
            }
        });
    });

    // Handle planting
    plantButton.addEventListener('click', () => {
        if (!selectedCard) return;

        plantButton.style.display = 'none';
        planted = true;
        document.body.classList.add('planting');

        // Query fresh list of seed cards (including newly generated ones)
        const currentSeedCards = document.querySelectorAll('.seed-card');
        currentSeedCards.forEach(c => {
            if (c !== selectedCard) {
                c.style.display = 'none';
            }
        });
        selectedCard.style.position = '';
        selectedCard.style.left = '';
        selectedCard.style.top = '';
        selectedCard.style.transition = '';
        selectedCard.style.transition = 'all 0.5s ease';

        // Insert selected card into the plant container
        const plantContainer = document.getElementById('plant-container');
        plantContainer.innerHTML = ''; // Clear previous content
        plantContainer.appendChild(selectedCard);
        plantContainer.style.display = 'flex';

        triggerPlantingAnimation(selectedCard)

    });

    function triggerPlantingAnimation(card) {
        const correctSyllable = card.dataset.syllables;
        const seedIcon = card.querySelector('img');
        const seedClone = seedIcon.cloneNode(true);
        seedClone.classList.add('flying-seed');
        document.body.appendChild(seedClone);

        const startRect = seedIcon.getBoundingClientRect();
        Object.assign(seedClone.style, {
            left: `${startRect.left}px`,
            top: `${startRect.top}px`,
            width: `${seedIcon.width}px`,
            height: `${seedIcon.height}px`
        });

        const targetRect = plantSpot.getBoundingClientRect();
        setTimeout(() => {
            seedClone.style.left = `${targetRect.left + 50}px`;
            seedClone.style.top = `${targetRect.top + 100}px`;
            seedClone.style.opacity = '0';
        }, 50);

        lottieContainer.innerHTML = ''; // Clear previous animation

        anim = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'assets/plant.json'
        });

        setTimeout(() => {
            sounds.plant.currentTime = 0;
            sounds.plant.play();
            seedClone.remove();
            plantSpot.innerHTML = '';
            plantSpot.appendChild(lottieContainer);
            anim.playSegments([0, 5], true);
            anim.play();
            anim.addEventListener('complete', () => showWateringCans(correctSyllable, anim), { once: true });
        }, 800);
    }

    function showWateringCans(correctSyllable, plantAnimation) {
        const syllableButtons = document.getElementById('syllable-buttons');
        syllableButtons.style.display = 'flex';

        document.querySelector('.feedback-message')?.remove();

        const buttons = Array.from(syllableButtons.querySelectorAll('button')).map(button => {
            const clone = button.cloneNode(true);
            button.parentNode.replaceChild(clone, button);
            clone.classList.remove('selected');
            return clone;
        });

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (isWatering) return; // Block if already watering

                isWatering = true;

              
                const selected = button.dataset.syll;
                const waterCan = createWateringCan(button);
                buttons.forEach(b => b.classList.remove('selected'));
                button.classList.add('selected');

                const wateringAnim = lottie.loadAnimation({
                    container: waterCan,
                    renderer: 'svg',
                    loop: false,
                    autoplay: true,
                    path: 'assets/watering_can.json'
                });

                setTimeout(()=>{
                    sounds.water.currentTime = 0;
                sounds.water.play();},800)


                wateringAnim.addEventListener('complete', () => {

                    waterCan.remove();

                    if (selected === correctSyllable) {
                        sounds.grow.currentTime = 0;
                        sounds.grow.play();
                        anim.playSegments([6, 100], true);
                        anim.addEventListener('complete', () => {
                            answeredWords.add(selectedCard.dataset.word);
                            score += 1
                            scoreElement.textContent = score;
                            document.body.classList.remove('planting');
                            syllableButtons.style.display = 'none';
                            selectedCard.style.display = 'none';
                            isWatering = false;
                            showSuccessMessage();
                        }, { once: true });
                    } else {
                        isWatering = false;
                        const msg = document.createElement('div');
                        msg.className = 'feedback-message';
                        msg.textContent = 'Oops! Try again.';
                        setTimeout(() => { msg.style.display = 'none' }, 1000);
                        syllableButtons.insertAdjacentElement('afterend', msg);
                    }

                });
            });
        });
    }

    function createWateringCan() {
        const can = document.createElement('div');
        Object.assign(can.style, {
            position: 'absolute',
            width: '300px',
            height: '300px',
            zIndex: '1000',
            pointerEvents: 'none',
            left: '40%',
            top: '80%',
            transform: 'translate(-50%, -50%)'
        });

        document.body.appendChild(can);
        return can;
    }


    // function moveWateringCanToPlant(fromButton, canElement, onArrive) {
    //     const btnRect = fromButton.getBoundingClientRect();
    //     const targetRect = plantSpot.getBoundingClientRect();
    //     const targetX = targetRect.left + targetRect.width / 2 - 225;
    //     const targetY = targetRect.top - 50;

    //     canElement.animate([
    //         { left: `${btnRect.left}px`, top: `${btnRect.top}px` },
    //         { left: `${targetX}px`, top: `${targetY}px` }
    //     ], {
    //         duration: 200,
    //         fill: 'forwards',
    //         easing: 'ease-in-out'
    //     });

    //     setTimeout(() => {
    //         canElement.style.left = `${targetX}px`;
    //         canElement.style.top = `${targetY}px`;
    //         onArrive();
    //     }, 800);
    // }



    function showSuccessMessage() {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';

        successMsg.innerHTML = `
        <div class="message-content">
            <h2>Great Job!</h2>
            <p>You helped the plant grow!</p>
        </div>
    `;

        document.body.appendChild(successMsg);

        // Trigger the animation after a brief delay
        setTimeout(() => {
            successMsg.classList.add('show');

            // Auto-hide after 3 seconds
            setTimeout(() => {
                successMsg.classList.remove('show');
                setTimeout(() => successMsg.remove(), 500); // Wait for fade out
                anim.destroy(); // Clean up animation
                generateNewSeeds();
            }, 2000);
        }, 100);
    }

    function generateNewSeeds() {
        const seedSelection = document.querySelector('.seed-selection');
        seedSelection.innerHTML = ''; // Clear old cards

        // Filter out answered words
        const unusedWords = wordDatabase.filter(entry => !answeredWords.has(entry.word));

        // Choose 3 new random words
        const newCards = getRandomItems(unusedWords, 3);

        newCards.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'seed-card';
            card.dataset.word = entry.word;
            card.dataset.syllables = entry.syllables;

            card.innerHTML = `
            <span class="seed-icon">
                <img src="assets/seed.png" width="50" height="50"/>
            </span>
            <div class="seed-word">${capitalize(entry.word)}</div>
        `;

            card.addEventListener('click', () => {
                document.querySelectorAll('.seed-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedCard = card;

                speechSynthesis.cancel();
                speechSynthesis.speak(new SpeechSynthesisUtterance(entry.word));

                if (!planted) {
                    plantButton.style.display = 'block';
                }
            });

            seedSelection.appendChild(card);
        });

        // Reset game state
        selectedCard = null;
        planted = false;
        plantButton.style.display = 'none';
        document.querySelector('.plant-container').style.display = 'none';
    }

    function getRandomItems(arr, count) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }



});

