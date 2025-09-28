# Bible Quest for Kids — Experience Overview

## App Vision
Bible Quest for Kids is a .NET MAUI adventure that wraps Scripture learning in quick, colorful challenges. The home screen highlights four core paths—Commandments drills, Bible book explorations, a hub of arcade-like minigames, and an online Bible reader—while the carousel of secondary cards nudges players toward Daily Challenges, leaderboards, tournaments, and duels for friendly competition.【F:BibleQuestForKids/wwwroot/src/pages/Home.jsx†L1-L122】 Persistent player profiles welcome adventurers by name and track quest eligibility, keeping repeat visits feeling personal.【F:BibleQuestForKids/wwwroot/src/pages/Home.jsx†L73-L91】

## Core Learning Modes
- **Commandments Quiz** — Rapid-fire questions focus on the Ten Commandments, reinforcing memorization in short bursts.【F:BibleQuestForKids/wwwroot/src/pages/Home.jsx†L23-L35】
- **Bible Books Journey** — Players pick a book and dive into curated question sets via the Book Selection flow, making survey study approachable.【F:BibleQuestForKids/wwwroot/src/pages/Home.jsx†L23-L35】
- **Daily Challenge** — A once-per-day mixed-mode quiz that locks for 24 hours after completion, motivating returning play sessions.【F:BibleQuestForKids/wwwroot/src/pages/Home.jsx†L37-L72】
- **Leaderboards & Competitive Play** — Leaderboards, tournaments, and one-on-one duels open routes for community play and bragging rights, all surfaced from the Home “More Ways to Play” strip.【F:BibleQuestForKids/wwwroot/src/pages/Home.jsx†L37-L122】

## Minigame Arcade
The Minigames hub presents eight snackable Bible-inspired games, each labeled with difficulty, time expectations, and coin/XP rewards. Navigation cards animate on hover, and a rules panel reminds kids that every session is short, friendly, and rewarding.【F:BibleQuestForKids/wwwroot/src/pages/Minigames.jsx†L1-L120】

### Verse Match (Easy)
Players flip cards to pair verse texts with their references. Before the first flip they choose 10, 25, or 50 pairs, letting parents scale the challenge. Time tracking, flip counts, and accuracy feed into coin and XP bonuses when every match is cleared.【F:BibleQuestForKids/wwwroot/src/pages/VerseMatch.jsx†L1-L160】

### Verse Jigsaw (Medium)
A verse is split into draggable tiles and shuffled. Kids race the clock to rebuild the passage; finishing fast boosts the score. Completion showers confetti, displays the full verse, and automatically grants coins and XP to the player profile.【F:BibleQuestForKids/wwwroot/src/pages/VerseJigsaw.jsx†L1-L120】

### Picture Match (Easy)
Kids connect shuffled Bible characters with their matching symbols. Selecting the right pairing locks it in, bumps the score, and marches toward a confetti celebration once every character is matched, with coins and XP distributed based on time saved.【F:BibleQuestForKids/wwwroot/src/pages/PictureMatch.jsx†L1-L160】

### Emoji Verse (Medium)
Emoji clues hide key words from famous verses. Kids type the missing words, then earn points for accuracy and speed. The game seeds a sample library if none exists, and completion feeds both MinigameScore records and player coins/XP totals.【F:BibleQuestForKids/wwwroot/src/pages/EmojiVerse.jsx†L1-L120】

### Bible Bingo (Easy)
A themed bingo card fills with books, characters, and fallback Bible vocabulary. Items are called automatically every few seconds, and players mark tiles once the prompt appears—free space included. Clearing a row, column, or diagonal triggers a celebratory reset prompt.【F:BibleQuestForKids/wwwroot/src/pages/BibleBingo.jsx†L1-L160】

### Wise Wordle (Hard)
This Wordle-style puzzle pulls five-letter words from a curated biblical list. Players get six guesses, with keyboard highlights showing correct placements and letters to retry. Win or lose, the session wraps with replay and home shortcuts.【F:BibleQuestForKids/wwwroot/src/pages/WiseWordle.jsx†L1-L120】

### Trivia Tower (Medium)
Kids queue into a live-style lobby where rounds start every minute. Correct answers stack animated tower blocks for each avatar, and the tallest tower wins. Results screens spotlight the champion, list standings, and offer quick rematch access.【F:BibleQuestForKids/wwwroot/src/pages/TriviaTower.jsx†L1-L160】

### Capture the Verse (Hard)
Players answer trivia to “earn” words from a mystery verse, then drag-and-drop those words to reconstruct the passage. Successful unscrambling marks the verse captured and returns the adventurer to the arcade hub.【F:BibleQuestForKids/wwwroot/src/pages/CaptureVerseGame.jsx†L1-L160】

## Progression & Rewards
Coins, XP, and stars tally automatically after minigames by reading performance metrics such as time, accuracy, and efficiency; those rewards flow back into the player profile for future unlocks and leaderboard placement.【F:BibleQuestForKids/wwwroot/src/pages/VerseJigsaw.jsx†L67-L120】【F:BibleQuestForKids/wwwroot/src/pages/VerseMatch.jsx†L120-L160】【F:BibleQuestForKids/wwwroot/src/pages/EmojiVerse.jsx†L77-L120】 Settings pages let players tweak preferred difficulty and saved configurations, ensuring challenges stay age appropriate.【F:BibleQuestForKids/wwwroot/src/pages/Settings.jsx†L1-L120】

## Family & Classroom Friendly Touches
- Quick sessions (1–3 minutes) fit into homeschool lessons or Sunday school rotations.【F:BibleQuestForKids/wwwroot/src/pages/Minigames.jsx†L101-L120】
- Claymorphism cards, emoji avatars, and confetti provide warm feedback without overstimulation, while timer badges encourage gentle competition.【F:BibleQuestForKids/wwwroot/src/pages/VerseJigsaw.jsx†L1-L120】【F:BibleQuestForKids/wwwroot/src/pages/TriviaTower.jsx†L1-L160】
- Built-in seeding ensures first-time players always see content, even before church leaders upload custom verse banks.【F:BibleQuestForKids/wwwroot/src/pages/EmojiVerse.jsx†L1-L80】【F:BibleQuestForKids/wwwroot/src/pages/WiseWordle.jsx†L1-L120】

## Ready for TestFlight and App Store
The `.github/workflows/ios-build.yml` GitHub Actions pipeline now packages this .NET MAUI build for iOS TestFlight distribution first, then App Store release once localization, screenshots, and App Store Connect metadata match the experiences detailed above. Keep the descriptions handy when filling out TestFlight beta notes versus App Store listing copy so marketing language stays consistent across TestFlight and App Store submissions.
