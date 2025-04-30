# Conventional Comments for GitHub

A browser extension that adds a floating panel for easily adding Conventional Comments to your GitHub pull requests, issues, and discussions.

## About Conventional Comments

[Conventional Comments](https://conventionalcomments.org/) is a labeling system for code review comments to make feedback more effective:

- **praise:** highlights something positive
- **nitpick:** trivial preference-based requests
- **suggestion:** specific, actionable recommendations
- **issue:** specific problems that require addressing
- **todo:** tracked tasks or to-do items
- **question:** requests for clarification or understanding
- **thought:** ideas, not requiring action
- **chore:** necessary but mundane tasks
- **note:** neutral observations

Additional modifiers can specify the comment's importance:

- **non-blocking:** doesn't need to be resolved to proceed
- **blocking:** must be resolved before merging
- **if-minor:** only address if it's a simple change

## Features

- Completely standalone interface - works with any GitHub UI
- Floating button that's always accessible
- Draggable panel that remembers its position
- Works with all GitHub comment areas
- Keyboard shortcut (Alt+C) to toggle the panel
- Automatically detects the active text field
- No network requests or data collection

## Installation

### From Browser Stores

- Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/...)
- Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/...)

### Manual Installation

1. Download the latest release from the Releases page
2. Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the downloaded folder
3. Firefox:
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the downloaded folder

## Usage

1. On any GitHub page with comment fields, look for the floating "CC" button in the bottom right
2. Click it to open the Conventional Comments panel
3. Select a text field to comment in (click in it to make it active)
4. Click a label (e.g., "suggestion") to insert it into your comment
5. Add optional decorations (e.g., "non-blocking") by clicking them
6. The panel can be dragged anywhere on the screen
7. Use Alt+C to quickly show/hide the panel

## Development

### Setup

1. Clone this repository
2. Make your changes to the files in the root directory
3. Load the extension in your browser using the manual installation steps

### Building

To build a distributable version:

```
zip -r conventional-comments.zip manifest.json content.js styles.css icons
```

## License

MIT License - see LICENSE file for details.

## Credits

- [Conventional Comments](https://conventionalcomments.org/) for the commenting standard
- Icons from [feather icons](https://feathericons.com/)

---
If you find this project useful, please consider supporting it! I accept donations through either [BuyMeACoffee](https://buymeacoffee.com/CoMfUcIoS)  or GitHub Sponsors. 
Your contributions help in maintaining and improving this extension. Thank you for your support! 
