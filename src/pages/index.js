import React, { useState, useEffect } from 'react';
import CARDS from '../cards.json'; // Import cards from a separate JSON file

function App() {
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [roundsLeft, setRoundsLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [scores, setScores] = useState({});
  const [message, setMessage] = useState('');
  const [selectedPoints, setSelectedPoints] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [timer, setTimer] = useState(60);
  const [roundActive, setRoundActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let countdown;
    if (roundActive) {
      countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            endRound('time');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [roundActive]);

  const startGame = (playerNames, rounds) => {
    const initialScores = {};
    playerNames.forEach((name) => (initialScores[name] = 0));
    setScores(initialScores);
    setPlayers(playerNames);
    setRoundsLeft(rounds);
    setAvailableCards([...CARDS]); // Copy of the full cards array
    setGameStarted(true);
    setSelectedPoints(null);
    setGameOver(false); // Reset gameOver state when starting a new game
  };

  const startRound = () => {
    setMessage('');
    setRoundActive(true);
    drawCard(); // Start the round by drawing the first card
  };

  const drawCard = () => {
    if (!selectedPoints) return; // Don't draw if no points are selected
    
    // Filter the cards based on selected points
    const filteredCards = availableCards.filter((card) => card.points === selectedPoints);
    
    if (filteredCards.length === 0) {
      setMessage('No more cards available for the selected points.');
      endRound('out-of-cards');
      return;
    }
    
    // Randomly pick a card from the filtered cards
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    const drawnCard = filteredCards[randomIndex];
    setCurrentCard(drawnCard); // Set the drawn card in state
    setAvailableCards(availableCards.filter((card) => card !== drawnCard)); // Remove the drawn card from available cards
    // setTimer(60); // Reset the timer for the round only here
  };

  const endRound = (reason) => {
    setRoundActive(false);
    setCurrentCard(null);
    setSelectedPoints(null);
    updateScores();

    if (reason === 'time') {
      setMessage('Round ended due to timeout.');
    } else if (reason === 'out-of-cards') {
      setMessage('Round ended due to lack of available cards.');
    }

    // Check for game-ending condition (no rounds left or no available cards)
    if (roundsLeft <= 1 || availableCards.length === 0) {
      setGameOver(true); // End the game when no rounds left or no cards available
    } else {
      setRoundsLeft(roundsLeft - 1);
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    }
  };

  const updateScores = () => {
    const updatedScores = { ...scores };
    
    // Half points for the guesser, full points for the performer
    const guessedPoints = currentCard ? Math.floor(currentCard.points / 2) : 0;
    const performerPoints = currentCard ? currentCard.points : 0;

    // Update scores
    updatedScores[players[currentPlayerIndex]] += performerPoints; // Full points for the performer
    updatedScores[players[(currentPlayerIndex + 1) % players.length]] += guessedPoints; // Half points for the guesser

    setScores(updatedScores);
  };

  const confirmGuess = () => {
    if (!currentCard) return;
    setMessage(`Correct! ${players[currentPlayerIndex]} performed the act, and ${players[(currentPlayerIndex + 1) % players.length]} guessed it correctly!`);
    updateScores();
    drawCard(); // Don't reset the timer here
  };

  const skipCard = () => {
    setMessage('Card skipped. No points awarded.');
    drawCard(); // Don't reset the timer here
  };

  const startNewGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScores({});
    setRoundsLeft(0);
    setPlayers([]);
    setSelectedPoints(null);
    setAvailableCards([]);
    setTimer(60);
    setRoundActive(false);
    setCurrentPlayerIndex(0);
    setCurrentCard(null);
    setMessage('');
  };

  return (
    <div className="App">
      <h1>TS Alias</h1>
      {!gameStarted ? (
        <SetupScreen startGame={startGame} setSelectedPoints={setSelectedPoints} selectedPoints={selectedPoints} />
      ) : gameOver ? (
        <FinalScoreScreen players={players} scores={scores} startNewGame={startNewGame} />
      ) : !roundActive ? (
        <PointsSelectionScreen
          setSelectedPoints={setSelectedPoints}
          selectedPoints={selectedPoints}
          startRound={startRound}
          currentPlayer={players[currentPlayerIndex]}
          roundsLeft={roundsLeft}
          availableCards={availableCards} // Pass available cards to the PointsSelectionScreen
        />
      ) : (
        <GameScreen
          players={players}
          currentPlayer={players[currentPlayerIndex]}
          currentCard={currentCard}
          confirmGuess={confirmGuess}
          skipCard={skipCard}
          message={message}
          scores={scores}
          timer={timer}
        />
      )}
    </div>
  );
}

function SetupScreen({ startGame, setSelectedPoints, selectedPoints }) {
  const [playerInput, setPlayerInput] = useState('');
  const [rounds, setRounds] = useState(4);

  const handleStart = () => {
    const playerNames = playerInput.split(',').map((name) => name.trim());
    if (playerNames.length > 1) {
      startGame(playerNames, rounds);
    }
  };

  return (
    <div className="SetupScreen">
      <label>
        Players (comma-separated):
        <input
          type="text"
          value={playerInput}
          onChange={(e) => setPlayerInput(e.target.value)}
        />
      </label>
      <br />
      <label>
        Rounds:
        <input
          type="number"
          value={rounds}
          onChange={(e) => setRounds(parseInt(e.target.value, 4))}
        />
      </label>
      <br />
      <button onClick={handleStart}>Start</button>
    </div>
  );
}

function PointsSelectionScreen({
  setSelectedPoints,
  selectedPoints,
  startRound,
  currentPlayer,
  roundsLeft,
  availableCards,
}) {
  // Helper function to check if there are available cards for a specific point value
  const areCardsAvailable = (points) => {
    return availableCards.some((card) => card.points === points);
  };

  return (
    <div className="PointsSelectionScreen">
      <h2>Points Selection</h2>
      <p>Current Player: {currentPlayer}</p>
      <p>Rounds Left: {roundsLeft}</p>
      <div>
        <h3>Select Points:</h3>
        <button
          className={selectedPoints === 2 ? 'selected button-2' : 'button-2'}
          onClick={() => setSelectedPoints(2)}
          disabled={!areCardsAvailable(2)} // Disable if no cards are available for 2 points
        >
          2 Points
        </button>
        <button
          className={selectedPoints === 3 ? 'selected button-3' : 'button-3'}
          onClick={() => setSelectedPoints(3)}
          disabled={!areCardsAvailable(3)} // Disable if no cards are available for 3 points
        >
          3 Points
        </button>
        <button
          className={selectedPoints === 4 ? 'selected button-4' : 'button-4'}
          onClick={() => setSelectedPoints(4)}
          disabled={!areCardsAvailable(4)} // Disable if no cards are available for 4 points
        >
          4 Points
        </button>
      </div>
      <br />
      {selectedPoints && (
        <button onClick={startRound} disabled={!selectedPoints}>
          Start Round
        </button>
      )}
    </div>
  );
}

function GameScreen({
  players,
  currentPlayer,
  currentCard,
  confirmGuess,
  skipCard,
  message,
  scores,
  timer,
}) {
  return (
    <div className="GameScreen">
      <p>Current Player: {currentPlayer}</p>
      <p>Timer: {timer}s</p>
      {currentCard ? (
        <div className={"card card-" + currentCard.points}>
          <p className="category">{currentCard.category}</p>
          <p>{currentCard.phrase}</p>
          <br />
          <div>
            <button onClick={confirmGuess} className="correct">Correct</button>
            <button onClick={skipCard} className="skip">Skip</button>
          </div>
        </div>
      ) : (
        <p>Drawing the next card...</p>
      )}
      {/* <p>{message}</p> */}
      {/* <h3>Scores:</h3>
      <ul>
        {players.map((player) => (
          <li key={player}>
            {player}: {scores[player]} points
          </li>
        ))}
      </ul> */}
    </div>
  );
}

function FinalScoreScreen({ players, scores, startNewGame }) {
  const winner = Object.keys(scores).reduce((a, b) => (scores[a] > scores[b] ? a : b));

  return (
    <div className="FinalScoreScreen">
      <h2>Game Over!</h2>
      <h3>Final Scores:</h3>
      <ul>
        {players.map((player) => (
          <li key={player}>
            {player}: {scores[player]} points
          </li>
        ))}
      </ul>
      <h2>Winner: {winner}</h2>
      <button onClick={startNewGame}>Start New Game</button>
    </div>
  );
}

export default App;
