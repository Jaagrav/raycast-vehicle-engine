# Raycast Vehicle Engine

[![rv-engine-gif](https://user-images.githubusercontent.com/52719271/128848701-ccee33e9-4958-4c59-b8ac-92b3bd3a1e45.gif)](https://rv-engine.vercel.app/)

Simply upload your favourite car's chassis model and car's wheel model and the RV Engine would automatically create a car with the same look and feel. It would also be able to control the car's movement and rotation. Add physics and everything else you want to the car and you're good to go.
After that you can simply download it as a zip file. Follow the same setup procedure, and you have a new raycast vehicle generated.

## Features
- Vehicle physics
- Change Vehicle Mass, Suspension Strength, Suspension Damping, etc.
- Change the position of each wheel, set the size of each wheel and have all the controls to yourself.
- Change the max speed of the car, movement controls etc directly from the GUI.
- Position the chassis from GUI, see helper to view the chassis in the physics world. Same goes for all of the wheels.
- Generate code, simply either copy Car.JS code or Download the ZIP file that has everything sitting ready for you. All you need to do is install it using npm once unzipped.

## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```

## Built With
- [ThreeJS](https://threejs.org/) - JavaScript 3D library
- [Webpack](https://webpack.js.org/) - Module bundler
- [Babel](https://babeljs.io/) - ES6 to ES5 transpiler
- [Cannon-ES](https://pmndrs.github.io/cannon-es/) - 3D physics engine
- [Guify](https://github.com/colejd/guify) - GUI framework
- [JSZip](https://stuk.github.io/jszip/) - JSZip is a javascript library for creating, reading and editing .zip files, with a lovely and simple API.
- [Stats.JS](https://github.com/mrdoob/stats.js/) - JavaScript Performance Monitor
- [File Saver](https://www.npmjs.com/package/file-saver) - Save files to disk

## What's next?
- [ ] Add more physics to the car
- [ ] Add more wheels to the car
- [ ] Add more features to the car
- [ ] Add more car models
- [ ] Add more physics models
- [ ] Add more wheel models

### Written by [Jaagrav](https://github.com/Jaagrav)
