Project: Geospatial Relativity Simulator
Overview
A high-fidelity 3D orbital mechanics simulation built with Three.js and Vanilla JavaScript. This project focuses on the intersection of Astrodynamics and Special/General Relativity, specifically modeling the time-dilation effects experienced by GPS satellite constellations.

Core Engineering Challenges
Modular Architecture: Implemented a decoupled module system (physics.js, camera.js, entities/) to manage complex scene state and mathematical constants independently of the rendering loop.

Tidally Locked Rotation: Mathematically synchronized the Moon’s rotational period with its orbital period using a hierarchical pivot system, ensuring physical accuracy.

Coordinate Space Management: Solved the "Moving Target" problem by utilizing World-Space Coordinate transformation (.getWorldPosition) to allow a smooth camera follow-cam on high-velocity satellites while the entire Earth-system is in motion.

Dynamic UX: Developed a custom UI bridge that allows real-time manipulation of TimeScale and Tracking Modes without interrupting the WebGL render cycle.
