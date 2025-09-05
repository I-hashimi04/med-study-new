import React, { useEffect, useState } from 'react';

function App() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/cards')
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Med Study Cards</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {cards.map(card => (
            <li key={card.id}>
              <strong>Q:</strong> {card.question}<br />
              <strong>A:</strong> {card.answer}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;