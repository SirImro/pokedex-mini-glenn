function PokeballLoader({ message = "Loading Pokémon…" }) {
  return (
    <div className="pokeball-loader-container">
      <div className="pokeball-spinner">
        <div className="pokeball-top"></div>
        <div className="pokeball-middle">
          <div className="pokeball-center-button"></div>
        </div>
        <div className="pokeball-bottom"></div>
      </div>
      <p className="loader-text">{message}</p>
    </div>
  );
}

export default PokeballLoader;
