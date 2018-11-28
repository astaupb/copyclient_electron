# asta-copyclient-angulardart

Copyclient for the AStA Copyservice Paderborn.

Built using Dart, AngularDart, Node and Electron

A basic Electron+AngularDart application needs just these files/directories:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is where the Angular app is loaded.
- `src/*`- Contains the AngularDart app's structure with Pubspec.yaml etc. Contains the **main app logic**.

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) and the [AngularDart Toolchain](https://webdev.dartlang.org/guides/get-started) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://git.uni-paderborn.de/ltappe/asta-copyclient-angulardart.git
# Go into the repository
cd electron-angulardart-quickstart
# Install dependencies
npm install
# Run the app
npm start
```

## License

[GNU LGPL 3.0 or later](LICENSE.md)
