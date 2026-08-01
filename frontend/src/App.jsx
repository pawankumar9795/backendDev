import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import axios from 'axios'
import './App.css'
import { useEffect } from 'react'

function App() {
  const [jokes, setJokes] = useState([])
  useEffect(() => {
    axios.get('/api/jokes')
    .then((response) => {
      setJokes(response.data) 
    })
    .catch((error) => {
      console.log(error)
    })
  },[])
  return (
    <>
      <h1>full stack chai aur code</h1>
      <p>JOKES: {jokes.length}</p>

      {
        jokes.map((joke,index) => (
          <div key="{joke.id}">
            <h3>{joke.title}</h3>
            <p>{joke.content}</p>
          </div>
        ))
      }

      
    </>
  )
}

export default App
