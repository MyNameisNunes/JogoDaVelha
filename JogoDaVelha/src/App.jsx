import { useState } from 'react'
import './App.css'

// Componente de cada casa do tabuleiro
function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  )
}

// Função auxiliar para descobrir se alguém venceu
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let i = 0; i < lines.length; i += 1) {
    const [a, b, c] = lines[i]

    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a]
    }
  }

  return null
}

export default function App() {
  // Guarda quem joga agora: true = X, false = O
  const [xIsNext, setXIsNext] = useState(true)

  // Guarda o estado das 9 casas do tabuleiro
  const [squares, setSquares] = useState(Array(9).fill(null))

  // Reseta o jogo para o estado inicial
  function handleReset() {
    setSquares(Array(9).fill(null))
    setXIsNext(true)
  }

  function handleClick(i) {
    // Impede jogar em casa ocupada ou após existir vencedor
    if (squares[i] || calculateWinner(squares)) {
      return
    }

    // Cria uma cópia para manter imutabilidade do estado
    const nextSquares = squares.slice()

    // Marca X ou O de acordo com o jogador atual
    nextSquares[i] = xIsNext ? 'X' : 'O'

    // Atualiza o tabuleiro e alterna o próximo jogador
    setSquares(nextSquares)
    setXIsNext(!xIsNext)
  }

  const winner = calculateWinner(squares)
  const isDraw = !winner && squares.every((square) => square !== null)
  let status

  // Texto de status mostrado acima do tabuleiro
  if (winner) {
    status = `Vencedor: ${winner}`
  } else if (isDraw) {
    status = 'Deu velha! Ninguem venceu.'
  } else {
    status = `Proximo jogador: ${xIsNext ? 'X' : 'O'}`
  }

  return (
    <main className="game">
      <h1>Jogo da Velha</h1>
      <div className="status">{status}</div>

      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>

      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>

      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>

      <button className="reset-button" onClick={handleReset}>
        Reiniciar jogo
      </button>
    </main>
  )
}

