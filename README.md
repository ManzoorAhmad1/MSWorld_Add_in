# MS Word Add-in with React.js

This is a Microsoft Word add-in built with React.js that allows users to insert "Hello World" text into their Word documents.

## Features

- Built with pure React.js (no Vite)
- Uses Office.js API for Word integration
- Simple button to insert "Hello World" text
- Modern UI with Microsoft Office styling

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3000`

3. **Load the add-in in Word:**
   - Open Microsoft Word
   - Go to Insert > My Add-ins > Upload My Add-in
   - Select the `manifest.xml` file from this project
   - The add-in will appear in the Home tab

## Usage

1. Once the add-in is loaded, you'll see a "Show Taskpane" button in the Home tab
2. Click the button to open the add-in panel
3. Click "Insert Hello World" to add the text to your document

## Project Structure

```
MSWorld_Add_in/
├── public/
│   └── index.html
├── src/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── manifest.xml
├── package.json
└── webpack.config.js
```

## Development

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run dev` - Start development server with auto-open

## Notes

- The add-in requires HTTPS in production
- Make sure Office.js is loaded before the React app initializes
- The manifest.xml file needs to be uploaded to Word for the add-in to work
