import Header from "./components/Header"
import Body from "./components/Body";
import Footer from "./components/Footer"

function App() {

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <Header />
      <Body />
      <Footer />
    </div>
  )
}

export default App
