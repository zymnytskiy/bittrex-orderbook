const BittrexConnection = require('./connection');
const BidOrderBook = require('./bidorderbook');
const AskOrderBook = require('./askorderbook');
const Market = require('./market');

class BittrexOrderBook {
    subscribeToMarket(market) {
        return this.conn.call('SubscribeToExchangeDeltas', market);
    }

    getInitialState(market) {
        if (this.haveMarket(market)) {
            return this.conn
                .call('QueryExchangeState', market)
                .then(this.markets[market].onInitialState);
        }
    }

    setupConn() {
        this.conn = new BittrexConnection(this._options);
        this.conn.on('updateExchangeState', (update) => {
            const market = update.MarketName;
            if (this.haveMarket(market)) {
                this.markets[market].onUpdateExchangeState(update);
            }
        });
    }

    haveMarket(market) {
        return this.markets.hasOwnProperty(market);
    }

    market(market) {
        if (!this.haveMarket(market)) {
            // create market now
            this.markets[market] = new Market(market);
            this.conn
                .ready()
                .then(() => this.getInitialState(market))
                .then(() => this.subscribeToMarket(market));
        }
        return this.markets[market];
    }

    constructor(options = {}) {
        this._options = options;
        this.markets = {};
        this.setupConn();
    }
}

module.exports = BittrexOrderBook;
