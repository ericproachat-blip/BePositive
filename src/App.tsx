import { useState } from 'react';
import { PhaserGame } from './PhaserGame';
import { MainMenu } from './game/scenes/MainMenu';

function App() {
    const [isStarted, setIsStarted] = useState(false);

    const handleCurrentScene = (scene: Phaser.Scene) => {
        if (scene.scene.key === 'MainMenu') {
            (scene as MainMenu).changeScene();
        }
    };

    if (isStarted) {
        return (
            <main id="app" className="game-screen">
                <PhaserGame currentActiveScene={handleCurrentScene} />
            </main>
        );
    }

    return (
        <main id="app" className="hero-screen">
            <section className="hero-content" aria-label="Welcome screen">
                <h1>BE POSITIVE</h1>
                <p>A small journey to make things better</p>
                <button className="start-button" type="button" onClick={() => setIsStarted(true)}>Start</button>
            </section>
        </main>
    );
}

export default App;
