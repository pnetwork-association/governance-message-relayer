# Governance Message Relayer

This repository houses the `governance-message-relayer` tool for the pNetwork DAO v2. The tool is designed to securely relay governance decisions made on the pNetwork DAO v2 on the Polygon blockchain to other blockchains supported by the pNetwork v3 protocol. 

The `governance-message-relayer` achieves this by providing proof on the Ethereum blockchain that a particular message (technically an Ethereum event log) has truly originated on the pNetwork DAO v2 on Polygon and then disseminates this message to other chains.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Contribution Guidelines](#contribution)
5. [License](#license)

## Prerequisites <a name="prerequisites"></a>

- Node.js v16.x or later
- npm v6.x or later
- Git

## Installation <a name="installation"></a>

1. Clone the repository: 

```bash
git clone https://github.com/pnetwork-association/governance-message-relayer
```

2. Navigate into the cloned repository: 

```bash
cd governance-message-relayer
```

3. Install the dependencies: 

```bash
npm install
```

## Usage <a name="usage"></a>

To run the `governance-message-relayer`, use the following command:

```bash
node src/relayer.js "tx hash"
```

You will need to provide the necessary environment variables for the tool to function correctly. These can be set in a `.env` file in the root directory. A sample `.env.example` file has been provided for reference.

```bash
# .env file
ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
PK=
MAINNET_NODE=
POLYGON_NODE=
SEPOLIA_NODE=
```

## Contribution Guidelines <a name="contribution"></a>

We welcome contributions from the community. Please refer to the `CONTRIBUTING.md` document for detailed contribution guidelines.

## License <a name="license"></a>

The `governance-message-relayer` is released under the [MIT License](https://opensource.org/licenses/MIT). See the `LICENSE` file for more details.


---

Disclaimer: Please note that this is a community project. The pNetwork Community Association is not responsible for any loss of funds or other damages caused by the use of this software. Use it at your own risk.