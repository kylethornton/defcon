var util    = require('util'),
    events  = require('events')
    _       = require('underscore');

// ---------------------------------------------
// Constructor
// ---------------------------------------------
function Stopwatch() {
    if(false === (this instanceof Stopwatch)) {
        return new Stopwatch();
    }

    this.bid = {
        player: '',
        amount: 0,
        topBidder: 'Admin'
    }
    this.hour = 3600000;
    this.minute = 60000;
    this.second = 1000;
    this.startTime = 20000;
    this.time = this.startTime;
    this.interval = undefined;

    events.EventEmitter.call(this);

    // Use Underscore to bind all of our methods
    // to the proper context
    _.bindAll(this);
};

// ---------------------------------------------
// Inherit from EventEmitter
// ---------------------------------------------
util.inherits(Stopwatch, events.EventEmitter);

// ---------------------------------------------
// Methods
// ---------------------------------------------
Stopwatch.prototype.start = function() {
    if (this.interval || this.time <= 0) {
        return;
    }

    console.log('Starting Stopwatch!');
    // note the use of _.bindAll in the constructor
    // with bindAll we can pass one of our methods to
    // setInterval and have it called with the proper 'this' value
    this.interval = setInterval(this.onTick, this.second);
    this.emit('start:stopwatch');
};

Stopwatch.prototype.stop = function() {
    console.log('Stopping Stopwatch!');
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = undefined;
        this.emit('stop:stopwatch');
    }
};

Stopwatch.prototype.reset = function() {
    console.log('Resetting Stopwatch!');
    this.stop();
    this.time = this.startTime;
    this.bid.amount = 0;
    this.bid.topBidder = 'Admin';
    this.emit('reset:stopwatch',
        {
            time: this.getTime(),
            bid : this.getBid()
        }
    );
};

Stopwatch.prototype.onTick = function() {
    this.time -= this.second;

    var formattedTime = this.getTime();
    this.emit('tick:stopwatch', formattedTime);

    if (this.time === 0) {
        this.stop();
    }
};

Stopwatch.prototype.bidReceived = function(bid) {
    console.log('Bid Received', bid.bidder, bid.amount);
    if (this.interval && bid.amount > this.bid.amount) {
        this.bid.amount = bid.amount;
        this.bid.topBidder = bid.bidder;

        if (this.time < 15000) {
            this.time = 15000;
        }
        this.emit('bid:received',
            {
                time: this.getTime(),
                bid: this.getBid()
            }
        );
    }
}

Stopwatch.prototype.formatTime = function(time) {
    var remainder = time,
        numHours,
        numMinutes,
        numSeconds,
        output = "";

    // numHours = String(parseInt(remainder / this.hour, 10));
    // remainder -= this.hour * numHours;

    numMinutes = String(parseInt(remainder / this.minute, 10));
    remainder -= this.minute * numMinutes;

    numSeconds = String(parseInt(remainder / this.second, 10));

    output = _.map([numMinutes, numSeconds], function(str) {
        if (str.length === 1) {
            str = "0" + str;
        }
        return str;
    }).join(":");

    return output;
};

Stopwatch.prototype.setPlayer = function(player) {
    this.bid.player = player;
    this.emit('player:changed', player);
}

Stopwatch.prototype.setBid = function (bid) {
    console.log('Setting bid', bid);
    this.bid.amount = bid;
    this.emit('bid:received',
        {
            time: this.getTime(),
            bid: this.getBid()
        }
    );
}

Stopwatch.prototype.getTime = function() {
    return {
        value: this.formatTime(this.time),
        class: this.time <= 5000 && this.time > 0 ? 'warning pulse' : '',
        end: this.time === 0,
        running: this.interval !== undefined
    }

};

Stopwatch.prototype.getBid = function() {
    return this.bid;
}

// ---------------------------------------------
// Export
// ---------------------------------------------
module.exports = Stopwatch;