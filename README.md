# FEARLESS

A custom Discord bot tailored for the **Ruthless Fears** clan.

## ⚔️ About The Clan

**Ruthless Fears** is a clan based in the Roblox game *The Strongest Battleground*, owned by **RDS**. This bot handles internal automation and management specific to the clan's needs.

🔗 **[Join the Discord Server](https://discord.com/invite/aEUyubPVV3)**

## 🛠️ Built With

*   [Bun](https://bun.sh) - A fast all-in-one JavaScript runtime.
*   [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript.
*   [discord.js](https://discord.js.org/) - The library used to interact with the Discord API.

## 🚀 Getting Started

### Prerequisites

*   Install [Bun](https://bun.sh).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/namthedev/fearless.git
    cd fearless
    ```

2.  Install dependencies:
    ```bash
    bun install
    ```

3.  Create a `.env` file in the root directory and add the following variables:
    ```env
    DISCORD_TOKEN=your_token_here
    CLIENT_ID=your_bot_client_id
    GUILD_ID=your_target_guild_id
    STAFF_ROLE_ID=your_staff_role_id
    ```

### Running the Bot

*   **Development Mode** (Hot reloading):
    ```bash
    bun run dev
    ```

*   **Production Start**:
    ```bash
    bun run start
    ```

### Command Management

*   **Deploy Commands** (Register slash commands):
    ```bash
    bun run deploy
    ```

*   **Reset Commands** (Clear all global/guild commands):
    ```bash
    bun run reset
    ```

## 👨‍💻 Developer & Maintainer

**NamTheDev** (Discord: `namchill235`)

*   🌐 **Portfolio:** [namthedev.github.io/profile](https://namthedev.github.io/profile/)