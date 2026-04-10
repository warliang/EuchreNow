# EuchreNow

[Euchre](https://en.wikipedia.org/wiki/Euchre)(pronounced YEW-ker) is a [trick-taking card game](https://en.wikipedia.org/wiki/Trick-taking_game) that originated in the 19th century by German immigrants in the United States.
The game is played around the world, but most popular in Great Britain, Canada, Australia, New Zealand, and the United States (mainly Midwest and Upstate New York).

## Terminology

| Term                    | Definition                                                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trick**               | One round of card play where each player plays one card. The highest card wins the trick.                                                                         |
| **Trump**               | The suit declared as the most powerful for the hand. Cards of the trump suit beat all other suits.                                                                |
| **Right Bower**         | The Jack of the trump suit. The highest card in the game.                                                                                                         |
| **Left Bower**          | The Jack of the same-color suit as trump. The second highest card in the game. For the duration of the hand it is treated as a trump card, not its original suit. |
| **Kitty**               | The 4 cards set aside after dealing. The top card is flipped face up to start bidding.                                                                            |
| **Lead Suit**           | The suit of the first card played in a trick. All other players must follow this suit if they have it.                                                            |
| **Maker**               | The player who calls trump. Their team must win at least 3 of the 5 tricks or risk being euchred.                                                                 |
| **Defender**            | A player on the team that did not call trump.                                                                                                                     |
| **Euchred**             | When the makers fail to win at least 3 tricks. The defending team earns 2 points.                                                                                 |
| **March**               | When the makers win all 5 tricks in a hand. Worth 2 points.                                                                                                       |
| **Going Alone / Loner** | When the maker chooses to play without their partner. The partner sits out. Winning all 5 tricks alone earns 4 points.                                            |
| **Stick the Dealer**    | An optional rule that forces the dealer to name trump in round 2 if all other players pass. Prevents hands from being thrown in.                                  |
| **Order Up**            | A player's decision in round 1 to declare the flipped card's suit as trump, prompting the dealer to pick it up.                                                   |
| **Packet**              | The group of cards dealt to a player at once. Euchre is typically dealt in packets of 2 then 3, or 3 then 2.                                                      |

## Tech Stack

- **Frontend** — React (Vite), TypeScript
- **Backend** — Node.js, Express, Socket.io
- **Database** — PostgreSQL (game persistence), Redis (active game state)

## Game Rules

### Overview

- 4 players split into 2 teams of 2 (or 2 in settings)
- Teammates sit across from each other
- A shortened deck of 24 cards is used: 9, 10, J, Q, K, A (all suits)
- Each hand consists of 5 tricks
- First team to 10 points wins

### Deck

Euchre uses only 24 cards from a standard deck — the 9 through Ace of each suit. All cards below 9 are removed before play.

Once trump is declared, the Jack of the trump suit becomes the highest card in the game (the **Right Bower**), and the Jack of the same-color suit becomes the second highest card (the **Left Bower**). For example, if Hearts is trump:

- Right Bower → Jack of Hearts (highest)
- Left Bower → Jack of Diamonds (second highest)

### The Deal

- The dealer is chosen randomly at the start of the game, then rotates clockwise each hand
- Each player is dealt 5 cards in packets (typically 2-3 or 3-2)
- The remaining 4 cards form the **kitty**
- The top card of the kitty is flipped face up to start the bidding phase

### Bidding Phase

Bidding determines which suit will be **trump** for the hand. It happens in two rounds, starting with the player to the left of the dealer and going clockwise.

**Round 1 — Order Up**

Each player may either:

- **Order it up** — declare the flipped card's suit as trump. The dealer picks up the flipped card and discards one card face down into the kitty
- **Pass** — decline

If all 4 players pass, the flipped card is turned face down and Round 2 begins.

**Round 2 — Name Trump**

Each player may either:

- **Name a suit** — declare any suit as trump except the suit of the flipped card
- **Pass** — decline

If all 4 players pass in Round 2, the hand is thrown in and redealt by the next dealer _(this rule can be different if playing **Stick the Dealer**)_.

**Stick the Dealer** _(optional house rule)_  
If enabled, the dealer cannot pass in Round 2 and must name a suit. This prevents hands from being thrown in.

**The Maker**  
The player who calls trump (either round) is called the maker. Their team is responsible for winning at least 3 of the 5 tricks.

**Going Alone** _(optional)_  
When ordering up or naming trump, the maker may choose to go alone. Their partner sits out the hand, and the maker becomes the **loner**. If the loner wins their team wins extra points.

### Trick Taking (Player Phase)

- The player to the left of the dealer leads the first trick (or the maker if going alone)
- The suit of the card played becomes the **lead suit**, players must follow the lead suit **IF** they have it
- If a player cannot follow suit they may play any card including trump cards
- The highest trump card wins the trick, or if no trump is played the highest card of the lead suit wins
- The winner of each trick leads the next one
- Each hand plays out 5 tricks (or 4 if someone is going alone)

**Playable Trumps** _(optional on two players)_
Allow trumps to be played even if you have cards in your hand that is the current lead suit.

### Scoring

| Result                                       | Points                     |
| -------------------------------------------- | -------------------------- |
| Makers win 3 or 4 tricks                     | 1 point                    |
| Makers win all 5 tricks (march)              | 2 points                   |
| Makers are euchred (win fewer than 3 tricks) | Defenders get 2 points     |
| Loner wins all 5 tricks                      | Maker's team gets 4 points |
| Loner wins 3 or 4 tricks                     | 1 point                    |
| Loner is euchred                             | Defenders get 2 points     |

### Winning

The first team to reach **10 points** wins the game.

## House Rules

EuchreNow supports the following optional rules that can be toggled in the game lobby:

| Rule             | Description                                          |
| ---------------- | ---------------------------------------------------- |
| Stick the Dealer | Dealer must name trump in round 2 if all others pass |
| Going Alone      | Maker may choose to play without their partner       |
| Playable Trumps  | 2 player only. Trump cards are playable at any time  |

## Project Structure

```
EuchreNow/
├── apps/
│ ├── client/ # React frontend (Vite)
│ └── server/ # Express + Socket.io backend
├── packages/
│ └── game-engine/ # Pure JS game logic, shared by client and server
├── tsconfig.json # Base TypeScript config
└── package.json # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Install

```bash
git clone https://github.com/warliang/EuchreNow.git
cd EuchreNow
npm install
```

### Run in development

```bash
npm run dev
```
