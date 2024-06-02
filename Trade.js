const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class TradingBot {
    constructor() {
        this.state = new BotState();
    }

    start() {
        rl.on('line', (command) => {
            if (command) {
                this.processCommand(command);
            }
        });
    }

    processCommand(command) {
        const parts = command.split(' ');
        const cmdType = parts[0];

        if (cmdType === 'settings') {
            this.state.updateSettings(parts[1], parts[2]);
        } else if (cmdType === 'update') {
            if (parts[1] === 'game') {
                this.state.updateGame(parts[2], parts[3]);
            }
        } else if (cmdType === 'action') {
            this.executeAction();
        }
    }

    executeAction() {
        const usdBalance = this.state.stacks['USDT'] || 0;
        const currentPrice = this.state.charts['USDT_BTC'] ? this.state.charts['USDT_BTC'].closes.slice(-1)[0] : 0;
        const btcAmount = usdBalance / currentPrice;

        const actionDecision = ['buy', 'sell', 'pass'][Math.floor(Math.random() * 3)];

        const btcChart = this.state.charts['USDT_BTC'] || new PriceChart();
        if (actionDecision === 'buy') {
            this.state.btcBalance += btcAmount * 0.199;
            console.log(`buy USDT_BTC ${0.20 * btcAmount}`);
        } else if (actionDecision === 'sell') {
            if (this.state.btcBalance > 0) {
                console.log(`sell USDT_BTC ${this.state.btcBalance}`);
                this.state.btcBalance = 0;
            } else {
                console.log('pass');
            }
        } else {
            console.log('pass');
        }
    }
}

class CandleData {
    constructor(schema, dataStr) {
        const values = dataStr.split(',');
        for (let i = 0; i < schema.length; i++) {
            this[schema[i]] = this.parseValue(schema[i], values[i]);
        }
    }

    parseValue(key, value) {
        if (key === 'date') {
            return parseInt(value);
        } else if (['high', 'low', 'open', 'close', 'volume'].includes(key)) {
            return parseFloat(value);
        }
        return value;
    }

    toString() {
        return `CandleData(${this.date}, ${this.close}, ${this.volume})`;
    }
}

class PriceChart {
    constructor() {
        this.dates = [];
        this.opens = [];
        this.highs = [];
        this.lows = [];
        this.closes = [];
        this.volumes = [];
    }

    addCandle(candle) {
        this.dates.push(candle.date);
        this.opens.push(candle.open);
        this.highs.push(candle.high);
        this.lows.push(candle.low);
        this.closes.push(candle.close);
        this.volumes.push(candle.volume);
    }
}

class BotState {
    constructor() {
        this.timeBank = 0;
        this.maxTimeBank = 0;
        this.timePerMove = 1;
        this.candleInterval = 1;
        this.candleFormat = [];
        this.totalCandles = 0;
        this.receivedCandles = 0;
        this.initialStack = 0;
        this.transactionFee = 0.1;
        this.currentDate = 0;
        this.btcBalance = 0;
        this.stacks = {};
        this.charts = {};
    }

    updateChart(pair, candleDataStr) {
        if (!this.charts[pair]) {
            this.charts[pair] = new PriceChart();
        }
        const candle = new CandleData(this.candleFormat, candleDataStr);
        this.charts[pair].addCandle(candle);
    }

    updateStack(currency, amount) {
        this.stacks[currency] = parseFloat(amount);
    }

    updateSettings(key, value) {
        if (key === 'timebank') {
            this.maxTimeBank = parseInt(value);
            this.timeBank = parseInt(value);
        } else if (key === 'time_per_move') {
            this.timePerMove = parseInt(value);
        } else if (key === 'candle_interval') {
            this.candleInterval = parseInt(value);
        } else if (key === 'candle_format') {
            this.candleFormat = value.split(',');
        } else if (key === 'candles_total') {
            this.totalCandles = parseInt(value);
        } else if (key === 'candles_given') {
            this.receivedCandles = parseInt(value);
        } else if (key === 'initial_stack') {
            this.initialStack = parseInt(value);
        } else if (key === 'transaction_fee_percent') {
            this.transactionFee = parseFloat(value);
        }
    }

    updateGame(key, value) {
        if (key === 'next_candles') {
            const candleList = value.split(';');
            this.currentDate = parseInt(candleList[0].split(',')[1]);
            for (const candleStr of candleList) {
                const candleInfo = candleStr.split(',');
                this.updateChart(candleInfo[0], candleStr);
            }
        } else if (key === 'stacks') {
            const stackList = value.split(',');
            for (const stackStr of stackList) {
                const stackInfo = stackStr.split(':');
                this.updateStack(stackInfo[0], parseFloat(stackInfo[1]));
            }
        }
    }
}

const bot = new TradingBot();
bot.start();
