window.onload = function () {
    // all board rows:
    let boardRows = document.getElementsByClassName("board-row");

    // in this variable we will decide who's turn it is
    let isWhitesTurn = true;

    // in this variable we will store pieces of given color
    let pieces;

    let isBlackKingInCheck = false;

    let isWhiteKingInCheck = false;

    let isDoubleCheck = false;

    let whiteKingHasMoved = false;
    let blackKingHasMoved = false;
    let whiteLeftRookHasMoved = false;
    let whiteRightRookHasMoved = false;
    let blackLeftRookHasMoved = false;
    let blackRightRookHasMoved = false;

    // to check for checkmate
    let thereIsOnlyKingToPlayWith = false;
    let gameOver = false;

    const statusBarPar = document.getElementById("status-bar").firstElementChild;

    function startTurn() {
        if (gameOver){
           return;  
        }        
        // depending on who's turn it is and if there is a check, choose pieces
        if (isWhitesTurn && !(isWhiteKingInCheck)) {
            statusBarPar.textContent = "White to play.";
            pieces = document.getElementsByClassName("white piece");
        } else if (isWhitesTurn && isWhiteKingInCheck) {
            statusBarPar.textContent = "White to play. White is in check!";
            pieces = getPiecesToPlayInCheck();
            // for checkmate purposes, check if the only piece to play with is king
            if (pieces.length === 1){//there is only king to play with
                thereIsOnlyKingToPlayWith = true;
            } else {
                thereIsOnlyKingToPlayWith = false;
            }
        } else if (!(isWhitesTurn) && !(isBlackKingInCheck)) {
            statusBarPar.textContent = "Black to play.";
            pieces = document.getElementsByClassName("black piece");
        } else if (!(isWhitesTurn) && isBlackKingInCheck) {
            statusBarPar.textContent = "Black to play. Black is in check!";
            pieces = getPiecesToPlayInCheck();
            // for checkmate purposes, check if the only piece to play with is king
            if (pieces.length === 1){//there is only king to play with
                thereIsOnlyKingToPlayWith = true;
            } else {
                thereIsOnlyKingToPlayWith = false;
            }
        }        

        for (let piece of pieces) {
            piece.addEventListener("click", handlePieceClick, { once: true });
        }
    }

    // this function will handle what happens after user clicks a piece
    function handlePieceClick(event) {
        let piece = event.target;

        // handle when the user clicks the same piece twice - cancel / remove highlighted moves
        piece.addEventListener("click", function cancelHandler(ev) {
            ev.preventDefault();
            cleanUp();
            startTurn();
        }, { once: true });

        // handle if the user clicks on a different piece, which is of his color - cancel moves
        if (isWhitesTurn) {// depending on who's turn it is, choose pieces
            pieces = document.getElementsByClassName("white piece");
        } else {
            pieces = document.getElementsByClassName("black piece");
        }

        for (let piece of pieces) {
            piece.addEventListener("click", function cancelDiffHandler(ev) {
                ev.preventDefault();
                cleanUp();
                startTurn();
            }, { once: true });
        }

        // At this point, take care of legal moves
        let legalMoves = [];
        // we gotta decide, in case this is not a 'check' situation, find normal legal moves
        // but, if it is check, find only moves which prevent or are legal in check
        if (isBlackKingInCheck || isWhiteKingInCheck) {
            legalMoves = findLegalCheckMoves(piece);
        } else {
            legalMoves = findLegalMoves(piece);
        }

        //HIGHLIGHT MOVES WHICH ARE TO EMPTY SQUARES
        legalMoves = highlightMoves(legalMoves);

        // here we add event listeners to each legal move. If it will be clicked, we will handle the move.
        for (let legalMove of legalMoves) {
            legalMove.addEventListener("click", function moveHandler(event) {
                event.preventDefault();

                // we gotta check if this was pawn's speacial move
                if (thisIsPawnsSpecialMove(piece, legalMove)) {// if yes, mark the pawn, for en passant purposes
                    piece.classList.add("jumped");
                }

                // we gotta check if this is not a PROMOTION of a pawn
                if (thisIsPawnPromotionMove(piece, legalMove)) {
                    moveAndPromote(piece, legalMove);
                } else if (thisIsEnPassantMove(piece, legalMove)) {// now we gotta check if this was a en passant move
                    enPassant(piece, legalMove);
                } else if (thisIsCastleMove(piece, legalMove)) { // if yes, do not do normal move, but castle instead
                    castle(piece, legalMove);
                } else {//otherwise do normal move
                    moveToSquare(piece, legalMove, false);
                }

                let isWhite = piece.classList.contains("white");
                // once we moved - it cannot be check anymore.- logically
                isWhiteKingInCheck = false;
                isBlackKingInCheck = false;

                // the only possiblity is that we gave a check to opponent, this we check below:
                // here we will store how many pieces checks the king
                let nrOfCheckingPieces = isKingInCheck(isWhite);

                // the color of potentially checked king
                let checkedKingColor = isWhite ? "black" : "white";
                // below, based on number of checking pieces and color, we raise the flag
                if (checkedKingColor === "white" && nrOfCheckingPieces > 0) {
                    isWhiteKingInCheck = true;
                } else if (checkedKingColor === "black" && nrOfCheckingPieces > 0) {
                    isBlackKingInCheck = true;
                } else if (checkedKingColor === "white" && nrOfCheckingPieces === 0) {
                    isWhiteKingInCheck = false;
                } else if (checkedKingColor === "black" && nrOfCheckingPieces === 0) {
                    isBlackKingInCheck = false;
                }

                if (nrOfCheckingPieces >= 2) {
                    isDoubleCheck = true;
                } else if (nrOfCheckingPieces < 2) {
                    isDoubleCheck = false;
                }

                isWhitesTurn = !isWhitesTurn;

                cleanUp();

                // next turn
                startTurn();
            }, { once: true });
        }
    }

    function moveAndPromote(piece, legalMove) {
        console.log("just went into move and promote.");
        let popup;
        const isWhite = piece.classList.contains("white");
        const sameColor = isWhite ? "white" : "black";
        if (isWhite) {
            popup = document.getElementById("popup-white");
        } else {
            popup = document.getElementById("popup-black");
        }
        // legal move indexes, so I can find the pawn later
        const legalMoveRow = getRowIndex(legalMove);
        const legalMoveCol = getColumnsIndex(legalMove);


        // move the piece to new square
        let squareElement = document.createElement("span");
        squareElement.className = "square";
        piece.parentElement.appendChild(squareElement);
        piece.parentElement.removeChild(piece);
        legalMove.parentElement.appendChild(piece);
        legalMove.parentElement.removeChild(legalMove);

        const rect = piece.getBoundingClientRect();

        popup.style.left = `${rect.right + 10}px`;
        popup.style.top = `${rect.top}px`;

        popup.classList.toggle("hidden");
        // cleanup previous listeners:
        for (let figure of popup.children) {
            const clone = figure.cloneNode(true);
            figure.replaceWith(clone);
        }

        for (let figure of popup.children) {
            figure.addEventListener("click", function promote(event) {
                console.log("I am looking and this figure: " + figure.firstElementChild.src);
                event.preventDefault();

                // FIND THE ACTUAL PAWN
                const maxRow = isWhite ? 0 : 7;
                let allPawns = document.getElementsByClassName(sameColor + " piece pawn");
                let thePawn;
                for (let aPawn of allPawns) {
                    console.log("We are actually looking at this pawn: " + getRowIndex(aPawn) + " and col: " + getColumnsIndex(aPawn));
                    if (getRowIndex(aPawn) === maxRow) {
                        thePawn = aPawn;
                        break;
                    }
                }

                if (thePawn === undefined) {
                    console.log("The pawn was not found.");
                    return;
                } else {
                    console.log("the pawn is still defined. and it is: " + getRowIndex(thePawn) + " and col: " + getColumnsIndex(thePawn));
                }

                let classListToAdd;
                let newSrc;
                // now based on the piece type change clothes of the pawn to new piece
                const selectedPiece = event.target;
                const imageType = selectedPiece.getAttribute('src');
                if (imageType.includes("queen")) {
                    classListToAdd = "queen";
                    newSrc = `./queen_${sameColor}.svg`;
                } else if (imageType.includes("rook")) {
                    classListToAdd = "rook";
                    newSrc = `./rook_${sameColor}.svg`;
                } else if (imageType.includes("knight")) {
                    classListToAdd = "knight";
                    newSrc = `./knight_${sameColor}.svg`;
                } else if (imageType.includes("bishop")) {
                    classListToAdd = "bishop";
                    newSrc = `./bishop_${sameColor}.svg`;
                }

                // CREATE NEW PIECE
                let newPiece = document.createElement("img");
                newPiece.className = sameColor + " piece " + classListToAdd;
                newPiece.src = newSrc;

                console.log("I am here before promoting. and changing the pieces.");
                // replace the pawn with the piece
                thePawn.parentElement.appendChild(newPiece);
                thePawn.parentElement.removeChild(thePawn);
                // and 'shrink' it
                thePawn.className = "";

                // and now hide the popup again
                popup.classList.add("hidden");

                // the only possiblity is that we gave a check to opponent, this we check below:
                // here we will store how many pieces checks the king
                let nrOfCheckingPieces = isKingInCheck(isWhite);

                // the color of potentially checked king
                let checkedKingColor = isWhite ? "black" : "white";
                // below, based on number of checking pieces and color, we raise the flag
                if (checkedKingColor === "white" && nrOfCheckingPieces > 0) {
                    isWhiteKingInCheck = true;
                } else if (checkedKingColor === "black" && nrOfCheckingPieces > 0) {
                    isBlackKingInCheck = true;
                } else if (checkedKingColor === "white" && nrOfCheckingPieces === 0) {
                    isWhiteKingInCheck = false;
                } else if (checkedKingColor === "black" && nrOfCheckingPieces === 0) {
                    isBlackKingInCheck = false;
                }

                if (nrOfCheckingPieces >= 2) {
                    isDoubleCheck = true;
                } else if (nrOfCheckingPieces < 2) {
                    isDoubleCheck = false;
                }

            }, { once: true });
        }

    }

    function thisIsPawnPromotionMove(piece, legalMove) {
        const isWhite = piece.classList.contains("white");
        const lastRowsIndex = isWhite ? 0 : 7;

        if (piece.classList.contains("pawn") && getRowIndex(legalMove) === lastRowsIndex) {
            return true;
        }

        return false;
    }

    // this function do the en passant move -> normally make the move and then remove the pawn next to me
    function enPassant(piece, legalMove) {
        const isWhite = piece.classList.contains("white");
        // with which square we will operate: piece, legalMove and the square next to piece in the direction of legalMove
        const colDifference = getColumnsIndex(piece) - getColumnsIndex(legalMove);

        let direction;
        if (isWhite && colDifference > 0) {
            direction = "left";
        } else if (isWhite && colDifference < 0) {
            direction = "right";
        } else if (!(isWhite) && colDifference > 0) {
            direction = "right";
        } else if (!(isWhite) && colDifference < 0) {
            direction = "left";
        }
        let squareNextToPawn = getElement(piece, isWhite, direction);

        let squareElement = document.createElement("span");
        squareElement.className = "square";
        let squareElement2 = document.createElement("span");
        squareElement2.className = "square";

        // part 1: move the piece to legalMove square
        piece.parentElement.appendChild(squareElement);
        piece.parentElement.removeChild(piece);
        legalMove.parentElement.appendChild(piece);
        legalMove.parentElement.removeChild(legalMove);

        // part 2: remove the pawn next to our piece, move it to array for taken pieces
        squareNextToPawn.parentElement.appendChild(squareElement2);
        squareNextToPawn.parentElement.removeChild(squareNextToPawn);
        addPieceToRemovedArray(squareNextToPawn);
    }

    // returns true if this was en passant move
    function thisIsEnPassantMove(piece, legalMove) {
        /*
        Conditions:
        a) piece is pawn
        b) the move is to diagonal from the pawn, and there is no piece there
        c) next to it, in the direction of the legal move, there is pawn which just made double move
        */
        const isWhite = piece.classList.contains("white");

        if (!(piece.classList.contains("pawn"))) {
            return false;
        }

        const colDifference = getColumnsIndex(piece) - getColumnsIndex(legalMove);
        if (Math.abs(colDifference) !== 1) {// if there is no columns difference, or it is different than one, 
            return false;
        }

        let direction;
        if (isWhite && colDifference > 0) {
            direction = "left";
        } else if (isWhite && colDifference < 0) {
            direction = "right";
        } else if (!(isWhite) && colDifference > 0) {
            direction = "right";
        } else if (!(isWhite) && colDifference < 0) {
            direction = "left";
        }
        let squareNextToPawn = getElement(piece, isWhite, direction);
        // now check if on the square is the pawn, which just made double move -> his class should be:
        // "oppositeColor piece pawn jumped now"
        const oppositeColor = isWhite ? "black" : "white";
        if (!(squareNextToPawn.className === `${oppositeColor} piece pawn jumped now`)) {
            return false;
        }

        return true;
    }

    // this function returns true if this is pawns special move - the double move on initial position
    function thisIsPawnsSpecialMove(piece, legalMove) {
        const isWhite = piece.classList.contains("white");

        // first check if the piece is pawn
        if (!(piece.classList.contains("pawn"))) {//if not
            return false;
        }

        // then check if the pawn is on initial position
        // let's get row index
        let currentRowIndex = getRowIndex(piece);
        let initialPosition = isWhite ? 6 : 1;
        if (currentRowIndex !== initialPosition) {
            return false;
        }

        // lastly, check if the legal move is the '2nd front element'.
        let elementInFront = getElement(piece, isWhite, "front");
        let secondFrontElement = getElement(elementInFront, isWhite, "front");

        if (secondFrontElement !== legalMove) {
            return false;
        }

        return true;
    }

    // this function returns true, if the piece is king and legal move which was clicked is two squares away from the king
    function thisIsCastleMove(piece, legalMove) {
        if (!(piece.classList.contains("king"))) {
            return false;
        }

        // else we gotta check if the move is 
        // a) on the same row
        // b) difference of the cols is two
        const kingsRow = getRowIndex(piece);
        if (kingsRow !== getRowIndex(legalMove)) {
            return false;
        }

        const kingsCol = getColumnsIndex(piece);
        const colDiff = Math.abs(kingsCol - (getColumnsIndex(legalMove)));
        if (colDiff !== 2) {
            return false;
        }

        return true;
    }

    // this function will do the castle move --> move the king by two squares in given direction, 
    // put the rook behind the king
    function castle(king, legalMove) {
        const isWhite = king.classList.contains("white");
        const myColor = isWhite ? "white" : "black";
        // find direction
        let direction;
        const colDiff = getColumnsIndex(king) - getColumnsIndex(legalMove);
        if (colDiff > 0 && isWhite) {
            direction = "left";
        } else if (colDiff < 0 && isWhite) {
            direction = "right";
        } else if (colDiff > 0 && !(isWhite)) {
            direction = "right";
        } else {
            direction = "left";
        }

        //get correct rook
        let rook = document.getElementById(myColor + "-" + direction + "-rook");

        // based on it get the first square in that direction -> move rook to that square
        let firstSquareInThatDirection = getElement(king, isWhite, direction);
        let secondSquareInThatDirection = getElement(firstSquareInThatDirection, isWhite, direction);

        moveToSquare(rook, firstSquareInThatDirection);
        // then get the second square in that direction -> move the king to that square
        moveToSquare(king, secondSquareInThatDirection);
    }

    // returns the number of pieces checking the king
    // the color in parameter is the color of ATTACKING army -> the one which is giving the check
    // in other words, it is the oposite color to the color of the checked king
    function isKingInCheck(isWhite) {
        let nrOfCheckingPieces = getCheckingPieces(isWhite).length;

        return nrOfCheckingPieces;
    }

    function getCheckingPieces(isWhite) {
        let checkingPieces = [];
        let sameColor = isWhite ? "white" : "black";
        let oponentsColor = isWhite ? "black" : "white";
        let oponentsKing = document.getElementsByClassName(oponentsColor + " piece king");
        let friendlyPieces = document.getElementsByClassName(sameColor + " piece");


        let pieceAttackingMoves;
        for (let friendlyPiece of friendlyPieces) {
            pieceAttackingMoves = getAttackingMoves(friendlyPiece);
            if (pieceAttackingMoves.includes(oponentsKing.item(0))) {
                checkingPieces.push(friendlyPiece);
            }
        }

        return checkingPieces;
    }

    function getPiecesToPlayInCheck() {
        let pieces = [];
        let currentColor = isWhitesTurn ? "white" : "black";
        let isKingWhite = isWhitesTurn ? true : false;
        // oviously we can add king
        pieces.push(...Array.from(document.getElementsByClassName(currentColor + " piece king")));

        // in case it is double check, we will return only king, since you cannot block or take
        if (isDoubleCheck) {
            return pieces;
        }

        // now, we must add pieces which are able to block check
        pieces.push(...getBlockingPieces());

        // last but not least, piece which can remove the checker
        // i need the checking piece for this purpose
        let checkingPiece = getCheckingPieces(!(isKingWhite));

        // if there is different number of checking pieces than 1, return null -> invalid state
        if (!(checkingPiece.length === 1)) {
            return [];
        }
        pieces.push(...getAttackingPieces(checkingPiece[0], isKingWhite));

        // avoid duplicities
        pieces = [...new Set(pieces)];
        return pieces;
    }

    // this function return array of pieces, which can block current check on their king
    // we must be careful about colors -> the function getCheckingPieces is working with opposite color than the kings color.
    function getBlockingPieces() {
        let blockingPieces = [];
        let isWhite = isWhitesTurn ? true : false;
        let currentColor = isWhitesTurn ? "white" : "black";

        let kingInCheck = document.getElementsByClassName(`${currentColor} piece king`);

        let checkingPiece = getCheckingPieces(!(isWhite));

        // if there is different number of checking pieces than 1, return null -> invalid state
        if (!(checkingPiece.length === 1)) {
            return [];
        }

        let knightIsGivingCheck = false;
        if (checkingPiece[0].classList.contains("knight")) {
            knightIsGivingCheck = true;
        }

        let squaresBetweenKingAndChecker = getSquaresBetweenKingAndChecker(kingInCheck[0], checkingPiece[0]);
        // now the hard part. We must take all the pieces of kingInCheck army and look if they can reach that square
        let kingsArmy = [];
        kingsArmy.push(...Array.from(document.getElementsByClassName(currentColor)));

        for (let piece of kingsArmy) {

            // skip king
            if (piece.classList.contains("king")) {
                continue;
            }
            // else get legal moves
            let legalMoves = findLegalMoves(piece);

            // in case the knight is giving check
            if (knightIsGivingCheck && legalMoves.includes(checkingPiece[0])) {// we will check only if the knight is included in the legal moves. 
                blockingPieces.push(piece);
                continue;
            } else if (knightIsGivingCheck) { // if knight is giving check just skipt the piece
                continue;
            }

            // and check if the piece can get to any of the squares between king and checker
            let intersection = squaresBetweenKingAndChecker.some(item => legalMoves.includes(item));

            if (intersection) {
                blockingPieces.push(piece);
            }
        }

        return blockingPieces;
    }

    // returns squares betweem attaclomg piece and the king, including the attacking piece and excluding the king
    function getSquaresBetweenKingAndChecker(kingInCheck, checkingPiece) {
        let isCheckerWhite = checkingPiece.classList.contains("white");

        let rowsDifference = getRowIndex(checkingPiece) - getRowIndex(kingInCheck);
        let colsDifference = getColumnsIndex(checkingPiece) - getColumnsIndex(kingInCheck);

        let direction;
        if (rowsDifference > 0 && colsDifference > 0) {
            direction = isCheckerWhite ? "top-left" : "bottom-right";
        } else if (rowsDifference > 0 && colsDifference === 0) {
            direction = isCheckerWhite ? "front" : "back";
        } else if (rowsDifference > 0 && colsDifference < 0) {
            direction = isCheckerWhite ? "top-right" : "bottom-left";
        } else if (rowsDifference === 0 && colsDifference > 0) {
            direction = isCheckerWhite ? "left" : "right";
        } else if (rowsDifference === 0 && colsDifference < 0) {
            direction = isCheckerWhite ? "right" : "left";
        } else if (rowsDifference < 0 && colsDifference > 0) {
            direction = isCheckerWhite ? "bottom-left" : "top-right";
        } else if (rowsDifference < 0 && colsDifference === 0) {
            direction = isCheckerWhite ? "back" : "front";
        } else if (rowsDifference < 0 && colsDifference < 0) {
            direction = isCheckerWhite ? "bottom-right" : "top-left";
        }

        let squaresBetween = [];
        // include the checking piece -> possiblity to take the piece
        squaresBetween.push(checkingPiece);
        squaresBetween.push(...getMoves(checkingPiece, isCheckerWhite, direction));
        // remove the king from there, because he suppose to be in on the last position
        squaresBetween.pop();

        return squaresBetween;
    }

    // this function returns squares between the two provided pieces. It will stop in case there is some other piece. 
    // this will work only of there are no pieces between the two. 
    // in case they are different colors, last element of the array will be the piece2. otherwise, there will be only empty squares
    function getSquaresBetweenTwoPieces(piece1, piece2) {
        const piece1Color = piece1.classList.contains("white");
        const piece2Color = piece2.classList.contains("white");

        let rowsDifference = getRowIndex(piece1) - getRowIndex(piece2);
        let colsDifference = getColumnsIndex(piece1) - getColumnsIndex(piece2);

        let direction;
        if (rowsDifference > 0 && colsDifference > 0) {
            direction = piece2Color ? "top-left" : "bottom-right";
        } else if (rowsDifference > 0 && colsDifference === 0) {
            direction = piece2Color ? "front" : "back";
        } else if (rowsDifference > 0 && colsDifference < 0) {
            direction = piece2Color ? "top-right" : "bottom-left";
        } else if (rowsDifference === 0 && colsDifference > 0) {
            direction = piece2Color ? "left" : "right";
        } else if (rowsDifference === 0 && colsDifference < 0) {
            direction = piece2Color ? "right" : "left";
        } else if (rowsDifference < 0 && colsDifference > 0) {
            direction = piece2Color ? "bottom-left" : "top-right";
        } else if (rowsDifference < 0 && colsDifference === 0) {
            direction = piece2Color ? "back" : "front";
        } else if (rowsDifference < 0 && colsDifference < 0) {
            direction = piece2Color ? "bottom-right" : "top-left";
        }

        let squaresBetween = [];
        squaresBetween.push(...getMoves(piece1, piece1Color, direction));

        return squaresBetween;
    }

    function highlightMoves(legalMoves) {
        let newLegalMoves = []
        for (let legalMove of legalMoves) {
            if (legalMove.classList.contains("square")) {
                let highlighter = document.createElement("img");
                highlighter.src = "./highlighter.svg";
                highlighter.className = "highlighter";

                legalMove.parentElement.appendChild(highlighter);
                legalMove.parentElement.removeChild(legalMove);
                newLegalMoves.push(highlighter);
            } else {
                newLegalMoves.push(legalMove);
            }
        }

        return newLegalMoves;
    }

    // in this function, we want to get rid of all highlighters and we want to throw away all event listeners
    function cleanUp() {
        // remove highlighters
        let highlighters = document.querySelectorAll(".highlighter");

        for (let highlighter of highlighters) {
            let square = document.createElement("span");
            square.classList = "square";
            highlighter.parentElement.appendChild(square);
            highlighter.parentElement.removeChild(highlighter);
        }

        // mark pawns which did jumped doulbe move THIS ROUND!
        let jumpedPawns = document.querySelectorAll(".jumped");
        for (let jumpedPawn of jumpedPawns) {
            if (jumpedPawn.classList.contains("now")) {// this means that he was marked in previous round
                // remove "now" and also "jumped"
                jumpedPawn.classList.remove("now");
                jumpedPawn.classList.remove("jumped");
            } else {
                jumpedPawn.classList.add("now");
            }
        }

        // remove all event listeners
        document.querySelectorAll(".piece").forEach(removeAllEventListeners);
    }

    function removeAllEventListeners(element) {
        let newEl = element.cloneNode(true);
        element.parentNode.replaceChild(newEl, element);
    }


    function moveToSquare(piece, elementOnPlace, isTemporaryMove) {
        // this will be useful
        let isWhite = piece.classList.contains("white");
        let oppositeColor = isWhite ? "black" : "white";

        let elementsParent = elementOnPlace.parentElement;
        let squareElement = document.createElement("span");
        squareElement.className = "square";

        // lets check if there is highlighter
        if (elementOnPlace.classList.contains("highlighter")) {
            elementsParent.removeChild(elementOnPlace);
            piece.parentElement.appendChild(squareElement);
            piece.parentElement.removeChild(piece);
            elementsParent.appendChild(piece);
        } else if (elementOnPlace.classList.contains(oppositeColor)) {// if it is opponents piece
            elementsParent.removeChild(elementOnPlace);
            piece.parentElement.appendChild(squareElement);
            piece.parentElement.removeChild(piece);
            elementsParent.appendChild(piece);
            if (!(isTemporaryMove)) {
                addPieceToRemovedArray(elementOnPlace);
            }

        } else {
            // something is wrong
        }

        // check if the piece is either rook or king, for castling check
        if (piece.classList.contains("king") && isWhite) {
            whiteKingHasMoved = true;
        } else if (piece.classList.contains("king") && !(isWhite)) {
            blackKingHasMoved = true;
        } else if (piece.id === "white-left-rook") {
            whiteLeftRookHasMoved = true;
        } else if (piece.id === "white-right-rook") {
            whiteRightRookHasMoved = true;
        } else if (piece.id === "black-left-rook") {
            blackLeftRookHasMoved = true;
        } else if (piece.id === "black-right-rook") {
            blackRightRookHasMoved = true;
        }
    }

    function findLegalMoves(piece) {
        let pieceClasses = piece.classList;
        let pieceType;
        let legalMoves = [];
        for (let pieceClass of pieceClasses) {
            if (pieceClass === "white" || pieceClass === "black") {
                continue;
            } else if (pieceClass === "piece") {
                continue;
            } else if (pieceClass === "jumped") {
                continue;
            } else {
                // save the class
                pieceType = pieceClass;
            }
        }

        switch (pieceType) {
            case "pawn":
                legalMoves = findLegalPawnMoves(piece);
                break;
            case "knight":
                legalMoves = findLegalKnightMoves(piece);
                break;
            case "bishop":
                legalMoves = findLegalBishopMoves(piece);
                break;
            case "rook":
                legalMoves = findLegalRookMoves(piece);
                break;
            case "queen":
                legalMoves = findLegalQueenMoves(piece);
                break;
            case "king":
                legalMoves = findLegalKingMoves(piece);
                break;
            default:
                break;
        }

        return legalMoves;
    }


    function findLegalKingMoves(king) {
        // first we will normaly provide all possible moves, without considering checks or mates
        let possibleMoves = [];
        let isWhite = king.classList.contains("white");
        let oppositeColor = isWhite ? "black" : "white";


        let directions = ["front", "top-right", "right", "bottom-right", "back", "bottom-left", "left", "top-left"];
        let nextElement;
        for (let direction of directions) {
            nextElement = getElement(king, isWhite, direction);

            if (nextElement === null) {
                // do nothing
            } else if (nextElement.classList.contains("square") && !(isAttacked(nextElement, !(isWhite)))) {
                possibleMoves.push(nextElement);
            } else if (nextElement.classList.contains(oppositeColor) && !(isDefended(nextElement, !(isWhite)))) {
                possibleMoves.push(nextElement);
            }
        }

        // now go through all possible moves again and check if king is in check on that square - virtually
        let finalMoves = [];
        // get virtual board
        let virtualBoard = getVirtualBoardInCurrentState();

        // get king indexes
        let kingRow = getRowIndex(king);
        let kingCol = getColumnsIndex(king);
        let virtualKing = [kingRow, kingCol];
        for (let possibleMove of possibleMoves) {
            // make the move on the virtual board
            // get indexes of possible move
            let possibleMoveRowIndex = getRowIndex(possibleMove);
            let possibleMoveColIndex = getColumnsIndex(possibleMove);
            let possibleVirtualMove = [possibleMoveRowIndex, possibleMoveColIndex];

            // move the king to possible move
            virtualBoard = moveVirtuallyToSquare(virtualBoard, virtualKing, possibleVirtualMove);

            // check if there is check on the virtual board
            if (!(isVirtualKingInCheck(virtualBoard, isWhite))) {
                finalMoves.push(possibleMove);
            }

            // reset the board
            virtualBoard = getVirtualBoardInCurrentState();
        }

        // here we will check if castles is possible
        let leftRook;
        let rightRook;
        if (isWhite) {
            leftRook = document.getElementById("white-left-rook");
            rightRook = document.getElementById("white-right-rook");
        } else {
            leftRook = document.getElementById("black-left-rook");
            rightRook = document.getElementById("black-right-rook");
        }
        if (castlesIsPossible(king, leftRook)) {
            // add left castling move - long castle - we will add only two squares to left from king
            let leftCastle = getElement(getElement(king, isWhite, "left"), isWhite, "left");
            finalMoves.push(leftCastle);

        }
        if (castlesIsPossible(king, rightRook)) {
            // add right castling move - short castle
            let rightCastle = getElement(getElement(king, isWhite, "right"), isWhite, "right");
            finalMoves.push(rightCastle);
        }
        if (thereIsOnlyKingToPlayWith && finalMoves.length === 0){
            // CHECKMATE
            const sameColor = isWhite ? "white" : "black";
            statusBarPar.textContent = "CHECKMATE!! " + oppositeColor + " has checkmated the " + sameColor + "! GAME OVER";
            gameOver = true;
        }

        return finalMoves;
    }

    // this function returns true if this king can castle 
    function castlesIsPossible(king, rook) {
        const isWhite = king.classList.contains("white");
        // 1. check if king is in check
        if (isWhite && isWhiteKingInCheck) {
            return false;
        } else if (!(isWhite) && isBlackKingInCheck) {
            return false;
        }

        // 2. check if king or rook has moved
        let rookIsLeft;
        if (isWhite) {
            rookIsLeft = rook.id === "white-left-rook";
        } else {
            rookIsLeft = rook.id === "black-left-rook";
        }
        if (rookIsLeft && isWhite && whiteLeftRookHasMoved) {
            return false;
        } else if (!rookIsLeft && isWhite && whiteRightRookHasMoved) {
            return false;
        } else if (rookIsLeft && !isWhite && blackLeftRookHasMoved) {
            return false;
        } else if (!rookIsLeft && !isWhite && blackRightRookHasMoved) {
            return false;
        }

        if (isWhite && whiteKingHasMoved) {
            return false;
        } else if (!isWhite && blackKingHasMoved) {
            return false;
        }

        // 3. check if there are no pieces in between king and the rook
        // which means that the rook can defend the king
        let castlesIsPossible = isThePieceDefended(king, rook);
        if (!(castlesIsPossible)) {
            return false;
        }

        // 4. check if there are no attacking pieces the squares between rook and king
        let squaresBetween = getSquaresBetweenTwoPieces(king, rook);
        for (let square of squaresBetween) {
            // if given square is attacked
            if (isAttacked(square, !isWhite)) {
                return false;
            }
        }

        return true;
    }

    function findLegalQueenMoves(queen) {
        let legalMoves = [];

        let isWhite = queen.classList.contains("white");

        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(queen);
        let isThePiecePinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            isThePiecePinned = true;
        }

        let frontMoves = getMoves(queen, isWhite, "front");
        let rightMoves = getMoves(queen, isWhite, "right");
        let backMoves = getMoves(queen, isWhite, "back");
        let leftMoves = getMoves(queen, isWhite, "left");
        let topLeftDiagonalMoves = getMoves(queen, isWhite, "top-left");
        let topRightDiagonalMoves = getMoves(queen, isWhite, "top-right");
        let bottomRightDiagonalMoves = getMoves(queen, isWhite, "bottom-right");
        let bottomLeftDiagonalMoves = getMoves(queen, isWhite, "bottom-left");

        legalMoves.push(...frontMoves);
        legalMoves.push(...rightMoves);
        legalMoves.push(...backMoves);
        legalMoves.push(...leftMoves);
        legalMoves.push(...topLeftDiagonalMoves);
        legalMoves.push(...topRightDiagonalMoves);
        legalMoves.push(...bottomRightDiagonalMoves);
        legalMoves.push(...bottomLeftDiagonalMoves);

        // if the piece is pinned
        if (isThePiecePinned) {
            // first convert indexes to actual elements
            let possiblePinnedMoves = possiblePinnedMovesIndexes.map(
                ([r, c]) => boardRows[r].children[c].firstElementChild
            );

            // now go through all legal moves and check if they are within the pinned moves, if yes, add them
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMoves.includes(legalMove)
            );

            return newLegalMoves;
        }

        return legalMoves;
    }

    function findLegalRookMoves(rook) {
        /**
         * this function will return array of possible rook moves, 
         * in the array will be elements of the target squares, so:
         * a) squares where there is no piece and it is not out of bounds
         * b) square where is opponents piece ideally
         * the array may be empty, if there are no moves
         */
        let legalMoves = [];

        let isWhite = rook.classList.contains("white");

        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(rook);
        let isThePiecePinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            isThePiecePinned = true;
        }

        // the idea is this. I guess we will do this in four phases.
        // phase 1: go to front, until you hit a piece or hit borders
        // phase 2: go to right ...
        // phase 3: go to back ...
        // phase 4: go to left ...
        // recursively

        let frontMoves = getMoves(rook, isWhite, "front");
        let rightMoves = getMoves(rook, isWhite, "right");
        let backMoves = getMoves(rook, isWhite, "back");
        let leftMoves = getMoves(rook, isWhite, "left");

        // add all moves to legal moves array
        legalMoves.push(...frontMoves);
        legalMoves.push(...rightMoves);
        legalMoves.push(...backMoves);
        legalMoves.push(...leftMoves);

        // if the piece is pinned
        if (isThePiecePinned) {
            // first convert indexes to actual elements
            let possiblePinnedMoves = possiblePinnedMovesIndexes.map(
                ([r, c]) => boardRows[r].children[c].firstElementChild
            );

            // now go through all legal moves and check if they are within the pinned moves, if yes, add them
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMoves.includes(legalMove)
            );

            return newLegalMoves;
        }

        return legalMoves;
    }


    function findLegalBishopMoves(bishop) {
        /**
         * this function will return array of possible bishop moves, 
         * in the array will be elements of the target squares, so:
         * a) squares where there is no piece and it is not out of bounds
         * b) square where is opponents piece ideally
         * the array may be empty, if there are no moves
         */
        let legalMoves = [];

        let isWhite = bishop.classList.contains("white");

        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(bishop);
        let isThePiecePinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            isThePiecePinned = true;
        }

        // the idea is this. I guess we will do this in four phases.
        // phase 1: go top left diagonal, until you hit a piece or hit boarders
        // phase 2: go top right ...
        // phase 3: go bottom right ...
        // phase 4: go bottom left ...
        // recursively

        let topLeftDiagonalMoves = getMoves(bishop, isWhite, "top-left");
        let topRightDiagonalMoves = getMoves(bishop, isWhite, "top-right");
        let bottomRightDiagonalMoves = getMoves(bishop, isWhite, "bottom-right");
        let bottomLeftDiagonalMoves = getMoves(bishop, isWhite, "bottom-left");

        // add all moves to legal moves array
        legalMoves.push(...topLeftDiagonalMoves);
        legalMoves.push(...topRightDiagonalMoves);
        legalMoves.push(...bottomRightDiagonalMoves);
        legalMoves.push(...bottomLeftDiagonalMoves);

        // if the piece is pinned
        if (isThePiecePinned) {
            // first convert indexes to actual elements
            let possiblePinnedMoves = possiblePinnedMovesIndexes.map(
                ([r, c]) => boardRows[r].children[c].firstElementChild
            );

            // now go through all legal moves and check if they are within the pinned moves, if yes, add them
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMoves.includes(legalMove)
            );

            return newLegalMoves;
        }

        return legalMoves;
    }

    // this will find AND highlight all legal knight moves
    function findLegalKnightMoves(knight) {
        /**
         * this function will return array of possible knight moves, 
         * in the array will be elements of the target squares, so:
         * a) squares where there is no piece and it is not out of bounds
         * b) square where is opponents piece ideally
         * the array may be empty
         */
        let legalMoves = [];

        let isWhite = knight.classList.contains("white");
        let oppositeColor = isWhite ? "black" : "white";

        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(knight);
        let isThePiecePinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            isThePiecePinned = true;
        }

        // lets get all possible moves
        let possibleMoves = getAllKnightMoves(knight);
        // go through them and check for empty squares and opposite color pieces
        for (let possibleMove of possibleMoves) {
            // empty square case
            if (possibleMove.classList.contains("square")) {
                // add it to array
                legalMoves.push(possibleMove);
            } else if (possibleMove.classList.contains(oppositeColor)) {// opposite color piece case
                legalMoves.push(possibleMove);
            }
            // otherwise just do nothing
        }

        // if the piece is pinned
        if (isThePiecePinned) {
            // first convert indexes to actual elements
            let possiblePinnedMoves = possiblePinnedMovesIndexes.map(
                ([r, c]) => boardRows[r].children[c].firstElementChild
            );

            // now go through all legal moves and check if they are within the pinned moves, if yes, add them
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMoves.includes(legalMove)
            );

            return newLegalMoves;
        }

        // return the array, which may be empty
        return legalMoves;
    }

    // returns array of all possible knight moves, no matter if there is an piece on the square or not
    // it gets rid of all moves which are outside of the board
    function getAllKnightMoves(knight) {
        let knightMoves = [];
        let currentRowIndex = getRowIndex(knight);
        let currentColumnIndex = getColumnsIndex(knight);

        // there are eight combinations
        // order matters
        // -1 -2
        if (((currentRowIndex - 1) >= 0) && ((currentColumnIndex - 2) >= 0)) {
            knightMoves.push(boardRows[currentRowIndex - 1].children[currentColumnIndex - 2].firstElementChild);
        }
        // -2 -1
        if (((currentRowIndex - 2) >= 0) && ((currentColumnIndex - 1) >= 0)) {
            knightMoves.push(boardRows[currentRowIndex - 2].children[currentColumnIndex - 1].firstElementChild);
        }

        // -1 2
        if (((currentRowIndex - 1) >= 0) && ((currentColumnIndex + 2) <= 7)) {
            knightMoves.push(boardRows[currentRowIndex - 1].children[currentColumnIndex + 2].firstElementChild);
        }
        // -2 1
        if (((currentRowIndex - 2) >= 0) && ((currentColumnIndex + 1) <= 7)) {
            knightMoves.push(boardRows[currentRowIndex - 2].children[currentColumnIndex + 1].firstElementChild);
        }
        // 1 -2
        if (((currentRowIndex + 1) <= 7) && ((currentColumnIndex - 2) >= 0)) {
            knightMoves.push(boardRows[currentRowIndex + 1].children[currentColumnIndex - 2].firstElementChild);
        }
        // 2 -1
        if (((currentRowIndex + 2) <= 7) && ((currentColumnIndex - 1) >= 0)) {
            knightMoves.push(boardRows[currentRowIndex + 2].children[currentColumnIndex - 1].firstElementChild);
        }
        // 1 2
        if (((currentRowIndex + 1) <= 7) && ((currentColumnIndex + 2) <= 7)) {
            knightMoves.push(boardRows[currentRowIndex + 1].children[currentColumnIndex + 2].firstElementChild);
        }
        // 2 1
        if (((currentRowIndex + 2) <= 7) && ((currentColumnIndex + 1) <= 7)) {
            knightMoves.push(boardRows[currentRowIndex + 2].children[currentColumnIndex + 1].firstElementChild);
        }

        return knightMoves;
    }

    function findLegalPawnMoves(pawn) {
        /**
         * this function will return array of possible pawn moves, 
         * possible moves are:
         * normal front move - in case there is no piece in front
         * double move in case of initial position
         * diagonal takes moves in case there is opponents piece
         * en passant - the oponnents pawn just made the double move and I stand on correct square, I can take it
         */
        let legalMoves = [];
        let isWhite = pawn.classList.contains("white");

        // before we start checking normal moves, check if you are not pinned
        let possiblePinnedMovesIndexes = pieceIsPinned(pawn);
        let isThePiecePinned = false;
        if (possiblePinnedMovesIndexes !== null) {
            isThePiecePinned = true;
        }

        // basic front move case
        let elementInFront = getElement(pawn, isWhite, "front");
        // if there is empty square
        if (elementInFront.classList.contains("square")) {
            // and add  as legal move
            legalMoves.push(elementInFront);
        }

        // special double front move in initial positions case

        // let's get row index
        let currentRowIndex = getRowIndex(pawn);
        let initialPosition = isWhite ? 6 : 1;
        if (currentRowIndex === initialPosition) {
            let elementInFront = getElement(pawn, isWhite, "front");
            let secondFrontElement = getElement(elementInFront, isWhite, "front");

            if (elementInFront.classList.contains("square") && secondFrontElement.classList.contains("square")) {
                legalMoves.push(secondFrontElement);
            }
        }

        // now check diagonal squares
        // first right one
        // now we need to check if the square is occupied by OPPOSITE color piece!
        // which is element with class "black", in case the pawn is "white" and otherwise
        let oppositeColor = isWhite ? "black" : "white";
        let rightDiagonalElement = getElement(pawn, isWhite, "top-right");
        if (rightDiagonalElement !== null && rightDiagonalElement.classList.contains(oppositeColor)) {
            legalMoves.push(rightDiagonalElement);
        }
        //do the same for left diagonal element
        let leftDiagonalElement = getElement(pawn, isWhite, "top-left");
        if (leftDiagonalElement !== null && leftDiagonalElement.classList.contains(oppositeColor)) {
            legalMoves.push(leftDiagonalElement);
        }

        // now check en passant case
        const enPassantRow = isWhite ? 3 : 4;
        let elementOnLeft = getElement(pawn, isWhite, "left");
        let elementOnRight = getElement(pawn, isWhite, "right");
        // there are these conditions:
        // 1. my pawn is on 'en passant row'
        // 2. Next to me, left or right, is oponnents pawn
        // 3. the oponnents pawn just made the double move - his classlist contains "jumped"
        // first try left side
        if (elementOnLeft !== null && currentRowIndex === enPassantRow && elementOnLeft.className === `${oppositeColor} piece pawn jumped now`) {
            // add en passant move, which is leftDiagonalElement
            legalMoves.push(leftDiagonalElement);
        }

        if (elementOnRight !== null && currentRowIndex === enPassantRow && elementOnRight.className === `${oppositeColor} piece pawn jumped now`) {
            legalMoves.push(rightDiagonalElement);
        }

        // if the piece is pinned
        if (isThePiecePinned) {
            // first convert indexes to actual elements
            let possiblePinnedMoves = possiblePinnedMovesIndexes.map(
                ([r, c]) => boardRows[r].children[c].firstElementChild
            );

            // now go through all legal moves and check if they are within the pinned moves, if yes, add them
            let newLegalMoves = legalMoves.filter(
                legalMove => possiblePinnedMoves.includes(legalMove)
            );

            return newLegalMoves;
        }

        // return the array, which may be empty
        return legalMoves;
    }

    // get diagonal moves
    function getMoves(square, isWhite, direction) {
        let legalMoves = [];
        let oppositeColor = isWhite ? "black" : "white";

        let nextElement = getElement(square, isWhite, direction);

        if (nextElement === null) {
            // do nothing
        } else if (nextElement.classList.contains("square")) {
            // add current element
            legalMoves.push(nextElement);
            // and go to recursion
            legalMoves.push(...getMoves(nextElement, isWhite, direction));
        } else if (nextElement.classList.contains(oppositeColor)) {
            legalMoves.push(nextElement);
        }

        // last possibility is that is is same color piece, which means we do nothing and we return

        return legalMoves;
    }

    /// SECTION FOR GETTING THE MOVES IN CASE IT IS CHECK

    function findLegalCheckMoves(piece) {

        let pieceClasses = piece.classList;
        let pieceType;
        let legalMoves = [];
        for (let pieceClass of pieceClasses) {
            if (pieceClass === "white" || pieceClass === "black") {
                continue;
            } else if (pieceClass === "piece") {
                continue;
            } else {
                // save the class
                pieceType = pieceClass;
            }
        }

        switch (pieceType) {
            case "pawn":
                legalMoves = findLegalPawnMoves(piece);
                break;
            case "knight":
                legalMoves = findLegalKnightMoves(piece);
                break;
            case "bishop":
                legalMoves = findLegalBishopMoves(piece);
                break;
            case "rook":
                legalMoves = findLegalRookMoves(piece);
                break;
            case "queen":
                legalMoves = findLegalQueenMoves(piece);
                break;
            case "king":
                legalMoves = findLegalKingMoves(piece);
                break;
            default:
                break;
        }
        // now go through legal moves and pick only those which are on the line between attacker and king
        let legalCheckMoves = [];

        let isWhite = piece.classList.contains("white");
        let currentColor = isWhitesTurn ? "white" : "black";

        let kingInCheck = document.getElementsByClassName(`${currentColor} piece king`);

        let checkingPiece = getCheckingPieces(!(isWhite));

        // if there is different number of checking pieces than 1, return null -> invalid state
        if (!(checkingPiece.length === 1)) {
            return [];
        }

        let checkingPieceIsKnight = false;
        if (checkingPiece[0].classList.contains("knight")) {
            checkingPieceIsKnight = true;
        }

        // do a knight check
        if (checkingPieceIsKnight && !(piece.classList.contains("king")) && legalMoves.includes(checkingPiece[0])) {
            legalCheckMoves.push(checkingPiece[0]);
            return legalCheckMoves;
        } else if (checkingPieceIsKnight && !(piece.classList.contains("king"))) {
            return legalCheckMoves;
        }

        let squaresBetweenKingAndChecker = getSquaresBetweenKingAndChecker(kingInCheck[0], checkingPiece[0]);
        // if we are looking at kings moves, return normal legal moves
        if (piece.classList.contains("king")) {
            return legalMoves;
        }

        // go through each move and check if it lays on the line between attacker and king. If yes, add it.
        for (potentialMove of legalMoves) {
            if (squaresBetweenKingAndChecker.includes(potentialMove)) {
                legalCheckMoves.push(potentialMove);
            }
        }

        return legalCheckMoves;
    }

    /// SECTION for Pinned stuff

    // this function will return:
    // a) if this piece is NOT pinned, NULL
    // b) if this piece IS pinned, array of possible moves during the pin.
    function pieceIsPinned(piece) {
        // we will use virtual board for this and we will do it like this:
        // first we will check in which direction from the piece is the king
        // then we will remove the piece, virtually and check that direction from the king
        // if at the end of that direction is oponnents piece, we will check if it is piece
        // which can attack the king -> in case of diagonal move, it can be only bishop or queen,
        // in case of straight direction, it can be only rook and queen
        const isWhite = piece.classList.contains("white");
        const sameColor = isWhite ? "white" : "black";
        const king = document.querySelector("." + sameColor + ".king");
        let possibleMovesDuringPin = [];

        const piecesRow = getRowIndex(piece);
        const piecesCol = getColumnsIndex(piece);
        const kingsRow = getRowIndex(king);
        const kingsCol = getColumnsIndex(king);

        // we will use direction from king to piece, so we can use same direction later
        const rowsDifference = kingsRow - piecesRow;
        const colsDifference = kingsCol - piecesCol;

        let direction;
        if (rowsDifference > 0 && colsDifference > 0) {
            direction = isWhite ? "top-left" : "bottom-right";
        } else if (rowsDifference > 0 && colsDifference === 0) {
            direction = isWhite ? "front" : "back";
        } else if (rowsDifference > 0 && colsDifference < 0) {
            direction = isWhite ? "top-right" : "bottom-left";
        } else if (rowsDifference === 0 && colsDifference > 0) {
            direction = isWhite ? "left" : "right";
        } else if (rowsDifference === 0 && colsDifference < 0) {
            direction = isWhite ? "right" : "left";
        } else if (rowsDifference < 0 && colsDifference > 0) {
            direction = isWhite ? "bottom-left" : "top-right";
        } else if (rowsDifference < 0 && colsDifference === 0) {
            direction = isWhite ? "back" : "front";
        } else if (rowsDifference < 0 && colsDifference < 0) {
            direction = isWhite ? "bottom-right" : "top-left";
        }

        // in this array we will store piece types which can pin the piece in given direction
        let possiblePieceTypes = [];
        if (["front", "back", "left", "right"].includes(direction)) {
            possiblePieceTypes.push("q");
            possiblePieceTypes.push("r");
        } else if (["top-left", "top-right", "bottom-left", "bottom-right"].includes(direction)) {
            possiblePieceTypes.push("q");
            possiblePieceTypes.push("b");
        }


        // now get virtual board in current state and remove the piece and check the direction from the king. 
        let virtualBoard = getVirtualBoardInCurrentState();
        virtualBoard[piecesRow][piecesCol] = "s";

        let kingMovesInDirection = getVirtualLongRangeMoves(virtualBoard, [kingsRow, kingsCol], isWhite, direction);
        if (kingMovesInDirection === null || kingMovesInDirection.length === 0) {
            return null;
        }
        // check what is at the end of the array -> should be opposite color piece.
        const lastItemIndexes = kingMovesInDirection.at(-1);
        const lastItem = virtualBoard[lastItemIndexes[0]][lastItemIndexes[1]];
        if (lastItem === "s" || lastItem === "h") {
            return null;
        }
        const oppositeColorMark = isWhite ? "B" : "W";
        const lastItemArray = lastItem.split(" ");
        if (lastItemArray[0] === oppositeColorMark && possiblePieceTypes.includes(lastItemArray[1])) {
            possibleMovesDuringPin.push(...kingMovesInDirection);
            possibleMovesDuringPin = possibleMovesDuringPin.filter(item => !(item[0] === piecesRow && item[1] === piecesCol));
            return possibleMovesDuringPin;
        }
        return null;
    }

    /// SECTION for DEFENDiNG and ATTACKING stuff

    function getAttackingMoves(piece) {
        let pieceClasses = piece.classList;
        let pieceType;
        for (let pieceClass of pieceClasses) {
            if (pieceClass === "white" || pieceClass === "black") {
                continue;
            } else if (pieceClass === "piece") {
                continue;
            } else {
                // save the class
                pieceType = pieceClass;
            }
        }


        let attackingMoves = [];

        switch (pieceType) {
            case "pawn":
                attackingMoves = getAttackingPawnMoves(piece);
                break;
            case "knight":
                attackingMoves = findLegalKnightMoves(piece);
                break;
            case "bishop":
                attackingMoves = findLegalBishopMoves(piece);
                break;
            case "rook":
                attackingMoves = findLegalRookMoves(piece);
                break;
            case "queen":
                attackingMoves = findLegalQueenMoves(piece);
                break;
            case "king":
                attackingMoves = getAttackingKingMoves(piece);
                break;
            default:
                break;
        }

        return attackingMoves;
    }

    function getAttackingPawnMoves(piece) {
        let isWhite = piece.classList.contains("white");
        let oppositeColor = isWhite ? "black" : "white";
        let attackingMoves = [];
        // pawn is attacking only on its top diagonals
        let topLeftDiagonalElement = getElement(piece, isWhite, "top-left");
        if (topLeftDiagonalElement === null) {
            // do nothing
        } else if (topLeftDiagonalElement.classList.contains("square") || topLeftDiagonalElement.classList.contains(oppositeColor)) {
            attackingMoves.push(topLeftDiagonalElement);
        }

        let topRightDiagonalElement = getElement(piece, isWhite, "top-right");
        if (topRightDiagonalElement === null) {
            //do nothing
        } else if (topRightDiagonalElement.classList.contains("square") || topRightDiagonalElement.classList.contains(oppositeColor)) {
            attackingMoves.push(topRightDiagonalElement);
        }

        return attackingMoves;
    }

    function getAttackingKingMoves(piece) {
        let attackingMoves = [];
        let isWhite = piece.classList.contains("white");
        let oppositeColor = isWhite ? "black" : "white";

        let directions = ["front", "top-right", "right", "bottom-right", "back", "bottom-left", "left", "top-left"];
        let nextElement;
        for (let direction of directions) {
            nextElement = getElement(piece, isWhite, direction);

            if (nextElement === null) {
                // do nothing
            } else if (nextElement.classList.contains("square") || nextElement.classList.contains(oppositeColor)) {
                attackingMoves.push(nextElement);
            }
        }
        return attackingMoves;
    }

    // I will provide a square and a color and this function will return all pieces OF THAT COLOR which are attacking it
    // so for example, I provide a bishop of black color, and isWhite will be true, because I look between attackers of opposite color
    function getAttackingPieces(square, isWhite) {
        let attackingPieces = [];

        let piecesColor = isWhite ? "white" : "black";
        // get all pieces
        let pieces = document.getElementsByClassName(piecesColor + " piece");

        // idea - one by one, go through pieces. 
        // for each piece, get its attacking moves. If there is this square between them,
        // it means it attacks it. 
        // Add the piece to array
        let pieceAttackingMoves;
        for (let piece of pieces) {
            pieceAttackingMoves = getAttackingMoves(piece);
            if (pieceAttackingMoves.includes(square)) {
                attackingPieces.push(piece);
            }
        }

        return attackingPieces;
    }

    // I will provide a square and a color and this function will return true if some piece attacks it
    // the color is the color of attacking pieces
    function isAttacked(square, isWhite) {
        let piecesColor = isWhite ? "white" : "black";
        // get all pieces
        let pieces = document.getElementsByClassName(piecesColor + " piece");

        let pieceAttackingMoves;
        for (let piece of pieces) {
            pieceAttackingMoves = getAttackingMoves(piece);
            if (pieceAttackingMoves.includes(square)) {
                return true;
            }
        }

        return false;
    }

    function getDefendingPieceMoves(piece) {
        let pieceClasses = piece.classList;
        let pieceType;
        for (let pieceClass of pieceClasses) {
            if (pieceClass === "white" || pieceClass === "black") {
                continue;
            } else if (pieceClass === "piece") {
                continue;
            } else {
                // save the class
                pieceType = pieceClass;
            }
        }


        let defendingMoves = [];

        switch (pieceType) {
            case "pawn":
                defendingMoves = getDefendingPawnMoves(piece);
                break;
            case "knight":
                defendingMoves = getDefendingKnightMoves(piece);
                break;
            case "bishop":
                defendingMoves = getDefendingBishopMoves(piece);
                break;
            case "rook":
                defendingMoves = getDefendingRookMoves(piece);
                break;
            case "queen":
                defendingMoves = getDefendingQueenMoves(piece);
                break;
            case "king":
                defendingMoves = getDefendingKingMoves(piece);
                break;
            default:
                break;
        }

        return defendingMoves;
    }

    function getDefendingPawnMoves(piece) {
        let isWhite = piece.classList.contains("white");
        let myColor = isWhite ? "white" : "black";
        let defendingMoves = [];
        // pawn is defending only on its top diagonals
        let topLeftDiagonalElement = getElement(piece, isWhite, "top-left");
        if (topLeftDiagonalElement === null) {
            // do nothing
        } else if (topLeftDiagonalElement.classList.contains("square") || topLeftDiagonalElement.classList.contains(myColor)) {
            defendingMoves.push(topLeftDiagonalElement);
        }

        let topRightDiagonalElement = getElement(piece, isWhite, "top-right");
        if (topRightDiagonalElement === null) {
            //do nothing
        } else if (topRightDiagonalElement.classList.contains("square") || topRightDiagonalElement.classList.contains(myColor)) {
            defendingMoves.push(topRightDiagonalElement);
        }

        return defendingMoves;
    }

    function getDefendingKnightMoves(piece) {
        let defendingMoves = [];

        let isWhite = piece.classList.contains("white");
        let myColor = isWhite ? "white" : "black";

        // lets get all possible moves
        let possibleMoves = getAllKnightMoves(piece);
        // go through them and check for empty squares and same color pieces
        for (let possibleMove of possibleMoves) {
            if (possibleMove === null) {
                //if null just do nothing
            } else if (possibleMove.classList.contains("square") || possibleMove.classList.contains(myColor)) {
                defendingMoves.push(possibleMove);
            }
            // otherwise just do nothing
        }

        // return the array, which may be empty
        return defendingMoves;
    }

    function getDefendingBishopMoves(piece) {
        let defendingMoves = [];

        let isWhite = piece.classList.contains("white");

        let topLeftDiagonalMoves = getDefendingMoves(piece, isWhite, "top-left");
        let topRightDiagonalMoves = getDefendingMoves(piece, isWhite, "top-right");
        let bottomRightDiagonalMoves = getDefendingMoves(piece, isWhite, "bottom-right");
        let bottomLeftDiagonalMoves = getDefendingMoves(piece, isWhite, "bottom-left");

        // add all moves to legal moves array
        defendingMoves.push(...topLeftDiagonalMoves);
        defendingMoves.push(...topRightDiagonalMoves);
        defendingMoves.push(...bottomRightDiagonalMoves);
        defendingMoves.push(...bottomLeftDiagonalMoves);
        return defendingMoves;
    }

    function getDefendingRookMoves(rook) {
        let legalMoves = [];

        let isWhite = rook.classList.contains("white");

        let frontMoves = getDefendingMoves(rook, isWhite, "front");
        let rightMoves = getDefendingMoves(rook, isWhite, "right");
        let backMoves = getDefendingMoves(rook, isWhite, "back");
        let leftMoves = getDefendingMoves(rook, isWhite, "left");

        // add all moves to legal moves array
        legalMoves.push(...frontMoves);
        legalMoves.push(...rightMoves);
        legalMoves.push(...backMoves);
        legalMoves.push(...leftMoves);
        return legalMoves;
    }

    function getDefendingQueenMoves(piece) {
        let legalMoves = [];

        let isWhite = piece.classList.contains("white");

        let frontMoves = getDefendingMoves(piece, isWhite, "front");
        let rightMoves = getDefendingMoves(piece, isWhite, "right");
        let backMoves = getDefendingMoves(piece, isWhite, "back");
        let leftMoves = getDefendingMoves(piece, isWhite, "left");
        let topLeftDiagonalMoves = getDefendingMoves(piece, isWhite, "top-left");
        let topRightDiagonalMoves = getDefendingMoves(piece, isWhite, "top-right");
        let bottomRightDiagonalMoves = getDefendingMoves(piece, isWhite, "bottom-right");
        let bottomLeftDiagonalMoves = getDefendingMoves(piece, isWhite, "bottom-left");


        // add all moves to legal moves array
        legalMoves.push(...frontMoves);
        legalMoves.push(...rightMoves);
        legalMoves.push(...backMoves);
        legalMoves.push(...leftMoves);
        legalMoves.push(...topLeftDiagonalMoves);
        legalMoves.push(...topRightDiagonalMoves);
        legalMoves.push(...bottomRightDiagonalMoves);
        legalMoves.push(...bottomLeftDiagonalMoves);

        return legalMoves;
    }

    function getDefendingKingMoves(piece) {
        let defendingMoves = [];
        let isWhite = piece.classList.contains("white");
        let sameColor = isWhite ? "white" : "black";

        let directions = ["front", "top-right", "right", "bottom-right", "back", "bottom-left", "left", "top-left"];
        let nextElement;
        for (let direction of directions) {
            nextElement = getElement(piece, isWhite, direction);

            if (nextElement === null) {
                // do nothing
            } else if (nextElement.classList.contains("square") || nextElement.classList.contains(sameColor)) {
                defendingMoves.push(nextElement);
            }
        }
        return defendingMoves;
    }

    function getDefendingMoves(square, isWhite, direction) {
        let defendingMoves = [];
        let myColor = isWhite ? "white" : "black";

        let nextElement = getElement(square, isWhite, direction);

        if (nextElement === null) {
            // do nothing
        } else if (nextElement.classList.contains("square")) {
            // add current element
            defendingMoves.push(nextElement);
            // and go to recursion
            defendingMoves.push(...getDefendingMoves(nextElement, isWhite, direction));
        } else if (nextElement.classList.contains(myColor)) {
            defendingMoves.push(nextElement);
        }

        return defendingMoves;
    }

    // I will provide a piece and a color of that piece and this function will answer this question: "Is this piece defended?"
    // returns true or false
    function isDefended(piece, isWhite) {
        let sameColor = isWhite ? "white" : "black";
        let friendlyPieces = document.getElementsByClassName(sameColor + " piece");
        let defendingMoves;
        for (let friendlyPiece of friendlyPieces) {
            defendingMoves = getDefendingPieceMoves(friendlyPiece);
            if (defendingMoves.includes(piece)) {
                return true;
            }
        }
        return false;
    }

    // I will provide two piece -> first piece the targete, second piece the defender
    // this function will answer this -> is target defended by the defender?
    function isThePieceDefended(piece, defender) {
        let isWhite = piece.classList.contains("white");
        let sameColor = isWhite ? "white" : "black";

        let defendingMoves = getDefendingPieceMoves(defender);
        if (defendingMoves.includes(piece)) {
            return true;
        }

        return false;
    }


    /// SECTION for helping functions to calculate front, back, left, right, top-left top-right bottom-left and bottom-right diagonal squares

    function getElement(square, isWhite, direction) {
        let columnIndex;
        let rowIndex;

        switch (direction) {
            case "front":
                columnIndex = getColumnsIndex(square);
                rowIndex = getNewFrontRowIndex(square, isWhite);
                break;
            case "top-right":
                rowIndex = getNewFrontRowIndex(square, isWhite);
                columnIndex = getNewRightColumnIndex(square, isWhite);
                break;
            case "right":
                rowIndex = getRowIndex(square);
                columnIndex = getNewRightColumnIndex(square, isWhite);
                break;
            case "bottom-right":
                rowIndex = getNewBackRowIndex(square, isWhite);
                columnIndex = getNewRightColumnIndex(square, isWhite);
                break;
            case "back":
                rowIndex = getNewBackRowIndex(square, isWhite);
                columnIndex = getColumnsIndex(square);
                break;
            case "bottom-left":
                rowIndex = getNewBackRowIndex(square, isWhite);
                columnIndex = getNewLeftColumnIndex(square, isWhite);
                break;
            case "left":
                rowIndex = getRowIndex(square);
                columnIndex = getNewLeftColumnIndex(square, isWhite);
                break;
            case "top-left":
                rowIndex = getNewFrontRowIndex(square, isWhite);
                columnIndex = getNewLeftColumnIndex(square, isWhite);
                break;
            default:
                break;
        }

        if (rowIndex === null || columnIndex === null ||
            rowIndex < 0 || rowIndex >= boardRows.length ||
            columnIndex < 0 || columnIndex >= boardRows[rowIndex].children.length
        ) {
            return null;
        }

        return boardRows[rowIndex].children[columnIndex].firstElementChild;
    }

    ///// SECTION for totally basic functions - helping to get correct indexes from different directions.
    // they return null in case the index is OUT OF BOUNDS of the board


    // returns index of the column of the piece
    function getColumnsIndex(piece) {
        // lets find the column it is acutally on
        let currentRowColumns = piece.parentElement.parentElement.children;
        let currentColumnIndex = -1;

        for (let i = 0; i < currentRowColumns.length; i++) {
            if (currentRowColumns[i] == piece.parentElement) {
                return i;
            }
        }
        return currentColumnIndex;
    }

    function getRowIndex(piece) {
        // lets find the index of the row it is actually on.
        let currentPieceRow = piece.parentElement.parentElement;
        let currentRowIndex = -1;
        for (let i = 0; i < boardRows.length; i++) {
            if (boardRows[i] == currentPieceRow) {
                return i;
            }
        }

        return currentRowIndex;
    }

    function getNewFrontRowIndex(piece, isWhite) {
        // now lets find row index
        let currentRowIndex = getRowIndex(piece);

        // calculate new row index
        let newRowIndex;

        // now based on color choose if we will look in front or back
        let increment = isWhite ? -1 : 1;

        // if we are on the edge of the board
        if (currentRowIndex === 0 && isWhite) {
            return null;
        } else if (currentRowIndex === 7 && !(isWhite)) {
            return null;
        }
        else {
            newRowIndex = currentRowIndex + increment;
        }

        return newRowIndex;
    }

    function getNewBackRowIndex(piece, isWhite) {
        // now lets find row index
        let currentRowIndex = getRowIndex(piece);

        // calculate new row index
        let newRowIndex;

        // now based on color choose if we will look in front or back
        let increment = isWhite ? 1 : -1;

        // if we are on the edge of the board
        if (currentRowIndex === 7 && isWhite) {
            return null;
        } else if (currentRowIndex === 0 && !(isWhite)) {
            return null;
        }
        else {
            newRowIndex = currentRowIndex + increment;
        }

        return newRowIndex;
    }

    function getNewRightColumnIndex(piece, isWhite) {
        // lets find the column it is acutally on
        let currentColumnIndex = getColumnsIndex(piece);

        // calculate new column index. In case of white it is +1, in case of black it is -1.
        let increment = isWhite ? 1 : -1;
        let newColumnIndex;

        // if we are on the edge
        if (currentColumnIndex === 7 && isWhite) {
            return null;
        } else if (currentColumnIndex === 0 && !(isWhite)) {
            return null;
        } else {
            newColumnIndex = currentColumnIndex + increment;
        }

        return newColumnIndex;
    }

    function getNewLeftColumnIndex(piece, isWhite) {
        // lets find the column it is acutally on
        let currentColumnIndex = getColumnsIndex(piece);

        // calculate new column index. In case of white it is -1, in case of black it is +1.
        let increment = isWhite ? -1 : 1;
        let newColumnIndex;

        // if we are on the edge
        if (currentColumnIndex === 0 && isWhite) {
            return null;
        } else if (currentColumnIndex === 7 && !(isWhite)) {
            return null;
        } else {
            newColumnIndex = currentColumnIndex + increment;
        }

        return newColumnIndex;
    }

    function addPieceToRemovedArray(piece) {
        let isWhite = piece.classList.contains("white");

        if (isWhite) {
            let takenWhitePiecesDiv = document.getElementById("taken-white-pieces");
            takenWhitePiecesDiv.appendChild(piece);
        } else {
            let takenBlackPiecesDiv = document.getElementById("taken-black-pieces");
            takenBlackPiecesDiv.appendChild(piece);
        }
        piece.className = "col-1-8";
    }

    /// section VIRTUAL BOARD

    // this function will return 2D array, with the state of the actual game
    function getVirtualBoardInCurrentState() {
        let virtualBoard = [];
        // now go through every row and for each row, go through all its children. 
        // based on what is on given position, store symbol. 
        /**
         * Symbols:
         * white color piece: W
         * black color piece: B
         * pawn: p
         * knight: n
         * bishop: b
         * rook: r
         * queen: q
         * king: k
         * No color symbols:
         * empty square: s
         * highlighter: h
         */

        for (let i = 0; i < boardRows.length; i++) {
            let currentRow = [];
            for (let j = 0; j < boardRows[i].children.length; j++) {
                let currentElement = boardRows[i].children[j].firstElementChild;
                let currentString = "";
                if (currentElement.classList.contains("square")) {
                    currentString = currentString + "s";
                } else if (currentElement.classList.contains("white")) {
                    currentString = currentString + "W ";
                    if (currentElement.classList.contains("pawn")) {
                        currentString = currentString + "p";
                    } else if (currentElement.classList.contains("knight")) {
                        currentString = currentString + "n";
                    } else if (currentElement.classList.contains("bishop")) {
                        currentString = currentString + "b";
                    } else if (currentElement.classList.contains("rook")) {
                        currentString = currentString + "r";
                    } else if (currentElement.classList.contains("queen")) {
                        currentString = currentString + "q";
                    } else if (currentElement.classList.contains("king")) {
                        currentString = currentString + "k";
                    }
                } else if (currentElement.classList.contains("black")) {
                    currentString = currentString + "B ";
                    if (currentElement.classList.contains("pawn")) {
                        currentString = currentString + "p";
                    } else if (currentElement.classList.contains("knight")) {
                        currentString = currentString + "n";
                    } else if (currentElement.classList.contains("bishop")) {
                        currentString = currentString + "b";
                    } else if (currentElement.classList.contains("rook")) {
                        currentString = currentString + "r";
                    } else if (currentElement.classList.contains("queen")) {
                        currentString = currentString + "q";
                    } else if (currentElement.classList.contains("king")) {
                        currentString = currentString + "k";
                    }
                } else if (currentElement.classList.contains("highlighter")) {
                    currentString = currentString + "h";
                }
                currentRow[j] = currentString;
            }
            virtualBoard[i] = currentRow;
        }

        return virtualBoard;
    }

    // The function will move the piece to a square, on the vritual board. 
    // It will put empty square on the original place of the piece. 
    function moveVirtuallyToSquare(virtualBoard, piece, square) {
        let pieceString = virtualBoard[piece[0]][piece[1]];
        virtualBoard[piece[0]][piece[1]] = "s";
        virtualBoard[square[0]][square[1]] = pieceString;
        return virtualBoard;
    }

    /// most basic functions for working with virtual board
    // finding moves for given piece. 
    // how to work with it. 
    // let's say I will be passing indexes, like [0, 1] and I will know that on that place there is this and this piece. 
    // I will have to work with colors -> I want to find out if opposite color army is attacking my king.
    // I will be working with arrays of coordinates

    function getVirtualPieces(virtualBoard, isWhite) {
        let colorMark = isWhite ? "W " : "B ";
        let pieces = [];
        // go through board and look for the letter.
        for (let i = 0; i < virtualBoard.length; i++) {
            for (let j = 0; j < virtualBoard[0].length; j++) {
                if (virtualBoard[i][j].includes(colorMark)) {
                    pieces.push([i, j]);
                }
            }
        }

        return pieces;
    }

    // In this case the "isWhite" is the color of the KING!! I must pass opposite color to isVirtuallyAttacking.
    function isVirtualKingInCheck(virtualBoard, isWhite) {
        let myColorMark = isWhite ? "W " : "B ";
        let myKing = findVirtualPiece(virtualBoard, myColorMark + "k");
        let oponnentsPieces = getVirtualPieces(virtualBoard, !(isWhite));

        for (let oponnentsPiece of oponnentsPieces) {
            if (isVirtuallyAttacking(virtualBoard, !(isWhite), oponnentsPiece, myKing)) {
                return true;
            }
        }
        return false;
    }

    // returns virtual indexes of a piece, defined by string. null if not found.
    function findVirtualPiece(virtualBoard, string) {
        for (let i = 0; i < virtualBoard.length; i++) {
            for (let j = 0; j < virtualBoard[0].length; j++) {
                if (virtualBoard[i][j] === string) {
                    return [i, j];
                }
            }
        }

        return null;
    }

    // provided attacker and 'target', this function will return true if given attacker is attacking target.
    // isWhite here is the color of the attacker
    function isVirtuallyAttacking(virtualBoard, isWhite, attacker, target) {
        let attackingMoves = findVirtualAttackingMoves(virtualBoard, isWhite, attacker);
        for (let attackingMove of attackingMoves) {
            if (attackingMove.toString() === target.toString()) {
                return true;
            }
        }

        return false;
    }

    // isWhite - is color of the attacker
    function findVirtualAttackingMoves(virtualBoard, isWhite, attacker) {
        let subStrings = virtualBoard[attacker[0]][attacker[1]].split(" ");
        let pieceType = subStrings[1];
        let attackingMoves = [];

        switch (pieceType) {
            case "p":
                attackingMoves = findVirtualAttackingPawnMoves(virtualBoard, isWhite, attacker);
                break;
            case "b":
                attackingMoves = findVirtualAttackingBishopMoves(virtualBoard, isWhite, attacker);
                break;
            case "n":
                attackingMoves = findVirtualAttackingKnightMoves(virtualBoard, isWhite, attacker);
                break;
            case "r":
                attackingMoves = findVirtualAttackingRookMoves(virtualBoard, isWhite, attacker);
                break;
            case "q":
                attackingMoves = findVirtualAttackingQueenMoves(virtualBoard, isWhite, attacker);
                break;
            case "k":
                attackingMoves = findVirtualAttackingKingMoves(virtualBoard, isWhite, attacker);
                break;
            default:
                break;
        }

        return attackingMoves;
    }

    function findVirtualAttackingKingMoves(virtualBoard, isWhite, attacker) {
        let attackingMoves = [];
        let oppositeColorMark = isWhite ? "B" : "W";
        let directions = ["front", "top-left", "right", "bottom-right", "back", "bottom-left", "left", "top-left"];
        let possibleMoves = [];

        for (let direction of directions) {
            let currentElementIndexes = getVirtualElementIndexes(attacker, isWhite, direction);
            possibleMoves.push(currentElementIndexes);
        }

        for (let possibleMove of possibleMoves) {
            if (possibleMove === null || possibleMove[0] === null || possibleMove[1] === null) {
                continue;
            } else if (virtualBoard[possibleMove[0]][possibleMove[1]].includes(oppositeColorMark) || virtualBoard[possibleMove[0]][possibleMove[1]] === "s") {
                attackingMoves.push(possibleMove);
            }
        }

        return attackingMoves;
    }

    function findVirtualAttackingQueenMoves(virtualBoard, isWhite, attacker) {
        let attackingMoves = [];

        let frontMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "front");
        let rightMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "right");
        let backMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "back");
        let leftMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "left");
        let topLeftDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "top-left");
        let topRightDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "top-right");
        let bottomRightDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "bottom-right");
        let bottomLeftDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "bottom-left");

        attackingMoves.push(...frontMoves);
        attackingMoves.push(...rightMoves);
        attackingMoves.push(...backMoves);
        attackingMoves.push(...leftMoves);
        attackingMoves.push(...topLeftDiagonalMoves);
        attackingMoves.push(...topRightDiagonalMoves);
        attackingMoves.push(...bottomRightDiagonalMoves);
        attackingMoves.push(...bottomLeftDiagonalMoves);

        return attackingMoves;
    }

    function findVirtualAttackingRookMoves(virtualBoard, isWhite, attacker) {
        let attackingMoves = [];

        let frontMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "front");
        let rightMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "right");
        let backMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "back");
        let leftMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "left");

        attackingMoves.push(...frontMoves);
        attackingMoves.push(...rightMoves);
        attackingMoves.push(...backMoves);
        attackingMoves.push(...leftMoves);

        return attackingMoves;
    }

    function findVirtualAttackingKnightMoves(virtualBoard, isWhite, attacker) {
        let attackingMoves = [];
        let possibleMoves = getAllVirtualKnightMoves(attacker);
        let oppositeColorMark = isWhite ? "B" : "W";

        // go through moves and check if it is square or opposite color piece
        for (let possibleMove of possibleMoves) {
            let currentMoveString = virtualBoard[possibleMove[0]][possibleMove[1]];
            if (currentMoveString.includes(oppositeColorMark) || currentMoveString === "s") {
                attackingMoves.push(possibleMove);
            }
        }

        return attackingMoves;
    }

    function getAllVirtualKnightMoves(knight) {
        let knightMoves = [];
        let currentRowIndex = knight[0];
        let currentColumnIndex = knight[1];

        // there are eight combinations
        // order matters
        // -1 -2
        if (((currentRowIndex - 1) >= 0) && ((currentColumnIndex - 2) >= 0)) {
            knightMoves.push([(currentRowIndex - 1), (currentColumnIndex - 2)]);
        }
        // -2 -1
        if (((currentRowIndex - 2) >= 0) && ((currentColumnIndex - 1) >= 0)) {
            knightMoves.push([(currentRowIndex - 2), (currentColumnIndex - 1)]);
        }

        // -1 2
        if (((currentRowIndex - 1) >= 0) && ((currentColumnIndex + 2) <= 7)) {
            knightMoves.push([(currentRowIndex - 1), (currentColumnIndex + 2)]);
        }
        // -2 1
        if (((currentRowIndex - 2) >= 0) && ((currentColumnIndex + 1) <= 7)) {
            knightMoves.push([(currentRowIndex - 2), (currentColumnIndex + 1)]);
        }
        // 1 -2
        if (((currentRowIndex + 1) <= 7) && ((currentColumnIndex - 2) >= 0)) {
            knightMoves.push([(currentRowIndex + 1), (currentColumnIndex - 2)]);
        }
        // 2 -1
        if (((currentRowIndex + 2) <= 7) && ((currentColumnIndex - 1) >= 0)) {
            knightMoves.push([(currentRowIndex + 2), (currentColumnIndex - 1)]);
        }
        // 1 2
        if (((currentRowIndex + 1) <= 7) && ((currentColumnIndex + 2) <= 7)) {
            knightMoves.push([(currentRowIndex + 1), (currentColumnIndex + 2)]);
        }
        // 2 1
        if (((currentRowIndex + 2) <= 7) && ((currentColumnIndex + 1) <= 7)) {
            knightMoves.push([(currentRowIndex + 2), (currentColumnIndex + 1)]);
        }

        return knightMoves;
    }


    function findVirtualAttackingBishopMoves(virtualBoard, isWhite, attacker) {
        let attackingMoves = [];

        let topLeftDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "top-left");
        let topRightDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "top-right");
        let bottomRightDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "bottom-right");
        let bottomLeftDiagonalMoves = getVirtualLongRangeMoves(virtualBoard, attacker, isWhite, "bottom-left");

        attackingMoves.push(...topLeftDiagonalMoves);
        attackingMoves.push(...topRightDiagonalMoves);
        attackingMoves.push(...bottomRightDiagonalMoves);
        attackingMoves.push(...bottomLeftDiagonalMoves);

        return attackingMoves;
    }

    function findVirtualAttackingPawnMoves(virtualBoard, isWhite, attacker) {
        let attackingMoves = [];
        let oppositeColorMark = isWhite ? "B" : "W";
        let leftDiagonalElementIndexes = getVirtualElementIndexes(attacker, isWhite, "top-left");
        if (leftDiagonalElementIndexes === null || leftDiagonalElementIndexes[0] === null || leftDiagonalElementIndexes[1] === null) {
            // do nothing
        } else {
            let leftDiagonalElementString = virtualBoard[leftDiagonalElementIndexes[0]][leftDiagonalElementIndexes[1]];
            if (leftDiagonalElementString.includes(oppositeColorMark) || leftDiagonalElementString === "s") {
                attackingMoves.push(leftDiagonalElementIndexes);
            }
        }

        let rightDiagonalElementIndexes = getVirtualElementIndexes(attacker, isWhite, "top-right");
        if (rightDiagonalElementIndexes === null || rightDiagonalElementIndexes[0] === null || rightDiagonalElementIndexes[1] === null) {
            // do nothing
        } else {
            let rightDiagonalElementString = virtualBoard[rightDiagonalElementIndexes[0]][rightDiagonalElementIndexes[1]];
            if (rightDiagonalElementString.includes(oppositeColorMark) || rightDiagonalElementString === "s") {
                attackingMoves.push(rightDiagonalElementString);
            }
        }

        return attackingMoves;
    }

    /// VIRTUAL! section for elementary/basic functions

    // get long-range moves
    function getVirtualLongRangeMoves(virtualBoard, square, isWhite, direction) {
        let legalMoves = [];
        let oppositeColorMark = isWhite ? "B" : "W";

        let nextElementIndexes = getVirtualElementIndexes(square, isWhite, direction);
        if (nextElementIndexes === null) {
            return legalMoves;
        }

        if (nextElementIndexes[0] === null || nextElementIndexes[1] === null) {
            return legalMoves;
        }
        let nextElement = virtualBoard[nextElementIndexes[0]][nextElementIndexes[1]];

        if (nextElement === null) {
            // do nothing
        } else if (nextElement === "s") {
            // add current element
            legalMoves.push(nextElementIndexes);
            // and go to recursion
            legalMoves.push(...getVirtualLongRangeMoves(virtualBoard, nextElementIndexes, isWhite, direction));
        } else if (nextElement.includes(oppositeColorMark)) {
            legalMoves.push(nextElementIndexes);
        }

        // last possibility is that is is same color piece, which means we do nothing and we return

        return legalMoves;
    }

    function getVirtualElementIndexes(square, isWhite, direction) {
        let columnIndex;
        let rowIndex;

        switch (direction) {
            case "front":
                columnIndex = square[1];
                rowIndex = getNewVirtualFrontRowIndex(square, isWhite);
                break;
            case "top-right":
                rowIndex = getNewVirtualFrontRowIndex(square, isWhite);
                columnIndex = getNewVirtualRightColumnIndex(square, isWhite);
                break;
            case "right":
                rowIndex = square[0];
                columnIndex = getNewVirtualRightColumnIndex(square, isWhite);
                break;
            case "bottom-right":
                rowIndex = getNewVirtualBackRowIndex(square, isWhite);
                columnIndex = getNewVirtualRightColumnIndex(square, isWhite);
                break;
            case "back":
                rowIndex = getNewVirtualBackRowIndex(square, isWhite);
                columnIndex = square[1];
                break;
            case "bottom-left":
                rowIndex = getNewVirtualBackRowIndex(square, isWhite);
                columnIndex = getNewVirtualLeftColumnIndex(square, isWhite);
                break;
            case "left":
                rowIndex = square[0];
                columnIndex = getNewVirtualLeftColumnIndex(square, isWhite);
                break;
            case "top-left":
                rowIndex = getNewVirtualFrontRowIndex(square, isWhite);
                columnIndex = getNewVirtualLeftColumnIndex(square, isWhite);
                break;
            default:
                break;
        }

        if (rowIndex === null || columnIndex === null ||
            rowIndex < 0 || rowIndex >= boardRows.length ||
            columnIndex < 0 || columnIndex >= boardRows[0].children.length
        ) {
            return null;
        }

        return [rowIndex, columnIndex];
    }

    function getNewVirtualFrontRowIndex(piece, isWhite) {
        // now lets find row index
        let currentRowIndex = piece[0];

        // calculate new row index
        let newRowIndex;

        // now based on color choose if we will look in front or back
        let increment = isWhite ? -1 : 1;

        // if we are on the edge of the board
        if (currentRowIndex === 0 && isWhite) {
            return null;
        } else if (currentRowIndex === 7 && !(isWhite)) {
            return null;
        }
        else {
            newRowIndex = currentRowIndex + increment;
        }

        return newRowIndex;
    }

    function getNewVirtualBackRowIndex(piece, isWhite) {
        // now lets find row index
        let currentRowIndex = piece[0];

        // calculate new row index
        let newRowIndex;

        // now based on color choose if we will look in front or back
        let increment = isWhite ? 1 : -1;

        // if we are on the edge of the board
        if (currentRowIndex === 7 && isWhite) {
            return null;
        } else if (currentRowIndex === 0 && !(isWhite)) {
            return null;
        }
        else {
            newRowIndex = currentRowIndex + increment;
        }

        return newRowIndex;
    }

    function getNewVirtualRightColumnIndex(piece, isWhite) {
        // lets find the column it is acutally on
        let currentColumnIndex = piece[1];

        // calculate new column index. In case of white it is +1, in case of black it is -1.
        let increment = isWhite ? 1 : -1;
        let newColumnIndex;

        // if we are on the edge
        if (currentColumnIndex === 7 && isWhite) {
            return null;
        } else if (currentColumnIndex === 0 && !(isWhite)) {
            return null;
        } else {
            newColumnIndex = currentColumnIndex + increment;
        }

        return newColumnIndex;
    }

    function getNewVirtualLeftColumnIndex(piece, isWhite) {
        // lets find the column it is acutally on
        let currentColumnIndex = piece[1];

        // calculate new column index. In case of white it is -1, in case of black it is +1.
        let increment = isWhite ? -1 : 1;
        let newColumnIndex;

        // if we are on the edge
        if (currentColumnIndex === 0 && isWhite) {
            return null;
        } else if (currentColumnIndex === 7 && !(isWhite)) {
            return null;
        } else {
            newColumnIndex = currentColumnIndex + increment;
        }
        return newColumnIndex;
    }

    startTurn();
}