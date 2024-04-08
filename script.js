import { cardList } from "./cards.js"

window.addEventListener('load', function(){
    // Canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');    
    const screenWidth = document.getElementById('canvasContainer');
    let canvasWidth;
    let canvasHeight;
    let columnWidth;
    let cardWidth;
    let cardHeight;
    let padding;
    let deck;
    let deckOpen = [];
    let acePiles = [ [], [], [], [] ];
    let cardPiles = [ [], [], [], [], [], [], [] ];
    let cardSelected = false;
    let selectedCards = [];
    let moveHistory = [];
    let mouseX;
    let mouseY;
    let gameOver = false;
    let autoFinish = false;
    let autoFinishAnimations = [];
    let animating = false;
    let animatingDeckFlip = false;
    let animatingOpenDeckFlip = false;
    let animatingCardFlip = false;
    let animationCardWidth;
    let animationX;
    let animationY;
    let frame = 0;
    let cardFlipPosition = 0;
    let cardFlipPile;
    let cardMovePileIndex;
    let cardMovePileType;
    let cardMoveAnimations = [];
    let moveFrame = 0;
    let endGameAnimations = [];
    const cardIcons = [];

    const heart = new Image();
    const club = new Image();
    const diamond = new Image();
    const spade = new Image();
    heart.src = 'images/heartIcon.png';
    club.src = 'images/clubIcon.png';
    diamond.src = 'images/diamondIcon.png';
    spade.src = 'images/spadeIcon.png';
    cardIcons.push(heart, club, diamond, spade);

    const cardBack = new Image();
    cardBack.src = 'images/CardBack.png';

    const testBtn = document.getElementById('imgTitle')
    testBtn.addEventListener('click', function(){
        console.log(cardMoveAnimations)
    })

    // Call setCanvas to set the initial dimensions of cards and card areas
    setCanvas();

    // Add event listener to set card demensions on window resize
    window.addEventListener('resize', () => setCanvas());

    // Add events to handle user input
    window.addEventListener('mousedown', function(e){
        if(gameOver){
            return;
        }

        if(animating || cardMoveAnimations.length > 0){
            return;
        }

        // Flip card from deck if deck is clicked
        if(e.x > padding && e.x < padding + cardWidth && e.y > padding && e.y < padding + cardHeight){
            if(deck.length > 0){
                animationX = padding;
                animationCardWidth = cardWidth;
                animating = true;
                animatingDeckFlip = true;
            }
            flipDeckCard();
        }

        // Select card from open deck
        if(e.x > columnWidth + padding && e.x < columnWidth * 2 - padding && e.y > padding && e.y < padding + cardHeight){
            mouseX = e.x;
            mouseY = e.y;
            selectFromOpenDeck(e);
        }

        // Select card from ace piles
        if(e.x > columnWidth * 3 && e.y < cardHeight + padding * 2){
            mouseX = e.x;
            mouseY = e.y;
            selectFromAcePile(e);
        }

        // Select card from card piles
        if(e.y > cardHeight + padding * 2){
            let rowHeight = cardHeight + padding * 3;
            let pilePadding;
            let selectionFound = false;
            mouseX = e.x;
            mouseY = e.y;
            for(let i = 0; i < cardPiles.length; i++){
                if(cardPiles[i].length < 10){
                    pilePadding = padding * 8;
                } else {
                    pilePadding = padding * 6;
                }
                for(let j = 0; j < cardPiles[i].length; j++){
                    if(j === cardPiles[i].length -1){
                        if(e.x > columnWidth * i + padding && e.x < columnWidth * i + cardWidth + padding && e.y > rowHeight + pilePadding * j && e.y < rowHeight + pilePadding * j + cardHeight){
                            selectFromCardPile(e, i, j, pilePadding);                            
                            selectionFound = true;
                            break;
                        }
                    }

                    if(e.x > columnWidth * i + padding && e.x < columnWidth * i + cardWidth + padding && e.y > rowHeight + pilePadding * j && e.y < rowHeight + pilePadding * (j+1)){
                        selectFromCardPile(e, i, j, pilePadding);                
                        selectionFound = true;
                        break;
                    }
                }
                if(selectionFound){
                    break;
                }
            }
        }
        
    });

    window.addEventListener('mousemove', function(e){
        if(cardSelected) {
            mouseX = e.x;
            mouseY = e.y;
        }
    });

    window.addEventListener('mouseup', function(){
        if(cardSelected){
            let targetPile = getTargetPile();
            if(targetPile !== null){
                checkTargetPile(targetPile);
            }
            clearSelectedCards();
            cardSelected = false;
            selectedCards = [];
        }
    });

    canvas.addEventListener('mouseleave', function(){
        if(cardSelected){
            clearSelectedCards();
            cardSelected = false;
            selectedCards = [];
        }
    })

    const newGameButton = document.getElementById("newGameBtn");
    newGameButton.addEventListener('click', () => startNewGame());

    const undoButton = document.getElementById('undoBtn');
    undoButton.addEventListener('click', () => undo())

    // Sets up the canvas, card, cell and padding dimensions
    function setCanvas() {
        canvasWidth = screenWidth.clientWidth * 0.7;
        canvasHeight = screenWidth.clientWidth * 0.5;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        columnWidth = canvasWidth / 7;
        cardWidth = columnWidth * 0.95;
        cardHeight = cardWidth * 1.36;
        padding = columnWidth * 0.025;
    }

    // Setup and shuffle the deck
    function deckSetUp(){
        const newDeck = []

        // Create card objects and add to deck
        for(let i = 0; i < cardList.length; i++){
            const image = new Image();
            image.src = `images/${cardList[i].image}`;
            const newCard = {
                suit: cardList[i].suit,
                number: cardList[i].number,
                image: image
            }
            newDeck.push(newCard);
        }
    
        // Shuffle deck
        for(let i = newDeck.length - 1; i > 0; i--){
            let randomIndex = Math.floor(Math.random() * i);
            let temp = newDeck[i];
            newDeck[i] = newDeck[randomIndex];
            newDeck[randomIndex] = temp;
        }

        return newDeck;
    }

    // Deal cards at start of game
    function dealCards() {
        for(let i = 0; i < cardPiles.length; i++){
            for(let j = 0; j < i + 1; j++){
                const newPileCard = {
                    position: "down",
                    selected: false,
                    moving: false,
                    card: deck.pop()
                }

                if(j === i) {
                    newPileCard.position = "up";
                }

                cardPiles[i].push(newPileCard);
            }
        }
    }

    ////////////////////////
    // Gameplay functions //
    ////////////////////////

    function flipDeckCard(){
        addMoveHistory();
        if(deck.length > 0){
            deckOpen.push(deck.pop());
        } else {
            deck = deckOpen.reverse();
            deckOpen = [];
        }
    }

    function selectFromOpenDeck(e){      
        if(deckOpen.length > 0){
            const selectedCard = {
                offsetX: e.x - (columnWidth + padding),
                offsetY: e.y - padding,
                currentPile: "openDeck",
                card: deckOpen[deckOpen.length - 1]
            }

            selectedCards.push(selectedCard);
            cardSelected = true;
        }
    }

    function selectFromAcePile(e){
        for(let i = 3; i < 7; i++){
            if(e.x > i * columnWidth + padding && e.x < columnWidth * (i + 1) - padding && e.y > padding && e.y < padding + cardHeight){
                if(acePiles[i-3].length > 1){
                    acePiles[i-3][acePiles[i-3].length-1].selected = true;
                    const selectedCard = {
                        offsetX: e.x - (columnWidth * i + padding),
                        offsetY: e.y - padding,
                        currentPile: `ace${i-2}`,
                        card: acePiles[i-3][acePiles[i-3].length-1].card
                    }
        
                    selectedCards.push(selectedCard);
                    cardSelected = true;
                }
            }
        }
    }

    function selectFromCardPile(e, cardPile, index, pilePadding){
        if(cardPiles[cardPile][index].position === "up"){
            for(let i = index; i < cardPiles[cardPile].length; i++){
                const selectedCard = {
                    offsetX: e.x - (columnWidth * cardPile + padding),
                    offsetY: e.y - (cardHeight + padding * 3 + pilePadding * i),
                    currentPile: cardPile,
                    card: cardPiles[cardPile][i].card
                }

                cardPiles[cardPile][i].selected = true;
                selectedCards.push(selectedCard);
            }
            cardSelected = true;
        }
    }

    function clearSelectedCards(){
        let pileToClear = selectedCards[0].currentPile
        if(pileToClear !== "openDeck" && pileToClear !== "ace1" && pileToClear !== "ace2" && pileToClear !== "ace3" && pileToClear !== "ace4"){
            for(let i = 0; i < cardPiles[pileToClear].length; i++){
                cardPiles[pileToClear][i].selected = false;
            }
        }
    
        if(pileToClear === "ace1" || pileToClear === "ace2" || pileToClear === "ace3" || pileToClear === "ace4"){
            let index = setAcePileToIndex(pileToClear);
            acePiles[index][acePiles[index].length-1].selected = false;
        }
    }

    function getTargetPile(){
        let left = mouseX - selectedCards[0].offsetX;
        let top = mouseY - selectedCards[0].offsetY;
        let right = mouseX + (cardWidth - selectedCards[0].offsetX);
        let bottom = mouseY + (cardHeight - selectedCards[0].offsetY);
        let targetPiles = [];
        let xCoverage;
        let yCoverage;
        let totalCoverage;

        // Check ace piles
        if(selectedCards.length === 1 && top < cardHeight + padding * 2){
            for(let i = 3; i < 7; i++){
                if(left > columnWidth * i + padding && left < columnWidth * (i+1) - padding && top > padding && top < cardHeight + padding){
                    const acePile = setAcePile(i);
                    xCoverage = (columnWidth * (i+1) - padding - left);
                    yCoverage = (cardHeight + padding) - top;
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: acePile,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }

                if(right > columnWidth * i + padding && right < columnWidth * (i+1) - padding && top > padding && top < cardHeight + padding){
                    const acePile = setAcePile(i);
                    xCoverage = right - (columnWidth * i + padding);
                    yCoverage = (cardHeight + padding) - top;
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: acePile,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }

                if(left > columnWidth * i + padding && left < columnWidth * (i+1) - padding && bottom < padding + cardHeight && bottom > padding){
                    const acePile = setAcePile(i);
                    xCoverage = (columnWidth * (i+1) - padding - left);
                    yCoverage = bottom - padding;
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: acePile,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }

                if(right > columnWidth * i + padding && right < columnWidth * (i+1) - padding && bottom < padding + cardHeight && bottom > padding){
                    const acePile = setAcePile(i);
                    xCoverage = right - (columnWidth * i + padding);
                    yCoverage = bottom - padding;
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: acePile,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }
            }
        }

        // Check card piles
        if(bottom > cardHeight + padding * 3){
            const rowHeight = cardHeight + padding * 3;
            for(let i = 0; i < 7; i++){
                let pileHeight = rowHeight + cardHeight;
                if(cardPiles[i].length > 1){
                    if(cardPiles[i].length < 10){
                        pileHeight += (cardPiles[i].length * (padding * 8));
                    } else {
                        pileHeight +=(cardPiles[i].length * (padding * 6));
                    }
                }

                if(left > columnWidth * i + padding && left < columnWidth * (i+1) - padding && top > rowHeight && top < rowHeight + pileHeight){
                    xCoverage = (columnWidth * (i+1) - padding - left);
                    yCoverage = (rowHeight + pileHeight) - top;
                    if(yCoverage > cardHeight){
                        yCoverage = cardHeight;
                    }
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: i,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }

                if(right > columnWidth * i + padding && right < columnWidth * (i+1) - padding && top > rowHeight && top < rowHeight + pileHeight){
                    xCoverage = right - (columnWidth * i + padding);
                    yCoverage = (rowHeight + pileHeight) - top;
                    if(yCoverage > cardHeight){
                        yCoverage = cardHeight;
                    }
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: i,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }

                if(left > columnWidth * i + padding && left < columnWidth * (i+1) - padding && bottom < rowHeight + pileHeight && bottom > rowHeight){                    
                    xCoverage = (columnWidth * (i+1) - padding - left);
                    yCoverage = bottom - rowHeight;
                    if(yCoverage > cardHeight){
                        yCoverage = cardHeight;
                    }
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: i,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }

                if(right > columnWidth * i + padding && right < columnWidth * (i+1) - padding && bottom < rowHeight + pileHeight && bottom > rowHeight){
                    xCoverage = right - (columnWidth * i + padding);
                    yCoverage = bottom - rowHeight;
                    if(yCoverage > cardHeight){
                        yCoverage = cardHeight;
                    }
                    totalCoverage = xCoverage * yCoverage;

                    const area = {
                        pile: i,
                        coverage: totalCoverage
                    }
                    targetPiles.push(area);
                }
            }
        }

        for(let i = 0; i < targetPiles.length; i++){
            for(let j = 0; j < targetPiles.length-1; j++){
                if(targetPiles[j].coverage < targetPiles[j+1].coverage){
                    let temp = targetPiles[j];
                    targetPiles[j] = targetPiles[j+1];
                    targetPiles[j+1] = temp;
                }
            }
        }
        
        if(targetPiles.length < 1) return null;
        return targetPiles;
    }

    function setAcePile(i){
        let acePile;
        switch(i){
            case 3:
                acePile = "ace1";
                break;
            case 4:
                acePile = "ace2";
                break;
            case 5:
                acePile = "ace3";
                break;
            case 6:
                acePile = "ace4";
                break;
        }
        return acePile;
    }

    function setAcePileToIndex(pile){
        let index = null;
        switch(pile){
            case "ace1":
                index = 0;
                break;
            case "ace2":
                index = 1;
                break;
            case "ace3":
                index = 2;
                break;
            case "ace4":
                index = 3;
                break;
        }
        return index;
    }
    
    function checkTargetPile(targetPiles){
        let targetPile;
        for(let i = 0; i < targetPiles.length; i++){
            targetPile = targetPiles[i].pile;
            if(targetPile === "ace1" || targetPile === "ace2" || targetPile === "ace3" || targetPile === "ace4"){
                let acePile = setAcePileToIndex(targetPile);
                
                if(acePiles[acePile].length < 1){
                    if(selectedCards[0].card.number === 1){
                        addMoveHistory();
                        moveToTargetPile(acePile, "ace");
                        break;
                    }
                } else if(selectedCards[0].card.suit === acePiles[acePile][0].card.suit && selectedCards[0].card.number === acePiles[acePile][acePiles[acePile].length-1].card.number + 1){
                    addMoveHistory();
                    moveToTargetPile(acePile, "ace");
                    break;
                }
            } else {
                if(cardPiles[targetPile].length > 0){
                    let selectedColour;
                    let targetColour;
        
                    if(selectedCards[0].card.suit === "spade" || selectedCards[0].card.suit === "club"){
                        selectedColour = "black";
                    } else {
                        selectedColour = "red";
                    }
        
                    if(cardPiles[targetPile][cardPiles[targetPile].length-1].card.suit === "spade" || cardPiles[targetPile][cardPiles[targetPile].length-1].card.suit === "club"){
                        targetColour = "black";
                    } else {
                        targetColour = "red";
                    }
        
                    if(selectedColour !== targetColour && cardPiles[targetPile][cardPiles[targetPile].length-1].card.number === selectedCards[0].card.number +1){
                        addMoveHistory();
                        moveToTargetPile(targetPile, "cardPile");
                        break;
                    }
                } else if(selectedCards[0].card.number === 13) {
                    addMoveHistory();
                    moveToTargetPile(targetPile, "cardPile");
                    break;
                }
            }
        }
    }

    function moveToTargetPile(targetPile, pileType){
        const previousPile = selectedCards[0].currentPile;
        if(pileType === "ace"){
            if(previousPile === "openDeck"){
                const newCard = {
                    position: "up",
                    selected: false,
                    moving: true,
                    card: deckOpen.pop()
                }
                setUpCardMoveAnimations(targetPile, pileType, acePiles[targetPile].length);
                acePiles[targetPile].push(newCard);                
            } else {
                const cardToMove = cardPiles[previousPile].pop();
                cardToMove.selected = false;
                cardToMove.moving = true;
                setUpCardMoveAnimations(targetPile, pileType, acePiles[targetPile].length);
                acePiles[targetPile].push(cardToMove);
                if(cardPiles[previousPile].length > 0){
                    if(cardPiles[previousPile][cardPiles[previousPile].length -1].position === "down"){
                        cardPiles[previousPile][cardPiles[previousPile].length -1].position = "up";
                        animating = true;
                        animatingCardFlip = true;
                        animationCardWidth = cardWidth;
                        cardFlipPile = previousPile;
                        cardFlipPosition = 0;
                        animationX = columnWidth * previousPile + padding;
                    }
                }
            }
        } else {
            if(previousPile === "openDeck"){
                const newCard = {
                    position: "up",
                    selected: false,
                    moving: true,
                    card: deckOpen.pop()
                }
                setUpCardMoveAnimations(targetPile, pileType, cardPiles[targetPile].length);
                cardPiles[targetPile].push(newCard);
            } else if(previousPile === "ace1" || previousPile === "ace2" || previousPile === "ace3" || previousPile === "ace4"){
                const index = setAcePileToIndex(previousPile);
                const cardToMove = acePiles[index].pop();
                cardToMove.selected = false;
                cardToMove.moving = true;
                setUpCardMoveAnimations(targetPile, pileType, cardPiles[targetPile].length);
                cardPiles[targetPile].push(cardToMove);
            } else {
                const cardsToMove = [];
                for(let i = 0; i < selectedCards.length; i++){
                    const card = cardPiles[previousPile].pop();
                    card.selected = false;
                    card.moving = true;
                    cardsToMove.push(card);
                }

                setUpCardMoveAnimations(targetPile, pileType, cardPiles[targetPile].length);
                for(let i = 0; i < selectedCards.length; i++){
                    cardPiles[targetPile].push(cardsToMove.pop());
                }

                if(cardPiles[previousPile].length > 0){
                    if(cardPiles[previousPile][cardPiles[previousPile].length -1].position === "down"){
                        cardPiles[previousPile][cardPiles[previousPile].length -1].position = "up";
                        animating = true;
                        animatingCardFlip = true;
                        animationCardWidth = cardWidth;
                        cardFlipPile = previousPile;
                        cardFlipPosition = 0;
                        animationX = columnWidth * previousPile + padding;
                    }
                }
            }
        }        
    }

    function setUpCardMoveAnimations(targetPile, pileType, targetPileLength){
        cardMovePileIndex = targetPile;
        cardMovePileType = pileType;
        let xTarget;
        let pilePadding;

        if(pileType === "ace"){
            xTarget = columnWidth * 3 + columnWidth * targetPile + padding;
        } else {
            xTarget = columnWidth * targetPile + padding;
        }

        if(pileType === "cardPile"){
            pilePadding = (cardPiles[targetPile].length < 10) ? padding * 8 : padding * 6;
        }

        for(let i = 0; i < selectedCards.length; i++){
            let yTarget;
            let currentX = mouseX - selectedCards[i].offsetX;
            let currentY = mouseY - selectedCards[i].offsetY;

            if(pileType === "cardPile"){
                yTarget = (cardHeight + padding * 3) + pilePadding * (targetPileLength + i);
            } else {
                yTarget = padding
            }
            
            const movingCard = {
                x: currentX,
                y: currentY,
                targetX: xTarget,
                targetY: yTarget,
                xSpeed: Math.abs((xTarget - currentX) / 5),
                ySpeed: Math.abs((yTarget - currentY) / 5),
                xDirection: (xTarget < currentX) ? 0 : 1,
                yDirection: (yTarget < currentY) ? 0 : 1,
                image: selectedCards[i].card.image
            }

            cardMoveAnimations.push(movingCard);
        }
    }

    function checkGameOver(){
        if(acePiles[0].length === 13 && acePiles[1].length === 13 && acePiles[2].length === 13 && acePiles[3].length === 13){
            gameOver = true;
            autoFinish = false;
            document.getElementById('endGameMsg').style.display = 'block';
        }
    }

    function checkAutoFinish(){
        if(deck.length === 0 && deckOpen.length === 0){
            let cardDown = false;
            for(let i = 0; i < cardPiles.length; i++){
                for(let j = 0; j < cardPiles[i].length; j++){
                    if(cardPiles[i][j].position === "down") cardDown = true;
                }
            }
            
            if(!cardDown){
                autoFinish = true;
                animating = true;                
            }
        }
    }

    function startNewGame(){
        document.getElementById('endGameMsg').style.display = 'none';
        gameOver = false;
        animating = false;
        deckOpen = [];
        acePiles = [ [], [], [], [] ];
        cardPiles = [ [], [], [], [], [], [], [] ];
        endGameAnimations = [];
        deck = deckSetUp();
        dealCards();
    }

    startNewGame();

    function addMoveHistory(){
        let cardPilesState = [ [], [], [], [], [], [], [] ];

        for(let i = 0; i < cardPilesState.length; i++){
            for(let j = 0; j < cardPiles[i].length; j++){
                const card = {
                    position: cardPiles[i][j].position,
                    selected: false,
                    moving: false,
                    card: cardPiles[i][j].card
                }
                cardPilesState[i].push(card);
            }
        }

        let move = {
            deck: [...deck],
            openDeck: [...deckOpen],
            acePiles: [[...acePiles[0]], [...acePiles[1]], [...acePiles[2]], [...acePiles[3]]],
            cardPiles: cardPilesState
        }
        moveHistory.push(move);
    }

    function undo(){
        if(gameOver) return;
        if(moveHistory.length > 0){
            let lastMove = moveHistory.pop();
            deck = lastMove.deck;
            deckOpen = lastMove.openDeck;
            acePiles = lastMove.acePiles;
            cardPiles = lastMove.cardPiles;
        }
    }
    
    /////////////////////
    // Draw functions  //
    /////////////////////

    function drawDeckPile() {
        ctx.shadowOffsetY = -2;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.411)';
        ctx.shadowBlur = 5;
        if(deck.length > 0){            
            ctx.drawImage(cardBack, padding, padding, cardWidth, cardHeight);
            if(animatingDeckFlip){
                drawDeckPileFlip();
            }
        } else {
            ctx.fillStyle = "rgb(0, 100, 0)";
            ctx.fillRect(padding, padding, cardWidth, cardHeight);
            if(animatingDeckFlip){
                drawDeckPileFlip();
            }
        }
    }

    function drawOpenDeckPile() {
        if(deckOpen.length > 1){
            if(selectedCards.length > 0 && selectedCards[0].currentPile === "openDeck"){
                ctx.drawImage(deckOpen[deckOpen.length - 2].image, columnWidth + padding, padding, cardWidth, cardHeight);
            } else {
                if(animatingOpenDeckFlip){
                    ctx.drawImage(deckOpen[deckOpen.length - 2].image, columnWidth + padding, padding, cardWidth, cardHeight);
                    drawOpenDeckPileFlip();
                } else {
                    if(animatingDeckFlip){
                        ctx.drawImage(deckOpen[deckOpen.length - 2].image, columnWidth + padding, padding, cardWidth, cardHeight);    
                    } else {
                        ctx.drawImage(deckOpen[deckOpen.length - 1].image, columnWidth + padding, padding, cardWidth, cardHeight);
                    }
                }
            }
        } else if(deckOpen.length === 1){
            if(selectedCards.length > 0 && selectedCards[0].currentPile === "openDeck"){
                ctx.fillStyle = "rgba(0, 90, 0, 0.4)";
                ctx.fillRect(columnWidth + padding, padding, cardWidth, cardHeight);
            } else {
                if(animatingOpenDeckFlip){
                    ctx.fillStyle = "rgba(0, 90, 0, 0.4)";
                    ctx.fillRect(columnWidth + padding, padding, cardWidth, cardHeight);
                    drawOpenDeckPileFlip();
                } else {
                    if(animatingDeckFlip){
                        ctx.fillStyle = "rgba(0, 90, 0, 0.4)";
                        ctx.fillRect(columnWidth + padding, padding, cardWidth, cardHeight);
                    } else {
                        ctx.drawImage(deckOpen[deckOpen.length - 1].image, columnWidth + padding, padding, cardWidth, cardHeight);
                    }
                }
            }
        } else {
            ctx.fillStyle = "rgba(0, 90, 0, 0.4)";
            ctx.fillRect(columnWidth + padding, padding, cardWidth, cardHeight);
        }
    }

    function drawAcePiles() {
        ctx.fillStyle = "rgba(0, 90, 0, 0.4)";

        for(let i = 0; i < acePiles.length; i++) {
            if(acePiles[i].length === 0) {
                ctx.fillRect(columnWidth * 3 + columnWidth * i, padding, cardWidth, cardHeight);
            } else {
                if(acePiles[i][acePiles[i].length-1].selected === true){
                    ctx.drawImage(acePiles[i][acePiles[i].length-2].card.image, columnWidth * (i + 3) + padding, padding, cardWidth, cardHeight);
                } else if(acePiles[i][acePiles[i].length-1].moving === true){
                    if(acePiles[i].length === 1){
                        ctx.fillRect(columnWidth * 3 + columnWidth * i, padding, cardWidth, cardHeight);
                    } else {
                        ctx.drawImage(acePiles[i][acePiles[i].length-2].card.image, columnWidth * (i + 3) + padding, padding, cardWidth, cardHeight);
                    }
                    
                } else {
                    ctx.drawImage(acePiles[i][acePiles[i].length-1].card.image, columnWidth * (i + 3) + padding, padding, cardWidth, cardHeight);
                }
            }
        }
    }

    function drawCardPiles() {
        let pilePadding;
        for(let i = 0; i < cardPiles.length; i++){
            if(cardPiles[i].length > 0){
                if(cardPiles[i].length < 10){
                    pilePadding = padding * 8;
                } else {
                    pilePadding = padding * 6;
                }

                if(animatingCardFlip && cardFlipPile === i){
                    animationY = (pilePadding * (cardPiles[i].length-1)) + (cardHeight + padding * 3);
                }

                for(let j = 0; j < cardPiles[i].length; j++){
                    if(cardPiles[i][j].position === "up" && cardPiles[i][j].selected === false && cardPiles[i][j].moving === false){
                        if(j === cardPiles[i].length-1 && animatingCardFlip && cardFlipPile === i){
                            drawCardPileFlip();
                        } else {
                            ctx.drawImage(cardPiles[i][j].card.image, columnWidth * i + padding, cardHeight + padding * 3 + (j * pilePadding), cardWidth, cardHeight);
                        }
                    } else if (cardPiles[i][j].position === "down"){
                        ctx.drawImage(cardBack, columnWidth * i + padding, cardHeight + padding * 3 + (j * pilePadding), cardWidth, cardHeight);
                    }
                }
            }
        }
    }

    function drawSelectedCards(){
        if(selectedCards.length > 0){
            for(let i = 0; i < selectedCards.length; i++){
                ctx.drawImage(selectedCards[i].card.image, mouseX - selectedCards[i].offsetX, mouseY - selectedCards[i].offsetY, cardWidth, cardHeight);
            }
        }
    }

    /////////////////////////
    // Animation Functions //
    /////////////////////////

    function drawDeckPileFlip(){
        frame++;
        if(frame % 2 === 0){
            animationX += 50;
            animationCardWidth -= 50;
            if(animationCardWidth <= 0){
                animatingDeckFlip = false;
                frame = 0;
                animationCardWidth = 0;
                animatingOpenDeckFlip = true;
            } else {
                ctx.drawImage(cardBack, animationX, padding, animationCardWidth, cardHeight);
            }
        }
    }

    function drawOpenDeckPileFlip(){
        frame++;
        if(frame % 2 === 0){
            animationCardWidth += 50;            
        }

        if(animationCardWidth >= cardWidth){
            animationCardWidth = cardWidth;
            animating = false;
            frame = 0;
            animatingOpenDeckFlip = false;
        }

        ctx.drawImage(deckOpen[deckOpen.length - 1].image, columnWidth + padding, padding, animationCardWidth, cardHeight);
    }
    
    function drawCardPileFlip(){
        frame++;
        if(frame % 2 === 0){
            if(cardFlipPosition === 0){
                animationX += 30;
                animationCardWidth -= 60;
            } else {
                animationX -= 30;
                animationCardWidth += 60;
            }
        }

        if(animationCardWidth <= 0){
            cardFlipPosition = 1;
            animationCardWidth = 0;
        }

        if(cardFlipPosition === 1){
            if(animationCardWidth >= cardWidth){
                animationCardWidth = cardWidth;
                frame = 0;
                animating = false;
                animatingCardFlip = false;
            }
        }

        if(cardFlipPosition === 0){
            ctx.drawImage(cardBack, animationX, animationY, animationCardWidth, cardHeight);
        } else {
            ctx.drawImage(cardPiles[cardFlipPile][cardPiles[cardFlipPile].length-1].card.image, animationX, animationY, animationCardWidth, cardHeight);
        }
    }

    function drawCardMoveAnimations(){
        moveFrame++;
        
        cardMoveAnimations.forEach((card) => {
            if(moveFrame % 2 === 0){
                if(card.xDirection === 1){
                    card.x += card.xSpeed;
                    if(card.x >= card.targetX) card.x = card.targetX;
                } else {
                    card.x -= card.xSpeed;
                    if(card.x <= card.targetX) card.x = card.targetX;
                }
    
                if(card.yDirection === 1){
                    card.y += card.ySpeed;
                    if(card.y >= card.targetY) card.y = card.targetY;             
                } else {
                    card.y -= card.ySpeed;
                    if(card.y <= card.targetY) card.y = card.targetY
                }
            }
            ctx.drawImage(card.image, card.x, card.y, cardWidth, cardHeight);
        })

        if(cardMoveAnimations[0].x === cardMoveAnimations[0].targetX && cardMoveAnimations[0].y === cardMoveAnimations[0].targetY){
            moveFrame = 0;
            cardMoveAnimations = [];
            if(cardMovePileType === "ace"){
                acePiles[cardMovePileIndex].forEach((card) => {
                    card.moving = false;
                })
            } else {
                cardPiles[cardMovePileIndex].forEach((card) => {
                    card.moving = false;
                })
            }
        }
    }

    function drawAutoFinishAnimations(){
        if(autoFinishAnimations.length < 1){
            let currentX;
            let currentY;
            let xTarget;
            let yTarget;
            let pilePadding;

            for(let i = 0; i < cardPiles.length; i++){
                if(cardPiles[i].length > 0){
                    for(let j = 0; j < acePiles.length; j++){
                        if(cardPiles[i][cardPiles[i].length-1].card.suit === acePiles[j][acePiles[j].length-1].card.suit && cardPiles[i][cardPiles[i].length-1].card.number === acePiles[j][acePiles[j].length-1].card.number + 1){
                            
                            pilePadding = (cardPiles[i].length < 10) ? padding * 8 : padding * 6;
    
                            currentX = columnWidth * i + padding;
                            currentY = (cardHeight + padding * 3) + pilePadding * cardPiles[i].length;
                            xTarget = (columnWidth * 3) + columnWidth * j + padding;
                            yTarget = padding;
                            cardMovePileIndex = j;
    
                            const card = {
                                x: currentX,
                                y: currentY,
                                targetX: xTarget,
                                targetY: yTarget,
                                xSpeed: Math.abs((xTarget - currentX) / 5),
                                ySpeed: Math.abs((yTarget - currentY) / 5),
                                xDirection: (xTarget < currentX) ? 0 : 1,
                                yDirection: (yTarget < currentY) ? 0 : 1,
                                image: cardPiles[i][cardPiles[i].length-1].card.image
                            }
                            autoFinishAnimations.push(card);
    
                            const cardToMove = cardPiles[i].pop();
                            cardToMove.moving = true;
                            acePiles[j].push(cardToMove);
                            break;
                        }
                    }
                }
                if(autoFinishAnimations.length > 0) break;
            }
        } else {
            moveFrame++;

            if(moveFrame % 2 === 0){
                if(autoFinishAnimations[0].xDirection === 1){
                    autoFinishAnimations[0].x += autoFinishAnimations[0].xSpeed;
                    if(autoFinishAnimations[0].x >= autoFinishAnimations[0].targetX) autoFinishAnimations[0].x = autoFinishAnimations[0].targetX;
                } else {
                    autoFinishAnimations[0].x -= autoFinishAnimations[0].xSpeed;
                    if(autoFinishAnimations[0].x <= autoFinishAnimations[0].targetX) autoFinishAnimations[0].x = autoFinishAnimations[0].targetX;
                }

                if(autoFinishAnimations[0].yDirection === 1){
                    autoFinishAnimations[0].y += autoFinishAnimations[0].ySpeed;
                    if(autoFinishAnimations[0].y >= autoFinishAnimations[0].targetY) autoFinishAnimations[0].y = autoFinishAnimations[0].targetY;
                } else {
                    autoFinishAnimations[0].y -= autoFinishAnimations[0].ySpeed;
                    if(autoFinishAnimations[0].y <= autoFinishAnimations[0].targetY) autoFinishAnimations[0].y = autoFinishAnimations[0].targetY;
                }
            }
            ctx.drawImage(autoFinishAnimations[0].image, autoFinishAnimations[0].x, autoFinishAnimations[0].y, cardWidth, cardHeight);

            if(autoFinishAnimations[0].x === autoFinishAnimations[0].targetX && autoFinishAnimations[0].y === autoFinishAnimations[0].targetY){
                moveFrame = 0;
                autoFinishAnimations = [];
                acePiles[cardMovePileIndex][acePiles[cardMovePileIndex].length-1].moving = false;
            }
        }
    }

    function drawEndGameAnimations(){
        if(endGameAnimations.length < 100){
            const icon = {
                image: cardIcons[Math.floor(Math.random() * 4)],
                x: Math.floor(Math.random() * canvasWidth),
                y: -40,
                speed: Math.floor(Math.random() * 10) + 5,
                delete: false
            }
            endGameAnimations.push(icon);
        }

        frame++;

        if(frame % 2 === 0){
            endGameAnimations.forEach((icon) => {
                icon.y += icon.speed;
                if(icon.y > canvasHeight + 40){
                    icon.delete = true;
                }
            })
        }

        endGameAnimations.forEach((icon) => {
            ctx.drawImage(icon.image, icon.x, icon.y, 40, 40);
        })

        endGameAnimations = endGameAnimations.filter(icon => !icon.delete);
    }

    function animate() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        drawDeckPile();
        drawOpenDeckPile();
        drawAcePiles();
        drawCardPiles();
        drawSelectedCards();
        if(autoFinishAnimations.length === 0) checkGameOver();

        if(cardMoveAnimations.length > 0) drawCardMoveAnimations();

        if(gameOver) drawEndGameAnimations();

        if(!autoFinish && !gameOver) checkAutoFinish();
        if(autoFinish) drawAutoFinishAnimations();

        requestAnimationFrame(animate);
    }

    animate();
})